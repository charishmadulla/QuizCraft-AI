const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyMaterial",
      required: true,
      index: true,
    },
    sourceTitle: {
      type: String,
      required: true,
    },
    summaryLevel: {
      type: String,
      enum: ["short", "medium", "detailed"],
      default: "medium",
    },
    mainTopic: { type: String, default: "" },
    introduction: { type: String, default: "" },
    importantConcepts: [{ type: String }],
    keyPoints: [{ type: String }],
    importantDefinitions: [
      {
        term: { type: String },
        definition: { type: String },
      },
    ],
    examples: [{ type: String }],
    conclusion: { type: String, default: "" },
    rawSummary: { type: String, default: "" },
    simplifiedExplanation: {
      simplifiedText: { type: String, default: "" },
      analogies: [{ type: String }],
      technicalGlossary: [
        {
          term: { type: String },
          simpleExplanation: { type: String },
        },
      ],
      keyTakeaways: [{ type: String }],
    },
    mindMapData: {
      topic: { type: String },
      nodes: [
        {
          id: { type: String },
          label: { type: String },
          type: { type: String },
          parentId: { type: String },
          description: { type: String },
        },
      ],
      edges: [
        {
          from: { type: String },
          to: { type: String },
          relation: { type: String },
        },
      ],
    },
    flowchartData: {
      title: { type: String },
      steps: [
        {
          id: { type: String },
          stepNumber: { type: Number },
          type: { type: String },
          label: { type: String },
          description: { type: String },
          nextStepId: { type: String },
          condition: { type: String },
        },
      ],
    },
    comparisonTables: [
      {
        title: { type: String },
        headers: [{ type: String }],
        rows: [[{ type: String }]],
      },
    ],
    chartsData: {
      hasNumericalData: { type: Boolean, default: false },
      message: { type: String, default: "" },
      charts: [
        {
          title: { type: String },
          type: { type: String, enum: ["bar", "pie", "line"] },
          xAxisLabel: { type: String },
          yAxisLabel: { type: String },
          unit: { type: String },
          description: { type: String },
          dataPoints: [
            {
              label: { type: String },
              value: { type: Number },
            },
          ],
        },
      ],
    },
    flashcards: [
      {
        front: { type: String },
        back: { type: String },
        category: { type: String, default: "concept" },
      },
    ],
    importantFormulas: [
      {
        name: { type: String },
        formula: { type: String },
        explanation: { type: String },
      },
    ],
    importantFacts: [{ type: String }],
    modelName: { type: String, default: "facebook/bart-large-cnn" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Summary", summarySchema);
