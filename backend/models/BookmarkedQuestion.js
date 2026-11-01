const mongoose = require("mongoose");

const bookmarkedQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
    },
    materialTitle: {
      type: String,
      default: "Study Material",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: "",
    },
    questionType: {
      type: String,
      default: "multiple_choice",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "BookmarkedQuestion",
  bookmarkedQuestionSchema
);
