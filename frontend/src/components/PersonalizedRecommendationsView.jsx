import React, { useState, useEffect } from "react";
import {
  Compass,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCw,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { getRecommendations } from "../services/api";

export default function PersonalizedRecommendationsView({
  onSelectTopicForRevision,
  onStartTargetedQuiz,
  onNavigateToMaterials,
  onShowToast,
}) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await getRecommendations();
        if (isMounted && res) {
          setRecommendations(res.recommendations || []);
          setSummary(res.summary);
        }
      } catch (err) {
        if (onShowToast) onShowToast("Failed to load personalized recommendations.", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="studio-loading-box" style={{ padding: "80px 20px" }}>
        <div className="btn-spinner large"></div>
        <h4>Synthesizing Personalized Revision Recommendations...</h4>
        <p>Matching weak topics to your uploaded study materials.</p>
      </div>
    );
  }

  return (
    <div className="recommendations-container">
      {/* Header Banner */}
      <div className="recommendations-header-card">
        <div className="rec-header-content">
          <div className="rec-badge">
            <Compass size={16} /> Adaptive Learning Advisor
          </div>
          <h2>Personalized Study & Revision Roadmap</h2>
          <p>
            Actionable study plans generated from your actual test performance. Strengthen your weak topics through targeted study sessions and focused quizzes.
          </p>
        </div>

        {summary && (
          <div className="rec-summary-stats">
            <div className="rec-stat-pill weak">
              <span className="count">{summary.weakCount}</span>
              <span className="label">Focus Topics</span>
            </div>
            <div className="rec-stat-pill strong">
              <span className="count">{summary.strongCount}</span>
              <span className="label">Mastered Topics</span>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <div className="empty-state-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <CheckCircle2 size={48} style={{ color: "var(--mint-accent)", marginBottom: "16px" }} />
          <h3>All Caught Up!</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
            You currently have no critical weak topics. Keep practicing quizzes to maintain and advance your mastery.
          </p>
          <button type="button" className="btn-primary" onClick={onNavigateToMaterials}>
            Explore Study Materials
          </button>
        </div>
      ) : (
        <div className="recommendations-list-grid">
          {recommendations.map((rec) => (
            <div key={rec.id} className={`recommendation-card priority-${rec.priority || "medium"}`}>
              <div className="rec-card-top">
                <div className="rec-priority-tag">
                  {rec.priority === "high" ? "HIGH PRIORITY" : "RECOMMENDED"}
                </div>
                {rec.accuracy !== undefined && (
                  <span className="rec-accuracy-badge">{rec.accuracy}% Mastery</span>
                )}
              </div>

              <div className="rec-card-body">
                <h3>{rec.title}</h3>
                <p className="rec-desc">{rec.description}</p>
                {rec.materialTitle && (
                  <div className="rec-source-badge">
                    <BookOpen size={13} /> Source: {rec.materialTitle}
                  </div>
                )}
              </div>

              <div className="rec-card-actions">
                {onSelectTopicForRevision && rec.materialId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onSelectTopicForRevision(rec.materialId, rec.topicName)}
                  >
                    <Lightbulb size={15} /> Revise in Smart Studio
                  </button>
                )}

                {onStartTargetedQuiz && rec.materialId && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => onStartTargetedQuiz(rec.materialId, rec.topicName)}
                  >
                    <Sparkles size={15} /> Take Targeted Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
