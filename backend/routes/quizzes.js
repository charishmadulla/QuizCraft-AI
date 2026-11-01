const express = require("express");
const mongoose = require("mongoose");
const { GoogleGenAI } = require("@google/genai");
const StudyMaterial = require("../models/StudyMaterial");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Require authentication for all quiz endpoints
router.use(protect);

// --------------------------------------------------
// Gemini configuration
// --------------------------------------------------

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getMaterialText(material) {
  return (
    material.extractedText ||
    material.text ||
    material.content ||
    material.extractedContent ||
    material.notes ||
    ""
  );
}

function parseJsonResponse(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Gemini did not return valid JSON.");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new Error(
      "Gemini returned malformed JSON. Please try generating the quiz again."
    );
  }
}

function validateGeneratedQuestions(questions, requestedCount, requestedType) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("The AI must generate a valid list of questions.");
  }

  const validLength =
    questions.length === requestedCount ||
    (questions.length >= requestedCount - 1 &&
      questions.length <= requestedCount + 1);

  if (!validLength && questions.length < requestedCount) {
    throw new Error(
      `The AI generated ${questions.length} questions, but ${requestedCount} were requested.`
    );
  }

  const sliceQuestions = questions.slice(0, requestedCount);

  return sliceQuestions.map((item, index) => {
    if (
      !item ||
      typeof item.question !== "string" ||
      !item.question.trim()
    ) {
      throw new Error(`Question ${index + 1} has invalid question text.`);
    }

    if (!Array.isArray(item.options) || item.options.length < 2) {
      throw new Error(
        `Question ${index + 1} must have at least two answer options.`
      );
    }

    const correctAnswer = Number(item.correctAnswer);

    if (
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= item.options.length
    ) {
      throw new Error(
        `Question ${index + 1} has an invalid correct answer index.`
      );
    }

    let qType = item.questionType;
    if (!["multiple_choice", "true_false", "fill_in_the_blank"].includes(qType)) {
      if (item.options.length === 2) {
        qType = "true_false";
      } else if (item.question.includes("_____") || item.question.includes("___")) {
        qType = "fill_in_the_blank";
      } else {
        qType = "multiple_choice";
      }
    }

    return {
      question: item.question.trim(),
      options: item.options.map((option) => String(option).trim()),
      correctAnswer,
      explanation:
        typeof item.explanation === "string" ? item.explanation.trim() : "",
      questionType: qType,
    };
  });
}

// --------------------------------------------------
// POST /api/quizzes/generate
// --------------------------------------------------

router.post("/generate", async (req, res) => {
  console.log("========== QUIZ GENERATION STARTED ==========");
  console.log("User:", req.user?.email);
  console.log("Request body:", req.body);

  try {
    const {
      materialId,
      questionCount = 5,
      difficulty = "medium",
      questionType = "multiple_choice",
    } = req.body;

    if (!materialId || !mongoose.isValidObjectId(materialId)) {
      return res.status(400).json({
        message: "A valid materialId is required.",
      });
    }

    const count = Number(questionCount);
    if (isNaN(count) || count < 1 || count > 25) {
      return res.status(400).json({
        message: "Question count must be between 1 and 25.",
      });
    }

    const normalizedDifficulty = String(difficulty).toLowerCase();
    if (!["easy", "medium", "hard"].includes(normalizedDifficulty)) {
      return res.status(400).json({
        message: "Difficulty must be easy, medium, or hard.",
      });
    }

    // Ensure material belongs to the authenticated user
    const material = await StudyMaterial.findOne({
      _id: materialId,
      userId: req.user._id,
    }).lean();

    if (!material) {
      return res.status(404).json({
        message: "Study material not found or access denied.",
      });
    }

    const materialText = getMaterialText(material);

    if (typeof materialText !== "string" || !materialText.trim()) {
      return res.status(400).json({
        message:
          "No extracted study text was found for this material. Check the upload and text extraction process.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key is not configured. Check backend/.env.",
      });
    }

    let typeInstruction = "";
    if (questionType === "true_false") {
      typeInstruction = `Generate True/False questions. Each question must have exactly 2 options: ["True", "False"]. Set "questionType": "true_false".`;
    } else if (questionType === "fill_in_the_blank") {
      typeInstruction = `Generate Fill-in-the-blank questions. The question text MUST contain "_____" representing the missing keyword/concept, and 4 plausible options for the blank. Set "questionType": "fill_in_the_blank".`;
    } else if (questionType === "mixed") {
      typeInstruction = `Generate a balanced mix of Multiple Choice (4 options), True/False (2 options: ["True", "False"]), and Fill in the blanks (question containing "_____" with 4 options). Indicate "questionType" as "multiple_choice", "true_false", or "fill_in_the_blank" on each question.`;
    } else {
      typeInstruction = `Generate Multiple Choice Questions. Each question must have exactly 4 plausible options. Set "questionType": "multiple_choice".`;
    }

    const prompt = `
You are an expert educational assessment specialist.
Create exactly ${count} high-quality questions based ONLY on the study material provided below.

Difficulty Level: ${normalizedDifficulty.toUpperCase()}
Question Type Requirement:
${typeInstruction}

Rules:
- Questions must be factually accurate and strictly derived from the text.
- Options must be distinct, plausible, and grammatically consistent.
- Exactly one option must be the correct answer.
- "correctAnswer" must be a 0-based integer index pointing to the correct choice in the "options" array.
- Provide a clear, educational explanation for why the correct answer is right.
- Return ONLY valid raw JSON with no Markdown backticks or extra commentary.

Required JSON Structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Clear explanation of the concept and why Option A is correct.",
      "questionType": "multiple_choice"
    }
  ]
}

Study Material:
${materialText.slice(0, 35000)}
`;

    console.log("Calling Gemini model:", GEMINI_MODEL);

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    console.log("Gemini response received.");

    const generated = parseJsonResponse(response.text);

    const questions = validateGeneratedQuestions(
      generated.questions,
      count,
      questionType
    );

    console.log("Validated questions count:", questions.length);

    // Save Quiz associated with current user
    const quiz = await Quiz.create({
      userId: req.user._id,
      materialId: material._id,
      materialTitle:
        material.title || material.originalName || "Study Material",
      difficulty: normalizedDifficulty,
      questions,
      totalQuestions: questions.length,
    });

    console.log("Quiz saved successfully:", quiz._id.toString());

    // Do NOT expose correct answers or explanations before quiz submission
    return res.status(201).json({
      success: true,
      message: "Quiz generated successfully.",
      quizId: quiz._id.toString(),
      materialId: quiz.materialId,
      materialTitle: quiz.materialTitle,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.totalQuestions,
      questions: quiz.questions.map((question, index) => ({
        index,
        _id: question._id,
        question: question.question,
        options: question.options,
        questionType: question.questionType,
      })),
    });
  } catch (error) {
    console.error("========== GENERATE QUIZ ERROR ==========");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to generate quiz.",
    });
  }
});

