const express = require("express");
const mongoose = require("mongoose");
const BookmarkedQuestion = require("../models/BookmarkedQuestion");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Require authentication for all bookmark routes
router.use(protect);

// GET all bookmarked questions for the authenticated user
router.get("/", async (req, res) => {
  try {
    const { search, materialTitle } = req.query;
    const filter = { userId: req.user._id };

    if (materialTitle) {
      filter.materialTitle = new RegExp(materialTitle, "i");
    }

    if (search) {
      filter.$and = [
        { userId: req.user._id },
        {
          $or: [
            { question: new RegExp(search, "i") },
            { explanation: new RegExp(search, "i") },
            { materialTitle: new RegExp(search, "i") },
          ],
        },
      ];
      delete filter.userId;
    }

    const bookmarks = await BookmarkedQuestion.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: bookmarks.length,
      bookmarks,
    });
  } catch (error) {
    console.error("Fetch bookmarks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not retrieve bookmarks",
    });
  }
});

// POST bookmark a question for authenticated user
router.post("/", async (req, res) => {
  try {
    const {
      quizId,
      materialId,
      materialTitle,
      difficulty,
      question,
      options,
      correctAnswer,
      explanation,
      questionType,
      notes,
    } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Question and options are required to bookmark.",
      });
    }

    // Check if already bookmarked by this user
    const existing = await BookmarkedQuestion.findOne({
      userId: req.user._id,
      question: question.trim(),
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Question is already in your bookmarks.",
        bookmark: existing,
      });
    }

    const bookmark = await BookmarkedQuestion.create({
      userId: req.user._id,
      quizId: quizId && mongoose.isValidObjectId(quizId) ? quizId : undefined,
      materialId:
        materialId && mongoose.isValidObjectId(materialId)
          ? materialId
          : undefined,
      materialTitle: materialTitle || "Study Material",
      difficulty: difficulty || "medium",
      question: question.trim(),
      options,
      correctAnswer: Number(correctAnswer) || 0,
      explanation: explanation || "",
      questionType: questionType || "multiple_choice",
      notes: notes || "",
    });

    res.status(201).json({
      success: true,
      message: "Question bookmarked successfully.",
      bookmark,
    });
  } catch (error) {
    console.error("Save bookmark error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not save bookmark",
    });
  }
});

// DELETE a bookmark by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookmark ID",
      });
    }

    const deleted = await BookmarkedQuestion.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found or access denied.",
      });
    }

    res.json({
      success: true,
      message: "Bookmark removed successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete bookmark error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not delete bookmark",
    });
  }
});

// DELETE bookmark by question text
router.post("/remove-by-question", async (req, res) => {
  try {
    const { question, quizId } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question text is required",
      });
    }

    const filter = {
      userId: req.user._id,
      question: question.trim(),
    };

    const deleted = await BookmarkedQuestion.findOneAndDelete(filter);

    res.json({
      success: true,
      message: deleted ? "Bookmark removed" : "Bookmark not found",
      deletedId: deleted?._id,
    });
  } catch (error) {
    console.error("Remove bookmark by question error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not remove bookmark",
    });
  }
});

module.exports = router;
