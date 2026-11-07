const mongoose = require("mongoose");

const modelPredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    predictedScore: {
      type: Number,
      required: true,
    },
    expectedRange: {
      lowerBound: { type: Number },
      upperBound: { type: Number },
      marginOfError: { type: Number },
    },
    readinessTier: { type: String },
    readinessDescription: { type: String },
    modelVersion: { type: String, default: "1.0.0" },
    modelName: { type: String, default: "XGBoost" },
    inputFeatures: {
      avg_past_score: Number,
      recent_score: Number,
      attempts_count: Number,
      topic_accuracy_avg: Number,
      incorrect_rate: Number,
      time_per_question: Number,
      difficulty_level: Number,
      score_trend: Number,
    },
    predictionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ModelPrediction", modelPredictionSchema);
