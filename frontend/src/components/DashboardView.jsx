import React from "react";
import {
  Sparkles,
  Upload,
  BookOpen,
  CheckCircle,
  Award,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  Bookmark,
  Calendar,
} from "lucide-react";

export default function DashboardView({
  materials = [],
  quizHistory = [],
  bookmarks = [],
  onNavigate,
  onOpenPreview,
  onSelectMaterialForQuiz,
}) {
  // Real stats calculated directly from database records
  const totalMaterials = materials.length;
  const totalCompletedQuizzes = quizHistory.length;

  const totalQuestionsAnswered = quizHistory.reduce(
    (sum, a) => sum + (Number(a.totalQuestions) || 0),
    0
  );

  const totalCorrect = quizHistory.reduce(
    (sum, a) => sum + (Number(a.score) || 0),
    0
  );

  const averageScore =
    totalCompletedQuizzes > 0
      ? Math.round(
          quizHistory.reduce(
            (sum, a) => sum + (Number(a.percentage) || 0),
            0
          ) / totalCompletedQuizzes
        )
      : 0;

  const highestScore =
    totalCompletedQuizzes > 0
      ? Math.max(...quizHistory.map((a) => Number(a.percentage) || 0))
      : 0;

  // Recent materials (up to 4)
  const recentMaterials = materials.slice(0, 4);

  // Recent attempts (up to 4)
  const recentAttempts = quizHistory.slice(0, 4);

  const formatDate = (date) => {
    if (!date) return "Recently";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? "Recent"
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
  };

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-text">
          <span className="welcome-tag">
            <Sparkles size={14} /> AI-POWERED STUDY WORKSPACE
          </span>
          <h2>
            Welcome to <span>QuizCraft AI</span>
          </h2>
          <p>
            Transform your study notes, textbooks, and PDF documents into
            customized, interactive quizzes powered by Google Gemini.
          </p>
          <div className="welcome-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={() => onNavigate("generate")}
            >
              <Sparkles size={16} /> Generate New Quiz
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate("materials")}
            >
              <Upload size={16} /> Upload Study Material
            </button>
          </div>
        </div>
      </section>

      {/* Pastel Statistic Cards */}
      <section className="stats-grid">
        <div className="stat-card" style={{ backgroundColor: "var(--lavender)" }}>
          <div className="stat-icon-wrapper" style={{ color: "var(--purple-primary)" }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Study Materials</span>
            <h3 className="stat-value">{totalMaterials}</h3>
            <span className="stat-subtext">Saved in library</span>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: "var(--mint-soft)" }}>
          <div className="stat-icon-wrapper" style={{ color: "var(--mint-accent)" }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Quizzes Completed</span>
            <h3 className="stat-value">{totalCompletedQuizzes}</h3>
            <span className="stat-subtext">{totalQuestionsAnswered} questions attempted</span>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: "var(--blue-soft)" }}>
          <div className="stat-icon-wrapper" style={{ color: "var(--blue-accent)" }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Average Score</span>
            <h3 className="stat-value">{averageScore}%</h3>
            <span className="stat-subtext">Across all attempts</span>
          </div>
        </div>

        <div className="stat-card" style={{ backgroundColor: "var(--cream-warm)" }}>
          <div className="stat-icon-wrapper" style={{ color: "var(--peach-accent)" }}>
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Highest Score</span>
            <h3 className="stat-value">{highestScore}%</h3>
            <span className="stat-subtext">Best performance</span>
          </div>
        </div>
      </section>

      {/* Two-Column Overview */}
      <div className="dashboard-grid-two-col">
        {/* Left: Recent Study Materials */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Study Materials</h3>
              <p>Your uploaded documents and study notes</p>
            </div>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => onNavigate("materials")}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {recentMaterials.length === 0 ? (
            <div className="panel-empty-state">
              <FileText size={32} />
              <p>No study materials uploaded yet.</p>
              <button
                type="button"
                className="btn-outline-sm"
                onClick={() => onNavigate("materials")}
              >
                Add Notes or Upload Document
              </button>
            </div>
          ) : (
            <div className="panel-items-list">
              {recentMaterials.map((item) => (
                <div key={item._id} className="panel-item-card">
                  <div className="item-icon-tag" style={{
                    backgroundColor: item.sourceType === "pdf" ? "var(--pink-pastel)" : item.sourceType === "docx" ? "var(--blue-soft)" : "var(--lavender)",
                    color: item.sourceType === "pdf" ? "var(--pink-accent)" : item.sourceType === "docx" ? "var(--blue-accent)" : "var(--purple-primary)"
                  }}>
                    {item.sourceType === "pdf" ? "PDF" : item.sourceType === "docx" ? "DOC" : "TXT"}
                  </div>
                  <div className="item-details">
                    <h4 title={item.title}>{item.title}</h4>
                    <span className="item-date">
                      <Calendar size={12} /> Added {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn-pill-subtle"
                      onClick={() => onOpenPreview(item._id)}
                      title="Preview extracted text"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="btn-pill-primary"
                      onClick={() => onSelectMaterialForQuiz(item._id)}
                      title="Generate quiz from this"
                    >
                      Quiz <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Recent Quiz Attempts */}
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Quiz Results</h3>
              <p>Your recent scores and performance</p>
            </div>
            <button
              type="button"
              className="text-link-btn"
              onClick={() => onNavigate("history")}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="panel-empty-state">
              <Sparkles size={32} />
              <p>No completed quizzes yet.</p>
              <button
                type="button"
                className="btn-outline-sm"
                onClick={() => onNavigate("generate")}
              >
                Generate Your First Quiz
              </button>
            </div>
          ) : (
            <div className="panel-items-list">
              {recentAttempts.map((attempt, idx) => (
                <div key={attempt._id || idx} className="panel-item-card">
                  <div className="item-score-badge" style={{
                    backgroundColor: attempt.percentage >= 70 ? "var(--mint-soft)" : attempt.percentage >= 40 ? "var(--cream-warm)" : "var(--pink-pastel)",
                    color: attempt.percentage >= 70 ? "var(--mint-accent)" : attempt.percentage >= 40 ? "var(--peach-accent)" : "var(--pink-accent)",
                  }}>
                    {attempt.percentage}%
                  </div>
                  <div className="item-details">
                    <h4 title={attempt.materialTitle}>{attempt.materialTitle}</h4>
                    <span className="item-date">
                      <Clock size={12} /> {formatDate(attempt.createdAt)} · {attempt.difficulty} · {attempt.score}/{attempt.totalQuestions} correct
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-pill-subtle"
                    onClick={() => onNavigate("history")}
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bookmarks quick bar if any */}
      {bookmarks.length > 0 && (
        <section className="dashboard-banner-footer">
          <div className="footer-banner-left">
            <div className="footer-banner-icon">
              <Bookmark size={20} />
            </div>
            <div>
              <h4>You have {bookmarks.length} bookmarked {bookmarks.length === 1 ? "question" : "questions"}</h4>
              <p>Review difficult concepts and practice key questions before your exam.</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate("bookmarks")}
          >
            Practice Bookmarks <ArrowRight size={14} />
          </button>
        </section>
      )}
    </div>
  );
}
