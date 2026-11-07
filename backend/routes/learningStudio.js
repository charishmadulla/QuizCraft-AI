const express = require("express");
const mongoose = require("mongoose");
const StudyMaterial = require("../models/StudyMaterial");
const Summary = require("../models/Summary");
const { protect } = require("../middleware/auth");
const {
  generateSimplifiedExplanation,
  generateVisualLearning,
} = require("../services/visualLearningService");

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

// POST /api/learning/visualize
router.post("/visualize", async (req, res) => {
  try {
    const { materialId } = req.body;

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
        message: "Study material not found.",
      });
    }

    const text = getMaterialText(material);
    if (!text || text.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Material text is too short for visual learning generation.",
      });
    }

    console.log(`[Visual Learning] Generating diagrams & flashcards for "${material.title}"`);
    const visualData = await generateVisualLearning(text, material.title);

    // Save or update to Summary model
    let summary = await Summary.findOne({
      materialId: material._id,
      userId: req.user._id,
    });

    if (summary) {
      summary.mindMapData = visualData.mindMapData;
      summary.flowchartData = visualData.flowchartData;
      summary.comparisonTables = visualData.comparisonTables;
      summary.chartsData = visualData.chartsData;
      summary.flashcards = visualData.flashcards;
      summary.importantFormulas = visualData.importantFormulas;
      summary.importantFacts = visualData.importantFacts;
      await summary.save();
    } else {
      summary = await Summary.create({
        userId: req.user._id,
        materialId: material._id,
        sourceTitle: material.title,
        ...visualData,
      });
    }

    return res.json({
      success: true,
      message: "Visual learning materials generated successfully.",
      data: visualData,
    });
  } catch (error) {
    console.error("Visual learning generation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate visual learning materials.",
    });
  }
});

// POST /api/learning/simplify
router.post("/simplify", async (req, res) => {
  try {
    const { materialId, topicOrParagraph = "" } = req.body;

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
        message: "Study material not found.",
      });
    }

    const text = getMaterialText(material);
    if (!text || text.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: "Material text is too short to simplify.",
      });
    }

    console.log(`[Simplify] Simplifying content for "${material.title}"`);
    const simplified = await generateSimplifiedExplanation(text, topicOrParagraph);

    // Update in Summary if exists
    let summary = await Summary.findOne({
      materialId: material._id,
      userId: req.user._id,
    });

    if (summary) {
      summary.simplifiedExplanation = simplified;
      await summary.save();
    }

    return res.json({
      success: true,
      message: "Simplified explanation generated successfully.",
      simplifiedExplanation: simplified,
    });
  } catch (error) {
    console.error("Simplification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to simplify content.",
    });
  }
});

// GET /api/learning/:materialId
router.get("/:materialId", async (req, res) => {
  try {
    const { materialId } = req.params;

    if (!mongoose.isValidObjectId(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID.",
      });
    }

    const summary = await Summary.findOne({
      materialId,
      userId: req.user._id,
    });

    if (!summary) {
      return res.json({
        success: true,
        hasData: false,
        message: "No visual learning assets generated yet for this material.",
      });
    }

    return res.json({
      success: true,
      hasData: true,
      mindMapData: summary.mindMapData,
      flowchartData: summary.flowchartData,
      comparisonTables: summary.comparisonTables,
      chartsData: summary.chartsData,
      flashcards: summary.flashcards,
      importantFormulas: summary.importantFormulas,
      importantFacts: summary.importantFacts,
      simplifiedExplanation: summary.simplifiedExplanation,
    });
  } catch (error) {
    console.error("Get learning assets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve learning assets.",
    });
  }
});

module.exports = router;
