const express = require("express");
const QuizAttempt = require("../models/QuizAttempt");
const StudyMaterial = require("../models/StudyMaterial");
const StudentPerformance = require("../models/StudentPerformance");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.use(protect);

/**
 * Helper to compute comprehensive performance intelligence from stored QuizAttempt records
 */
async function computePerformanceData(userId) {
  const attempts = await QuizAttempt.find({ userId }).sort({ createdAt: 1 });

  if (!attempts || attempts.length === 0) {
    return {
      hasData: false,
      totalAttempts: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      totalQuestionsAnswered: 0,
      totalTimeSpent: 0,
      topicAccuracy: [],
      strongTopics: [],
      weakTopics: [],
      progressHistory: [],
      message: "No quiz attempts recorded yet. Complete a quiz to unlock performance intelligence.",
    };
  }

  let totalScore = 0;
  let totalPercentage = 0;
  let highestScore = 0;
  let totalQuestionsAnswered = 0;
  let totalTimeSpent = 0;

  const topicAggregation = {};

  attempts.forEach((attempt) => {
    totalScore += attempt.score || 0;
    totalPercentage += attempt.percentage || 0;
    totalQuestionsAnswered += attempt.totalQuestions || 0;
    totalTimeSpent += attempt.timeTaken || 0;

    if (attempt.score > highestScore) {
      highestScore = attempt.score;
    }

    // Process topic performance
    if (Array.isArray(attempt.topicPerformance) && attempt.topicPerformance.length > 0) {
      attempt.topicPerformance.forEach((tp) => {
        const id = tp.topicId || "general";
        const name = tp.topicName || "General Concept";
        if (!topicAggregation[id]) {
          topicAggregation[id] = {
            topicId: id,
            topicName: name,
            totalQuestions: 0,
            correctCount: 0,
            attemptsCount: 0,
            lastAttemptDate: attempt.createdAt,
          };
        }
        topicAggregation[id].totalQuestions += tp.totalQuestions || 0;
        topicAggregation[id].correctCount += tp.correctCount || 0;
        topicAggregation[id].attemptsCount += 1;
        topicAggregation[id].lastAttemptDate = attempt.createdAt;
      });
    } else if (Array.isArray(attempt.results)) {
      // Fallback from results if topicPerformance was not precalculated
      attempt.results.forEach((r) => {
        const id = r.topicId || "general";
        const name = r.topicName || "General Concept";
        if (!topicAggregation[id]) {
          topicAggregation[id] = {
            topicId: id,
            topicName: name,
            totalQuestions: 0,
            correctCount: 0,
            attemptsCount: 1,
            lastAttemptDate: attempt.createdAt,
          };
        }
        topicAggregation[id].totalQuestions += 1;
        if (r.isCorrect) topicAggregation[id].correctCount += 1;
      });
    }
  });

  const totalAttempts = attempts.length;
  const averageScore = Number((totalScore / totalAttempts).toFixed(1));
  const averagePercentage = Math.round(totalPercentage / totalAttempts);

  const topicAccuracy = [];
  const strongTopics = [];
  const weakTopics = [];

  // Minimum questions threshold to prevent classifying a topic from 1 isolated question
  const MIN_QUESTIONS_FOR_ASSESSMENT = 3;

  Object.values(topicAggregation).forEach((item) => {
    const accuracy =
      item.totalQuestions > 0
        ? Math.round((item.correctCount / item.totalQuestions) * 100)
        : 0;

    let status = "moderate";
    let statusLabel = "Moderate Understanding";

    if (item.totalQuestions < MIN_QUESTIONS_FOR_ASSESSMENT) {
      status = "insufficient_data";
      statusLabel = "Not enough attempts to assess this topic yet";
    } else if (accuracy >= 75) {
      status = "strong";
      statusLabel = "Strong Mastery";
      strongTopics.push({
        topicId: item.topicId,
        topicName: item.topicName,
        accuracy,
        totalQuestions: item.totalQuestions,
        attemptsCount: item.attemptsCount,
      });
    } else if (accuracy < 60) {
      status = "weak";
      statusLabel = "Needs Immediate Revision";
      weakTopics.push({
        topicId: item.topicId,
        topicName: item.topicName,
        accuracy,
        totalQuestions: item.totalQuestions,
        attemptsCount: item.attemptsCount,
        status: "weak",
        recommendation: `Current accuracy is ${accuracy}%. Review key definitions and retry a topic-specific quiz.`,
      });
    }

    topicAccuracy.push({
      topicId: item.topicId,
      topicName: item.topicName,
      totalQuestions: item.totalQuestions,
      correctCount: item.correctCount,
      accuracy,
      attemptsCount: item.attemptsCount,
      status,
      statusLabel,
      lastAttemptDate: item.lastAttemptDate,
    });
  });

  // Sort topic accuracy ascending so weakest topics appear first
  topicAccuracy.sort((a, b) => a.accuracy - b.accuracy);
  weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  strongTopics.sort((a, b) => b.accuracy - a.accuracy);

  const progressHistory = attempts.map((a) => ({
    attemptId: a._id,
    quizTitle: a.materialTitle || "Quiz Attempt",
    difficulty: a.difficulty,
    score: a.score,
    totalQuestions: a.totalQuestions,
    percentage: a.percentage,
    timeTaken: a.timeTaken,
    date: a.createdAt,
  }));

  // Cache or update in StudentPerformance
  await StudentPerformance.findOneAndUpdate(
    { userId },
    {
      totalAttempts,
      averageScore,
      averagePercentage,
      highestScore,
      topicAccuracy,
      weakTopics,
      strongTopics,
      progressHistory,
    },
    { upsert: true, new: true }
  );

  return {
    hasData: true,
    totalAttempts,
    averageScore,
    averagePercentage,
    highestScore,
    totalQuestionsAnswered,
    totalTimeSpent,
    topicAccuracy,
    strongTopics,
    weakTopics,
    progressHistory,
  };
}

