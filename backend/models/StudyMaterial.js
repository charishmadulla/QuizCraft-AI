const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["pasted_text", "pdf", "docx"],
      required: true,
    },
    originalName: {
      type: String,
      default: "",
    },
    extractedText: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StudyMaterial",
  studyMaterialSchema
);
