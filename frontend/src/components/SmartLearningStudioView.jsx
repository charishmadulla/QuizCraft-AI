import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  FileText,
  Sparkles,
  GitFork,
  ArrowRight,
  BarChart2,
  Table,
  Layers,
  Copy,
  Download,
  RotateCw,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ChevronRight,
  Eye,
  Info,
} from "lucide-react";
import {
  generateSummary,
  getSummaryById,
  generateSimplifiedExplanation,
  generateVisualLearning,
  getLearningAssets,
} from "../services/api";

export default function SmartLearningStudioView({
  materials = [],
  selectedMaterialId = "",
  onNavigateToUpload,
  onGenerateQuizForMaterial,
  onShowToast,
}) {
  const [currentMaterialId, setCurrentMaterialId] = useState(
    selectedMaterialId || (materials[0]?._id ?? "")
  );

  const [activeSubTab, setActiveSubTab] = useState("summary");
  const [summaryLevel, setSummaryLevel] = useState("medium");

  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [simplifiedData, setSimplifiedData] = useState(null);
  const [visualData, setVisualData] = useState(null);

  // Loading & error states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSimplify, setLoadingSimplify] = useState(false);
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [customParagraph, setCustomParagraph] = useState("");
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedSection, setCopiedSection] = useState("");

  const selectedMaterial = materials.find((m) => m._id === currentMaterialId);

  // Load existing data when material changes
  useEffect(() => {
    if (!currentMaterialId) return;

    let isMounted = true;
    async function loadMaterialData() {
      try {
        const assets = await getLearningAssets(currentMaterialId);
        if (isMounted && assets?.hasData) {
          setVisualData(assets);
          if (assets.simplifiedExplanation) {
            setSimplifiedData(assets.simplifiedExplanation);
          }
        }
      } catch (err) {
        console.warn("Could not pre-load visual assets:", err);
      }

      try {
        const sum = await getSummaryById(currentMaterialId);
        if (isMounted && sum) {
          setSummaryData(sum);
          if (sum.simplifiedExplanation) {
            setSimplifiedData(sum.simplifiedExplanation);
          }
        }
      } catch {
        // No existing summary yet
      }
    }

    loadMaterialData();
    return () => {
      isMounted = false;
    };
  }, [currentMaterialId]);

  // Handle Summary Generation
  const handleGenerateSummary = async (level = summaryLevel) => {
    if (!currentMaterialId) return;
    setLoadingSummary(true);
    try {
      const res = await generateSummary({
        materialId: currentMaterialId,
        summaryLevel: level,
      });
      if (res?.summary) {
        setSummaryData(res.summary);
        if (onShowToast) onShowToast("Structured summary generated successfully!", "success");
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to generate summary.", "error");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle Simplification
  const handleGenerateSimplification = async () => {
    if (!currentMaterialId) return;
    setLoadingSimplify(true);
    try {
      const res = await generateSimplifiedExplanation({
        materialId: currentMaterialId,
        topicOrParagraph: customParagraph.trim(),
      });
      if (res?.simplifiedExplanation) {
        setSimplifiedData(res.simplifiedExplanation);
        if (onShowToast) onShowToast("Simplified explanation generated!", "success");
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to simplify content.", "error");
    } finally {
      setLoadingSimplify(false);
    }
  };

  // Handle Visual Learning
  const handleGenerateVisualLearning = async () => {
    if (!currentMaterialId) return;
    setLoadingVisual(true);
    try {
      const res = await generateVisualLearning({ materialId: currentMaterialId });
      if (res?.data) {
        setVisualData(res.data);
        setActiveFlashcardIndex(0);
        setIsFlipped(false);
        if (onShowToast) onShowToast("Visual learning diagrams & flashcards generated!", "success");
      }
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to generate visual learning.", "error");
    } finally {
      setLoadingVisual(false);
    }
  };

  const copyToClipboard = (text, sectionName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    if (onShowToast) onShowToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedSection(""), 2000);
  };

  const downloadSummaryText = () => {
    if (!summaryData) return;
    const content = `
QUIZCRAFT AI - SMART LEARNING SUMMARY
Source Material: ${summaryData.sourceTitle}
Summary Level: ${summaryData.summaryLevel?.toUpperCase()}

MAIN TOPIC:
${summaryData.mainTopic}

INTRODUCTION:
${summaryData.introduction}

KEY POINTS:
${(summaryData.keyPoints || []).map((kp, i) => `${i + 1}. ${kp}`).join("\n")}

IMPORTANT DEFINITIONS:
${(summaryData.importantDefinitions || []).map((d) => `• ${d.term}: ${d.definition}`).join("\n")}

CONCLUSION:
${summaryData.conclusion}

RAW PROSE SUMMARY:
${summaryData.rawSummary}
    `.trim();

    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${summaryData.sourceTitle.replace(/\s+/g, "_")}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (materials.length === 0) {
    return (
      <div className="empty-state-card" style={{ padding: "60px 20px", textAlign: "center" }}>
        <BookOpen size={48} style={{ color: "var(--purple-primary)", marginBottom: "16px" }} />
        <h3>No Study Materials Found</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
          Upload a PDF, Word document, or paste lecture notes first to unlock Smart Learning Studio.
        </p>
        <button type="button" className="btn-primary" onClick={onNavigateToUpload}>
          Upload Study Material
        </button>
      </div>
    );
  }

  return (
    <div className="learning-studio-container">
      {/* Studio Header & Material Selector */}
      <div className="studio-top-bar">
        <div className="studio-material-picker">
          <label htmlFor="studio-mat-select">
            <BookOpen size={16} /> Active Study Material:
          </label>
          <select
            id="studio-mat-select"
            value={currentMaterialId}
            onChange={(e) => setCurrentMaterialId(e.target.value)}
          >
            {materials.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title} ({m.sourceType === "pdf" ? "PDF" : m.sourceType === "docx" ? "Word" : "Notes"})
              </option>
            ))}
          </select>
        </div>

        <div className="studio-quick-actions">
          {onGenerateQuizForMaterial && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onGenerateQuizForMaterial(currentMaterialId)}
            >
              <Sparkles size={15} /> Generate Quiz
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="studio-nav-tabs">
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveSubTab("summary")}
        >
          <FileText size={16} /> Structured Summary
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "simplify" ? "active" : ""}`}
          onClick={() => setActiveSubTab("simplify")}
        >
          <Lightbulb size={16} /> Simple Explanation
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "mindmap" ? "active" : ""}`}
          onClick={() => setActiveSubTab("mindmap")}
        >
          <GitFork size={16} /> Mind Map
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "flowchart" ? "active" : ""}`}
          onClick={() => setActiveSubTab("flowchart")}
        >
          <ArrowRight size={16} /> Flowchart
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "comparison" ? "active" : ""}`}
          onClick={() => setActiveSubTab("comparison")}
        >
          <Table size={16} /> Comparison Tables
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "charts" ? "active" : ""}`}
          onClick={() => setActiveSubTab("charts")}
        >
          <BarChart2 size={16} /> Charts & Data
        </button>
        <button
          type="button"
          className={`studio-tab-btn ${activeSubTab === "flashcards" ? "active" : ""}`}
          onClick={() => setActiveSubTab("flashcards")}
        >
          <Layers size={16} /> Flashcards
        </button>
      </div>

      {/* TAB 1: STRUCTURED SUMMARY */}
      {activeSubTab === "summary" && (
        <div className="studio-tab-content">
          <div className="studio-control-banner">
            <div className="level-selector-group">
              <span className="control-label">Summary Depth:</span>
              {["short", "medium", "detailed"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`level-btn ${summaryLevel === lvl ? "active" : ""}`}
                  onClick={() => {
                    setSummaryLevel(lvl);
                    handleGenerateSummary(lvl);
                  }}
                  disabled={loadingSummary}
                >
                  {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>

            <div className="control-actions-group">
              <button
                type="button"
                className="btn-studio-action"
                onClick={() => handleGenerateSummary(summaryLevel)}
                disabled={loadingSummary}
              >
                <RotateCw size={14} className={loadingSummary ? "spin-icon" : ""} />
                {summaryData ? "Regenerate" : "Generate Summary"}
              </button>
              {summaryData && (
                <>
                  <button
                    type="button"
                    className="btn-studio-action"
                    onClick={() => copyToClipboard(summaryData.rawSummary, "summary")}
                  >
                    <Copy size={14} /> {copiedSection === "summary" ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="btn-studio-action"
                    onClick={downloadSummaryText}
                  >
                    <Download size={14} /> Download
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingSummary && (
            <div className="studio-loading-box">
              <div className="btn-spinner large"></div>
              <h4>Analyzing and Summarizing Material...</h4>
              <p>Applying transformer summarization pipeline to extract grounded concepts.</p>
            </div>
          )}

          {!loadingSummary && !summaryData && (
            <div className="studio-prompt-box">
              <FileText size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Ready to Generate Structured Summary</h3>
              <p>Select your preferred depth (Short, Medium, or Detailed) to generate grounded academic notes.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleGenerateSummary(summaryLevel)}
              >
                <Sparkles size={16} /> Generate {summaryLevel.toUpperCase()} Summary
              </button>
            </div>
          )}

          {!loadingSummary && summaryData && (
            <div className="summary-structured-grid">
              <div className="summary-section-card topic-card">
                <span className="summary-badge">Core Topic</span>
                <h2>{summaryData.mainTopic || selectedMaterial?.title}</h2>
                <p className="summary-intro-text">{summaryData.introduction}</p>
              </div>

              {summaryData.keyPoints?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <CheckCircle2 size={18} style={{ color: "var(--mint-accent)" }} />
                    <h3>Key Points</h3>
                  </div>
                  <ul className="key-points-list">
                    {summaryData.keyPoints.map((kp, idx) => (
                      <li key={idx}>{kp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summaryData.importantDefinitions?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <BookOpen size={18} style={{ color: "var(--blue-accent)" }} />
                    <h3>Important Definitions</h3>
                  </div>
                  <div className="definitions-grid">
                    {summaryData.importantDefinitions.map((def, idx) => (
                      <div key={idx} className="definition-item">
                        <strong>{def.term}</strong>
                        <p>{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summaryData.importantConcepts?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <Lightbulb size={18} style={{ color: "var(--purple-primary)" }} />
                    <h3>Essential Concepts</h3>
                  </div>
                  <div className="concepts-list">
                    {summaryData.importantConcepts.map((concept, idx) => (
                      <div key={idx} className="concept-chip">
                        <span>{concept}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {summaryData.examples?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <HelpCircle size={18} style={{ color: "var(--peach-accent)" }} />
                    <h3>Illustrative Examples</h3>
                  </div>
                  <ul className="examples-list">
                    {summaryData.examples.map((ex, idx) => (
                      <li key={idx}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summaryData.conclusion && (
                <div className="summary-section-card conclusion-card">
                  <div className="section-card-title">
                    <Sparkles size={18} style={{ color: "var(--purple-primary)" }} />
                    <h3>Conclusion & Takeaways</h3>
                  </div>
                  <p>{summaryData.conclusion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMPLE EXPLANATION */}
      {activeSubTab === "simplify" && (
        <div className="studio-tab-content">
          <div className="simplify-input-box">
            <label htmlFor="custom-topic-input">
              Focus on a specific topic or difficult paragraph (Optional):
            </label>
            <div className="simplify-input-row">
              <input
                id="custom-topic-input"
                type="text"
                placeholder="e.g. Photosystem II, Calvin Cycle, or leave blank to simplify entire text"
                value={customParagraph}
                onChange={(e) => setCustomParagraph(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateSimplification}
                disabled={loadingSimplify}
              >
                {loadingSimplify ? (
                  <>
                    <div className="btn-spinner"></div> Simplifying...
                  </>
                ) : (
                  <>
                    <Lightbulb size={16} /> Explain in Plain English
                  </>
                )}
              </button>
            </div>
          </div>

          {simplifiedData && (
            <div className="simplified-results-container">
              <div className="summary-section-card simplified-main-card">
                <span className="summary-badge">Intuitive Explanation</span>
                <p className="simplified-body">{simplifiedData.simplifiedText}</p>
              </div>

              {simplifiedData.analogies?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <Sparkles size={18} style={{ color: "var(--peach-accent)" }} />
                    <h3>Real-World Analogies</h3>
                  </div>
                  <div className="analogies-list">
                    {simplifiedData.analogies.map((analogy, i) => (
                      <div key={i} className="analogy-card">
                        <span className="analogy-icon">💡</span>
                        <p>{analogy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {simplifiedData.technicalGlossary?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <BookOpen size={18} style={{ color: "var(--blue-accent)" }} />
                    <h3>Technical Jargon Simplified</h3>
                  </div>
                  <div className="glossary-grid">
                    {simplifiedData.technicalGlossary.map((item, i) => (
                      <div key={i} className="glossary-card">
                        <span className="glossary-term">{item.term}</span>
                        <p className="glossary-expl">{item.simpleExplanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {simplifiedData.keyTakeaways?.length > 0 && (
                <div className="summary-section-card">
                  <div className="section-card-title">
                    <CheckCircle2 size={18} style={{ color: "var(--mint-accent)" }} />
                    <h3>Quick Takeaways</h3>
                  </div>
                  <ul className="key-points-list">
                    {simplifiedData.keyTakeaways.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIND MAP */}
      {activeSubTab === "mindmap" && (
        <div className="studio-tab-content">
          {!visualData?.mindMapData && (
            <div className="studio-prompt-box">
              <GitFork size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Visual Concept Mind Map</h3>
              <p>Generate a structured node-and-branch relationship hierarchy for this document.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
                disabled={loadingVisual}
              >
                {loadingVisual ? "Generating..." : "Generate Mind Map"}
              </button>
            </div>
          )}

          {visualData?.mindMapData && (
            <div className="mindmap-container">
              <div className="mindmap-header">
                <h3>{visualData.mindMapData.topic}</h3>
                <span className="mindmap-count">
                  {visualData.mindMapData.nodes?.length || 0} Concept Nodes
                </span>
              </div>

              <div className="mindmap-interactive-view">
                {/* Center Root Node */}
                <div className="mindmap-root-node">
                  <span className="node-type-label">Core Subject</span>
                  <h4>{visualData.mindMapData.topic}</h4>
                </div>

                {/* Branches & Subtopics */}
                <div className="mindmap-branches-grid">
                  {(visualData.mindMapData.nodes || [])
                    .filter((n) => n.type === "branch" || n.parentId === "root")
                    .map((branch) => {
                      const children = (visualData.mindMapData.nodes || []).filter(
                        (child) => child.parentId === branch.id
                      );
                      return (
                        <div key={branch.id} className="mindmap-branch-card">
                          <div className="branch-header">
                            <span className="branch-dot"></span>
                            <h4>{branch.label}</h4>
                          </div>
                          {branch.description && (
                            <p className="branch-desc">{branch.description}</p>
                          )}
                          {children.length > 0 && (
                            <div className="subtopics-list">
                              {children.map((sub) => (
                                <div key={sub.id} className="subtopic-item">
                                  <ChevronRight size={13} style={{ color: "var(--purple-primary)" }} />
                                  <div>
                                    <strong>{sub.label}</strong>
                                    {sub.description && <span> — {sub.description}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FLOWCHART */}
      {activeSubTab === "flowchart" && (
        <div className="studio-tab-content">
          {!visualData?.flowchartData && (
            <div className="studio-prompt-box">
              <ArrowRight size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Process & Workflow Flowchart</h3>
              <p>Transform chronological or procedural concepts into a step-by-step flowchart.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
                disabled={loadingVisual}
              >
                {loadingVisual ? "Generating..." : "Generate Flowchart"}
              </button>
            </div>
          )}

          {visualData?.flowchartData && (
            <div className="flowchart-container">
              <div className="flowchart-header">
                <h3>{visualData.flowchartData.title || "Step-by-Step Flowchart"}</h3>
                <span className="flowchart-badge">Sequential Process</span>
              </div>

              <div className="flowchart-steps-pipeline">
                {(visualData.flowchartData.steps || []).map((step, idx) => (
                  <div key={step.id || idx} className="flowchart-step-wrapper">
                    <div className={`flowchart-node node-${step.type || "process"}`}>
                      <div className="node-step-badge">
                        {step.type === "start" ? "START" : step.type === "end" ? "END" : `STEP ${step.stepNumber || idx + 1}`}
                      </div>
                      <h4>{step.label}</h4>
                      {step.description && <p>{step.description}</p>}
                      {step.condition && (
                        <div className="node-condition">Condition: {step.condition}</div>
                      )}
                    </div>
                    {idx < visualData.flowchartData.steps.length - 1 && (
                      <div className="flowchart-arrow">
                        <ArrowRight size={24} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPARISON TABLES */}
      {activeSubTab === "comparison" && (
        <div className="studio-tab-content">
          {!visualData?.comparisonTables && (
            <div className="studio-prompt-box">
              <Table size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Concept Comparison Tables</h3>
              <p>Compare and contrast related ideas, trade-offs, advantages, and alternative methods.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
                disabled={loadingVisual}
              >
                {loadingVisual ? "Generating..." : "Generate Comparison Tables"}
              </button>
            </div>
          )}

          {visualData?.comparisonTables && (
            <div className="comparison-tables-container">
              {(visualData.comparisonTables || []).map((tbl, idx) => (
                <div key={idx} className="comparison-table-card">
                  <h3>{tbl.title || `Concept Matrix ${idx + 1}`}</h3>
                  <div className="table-responsive">
                    <table className="comparison-table">
                      <thead>
                        <tr>
                          {(tbl.headers || []).map((h, i) => (
                            <th key={i}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(tbl.rows || []).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CHARTS & GRAPHS */}
      {activeSubTab === "charts" && (
        <div className="studio-tab-content">
          {!visualData?.chartsData && (
            <div className="studio-prompt-box">
              <BarChart2 size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Data Grounded Visualizations</h3>
              <p>Extract numerical statistics and figures into charts with zero hallucinated data.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
                disabled={loadingVisual}
              >
                {loadingVisual ? "Generating..." : "Scan & Generate Charts"}
              </button>
            </div>
          )}

          {visualData?.chartsData && (
            <div className="charts-view-container">
              {!visualData.chartsData.hasNumericalData ? (
                <div className="no-data-notice-box">
                  <Info size={28} style={{ color: "var(--blue-accent)" }} />
                  <h4>No Numerical Data in Material</h4>
                  <p>
                    {visualData.chartsData.message ||
                      "This study material is conceptual and does not contain quantitative measurements or percentages. In accordance with academic accuracy rules, no fabricated charts were created."}
                  </p>
                </div>
              ) : (
                <div className="charts-grid">
                  {(visualData.chartsData.charts || []).map((chart, idx) => {
                    const maxValue = Math.max(
                      ...chart.dataPoints.map((d) => d.value),
                      1
                    );
                    return (
                      <div key={idx} className="chart-card">
                        <div className="chart-header">
                          <h4>{chart.title}</h4>
                          <span className="chart-type-pill">{chart.type?.toUpperCase()} CHART</span>
                        </div>
                        <p className="chart-desc">{chart.description}</p>

                        <div className="css-bar-chart">
                          {chart.dataPoints.map((dp, dIdx) => {
                            const pct = Math.round((dp.value / maxValue) * 100);
                            return (
                              <div key={dIdx} className="bar-row">
                                <span className="bar-label">{dp.label}</span>
                                <div className="bar-track">
                                  <div
                                    className="bar-fill"
                                    style={{ width: `${pct}%` }}
                                    title={`${dp.value} ${chart.unit || ""}`}
                                  ></div>
                                </div>
                                <span className="bar-value">
                                  {dp.value} {chart.unit || ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: FLASHCARDS */}
      {activeSubTab === "flashcards" && (
        <div className="studio-tab-content">
          {!visualData?.flashcards || visualData.flashcards.length === 0 ? (
            <div className="studio-prompt-box">
              <Layers size={40} style={{ color: "var(--purple-primary)" }} />
              <h3>Interactive Study Flashcards</h3>
              <p>Generate high-yield question & answer flashcards to test active recall.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
                disabled={loadingVisual}
              >
                {loadingVisual ? "Generating..." : "Generate Flashcards"}
              </button>
            </div>
          ) : (
            <div className="flashcards-deck-view">
              <div className="deck-progress-bar">
                <span>
                  Card {activeFlashcardIndex + 1} of {visualData.flashcards.length}
                </span>
                <span className="deck-category">
                  {visualData.flashcards[activeFlashcardIndex]?.category?.toUpperCase()}
                </span>
              </div>

              {/* Flippable Card */}
              <div
                className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <span className="card-face-indicator">QUESTION / PROMPT</span>
                    <h3>{visualData.flashcards[activeFlashcardIndex]?.front}</h3>
                    <p className="click-to-flip-text">Click anywhere to reveal answer ↻</p>
                  </div>
                  <div className="flashcard-back">
                    <span className="card-face-indicator">ANSWER / EXPLANATION</span>
                    <p>{visualData.flashcards[activeFlashcardIndex]?.back}</p>
                    <p className="click-to-flip-text">Click to flip back ↻</p>
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flashcard-controls">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={activeFlashcardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  Flip Card
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={activeFlashcardIndex === visualData.flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveFlashcardIndex((prev) =>
                      Math.min(visualData.flashcards.length - 1, prev + 1)
                    );
                  }}
                >
                  Next Card
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
