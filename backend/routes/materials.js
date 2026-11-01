const express = require("express");
const mongoose = require("mongoose");
const StudyMaterial = require("../models/StudyMaterial");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Apply authentication to all materials routes
router.use(protect);

// Save study material (pasted text)
router.post("/", async (req, res) => {
  try {
    const { title, sourceType, extractedText, originalName } = req.body;

    if (
      !title?.trim() ||
      !extractedText?.trim() ||
      !["pasted_text", "pdf", "docx"].includes(sourceType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a title, valid source type, and text.",
      });
    }

    const material = await StudyMaterial.create({
      userId: req.user._id,
      title: title.trim(),
      sourceType,
      extractedText: extractedText.trim(),
      originalName: originalName || "",
    });

    res.status(201).json({
      success: true,
      message: "Study material saved successfully",
      material,
    });
  } catch (error) {
    console.error("Save material error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not save study material",
    });
  }
});

// Get user's saved study materials list (summary view)
router.get("/", async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.user._id })
      .select("-extractedText")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: materials.length,
      materials,
    });
  } catch (error) {
    console.error("Fetch materials error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve study materials",
    });
  }
});

// Get single study material including extractedText (for preview modal)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid study material ID",
      });
    }

    const material = await StudyMaterial.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found or access denied.",
      });
    }

    res.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error("Fetch material by ID error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve study material",
    });
  }
});

// Rename study material
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid study material ID",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty title is required",
      });
    }

    const material = await StudyMaterial.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title: title.trim() },
      { returnDocument: "after" }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found or access denied.",
      });
    }

    res.json({
      success: true,
      message: "Material renamed successfully",
      material,
    });
  } catch (error) {
    console.error("Rename material error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not rename study material",
    });
  }
});

// Delete study material
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid study material ID",
      });
    }

    const material = await StudyMaterial.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found or access denied.",
      });
    }

    res.json({
      success: true,
      message: "Study material deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete material error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not delete study material",
    });
  }
});

module.exports = router;
