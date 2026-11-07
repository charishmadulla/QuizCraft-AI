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
} from "lucide-react";
import {
  getPerformanceOverview,
  predictFutureScore,
  getLatestPrediction,
} from "../services/api";

export default function PerformanceIntelligenceView({
  onNavigateToQuiz,
  onNavigateToRecommendations,
  onShowToast,
}) {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState(null);

  // ML Prediction States
  const [predicting, setPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [targetDifficulty, setTargetDifficulty] = useState(2); // 1=Easy, 2=Med, 3=Hard

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getPerformanceOverview();
        if (isMounted) setPerformance(data);

        // Fetch latest prediction if exists
        try {
          const pred = await getLatestPrediction();
          if (isMounted && pred?.hasPrediction) {
            setPredictionData(pred.prediction);
          }
        } catch {
          // No prior prediction
        }
      } catch (err) {
        if (onShowToast) onShowToast("Failed to load performance intelligence.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunPrediction = async () => {
    setPredicting(true);
    try {
      const res = await predictFutureScore({ targetDifficulty });
      if (res?.success) {
        if (res.isColdStart) {
          if (onShowToast) onShowToast(res.message, "info");
          setPredictionData({ isColdStart: true, message: res.message });
        } else {
          setPredictionData(res.prediction);
          if (onShowToast) onShowToast("ML future performance forecast generated!", "success");
        }
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Prediction service error.", "error");
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="studio-loading-box" style={{ padding: "80px 20px" }}>
        <div className="btn-spinner large"></div>
        <h4>Analyzing Quiz Performance & Weak Topics...</h4>
        <p>Calculating topic accuracy across historical attempts.</p>
      </div>
    );
  }

  const hasData = performance && performance.hasData;

  return (
    <div className="performance-intel-container">
      {/* Top Banner Stats */}
      <div className="analytics-summary-grid">
        <div className="analytics-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--lavender)", color: "var(--purple-primary)" }}>
            <Award size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Overall Average</span>
            <span className="stat-value">{hasData ? `${performance.averagePercentage}%` : "0%"}</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--blue-soft)", color: "var(--blue-accent)" }}>
            <BarChart3 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Quizzes Completed</span>
            <span className="stat-value">{hasData ? performance.totalAttempts : 0}</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--mint-soft)", color: "var(--mint-accent)" }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Strong Topics</span>
            <span className="stat-value">{hasData ? performance.strongTopics?.length || 0 : 0}</span>
          </div>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--peach-soft)", color: "var(--peach-accent)" }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Weak Topics</span>
            <span className="stat-value">{hasData ? performance.weakTopics?.length || 0 : 0}</span>
          </div>
        </div>
      </div>

      {/* ML Performance Forecast Card (Module 4) */}
      <div className="ml-forecast-hero-card">
        <div className="forecast-header">
          <div className="forecast-title-group">
            <div className="forecast-ai-badge">
              <Cpu size={16} /> ML Performance Engine
            </div>
            <h2>Predictive Assessment Readiness Forecast</h2>
            <p>
              Trained regression model (XGBoost / Random Forest) analyzing your cognitive accuracy curve, time per question, and error rates.
            </p>
          </div>

          <div className="forecast-action-controls">
            <div className="difficulty-target-picker">
              <span>Target Difficulty:</span>
              <select
                value={targetDifficulty}
                onChange={(e) => setTargetDifficulty(Number(e.target.value))}
              >
                <option value={1}>Easy Mode</option>
                <option value={2}>Medium (Standard)</option>
                <option value={3}>Hard Mode</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleRunPrediction}
              disabled={predicting}
            >
              {predicting ? (
                <>
                  <div className="btn-spinner"></div> Computing Forecast...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Run ML Performance Prediction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results Display */}
        {predictionData && !predictionData.isColdStart && (
          <div className="prediction-display-grid">
            <div className="score-meter-box">
              <span className="score-meter-label">Expected Future Score</span>
              <div className="score-meter-number">
                {predictionData.predictedScore}%
              </div>
              <div className="score-range-badge">
                Expected Range: {predictionData.expectedRange?.lowerBound}% – {predictionData.expectedRange?.upperBound}% (±{predictionData.expectedRange?.marginOfError} pts)
              </div>
            </div>

            <div className="readiness-tier-box">
              <span className="tier-pill">{predictionData.readinessTier}</span>
              <p className="tier-description">{predictionData.readinessDescription}</p>

              <div className="model-provenance-info">
                <span>Model: {predictionData.modelName || "XGBoost"} v{predictionData.modelVersion || "1.0.0"}</span>
                <span>Split Strategy: GroupShuffleSplit (Zero Data Leakage)</span>
              </div>
            </div>
          </div>
        )}

        {predictionData?.isColdStart && (
          <div className="cold-start-banner">
            <HelpCircle size={24} style={{ color: "var(--blue-accent)" }} />
            <div>
              <h4>Cold-Start Notice</h4>
              <p>{predictionData.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Weak Topics & Strong Topics */}
      <div className="topics-intel-grid">
        {/* WEAK TOPICS CARD */}
        <div className="intel-card weak-card">
          <div className="intel-card-header">
            <div className="intel-icon-wrapper" style={{ backgroundColor: "var(--pink-pastel)", color: "var(--error-text)" }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3>Topics Requiring Revision</h3>
              <p>Topics with accuracy below 60% based on multiple test attempts</p>
            </div>
          </div>

          {(!performance?.weakTopics || performance.weakTopics.length === 0) ? (
            <div className="empty-intel-box">
              <CheckCircle2 size={32} style={{ color: "var(--mint-accent)", marginBottom: "8px" }} />
              <h4>No Weak Topics Detected!</h4>
              <p>You have demonstrated solid mastery across all tested subjects.</p>
            </div>
          ) : (
            <div className="topics-list-group">
              {performance.weakTopics.map((wt) => (
                <div key={wt.topicId} className="topic-intel-row weak-row">
                  <div className="topic-intel-info">
                    <h4>{wt.topicName}</h4>
                    <span className="topic-intel-stats">
                      {wt.totalQuestions} Questions Tested across {wt.attemptsCount} Attempts
                    </span>
                  </div>
                  <div className="topic-intel-score">
                    <span className="accuracy-pill weak">{wt.accuracy}% Accuracy</span>
                    {onNavigateToRecommendations && (
                      <button
                        type="button"
                        className="btn-revise-small"
                        onClick={onNavigateToRecommendations}
                      >
                        Revise <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STRONG TOPICS CARD */}
        <div className="intel-card strong-card">
          <div className="intel-card-header">
            <div className="intel-icon-wrapper" style={{ backgroundColor: "var(--mint-soft)", color: "var(--mint-accent)" }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3>Mastered Strong Topics</h3>
              <p>Topics where you maintain 75%+ consistent accuracy</p>
            </div>
          </div>

          {(!performance?.strongTopics || performance.strongTopics.length === 0) ? (
            <div className="empty-intel-box">
              <BookOpen size={32} style={{ color: "var(--purple-primary)", marginBottom: "8px" }} />
              <h4>Build Your Strong Topic Portfolio</h4>
              <p>Complete more quizzes to certify topic mastery.</p>
            </div>
          ) : (
            <div className="topics-list-group">
              {performance.strongTopics.map((st) => (
                <div key={st.topicId} className="topic-intel-row strong-row">
                  <div className="topic-intel-info">
                    <h4>{st.topicName}</h4>
                    <span className="topic-intel-stats">
                      {st.totalQuestions} Questions Tested across {st.attemptsCount} Attempts
                    </span>
                  </div>
                  <div className="topic-intel-score">
                    <span className="accuracy-pill strong">{st.accuracy}% Mastery</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Topic Accuracy Breakdown Table */}
      {performance?.topicAccuracy?.length > 0 && (
        <div className="intel-card full-width">
          <div className="intel-card-header">
            <div className="intel-icon-wrapper" style={{ backgroundColor: "var(--lavender)", color: "var(--purple-primary)" }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <h3>Complete Topic Accuracy Breakdown</h3>
              <p>Granular accuracy records derived from your quiz attempts</p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Topic Name</th>
                  <th>Questions Attempted</th>
                  <th>Correct Answers</th>
                  <th>Accuracy</th>
                  <th>Status & Assessment</th>
                </tr>
              </thead>
              <tbody>
                {performance.topicAccuracy.map((t) => (
                  <tr key={t.topicId}>
                    <td><strong>{t.topicName}</strong></td>
                    <td>{t.totalQuestions}</td>
                    <td>{t.correctCount}</td>
                    <td>
                      <span className={`accuracy-pill ${t.status}`}>
                        {t.accuracy}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-label-badge status-${t.status}`}>
                        {t.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
