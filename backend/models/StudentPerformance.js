const mongoose = require("mongoose");

const studentPerformanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    averagePercentage: {
      type: Number,
      default: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
    },
    topicAccuracy: [
      {
        topicId: { type: String },
        topicName: { type: String },
        totalQuestions: { type: Number, default: 0 },
        correctCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        attemptsCount: { type: Number, default: 0 },
        lastAttemptDate: { type: Date, default: Date.now },
      },
    ],
    weakTopics: [
      {
        topicId: { type: String },
        topicName: { type: String },
        accuracy: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        attemptsCount: { type: Number, default: 0 },
        status: { type: String, default: "weak" },
        recommendation: { type: String, default: "" },
      },
    ],
    strongTopics: [
      {
        topicId: { type: String },
        topicName: { type: String },
        accuracy: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        attemptsCount: { type: Number, default: 0 },
      },
    ],
    progressHistory: [
      {
        attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "QuizAttempt" },
        quizTitle: { type: String },
        score: { type: Number },
        percentage: { type: Number },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentPerformance", studentPerformanceSchema);
