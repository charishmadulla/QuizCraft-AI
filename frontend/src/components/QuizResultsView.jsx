import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  Bookmark,
  Check,
  ChevronDown,
  Filter,
} from "lucide-react";
import { generateQuizReportPDF } from "../utils/pdfGenerator";

export default function QuizResultsView({
  resultsData,
  onRetakeQuiz,
  onGenerateAnother,
  onBackToDashboard,
  onBookmarkQuestion,
  bookmarkedMap = {}, // map of question text -> boolean
}) {
  const [filterMode, setFilterMode] = useState("all"); // "all", "incorrect", "correct"
  const [downloading, setDownloading] = useState(false);

  if (!resultsData) return null;

  const {
    quizTitle = "Practice Quiz",
    difficulty = "Medium",
    score = 0,
    totalQuestions = 0,
    percentage = 0,
    timeTaken = 0,
    submittedAt = new Date(),
    results = [],
    materialTitle = "Study Material",
  } = resultsData;

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.filter(
    (r) => !r.isCorrect && r.selectedAnswer !== null && r.selectedAnswer !== undefined
  ).length;
  const unansweredCount = results.filter(
    (r) => r.selectedAnswer === null || r.selectedAnswer === undefined
  ).length;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  // Performance headline & pastel badge
  let performanceBadge = "Good Effort!";
  let badgeColor = "var(--lavender)";
  let badgeTextColor = "var(--purple-primary)";

  if (percentage >= 85) {
    performanceBadge = "Mastery Level! Excellent Work!";
    badgeColor = "var(--mint-soft)";
    badgeTextColor = "var(--mint-accent)";
  } else if (percentage >= 65) {
    performanceBadge = "Solid Understanding! Well Done!";
    badgeColor = "var(--blue-soft)";
    badgeTextColor = "var(--blue-accent)";
  } else if (percentage < 50) {
    performanceBadge = "Needs More Revision. Keep Practicing!";
    badgeColor = "var(--pink-pastel)";
    badgeTextColor = "var(--pink-accent)";
  }

  // Filtered review list
  const filteredQuestions = results.filter((q) => {
    if (filterMode === "incorrect") return !q.isCorrect;
    if (filterMode === "correct") return q.isCorrect;
    return true;
  });

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      generateQuizReportPDF({
        quizTitle: materialTitle || quizTitle,
        difficulty,
        score,
        totalQuestions,
        percentage,
        timeTaken,
        submittedAt,
        results,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="quiz-results-container">
      {/* Top Banner Card */}
      <section className="results-summary-card">
        <div className="summary-left">
          <div className="summary-score-circle">
            <span className="score-percentage-number">{percentage}%</span>
            <span className="score-ratio-label">
              {score} / {totalQuestions} Correct
            </span>
          </div>

          <div className="summary-text-group">
            <span
              className="performance-pill"
              style={{ backgroundColor: badgeColor, color: badgeTextColor }}
            >
              <Award size={14} /> {performanceBadge}
            </span>
            <h2>{materialTitle || "Quiz Assessment Completed"}</h2>
            <p className="summary-details">
              Difficulty: <strong>{difficulty}</strong> · Completed in{" "}
              <strong>{timeTaken > 0 ? formatTime(timeTaken) : "N/A"}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="summary-actions-group">
          <button
            type="button"
            className="btn-primary"
            onClick={handleDownloadPDF}
            disabled={downloading}
          >
            <Download size={16} />
            <span>{downloading ? "Preparing PDF..." : "Download PDF Report"}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRetakeQuiz}
          >
            <RotateCcw size={16} />
            <span>Retake Quiz</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onGenerateAnother}
          >
            <Sparkles size={16} />
            <span>Generate Another</span>
          </button>
          <button
            type="button"
            className="btn-subtle"
            onClick={onBackToDashboard}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </button>
        </div>
      </section>

      {/* Pastel Metric Breakdown Cards */}
      <section className="results-breakdown-grid">
        <div className="breakdown-stat-card" style={{ backgroundColor: "var(--mint-soft)" }}>
          <div className="breakdown-icon" style={{ color: "var(--mint-accent)" }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3>{correctCount}</h3>
            <span>Correct Answers</span>
          </div>
        </div>

        <div className="breakdown-stat-card" style={{ backgroundColor: "var(--pink-pastel)" }}>
          <div className="breakdown-icon" style={{ color: "var(--pink-accent)" }}>
            <XCircle size={24} />
          </div>
          <div>
            <h3>{incorrectCount}</h3>
            <span>Incorrect Answers</span>
          </div>
        </div>

        <div className="breakdown-stat-card" style={{ backgroundColor: "var(--lavender)" }}>
          <div className="breakdown-icon" style={{ color: "var(--purple-primary)" }}>
            <HelpCircle size={24} />
          </div>
          <div>
            <h3>{unansweredCount}</h3>
            <span>Unanswered</span>
          </div>
        </div>

        <div className="breakdown-stat-card" style={{ backgroundColor: "var(--blue-soft)" }}>
          <div className="breakdown-icon" style={{ color: "var(--blue-accent)" }}>
            <Clock size={24} />
          </div>
          <div>
            <h3>{timeTaken > 0 ? formatTime(timeTaken) : "< 1m"}</h3>
            <span>Total Time Spent</span>
          </div>
        </div>
      </section>

      {/* Question Review Section */}
      <section className="results-review-section">
        <div className="review-section-header">
          <div>
            <h3>Question-by-Question Review</h3>
            <p>Review every question, check correct answers, and read comprehensive explanations</p>
          </div>

          <div className="review-filter-pills">
            <button
              type="button"
              className={`filter-pill-btn ${filterMode === "all" ? "filter-pill-active" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              All Questions ({results.length})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterMode === "incorrect" ? "filter-pill-active" : ""}`}
              onClick={() => setFilterMode("incorrect")}
            >
              Incorrect ({incorrectCount + unansweredCount})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${filterMode === "correct" ? "filter-pill-active" : ""}`}
              onClick={() => setFilterMode("correct")}
            >
              Correct ({correctCount})
            </button>
          </div>
        </div>

        <div className="review-questions-list">
          {filteredQuestions.map((item, idx) => {
            const isCorrect = item.isCorrect;
            const isUnanswered =
              item.selectedAnswer === null || item.selectedAnswer === undefined;
            const isBookmarked = bookmarkedMap[item.question];

            return (
              <article
                key={idx}
                className={`review-question-card ${
                  isCorrect
                    ? "card-border-success"
                    : isUnanswered
                    ? "card-border-neutral"
                    : "card-border-danger"
                }`}
              >
                <div className="review-card-topbar">
                  <div className="review-status-indicator">
                    {isCorrect ? (
                      <span className="status-badge-correct">
                        <CheckCircle2 size={15} /> Correct
                      </span>
                    ) : isUnanswered ? (
                      <span className="status-badge-unanswered">
                        <HelpCircle size={15} /> Unanswered
                      </span>
                    ) : (
                      <span className="status-badge-incorrect">
                        <XCircle size={15} /> Incorrect
                      </span>
                    )}
                    <span className="question-index-tag">Question {item.index + 1}</span>
                  </div>

                  <button
                    type="button"
                    className={`btn-bookmark-question ${isBookmarked ? "bookmarked" : ""}`}
                    onClick={() =>
                      onBookmarkQuestion({
                        quizId: resultsData.quizId,
                        materialTitle: materialTitle,
                        difficulty: difficulty,
                        question: item.question,
                        options: item.options,
                        correctAnswer: item.correctAnswer,
                        explanation: item.explanation,
                        questionType: item.questionType,
                      })
                    }
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark this question"}
                  >
                    <Bookmark size={15} />
                    <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                  </button>
                </div>

                <div className="review-question-prompt">
                  <h4>{item.question}</h4>
                </div>

                <div className="review-options-grid">
                  {item.options.map((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const isSelected = item.selectedAnswer === optIndex;
                    const isRightAnswer = item.correctAnswer === optIndex;

                    let optStyleClass = "review-opt-box";
                    if (isRightAnswer) {
                      optStyleClass += " review-opt-correct";
                    } else if (isSelected && !isRightAnswer) {
                      optStyleClass += " review-opt-wrong";
                    }

                    return (
                      <div key={optIndex} className={optStyleClass}>
                        <span className="review-opt-letter">{letter}</span>
                        <span className="review-opt-text">{opt}</span>
                        {isRightAnswer && (
                          <span className="review-opt-tag correct-tag">
                            Correct Answer
                          </span>
                        )}
                        {isSelected && !isRightAnswer && (
                          <span className="review-opt-tag wrong-tag">
                            Your Choice
                          </span>
                        )}
                        {isSelected && isRightAnswer && (
                          <span className="review-opt-tag user-correct-tag">
                            Your Choice ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {item.explanation && (
                  <div className="review-explanation-box">
                    <strong>Explanation:</strong>
                    <p>{item.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
