import React from "react";
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

export default function AnalyticsView({
  quizHistory = [],
  materials = [],
  onNavigateToGenerate,
}) {
  const totalAttempts = quizHistory.length;

  const totalQuestions = quizHistory.reduce(
    (sum, a) => sum + (Number(a.totalQuestions) || 0),
    0
  );

  const totalCorrect = quizHistory.reduce(
    (sum, a) => sum + (Number(a.score) || 0),
    0
  );

  const totalIncorrect = Math.max(0, totalQuestions - totalCorrect);

  const accuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const averagePercentage =
    totalAttempts > 0
      ? Math.round(
          quizHistory.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0) /
            totalAttempts
        )
      : 0;

  const highestScore =
    totalAttempts > 0
      ? Math.max(...quizHistory.map((a) => Number(a.percentage) || 0))
      : 0;

  // Score Trends (up to last 10 attempts sorted chronologically)
  const scoreTrends = [...quizHistory]
    .filter((a) => a.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-10);

  // Group by Difficulty
  const difficultyStats = quizHistory.reduce((acc, a) => {
    const diff = (a.difficulty || "medium").toLowerCase();
    if (!acc[diff]) {
      acc[diff] = { count: 0, totalPercent: 0, correct: 0, questions: 0 };
    }
    acc[diff].count += 1;
    acc[diff].totalPercent += Number(a.percentage) || 0;
    acc[diff].correct += Number(a.score) || 0;
    acc[diff].questions += Number(a.totalQuestions) || 0;
    return acc;
  }, {});

  // Group by Study Material
  const materialStats = quizHistory.reduce((acc, a) => {
    const title = a.materialTitle || "Study Material";
    if (!acc[title]) {
      acc[title] = { count: 0, totalPercent: 0, correct: 0, questions: 0 };
    }
    acc[title].count += 1;
    acc[title].totalPercent += Number(a.percentage) || 0;
    acc[title].correct += Number(a.score) || 0;
    acc[title].questions += Number(a.totalQuestions) || 0;
    return acc;
  }, {});

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (totalAttempts === 0) {
    return (
      <div className="analytics-empty-wrapper">
        <div className="empty-state-card">
          <BarChart3 size={48} className="empty-state-icon" />
          <h3>No Performance Data Yet</h3>
          <p>
            Complete your first practice quiz to unlock performance analytics, score trends, and difficulty breakdowns.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToGenerate}
          >
            <Sparkles size={16} /> Take Your First Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Overview Stat Cards */}
      <section className="analytics-metrics-grid">
        <div className="metric-box" style={{ backgroundColor: "var(--lavender)" }}>
          <div className="metric-icon" style={{ color: "var(--purple-primary)" }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <span className="metric-title">Total Attempts</span>
            <h3 className="metric-num">{totalAttempts}</h3>
            <span className="metric-sub">{totalQuestions} questions solved</span>
          </div>
        </div>

        <div className="metric-box" style={{ backgroundColor: "var(--mint-soft)" }}>
          <div className="metric-icon" style={{ color: "var(--mint-accent)" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="metric-title">Average Score</span>
            <h3 className="metric-num">{averagePercentage}%</h3>
            <span className="metric-sub">Overall accuracy: {accuracy}%</span>
          </div>
        </div>

        <div className="metric-box" style={{ backgroundColor: "var(--blue-soft)" }}>
          <div className="metric-icon" style={{ color: "var(--blue-accent)" }}>
            <Award size={22} />
          </div>
          <div>
            <span className="metric-title">Highest Score</span>
            <h3 className="metric-num">{highestScore}%</h3>
            <span className="metric-sub">Personal record</span>
          </div>
        </div>

        <div className="metric-box" style={{ backgroundColor: "var(--cream-warm)" }}>
          <div className="metric-icon" style={{ color: "var(--peach-accent)" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="metric-title">Correct Answers</span>
            <h3 className="metric-num">{totalCorrect}</h3>
            <span className="metric-sub">{totalIncorrect} incorrect answers</span>
          </div>
        </div>
      </section>

      {/* Score Trend Bar Chart */}
      <section className="analytics-panel-card">
        <div className="panel-card-title">
          <TrendingUp size={18} style={{ color: "var(--purple-primary)" }} />
          <div>
            <h3>Score Progression Trend</h3>
            <p>Chronological score percentages of your recent quiz attempts</p>
          </div>
        </div>

        <div className="chart-bar-container">
          <div className="chart-bar-stage">
            {scoreTrends.map((att, index) => {
              const pct = Math.max(0, Math.min(100, Number(att.percentage) || 0));
              let barColor = "linear-gradient(180deg, #7E69AB, #9D84CF)";
              if (pct >= 80) {
                barColor = "linear-gradient(180deg, #458B68, #6BB791)";
              } else if (pct < 50) {
                barColor = "linear-gradient(180deg, #C86987, #E08FA8)";
              }

              return (
                <div
                  key={att._id || index}
                  className="trend-bar-column"
                  title={`${att.materialTitle || "Quiz"}: ${pct}% (${formatDate(att.createdAt)})`}
                >
                  <span className="bar-percentage-label">{pct}%</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        height: `${Math.max(6, pct)}%`,
                        background: barColor,
                      }}
                    />
                  </div>
                  <span className="bar-date-label">
                    {formatDate(att.createdAt) || `Q${index + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Column Breakdown */}
      <div className="analytics-two-col">
        {/* Performance by Difficulty */}
        <section className="analytics-panel-card">
          <div className="panel-card-title">
            <Layers size={18} style={{ color: "var(--mint-accent)" }} />
            <div>
              <h3>Performance by Difficulty</h3>
              <p>Average accuracy across question complexity levels</p>
            </div>
          </div>

          <div className="difficulty-breakdown-list">
            {["easy", "medium", "hard"].map((level) => {
              const stat = difficultyStats[level];
              const avg = stat && stat.count > 0 ? Math.round(stat.totalPercent / stat.count) : 0;
              const count = stat ? stat.count : 0;

              return (
                <div key={level} className="difficulty-item-row">
                  <div className="diff-header-row">
                    <strong className="diff-name">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </strong>
                    <span className="diff-meta">
                      {avg}% average · {count} {count === 1 ? "attempt" : "attempts"}
                    </span>
                  </div>
                  <div className="diff-progress-track">
                    <div
                      className="diff-progress-fill"
                      style={{
                        width: `${avg}%`,
                        backgroundColor:
                          level === "easy"
                            ? "var(--mint-accent)"
                            : level === "medium"
                            ? "var(--purple-primary)"
                            : "var(--pink-accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Performance by Study Material */}
        <section className="analytics-panel-card">
          <div className="panel-card-title">
            <Award size={18} style={{ color: "var(--blue-accent)" }} />
            <div>
              <h3>Performance by Study Resource</h3>
              <p>Quiz mastery grouped by source document</p>
            </div>
          </div>

          <div className="material-mastery-list">
            {Object.entries(materialStats).map(([title, stat]) => {
              const avg = Math.round(stat.totalPercent / stat.count);

              return (
                <div key={title} className="material-stat-item">
                  <div className="diff-header-row">
                    <span className="material-stat-name" title={title}>
                      {title}
                    </span>
                    <span className="diff-meta">
                      {avg}% · {stat.correct}/{stat.questions} correct
                    </span>
                  </div>
                  <div className="diff-progress-track">
                    <div
                      className="diff-progress-fill"
                      style={{
                        width: `${avg}%`,
                        backgroundColor: "var(--blue-accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
