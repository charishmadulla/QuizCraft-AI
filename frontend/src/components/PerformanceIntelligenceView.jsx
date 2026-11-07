import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCw,
  Cpu,
  Brain,
  HelpCircle,
  BarChart3,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  Target,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  getPerformanceOverview,
  predictFutureScore,
  getLatestPrediction,
} from "../services/api";

export default function PerformanceIntelligenceView({
  onNavigateToQuiz,
  onNavigateToRecommendations,
  onSelectTopicForRevision,
  onShowToast,
}) {
  const [loading, setLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [performance, setPerformance] = useState(null);

  // ML Prediction States
  const [predicting, setPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [targetDifficulty, setTargetDifficulty] = useState(2); // 1=Easy, 2=Med, 3=Hard

  // Explicit user-driven performance analysis
  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const perfData = await getPerformanceOverview();
      if (perfData) {
        setPerformance(perfData);
        setHasAnalyzed(true);
        if (onShowToast) onShowToast("Cognitive performance analysis complete!", "success");
      }
    } catch (err) {
      console.warn("Could not load performance overview:", err);
      if (onShowToast) onShowToast(err.message || "Failed to analyze performance data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      const res = await predictFutureScore({ targetDifficulty });
      if (res?.prediction) {
        setPredictionData(res.prediction);
        if (onShowToast) onShowToast("ML assessment forecast computed successfully!", "success");
      } else if (res?.isColdStart) {
        setPredictionData(res);
        if (onShowToast) onShowToast(res.message, "info");
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Prediction service error.", "error");
    } finally {
      setPredicting(false);
    }
  };

  const hasData = performance && performance.hasData;

  return (
    <div className="perf-intelligence-page">
      {/* Top Header Card */}
      <div className="perf-hero-header">
        <div className="perf-hero-text">
          <div className="studio-badge-row">
            <span className="studio-pill-badge">
              <Cpu size={14} /> COGNITIVE ANALYTICS
            </span>
            <span className="studio-doc-badge">ML Predictive Engine</span>
          </div>
          <h1>Performance Intelligence</h1>
          <p>
            Continuous diagnostic tracking of your topic mastery, accuracy trajectory, and predicted exam readiness powered by machine learning regression.
          </p>
        </div>

        <div className="perf-hero-actions-group" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {hasAnalyzed && (
            <button
              type="button"
              className="btn-toolbar-action"
              onClick={handleRunAnalysis}
              disabled={loading}
              title="Refresh cognitive performance metrics"
            >
              <RotateCw size={14} className={loading ? "spin-icon" : ""} />
              <span>Re-run Diagnostic</span>
            </button>
          )}
          {onNavigateToRecommendations && (
            <button
              type="button"
              className="btn-hero-action"
              onClick={onNavigateToRecommendations}
            >
              <TrendingUp size={16} /> View Revision Roadmap →
            </button>
          )}
        </div>
      </div>

      {/* Loading state during explicit diagnostic execution */}
      {loading && (
        <div className="studio-card-loading" style={{ padding: "80px 20px" }}>
          <div className="btn-spinner large"></div>
          <h4>Analyzing Cognitive Mastery & Error Curves...</h4>
          <p>Evaluating topic-level accuracy across your historical attempts.</p>
        </div>
      )}

      {/* Initial state: Waiting for user to click Analyze */}
      {!hasAnalyzed && !loading && (
        <div className="studio-prompt-card" style={{ margin: "24px 0", padding: "60px 24px" }}>
          <div
            className="prompt-card-icon-wrapper"
            style={{ backgroundColor: "var(--lavender)", color: "var(--purple-primary)" }}
          >
            <Cpu size={36} />
          </div>
          <h3>Run Performance Intelligence Diagnostic</h3>
          <p>
            Analyze your quiz accuracy trajectory, detect weak topics requiring targeted revision, evaluate mastered concepts, and compute test-readiness forecasts using machine learning models.
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: "12px 26px", fontSize: "0.96rem" }}
            onClick={handleRunAnalysis}
          >
            <Sparkles size={16} /> Analyze My Performance Now
          </button>
        </div>
      )}

      {/* When analysis has been run */}
      {hasAnalyzed && !loading && !hasData && (
        <div className="diagnostic-empty-card neutral-empty" style={{ margin: "30px 0", padding: "40px" }}>
          <Info size={40} className="icon-blue" />
          <div>
            <h3>No Quiz Attempts Recorded Yet</h3>
            <p>Complete at least one quiz to unlock your cognitive accuracy breakdown, weak topic detection, and ML performance forecast.</p>
            {onNavigateToQuiz && (
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: "16px" }}
                onClick={() => onNavigateToQuiz()}
              >
                <Target size={16} /> Take a Quiz Now
              </button>
            )}
          </div>
        </div>
      )}

      {hasAnalyzed && !loading && hasData && (
        <>
          {/* 4-Column Metric Stat Cards (Matching Dashboard Pastel System) */}
          <div className="stats-grid">
            <div className="stat-card" style={{ backgroundColor: "#FFFFFF" }}>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "var(--lavender)", color: "var(--purple-primary)" }}
              >
                <Award size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Overall Average</span>
                <span className="stat-value">{performance.averagePercentage}%</span>
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: "#FFFFFF" }}>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "var(--blue-soft)", color: "var(--blue-accent)" }}
              >
                <BarChart3 size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Quizzes Completed</span>
                <span className="stat-value">{performance.totalAttempts}</span>
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: "#FFFFFF" }}>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "var(--mint-soft)", color: "var(--mint-accent)" }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Strong Topics</span>
                <span className="stat-value">{performance.strongTopics?.length || 0}</span>
              </div>
            </div>

            <div className="stat-card" style={{ backgroundColor: "#FFFFFF" }}>
              <div
                className="stat-icon-wrapper"
                style={{ backgroundColor: "var(--pink-pastel)", color: "var(--pink-accent)" }}
              >
                <AlertTriangle size={22} />
              </div>
              <div className="stat-content">
                <span className="stat-label">Weak Topics</span>
                <span className="stat-value">{performance.weakTopics?.length || 0}</span>
              </div>
            </div>
          </div>

      {/* ML Performance Forecast Card (Module 4) */}
      <div className="forecast-panel-card">
        <div className="forecast-panel-top">
          <div className="forecast-title-col">
            <div className="forecast-engine-pill">
              <Cpu size={14} /> Trained XGBoost Regression Engine
            </div>
            <h2>Predictive Assessment Readiness Forecast</h2>
            <p>
              Trained on multi-dimensional student performance records (cognitive accuracy curve, error rates, time-per-question, and difficulty trajectory).
            </p>
          </div>

          <div className="forecast-controls-col">
            <div className="diff-picker-box">
              <label>Target Difficulty:</label>
              <select
                value={targetDifficulty}
                onChange={(e) => setTargetDifficulty(Number(e.target.value))}
                className="diff-dropdown"
              >
                <option value={1}>Easy Difficulty</option>
                <option value={2}>Medium (Standard)</option>
                <option value={3}>Hard Difficulty</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-primary btn-run-prediction"
              onClick={handleRunPrediction}
              disabled={predicting}
            >
              {predicting ? (
                <>
                  <div className="btn-spinner"></div> Computing ML Forecast...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run ML Prediction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Display */}
        {predictionData && !predictionData.isColdStart && (
          <div className="forecast-results-showcase">
            <div className="forecast-meter-orb">
              <span className="meter-label">Expected Score</span>
              <div className="meter-score-large">{predictionData.predictedScore}%</div>
              <div className="meter-range-caption">
                Range: {predictionData.expectedRange?.lowerBound}% – {predictionData.expectedRange?.upperBound}% (±{predictionData.expectedRange?.marginOfError} pts)
              </div>
            </div>

            <div className="forecast-readiness-details">
              <div className="readiness-header-row">
                <span className="readiness-status-badge">
                  {predictionData.readinessTier || "Good Standing"}
                </span>
                <span className="forecast-model-name">
                  Model: {predictionData.modelUsed || "XGBoost Regressor (MAE: 5.63)"}
                </span>
              </div>
              <p className="readiness-commentary">
                {predictionData.insights ||
                  `Based on your past quiz accuracy and time distribution, you are projected to score approximately ${predictionData.predictedScore}% on a standard quiz. Continue targeted revision on weak areas to elevate your upper confidence bound.`}
              </p>

              <div className="forecast-mini-stats-row">
                <div className="mini-stat">
                  <span className="m-label">Margin of Error</span>
                  <strong className="m-val">±{predictionData.expectedRange?.marginOfError || 6.9}%</strong>
                </div>
                <div className="mini-stat">
                  <span className="m-label">Assessed Topics</span>
                  <strong className="m-val">{performance?.topics?.length || 1} Concepts</strong>
                </div>
                <div className="mini-stat">
                  <span className="m-label">Analyzed Attempts</span>
                  <strong className="m-val">{performance?.totalAttempts || 0} Quizzes</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cold Start Notice */}
        {predictionData?.isColdStart && (
          <div className="cold-start-friendly-card">
            <Info size={24} className="icon-blue" />
            <div>
              <h4>More Historical Attempts Required for Machine Learning Forecast</h4>
              <p>{predictionData.message}</p>
            </div>
          </div>
        )}

        {!predictionData && (
          <div className="forecast-initial-prompt">
            <p>
              Click <strong>"Run ML Prediction"</strong> above to compute your real-time test readiness forecast and score confidence interval.
            </p>
          </div>
        )}
      </div>

      {/* Weak Topics Diagnostic Section */}
      <div className="diagnostic-block-card">
        <div className="diagnostic-block-header">
          <div className="header-left">
            <div className="block-icon-badge alert-badge">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3>Topics Requiring Targeted Revision</h3>
              <p>Topics with accuracy below 60% based on your quiz attempts</p>
            </div>
          </div>
          <span className="count-pill red-pill">
            {performance?.weakTopics?.length || 0} Weak Areas
          </span>
        </div>

        {(!performance?.weakTopics || performance.weakTopics.length === 0) ? (
          <div className="diagnostic-empty-card success-empty">
            <CheckCircle2 size={32} className="icon-mint" />
            <div>
              <h4>No Weak Topics Detected!</h4>
              <p>You have demonstrated solid mastery (60%+ accuracy) across all tested concepts. Keep it up!</p>
            </div>
          </div>
        ) : (
          <div className="topic-cards-grid">
            {performance.weakTopics.map((topic, idx) => (
              <div key={idx} className="diagnostic-topic-card weak-card">
                <div className="card-top-row">
                  <strong className="topic-name">{topic.topicName}</strong>
                  <span className="accuracy-pill-weak">{topic.accuracy}% Accuracy</span>
                </div>
                <p className="topic-meta">
                  {topic.totalQuestions} Questions Tested · {topic.correctCount} Correct
                </p>
                <div className="topic-progress-bar">
                  <div
                    className="topic-progress-fill fill-weak"
                    style={{ width: `${topic.accuracy}%` }}
                  ></div>
                </div>
                <div className="card-actions-row">
                  {onSelectTopicForRevision && (
                    <button
                      type="button"
                      className="btn-topic-action secondary"
                      onClick={() => onSelectTopicForRevision(topic.materialId, topic.topicName)}
                    >
                      <BookOpen size={13} /> Revise in Studio
                    </button>
                  )}
                  {onNavigateToQuiz && (
                    <button
                      type="button"
                      className="btn-topic-action primary-alert"
                      onClick={() => onNavigateToQuiz(topic.materialId, topic.topicName)}
                    >
                      <Target size={13} /> Re-Quiz
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mastered Strong Topics Section */}
      <div className="diagnostic-block-card">
        <div className="diagnostic-block-header">
          <div className="header-left">
            <div className="block-icon-badge success-badge">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3>Mastered Strong Topics</h3>
              <p>Concepts where you maintain consistent 75%+ accuracy</p>
            </div>
          </div>
          <span className="count-pill green-pill">
            {performance?.strongTopics?.length || 0} Mastered
          </span>
        </div>

        {(!performance?.strongTopics || performance.strongTopics.length === 0) ? (
          <div className="diagnostic-empty-card neutral-empty">
            <Info size={32} className="icon-blue" />
            <div>
              <h4>No 75%+ Mastered Topics Yet</h4>
              <p>Complete more quizzes to build up your high-accuracy mastery catalog.</p>
            </div>
          </div>
        ) : (
          <div className="topic-cards-grid">
            {performance.strongTopics.map((topic, idx) => (
              <div key={idx} className="diagnostic-topic-card strong-card">
                <div className="card-top-row">
                  <strong className="topic-name">{topic.topicName}</strong>
                  <span className="accuracy-pill-strong">{topic.accuracy}% Mastery</span>
                </div>
                <p className="topic-meta">
                  {topic.totalQuestions} Questions Tested · {topic.correctCount} Correct
                </p>
                <div className="topic-progress-bar">
                  <div
                    className="topic-progress-fill fill-strong"
                    style={{ width: `${topic.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Topic Accuracy Breakdown Table */}
      {performance?.topics && performance.topics.length > 0 && (
        <div className="diagnostic-block-card">
          <div className="diagnostic-block-header">
            <div className="header-left">
              <div className="block-icon-badge purple-badge">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3>Complete Topic Diagnostic Matrix</h3>
                <p>Granular accuracy records derived from your quiz attempts</p>
              </div>
            </div>
            <span className="count-pill purple-pill">
              {performance.topics.length} Total Topics
            </span>
          </div>

          <div className="table-responsive-viewport">
            <table className="modern-comparison-table">
              <thead>
                <tr>
                  <th>Topic Name</th>
                  <th>Questions Attempted</th>
                  <th>Correct Answers</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {performance.topics.map((t, idx) => {
                  const isWeak = t.accuracy < 60;
                  const isStrong = t.accuracy >= 75;

                  return (
                    <tr key={idx}>
                      <td className="feature-header-cell">{t.topicName}</td>
                      <td>{t.totalQuestions}</td>
                      <td>{t.correctCount}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "60px", height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${t.accuracy}%`, height: "100%", backgroundColor: isStrong ? "var(--mint-accent)" : isWeak ? "var(--pink-accent)" : "var(--peach-accent)" }}></div>
                          </div>
                          <strong>{t.accuracy}%</strong>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-pill-badge ${isStrong ? "pill-strong" : isWeak ? "pill-weak" : "pill-med"}`}
                        >
                          {isStrong ? "Mastered" : isWeak ? "Needs Review" : "Developing"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {onSelectTopicForRevision && (
                            <button
                              type="button"
                              className="table-action-btn"
                              onClick={() => onSelectTopicForRevision(t.materialId, t.topicName)}
                            >
                              Revise
                            </button>
                          )}
                          {onNavigateToQuiz && (
                            <button
                              type="button"
                              className="table-action-btn primary"
                              onClick={() => onNavigateToQuiz(t.materialId, t.topicName)}
                            >
                              Re-Quiz
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
