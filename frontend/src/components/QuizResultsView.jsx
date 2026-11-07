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
  Target,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { generateQuizReportPDF } from "../utils/pdfGenerator";

export default function QuizResultsView({
  resultsData,
  onRetakeQuiz,
  onGenerateAnother,
  onBackToDashboard,
  onBookmarkQuestion,
  onReviseTopic, // (materialId, topicName) => void
  onTargetTopicQuiz, // (materialId, topicName) => void
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
    topicPerformance = [],
    materialTitle = "Study Material",
    materialId = "",
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

      {/* Module 2 & 3: Topic-wise Performance Diagnostic Breakdown */}
      {topicPerformance && topicPerformance.length > 0 && (
        <section className="results-topic-breakdown-card" style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                <Target size={20} style={{ color: "var(--purple-primary)" }} />
                Topic-Wise Mastery & Diagnostic Breakdown
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Diagnostic analysis feeds your Performance Intelligence and Weak-Topic Detection engine
              </p>
            </div>
            <span style={{
              fontSize: "0.8rem",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: "var(--lavender)",
              color: "var(--purple-primary)",
              fontWeight: "600"
            }}>
              {topicPerformance.length} Topics Assessed
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {topicPerformance.map((tp, idx) => {
              const isWeak = tp.accuracy < 60;
              const isStrong = tp.accuracy >= 75;
              const statusColor = isStrong ? "var(--mint-accent)" : isWeak ? "var(--pink-accent)" : "var(--peach-accent)";
              const statusBg = isStrong ? "var(--mint-soft)" : isWeak ? "var(--pink-pastel)" : "var(--cream-warm)";

              return (
                <div key={idx} style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-main)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{tp.topicName}</strong>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: statusBg,
                        color: statusColor,
                        fontWeight: "600"
                      }}>
                        {tp.accuracy}%
                      </span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      {tp.correctCount} of {tp.totalQuestions} questions correct
                    </div>

                    {/* Accuracy mini bar */}
                    <div style={{ width: "100%", height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
                      <div style={{
                        width: `${tp.accuracy}%`,
                        height: "100%",
                        backgroundColor: statusColor,
                        borderRadius: "3px"
                      }}></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                    {onReviseTopic && (
                      <button
                        type="button"
                        onClick={() => onReviseTopic(materialId, tp.topicName)}
                        style={{
                          flex: 1,
                          fontSize: "0.75rem",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--purple-primary)",
                          backgroundColor: "transparent",
                          color: "var(--purple-primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        <BookOpen size={12} /> Revise
                      </button>
                    )}
                    {onTargetTopicQuiz && isWeak && (
                      <button
                        type="button"
                        onClick={() => onTargetTopicQuiz(materialId, tp.topicName)}
                        style={{
                          flex: 1,
                          fontSize: "0.75rem",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "var(--pink-pastel)",
                          color: "var(--pink-accent)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontWeight: "600"
                        }}
                      >
                        <Target size={12} /> Re-Quiz
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
                    {item.topicName && (
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor: "var(--lavender)",
                        color: "var(--purple-primary)",
                        fontWeight: "500",
                        marginLeft: "6px"
                      }}>
                        {item.topicName}
                      </span>
                    )}
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
