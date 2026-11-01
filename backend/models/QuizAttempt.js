const mongoose = require("mongoose");

const quizAttemptResultSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    selectedAnswer: { type: Number, default: null },
    correctAnswer: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: "" },
    questionType: { type: String, default: "multiple_choice" },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
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
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    answers: {
      type: [Number],
      required: true,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unansweredCount: {
      type: Number,
      default: 0,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    results: {
      type: [quizAttemptResultSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
