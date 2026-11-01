import React, { useState } from "react";
import {
  History,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";

export default function MyQuizzesView({
  quizHistory = [],
  loading = false,
  onOpenAttemptResults,
  onRetakeQuizFromHistory,
  onNavigateToGenerate,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredAttempts = quizHistory
    .filter((attempt) => {
      const title = attempt.materialTitle || "Quiz";
      const matchesSearch = title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === "all" ||
        attempt.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "highestScore") {
        return (b.percentage || 0) - (a.percentage || 0);
      }
      if (sortBy === "lowestScore") {
        return (a.percentage || 0) - (b.percentage || 0);
      }
      return 0;
    });

  const formatDate = (date) => {
    if (!date) return "Recently";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "Recent"
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  return (
    <div className="my-quizzes-container">
      {/* Header Controls */}
      <div className="quizzes-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search completed quizzes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-controls-group">
          <div className="select-pill-wrapper">
            <Filter size={14} />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              aria-label="Filter by difficulty"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="select-pill-wrapper">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort attempts"
            >
              <option value="newest">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="highestScore">Highest Score</option>
              <option value="lowestScore">Lowest Score</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner"></div>
          <p>Loading your quiz history...</p>
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="empty-state-card">
          <History size={44} className="empty-state-icon" />
          <h3>No Quiz Attempts Found</h3>
          <p>
            {searchQuery || difficultyFilter !== "all"
              ? "No quiz attempts match your current search or difficulty filter."
              : "You haven't completed any quizzes yet. Generate a quiz from your notes and test your knowledge!"}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToGenerate}
          >
            <Sparkles size={16} /> Generate Practice Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-history-list">
          {filteredAttempts.map((attempt) => {
            const percentage = attempt.percentage || 0;
            let scoreBg = "var(--lavender)";
            let scoreColor = "var(--purple-primary)";

            if (percentage >= 80) {
              scoreBg = "var(--mint-soft)";
              scoreColor = "var(--mint-accent)";
            } else if (percentage < 50) {
              scoreBg = "var(--pink-pastel)";
              scoreColor = "var(--pink-accent)";
            }

            return (
              <article key={attempt._id} className="history-row-card">
                <div
                  className="history-score-box"
                  style={{ backgroundColor: scoreBg, color: scoreColor }}
                >
                  <span className="history-score-percent">{percentage}%</span>
                  <span className="history-score-detail">
                    {attempt.score} / {attempt.totalQuestions}
                  </span>
                </div>

                <div className="history-info-body">
                  <div className="history-title-row">
                    <h4>{attempt.materialTitle || "Quiz Assessment"}</h4>
                    <span className="difficulty-tag">
                      {attempt.difficulty?.toUpperCase()}
                    </span>
                  </div>

                  <div className="history-meta-row">
                    <span>
                      <Calendar size={13} /> {formatDate(attempt.createdAt)}
                    </span>
                    <span>
                      <Clock size={13} /> {attempt.totalQuestions} Questions
                    </span>
                    {attempt.autoSubmitted && (
                      <span className="auto-submit-pill">Auto-Submitted</span>
                    )}
                  </div>
                </div>

                <div className="history-actions-row">
                  <button
                    type="button"
                    className="btn-pill-subtle"
                    onClick={() => onOpenAttemptResults(attempt._id)}
                    title="Review questions and explanations"
                  >
                    <Eye size={15} /> Review Results
                  </button>
                  <button
                    type="button"
                    className="btn-pill-primary"
                    onClick={() =>
                      onRetakeQuizFromHistory(attempt.quizId || attempt._id)
                    }
                    title="Retake this quiz"
                  >
                    <RotateCcw size={15} /> Retake
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
