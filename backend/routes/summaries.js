const express = require("express");
const mongoose = require("mongoose");
const StudyMaterial = require("../models/StudyMaterial");
const Summary = require("../models/Summary");
const { protect } = require("../middleware/auth");
const { generateStructuredSummary } = require("../services/summarizationService");

const router = express.Router();
router.use(protect);

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

// POST /api/summaries/generate
router.post("/generate", async (req, res) => {
  try {
    const { materialId, summaryLevel = "medium" } = req.body;

    if (!materialId || !mongoose.isValidObjectId(materialId)) {
      return res.status(400).json({
        success: false,
        message: "A valid materialId is required.",
      });
    }

    const material = await StudyMaterial.findOne({
      _id: materialId,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found or access denied.",
      });
    }

    const text = getMaterialText(material);
    if (!text || text.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Extracted material text is too short to summarize.",
      });
    }

    console.log(`[Summary] Generating ${summaryLevel} summary for "${material.title}"`);
    const summaryData = await generateStructuredSummary(
      text,
      summaryLevel,
      material.title
    );

    // Upsert or create summary record for this user and material
    let summary = await Summary.findOne({
      materialId: material._id,
      userId: req.user._id,
      summaryLevel,
    });

    if (summary) {
      Object.assign(summary, {
        sourceTitle: material.title,
        ...summaryData,
      });
      await summary.save();
    } else {
      summary = await Summary.create({
        userId: req.user._id,
        materialId: material._id,
        sourceTitle: material.title,
        ...summaryData,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Summary generated successfully.",
      summary,
    });
  } catch (error) {
    console.error("Summary generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate summary.",
    });
  }
});

// GET /api/summaries
router.get("/", async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user._id })
      .select("materialId sourceTitle summaryLevel mainTopic createdAt updatedAt")
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      count: summaries.length,
      summaries,
    });
  } catch (error) {
    console.error("Fetch summaries error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch summaries.",
    });
  }
});

// GET /api/summaries/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid summary ID.",
      });
    }

    // Match by summary _id or materialId
    const summary = await Summary.findOne({
      $or: [{ _id: id }, { materialId: id }],
      userId: req.user._id,
    });

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: "Summary record not found.",
      });
    }

    return res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Get summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve summary.",
    });
  }
});

// DELETE /api/summaries/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid summary ID.",
      });
    }

    const deleted = await Summary.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Summary not found or access denied.",
      });
    }

    return res.json({
      success: true,
      message: "Summary deleted successfully.",
    });
  } catch (error) {
    console.error("Delete summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete summary.",
    });
  }
});

module.exports = router;
