const express = require("express");
const multer = require("multer");
const path = require("path");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const StudyMaterial = require("../models/StudyMaterial");
const { protect } = require("../middleware/auth");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (extension === ".pdf" || extension === ".docx") {
      callback(null, true);
    } else {
      callback(new Error("Only PDF and DOCX files are supported."));
    }
  },
});

// Require authentication for uploads
router.use(protect);

router.post("/", (req, res) => {
  upload.single("file")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        success: false,
        message: uploadError.message,
      });
    }

    let parser;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a PDF or DOCX file.",
        });
      }

      const extension = path.extname(req.file.originalname).toLowerCase();
      let extractedText = "";
      let sourceType = "";

      if (extension === ".pdf") {
        parser = new PDFParse({ data: req.file.buffer });
        const result = await parser.getText();
        extractedText = result.text;
        sourceType = "pdf";
      } else if (extension === ".docx") {
        const result = await mammoth.extractRawText({
          buffer: req.file.buffer,
        });
        extractedText = result.value;
        sourceType = "docx";
      }

      // Clean extracted text
      const cleanedText = extractedText
        .replace(/\u0000/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

      // Validate extracted text
      if (cleanedText.length < 50) {
        return res.status(400).json({
          success: false,
          message:
            "The document contains too little readable text. Please upload a text-based PDF or DOCX with more study content. Scanned PDFs may require OCR.",
        });
      }

      // Create title from original filename
      const title = path.parse(req.file.originalname).name;

      // Save study material to MongoDB attached to current user
      const material = await StudyMaterial.create({
        userId: req.user._id,
        title,
        sourceType,
        originalName: req.file.originalname,
        extractedText: cleanedText,
      });

      // Return saved material details
      return res.status(201).json({
        success: true,
        message: "Document uploaded and saved successfully.",
        material: {
          _id: material._id,
          userId: material.userId,
          title: material.title,
          sourceType: material.sourceType,
          originalName: material.originalName,
          createdAt: material.createdAt,
          extractedCharacterCount: cleanedText.length,
        },
      });
    } catch (error) {
      console.error("Document processing error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not process the document. Please try another file.",
      });
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  });
});

module.exports = router;