// --------------------------------------------------
// POST /api/quizzes/submit
// Body: { quizId, answers: [0, 1, null, 3], timeTaken, autoSubmit }
// --------------------------------------------------

router.post("/submit", async (req, res) => {
  try {
    const {
      quizId,
      answers,
      timeTaken = 0,
      autoSubmit = false,
    } = req.body;

    if (!quizId || !mongoose.isValidObjectId(quizId)) {
      return res.status(400).json({
        message: "A valid quizId is required.",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array.",
      });
    }

    // Verify quiz belongs to user
    const quiz = await Quiz.findOne({
      _id: quizId,
      userId: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or access denied.",
      });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `Submit exactly ${quiz.questions.length} answers.`,
      });
    }

    const normalizedAnswers = answers.map((answer, index) => {
      if (answer === null || answer === undefined || answer === "") {
        if (!autoSubmit) {
          throw new Error(
            `Please answer question ${index + 1} before submitting.`
          );
        }
        return null;
      }

      const value = Number(answer);
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value >= quiz.questions[index].options.length
      ) {
        throw new Error(
          `Answer ${index + 1} must be an option index from 0 to ${
            quiz.questions[index].options.length - 1
          }.`
        );
      }

      return value;
    });

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const results = quiz.questions.map((question, index) => {
      const selectedAnswer = normalizedAnswers[index];

      let isCorrect = false;
      if (selectedAnswer === null) {
        unansweredCount += 1;
      } else if (selectedAnswer === question.correctAnswer) {
        score += 1;
        correctCount += 1;
        isCorrect = true;
      } else {
        incorrectCount += 1;
      }

      return {
        index,
        question: question.question,
        options: question.options,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        questionType: question.questionType || "multiple_choice",
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Update Quiz document
    quiz.answers = normalizedAnswers.map((a) => (a === null ? -1 : a));
    quiz.score = score;
    quiz.completed = true;
    quiz.autoSubmitted = Boolean(autoSubmit);
    quiz.submittedAt = new Date();
    await quiz.save();

    // Persist to QuizAttempt collection associated with current user
    const attempt = await QuizAttempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      materialId: quiz.materialId,
      materialTitle: quiz.materialTitle,
      difficulty: quiz.difficulty,
      totalQuestions,
      score,
      percentage,
      answers: normalizedAnswers.map((a) => (a === null ? -1 : a)),
      timeTaken: Number(timeTaken) || 0,
      correctCount,
      incorrectCount,
      unansweredCount,
      autoSubmitted: Boolean(autoSubmit),
      results,
    });

    return res.json({
      success: true,
      message: "Quiz submitted successfully.",
      quizId: quiz._id.toString(),
      attemptId: attempt._id.toString(),
      materialTitle: quiz.materialTitle,
      difficulty: quiz.difficulty,
      score,
      totalQuestions,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeTaken: Number(timeTaken) || 0,
      submittedAt: quiz.submittedAt,
      results,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);

    const isValidationError =
      error.message &&
      (error.message.startsWith("Please answer question") ||
        error.message.startsWith("Answer "));

    return res.status(isValidationError ? 400 : 500).json({
      message: error.message || "Failed to submit quiz.",
    });
  }
});

