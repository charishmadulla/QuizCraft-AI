const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const materialsRouter = require("./routes/materials");
const uploadsRouter = require("./routes/uploads");
const quizzesRouter = require("./routes/quizzes");
const bookmarksRouter = require("./routes/bookmarks");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
// Authentication routes
app.use("/api/auth", authRouter);

// Study materials & uploads
// Both /api/materials/upload and /api/uploads are supported
app.use("/api/materials/upload", uploadsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/materials", materialsRouter);

// Quizzes and Bookmarks
app.use("/api/quizzes", quizzesRouter);
app.use("/api/bookmarks", bookmarksRouter);

app.get("/", (req, res) => {
  res.json({
    message: "QuizCraft AI API is running with User Authentication!",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start when executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;
