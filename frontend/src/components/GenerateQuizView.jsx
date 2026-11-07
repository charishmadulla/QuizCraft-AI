import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Timer,
  Zap,
  Target,
} from "lucide-react";

export default function GenerateQuizView({
  materials = [],
  selectedMaterialId = "",
  preSelectedTopic = "",
  onGenerateQuiz,
  generating = false,
  error = "",
  onNavigateToUpload,
}) {
  const [materialId, setMaterialId] = useState(
    selectedMaterialId || (materials[0]?._id ?? "")
  );
  const [questionCount, setQuestionCount] = useState(() => localStorage.getItem("quizcraft_default_count") || "5");
  const [difficulty, setDifficulty] = useState(() => localStorage.getItem("quizcraft_default_difficulty") || "medium");
  const [questionType, setQuestionType] = useState(() => localStorage.getItem("quizcraft_default_type") || "multiple_choice");
  
  // Topic Targeting state
  const [topicScope, setTopicScope] = useState(preSelectedTopic ? "specific" : "all");
  const [customTopic, setCustomTopic] = useState(preSelectedTopic || "");

  useEffect(() => {
    if (selectedMaterialId) {
      setMaterialId(selectedMaterialId);
    }
  }, [selectedMaterialId]);

  useEffect(() => {
    if (preSelectedTopic) {
      setTopicScope("specific");
      setCustomTopic(preSelectedTopic);
    }
  }, [preSelectedTopic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!materialId) return;
    onGenerateQuiz({
      materialId,
      questionCount: Number(questionCount),
      difficulty,
      questionType,
      selectedTopics: topicScope === "specific" && customTopic.trim() ? [customTopic.trim()] : ["all"],
    });
  };

  const selectedMaterial = materials.find((m) => m._id === materialId);

  return (
    <div className="generate-quiz-container">
      <div className="generate-layout-grid">
        {/* Main Quiz Configuration Card */}
        <section className="quiz-config-card">
          <div className="config-card-header">
            <div
              className="config-icon-badge"
              style={{
                backgroundColor: "var(--lavender)",
                color: "var(--purple-primary)",
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2>Create AI Practice Quiz</h2>
              <p>Configure parameters for your personalized learning assessment</p>
            </div>
          </div>

          {error && (
            <div className="config-error-banner">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {materials.length === 0 ? (
            <div className="empty-material-prompt">
              <BookOpen size={36} />
              <h3>No Study Materials Found</h3>
              <p>
                To generate a quiz, please upload a PDF/DOCX or add study notes first.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={onNavigateToUpload}
              >
                Upload Study Material Now
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="quiz-config-form">
              {/* 1. Choose Study Material */}
              <div className="form-section">
                <label className="section-label">
                  <span className="step-num">1</span> Select Source Study Material
                </label>
                <div className="material-picker-dropdown">
                  <select
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    required
                  >
                    {materials.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title} (
                        {m.sourceType === "pdf"
                          ? "PDF"
                          : m.sourceType === "docx"
                          ? "DOCX"
                          : "Notes"}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                {selectedMaterial && (
                  <p className="material-hint">
                    Questions will be factually generated based strictly on the text inside{" "}
                    <strong>{selectedMaterial.title}</strong>.
                  </p>
                )}
              </div>

              {/* 2. Topic Targeting Scope */}
              <div className="form-section">
                <label className="section-label">
                  <span className="step-num">2</span> Focus Scope & Topic Targeting
                </label>
                <div className="option-pill-selector" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className={`pill-choice-difficulty ${topicScope === "all" ? "pill-choice-selected" : ""}`}
                    onClick={() => setTopicScope("all")}
                  >
                    <strong className="difficulty-title">Entire Document</strong>
                    <span className="difficulty-desc">Comprehensive test covering all topics</span>
                  </button>
                  <button
                    type="button"
                    className={`pill-choice-difficulty ${topicScope === "specific" ? "pill-choice-selected" : ""}`}
                    onClick={() => setTopicScope("specific")}
                  >
                    <strong className="difficulty-title">Target Specific Topic</strong>
                    <span className="difficulty-desc">Concentrate on a single concept or weak area</span>
                  </button>
                </div>

                {topicScope === "specific" && (
                  <div className="specific-topic-input-wrapper" style={{ marginTop: "12px" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                      Target Topic / Sub-Concept Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Backpropagation, Supervised Learning, Memory Management"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="form-input"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.9rem",
                        backgroundColor: "var(--bg-main)",
                        outline: "none"
                      }}
                    />
                    {preSelectedTopic && (
                      <span style={{ fontSize: "0.8rem", color: "var(--purple-primary)", marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Target size={13} /> Pre-filled from Performance Intelligence Weak Topic detection
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Number of Questions */}
              <div className="form-section">
                <label className="section-label">
                  <span className="step-num">3</span> Number of Questions
                </label>
                <div className="option-pill-selector">
                  {["5", "10", "15"].map((count) => (
                    <button
                      key={count}
                      type="button"
                      className={`pill-choice ${
                        questionCount === count ? "pill-choice-selected" : ""
                      }`}
                      onClick={() => setQuestionCount(count)}
                    >
                      <span className="pill-choice-num">{count}</span>
                      <span className="pill-choice-label">Questions</span>
                    </button>
                  ))}
                </div>
                <div className="quiz-timing-note">
                  <Timer size={14} />
                  <span>Timed assessment: {Number(questionCount) * 60} seconds total ({questionCount} minutes)</span>
                </div>
              </div>

              {/* 4. Difficulty Level */}
              <div className="form-section">
                <label className="section-label">
                  <span className="step-num">4</span> Difficulty Level
                </label>
                <div className="option-pill-selector">
                  {[
                    {
                      id: "easy",
                      label: "Easy",
                      desc: "Direct facts & definitions",
                      color: "var(--mint-soft)",
                    },
                    {
                      id: "medium",
                      label: "Medium",
                      desc: "Conceptual understanding",
                      color: "var(--lavender)",
                    },
                    {
                      id: "hard",
                      label: "Hard",
                      desc: "Analytical & applied questions",
                      color: "var(--pink-pastel)",
                    },
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      className={`pill-choice-difficulty ${
                        difficulty === level.id ? "pill-choice-selected" : ""
                      }`}
                      onClick={() => setDifficulty(level.id)}
                    >
                      <strong className="difficulty-title">{level.label}</strong>
                      <span className="difficulty-desc">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Question Type */}
              <div className="form-section">
                <label className="section-label">
                  <span className="step-num">5</span> Question Format
                </label>
                <div className="option-pill-selector">
                  {[
                    {
                      id: "multiple_choice",
                      title: "Multiple Choice",
                      sub: "4 options (standard)",
                    },
                    {
                      id: "true_false",
                      title: "True / False",
                      sub: "Binary validation",
                    },
                    {
                      id: "fill_in_the_blank",
                      title: "Fill in Blanks",
                      sub: "Keyword recall with blanks",
                    },
                    {
                      id: "mixed",
                      title: "Mixed Formats",
                      sub: "Combination of all types",
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      className={`pill-choice-type ${
                        questionType === type.id ? "pill-choice-selected" : ""
                      }`}
                      onClick={() => setQuestionType(type.id)}
                    >
                      <strong>{type.title}</strong>
                      <span>{type.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="form-submit-wrapper">
                <button
                  type="submit"
                  className="btn-generate-large"
                  disabled={generating || !materialId}
                >
                  {generating ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Analyzing Material & Generating Quiz with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>
                        Generate {questionCount} Questions {topicScope === "specific" && customTopic.trim() ? `(${customTopic.trim()})` : "Now"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Right Info & Best Practice Guide Card */}
        <aside className="quiz-guide-aside">
          <div className="guide-card" style={{ backgroundColor: "var(--cream-warm)" }}>
            <div className="guide-header">
              <Zap size={20} style={{ color: "var(--peach-accent)" }} />
              <h4>How QuizCraft AI Works</h4>
            </div>
            <ul className="guide-steps">
              <li>
                <strong>1. Context Analysis:</strong> Google Gemini reads the extracted text from your notes or document.
              </li>
              <li>
                <strong>2. Topic Tagging:</strong> Every question is tagged with its topic to fuel your Weak-Topic Detection engine.
              </li>
              <li>
                <strong>3. Distractor Generation:</strong> Creates distinct, plausible distractors tailored to your selected difficulty level.
              </li>
              <li>
                <strong>4. Strict Answer Validation:</strong> Correct answers are kept safe on the server until submission.
              </li>
              <li>
                <strong>5. Explanations Included:</strong> Detailed reasoning is given for every question upon completion.
              </li>
            </ul>
          </div>

          <div className="guide-card" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="guide-header">
              <HelpCircle size={20} style={{ color: "var(--purple-primary)" }} />
              <h4>Active Session Rules</h4>
            </div>
            <p className="guide-tip">
              • Navigate freely between questions before submitting.
            </p>
            <p className="guide-tip">
              • Use <strong>Mark for Review</strong> to flag challenging questions.
            </p>
            <p className="guide-tip">
              • The quiz automatically submits when the countdown timer ends.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
