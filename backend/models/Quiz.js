const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) =>
          Array.isArray(options) && options.length >= 2 && options.length <= 4,
        message: "Each question must have between two and four options.",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["multiple_choice", "true_false", "fill_in_the_blank"],
      default: "multiple_choice",
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    materialTitle: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      validate: {
        validator: (questions) => questions.length > 0,
        message: "A quiz must contain at least one question.",
      },
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      default: null,
    },
    answers: {
      type: [Number],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