// --------------------------------------------------
// GET /api/quizzes/history
// Returns attempts only belonging to the authenticated user
// --------------------------------------------------

router.get("/history", async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const attemptQuizIds = new Set(
      attempts.map((a) => a.quizId?.toString()).filter(Boolean)
    );

    const legacyQuizzes = await Quiz.find({
      userId: req.user._id,
      completed: true,
      _id: { $nin: Array.from(attemptQuizIds).map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const unifiedHistory = [
      ...attempts.map((att) => ({
        _id: att._id.toString(),
        attemptId: att._id.toString(),
        quizId: att.quizId ? att.quizId.toString() : "",
        materialId: att.materialId ? att.materialId.toString() : "",
        materialTitle: att.materialTitle || "Study Material",
        difficulty: att.difficulty,
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage: att.percentage,
        timeTaken: att.timeTaken || 0,
        correctCount: att.correctCount ?? att.score,
        incorrectCount:
          att.incorrectCount ?? att.totalQuestions - att.score,
        unansweredCount: att.unansweredCount ?? 0,
        autoSubmitted: att.autoSubmitted || false,
        createdAt: att.createdAt,
        submittedAt: att.createdAt,
      })),
      ...legacyQuizzes.map((quiz) => {
        const total = quiz.totalQuestions || quiz.questions?.length || 1;
        const score = quiz.score !== null ? quiz.score : 0;
        return {
          _id: quiz._id.toString(),
          attemptId: quiz._id.toString(),
          quizId: quiz._id.toString(),
          materialId: quiz.materialId ? quiz.materialId.toString() : "",
          materialTitle: quiz.materialTitle || "Study Material",
          difficulty: quiz.difficulty,
          score,
          totalQuestions: total,
          percentage: Math.round((score / total) * 100),
          timeTaken: 0,
          correctCount: score,
          incorrectCount: total - score,
          unansweredCount: 0,
          autoSubmitted: quiz.autoSubmitted || false,
          createdAt: quiz.submittedAt || quiz.createdAt,
          submittedAt: quiz.submittedAt || quiz.createdAt,
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return res.json({
      success: true,
      count: unifiedHistory.length,
      attempts: unifiedHistory,
    });
  } catch (error) {
    console.error("Quiz history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load quiz history.",
    });
  }
});

// --------------------------------------------------
// GET /api/quizzes/attempts/:id
// Retrieve complete attempt details with results and explanations
// --------------------------------------------------

router.get("/attempts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid attempt ID.",
      });
    }

    let attempt = await QuizAttempt.findOne({
      _id: id,
      userId: req.user._id,
    }).lean();

    if (!attempt) {
      const quiz = await Quiz.findOne({
        _id: id,
        userId: req.user._id,
      }).lean();

      if (quiz && quiz.completed) {
        const total = quiz.totalQuestions || quiz.questions.length;
        const results = (quiz.questions || []).map((q, idx) => {
          const selected =
            quiz.answers && quiz.answers[idx] !== undefined && quiz.answers[idx] !== -1
              ? quiz.answers[idx]
              : null;
          return {
            index: idx,
            question: q.question,
            options: q.options,
            selectedAnswer: selected,
            correctAnswer: q.correctAnswer,
            isCorrect: selected !== null && selected === q.correctAnswer,
            explanation: q.explanation,
            questionType: q.questionType || "multiple_choice",
          };
        });

        attempt = {
          _id: quiz._id,
          quizId: quiz._id,
          materialTitle: quiz.materialTitle,
          difficulty: quiz.difficulty,
          totalQuestions: total,
          score: quiz.score || 0,
          percentage: Math.round(((quiz.score || 0) / total) * 100),
          results,
          createdAt: quiz.submittedAt || quiz.createdAt,
        };
      }
    }

    if (!attempt) {
      return res.status(404).json({
        message: "Quiz attempt not found or access denied.",
      });
    }

    return res.json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get attempt error:", error);

    return res.status(500).json({
      message: "Failed to load attempt details.",
    });
  }
});

// --------------------------------------------------
// GET /api/quizzes/:id
// Retrieve questions for taking/retaking (verifying user ownership)
// --------------------------------------------------

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid quiz ID.",
      });
    }

    const quiz = await Quiz.findOne({
      _id: id,
      userId: req.user._id,
    }).lean();

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or access denied.",
      });
    }

    return res.json({
      success: true,
      quizId: quiz._id.toString(),
      materialId: quiz.materialId,
      materialTitle: quiz.materialTitle,
      difficulty: quiz.difficulty,
      completed: quiz.completed,
      score: quiz.score,
      totalQuestions: quiz.totalQuestions,
      questions: (quiz.questions || []).map((question, index) => ({
        index,
        _id: question._id,
        question: question.question,
        options: question.options,
        questionType: question.questionType || "multiple_choice",
      })),
    });
  } catch (error) {
    console.error("Get quiz error:", error);

    return res.status(500).json({
      message: "Failed to retrieve quiz.",
    });
  }
});

module.exports = router;