// GET /api/performance/overview
router.get("/overview", async (req, res) => {
  try {
    const data = await computePerformanceData(req.user._id);
    return res.json({
      success: true,
      performance: data,
    });
  } catch (error) {
    console.error("Performance overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate performance overview.",
    });
  }
});

// GET /api/performance/topics
router.get("/topics", async (req, res) => {
  try {
    const data = await computePerformanceData(req.user._id);
    return res.json({
      success: true,
      topicAccuracy: data.topicAccuracy,
      weakTopics: data.weakTopics,
      strongTopics: data.strongTopics,
    });
  } catch (error) {
    console.error("Performance topics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load topic performance.",
    });
  }
});

// GET /api/performance/history
router.get("/history", async (req, res) => {
  try {
    const data = await computePerformanceData(req.user._id);
    return res.json({
      success: true,
      progressHistory: data.progressHistory,
    });
  } catch (error) {
    console.error("Performance history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load performance history.",
    });
  }
});

// GET /api/performance/recommendations (Personalized Revision Recommendations)
router.get("/recommendations", async (req, res) => {
  try {
    const performance = await computePerformanceData(req.user._id);

    if (!performance.hasData) {
      return res.json({
        success: true,
        hasData: false,
        recommendations: [],
        message: "Take your first quiz to receive tailored topic revision plans.",
      });
    }

    const recommendations = [];

    // Map weak topics to available study materials
    const materials = await StudyMaterial.find({ userId: req.user._id }).select(
      "_id title"
    );

    if (performance.weakTopics.length > 0) {
      for (const wt of performance.weakTopics) {
        // Find matching study material if name matches
        const matchingMat = materials.find(
          (m) =>
            m.title.toLowerCase().includes(wt.topicName.toLowerCase()) ||
            wt.topicName.toLowerCase().includes(m.title.toLowerCase())
        ) || materials[0];

        recommendations.push({
          id: `rec_${wt.topicId}`,
          topicId: wt.topicId,
          topicName: wt.topicName,
          accuracy: wt.accuracy,
          attemptsCount: wt.attemptsCount,
          priority: wt.accuracy < 45 ? "high" : "medium",
          type: "weak_topic_revision",
          title: `Focus Revision: ${wt.topicName}`,
          description: `Your recent accuracy is ${wt.accuracy}%. Review the simplified summary and reinforce with a targeted quiz.`,
          materialId: matchingMat?._id || null,
          materialTitle: matchingMat?.title || "Study Material",
          actionUrl: `/learning?materialId=${matchingMat?._id}&topic=${encodeURIComponent(wt.topicName)}`,
          quizUrl: `/generate?materialId=${matchingMat?._id}&topic=${encodeURIComponent(wt.topicName)}`,
        });
      }
    } else if (performance.averagePercentage >= 80) {
      recommendations.push({
        id: "rec_challenge",
        priority: "low",
        type: "advancement",
        title: "Mastery Achieved! Try Hard Mode",
        description: `You have an impressive ${performance.averagePercentage}% average across all quizzes. Challenge yourself with a Hard difficulty quiz!`,
        actionUrl: "/generate",
        quizUrl: "/generate?difficulty=hard",
      });
    } else {
      recommendations.push({
        id: "rec_practice",
        priority: "medium",
        type: "consistency",
        title: "Build Consistent Mastery",
        description: "Generate quizzes regularly across different study materials to build topic confidence.",
        actionUrl: "/materials",
        quizUrl: "/generate",
      });
    }

    return res.json({
      success: true,
      hasData: true,
      recommendations,
      summary: {
        weakCount: performance.weakTopics.length,
        strongCount: performance.strongTopics.length,
        averagePercentage: performance.averagePercentage,
      },
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate recommendations.",
    });
  }
});

module.exports = router;
