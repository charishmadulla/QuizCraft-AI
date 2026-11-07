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
  Info,
  Compass,
  Zap,
  Target,
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

  // Loading & interactive states
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSimplify, setLoadingSimplify] = useState(false);
  const [loadingVisual, setLoadingVisual] = useState(false);
  const [customParagraph, setCustomParagraph] = useState("");
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copiedSection, setCopiedSection] = useState("");

  const selectedMaterial = materials.find((m) => m._id === currentMaterialId);

  // Sync selectedMaterialId prop when it changes
  useEffect(() => {
    if (selectedMaterialId) {
      setCurrentMaterialId(selectedMaterialId);
    }
  }, [selectedMaterialId]);

  // Load existing data when active material changes
  useEffect(() => {
    if (!currentMaterialId) return;

    let isMounted = true;

    // Reset previous material data so old data does not linger
    setSummaryData(null);
    setSimplifiedData(null);
    setVisualData(null);
    setActiveFlashcardIndex(0);
    setIsFlipped(false);

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
          if (sum.simplifiedExplanation && !simplifiedData) {
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

  // Generate All Studio Materials in one go
  const handleGenerateAll = async () => {
    if (!currentMaterialId) return;
    setLoadingAll(true);
    try {
      const [sumRes, visRes] = await Promise.all([
        generateSummary({ materialId: currentMaterialId, summaryLevel }),
        generateVisualLearning({ materialId: currentMaterialId }),
      ]);

      if (sumRes?.summary) setSummaryData(sumRes.summary);
      if (visRes?.data) {
        setVisualData(visRes.data);
        setActiveFlashcardIndex(0);
        setIsFlipped(false);
      }

      if (onShowToast) {
        onShowToast("Complete AI Study Suite generated successfully!", "success");
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || "Failed to generate complete learning suite.", "error");
      }
    } finally {
      setLoadingAll(false);
    }
  };

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

  // Handle Visual Learning (Mind Map, Flowchart, Comparison, Charts, Flashcards)
  const handleGenerateVisualLearning = async () => {
    if (!currentMaterialId) return;
    setLoadingVisual(true);
    try {
      const res = await generateVisualLearning({ materialId: currentMaterialId });
      if (res?.data) {
        setVisualData(res.data);
        setActiveFlashcardIndex(0);
        setIsFlipped(false);
        if (onShowToast) onShowToast("Visual learning materials generated!", "success");
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
    element.download = `${summaryData.sourceTitle?.replace(/\s+/g, "_") || "study"}_summary.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (materials.length === 0) {
    return (
      <div className="studio-empty-hero">
        <BookOpen size={48} className="empty-hero-icon" />
        <h2>No Study Materials Found</h2>
        <p>
          Upload a PDF, Word document, or paste lecture notes first to unlock the Smart Learning Studio.
        </p>
        <button type="button" className="btn-primary" onClick={onNavigateToUpload}>
          Upload Study Material
        </button>
      </div>
    );
  }

  const hasAnyData = summaryData || visualData;

  return (
    <div className="studio-main-container">
      {/* Top Header Card */}
      <div className="studio-hero-header">
        <div className="studio-hero-title-group">
          <div className="studio-badge-row">
            <span className="studio-pill-badge">
              <Sparkles size={14} /> AI KNOWLEDGE HUB
            </span>
            <span className="studio-doc-badge">
              {selectedMaterial?.sourceType === "pdf" ? "PDF Document" : selectedMaterial?.sourceType === "docx" ? "Word Document" : "Study Notes"}
            </span>
          </div>
          <h1>Smart Learning Studio</h1>
          <p>
            Multi-modal learning suite — Structured summaries, Feynman explanations, conceptual mind maps, process flowcharts, comparison matrices, and flashcards.
          </p>
        </div>

        {/* Material Selector & Actions */}
        <div className="studio-hero-controls">
          <div className="studio-select-wrapper">
            <label htmlFor="studio-mat-select">
              <BookOpen size={15} /> Active Material:
            </label>
            <select
              id="studio-mat-select"
              value={currentMaterialId}
              onChange={(e) => setCurrentMaterialId(e.target.value)}
              className="studio-material-dropdown"
            >
              {materials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title} ({m.sourceType === "pdf" ? "PDF" : m.sourceType === "docx" ? "DOCX" : "Notes"})
                </option>
              ))}
            </select>
          </div>

          <div className="studio-hero-buttons">
            <button
              type="button"
              className="btn-studio-generate-all"
              onClick={handleGenerateAll}
              disabled={loadingAll || loadingSummary || loadingVisual}
              title="Generate summary, diagrams, and flashcards all at once"
            >
              {loadingAll ? (
                <>
                  <div className="btn-spinner"></div> Generating Complete Suite...
                </>
              ) : (
                <>
                  <Zap size={16} /> {hasAnyData ? "Regenerate All AI Assets" : "Generate Complete AI Suite"}
                </>
              )}
            </button>

            {onGenerateQuizForMaterial && (
              <button
                type="button"
                className="btn-studio-quiz"
                onClick={() => onGenerateQuizForMaterial(currentMaterialId)}
              >
                <Target size={15} /> Practice Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Navigation Dock (Subtabs) */}
      <nav className="studio-tabs-dock" aria-label="Learning Studio Tabs">
        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "summary" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("summary")}
        >
          <FileText size={16} />
          <span>Structured Summary</span>
          {summaryData && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "simplify" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("simplify")}
        >
          <Lightbulb size={16} />
          <span>Simple Explanation</span>
          {simplifiedData && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "mindmap" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("mindmap")}
        >
          <GitFork size={16} />
          <span>Mind Map</span>
          {visualData?.mindMapData && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "flowchart" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("flowchart")}
        >
          <ArrowRight size={16} />
          <span>Flowchart</span>
          {visualData?.flowchartData && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "comparison" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("comparison")}
        >
          <Table size={16} />
          <span>Comparison Tables</span>
          {visualData?.comparisonTables && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "charts" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("charts")}
        >
          <BarChart2 size={16} />
          <span>Charts & Data</span>
          {visualData?.chartsData && <span className="tab-ready-dot" title="Ready"></span>}
        </button>

        <button
          type="button"
          className={`studio-dock-tab ${activeSubTab === "flashcards" ? "dock-tab-active" : ""}`}
          onClick={() => setActiveSubTab("flashcards")}
        >
          <Layers size={16} />
          <span>Flashcards</span>
          {visualData?.flashcards?.length > 0 && <span className="tab-ready-dot" title="Ready"></span>}
        </button>
      </nav>

      {/* TAB 1: STRUCTURED SUMMARY */}
      {activeSubTab === "summary" && (
        <div className="studio-tab-view">
          <div className="studio-action-toolbar">
            <div className="depth-segmented-control">
              <span className="toolbar-label">Summary Depth:</span>
              <div className="segmented-group">
                {["short", "medium", "detailed"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`segmented-pill ${summaryLevel === lvl ? "pill-active" : ""}`}
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
            </div>

            <div className="toolbar-buttons-group">
              <button
                type="button"
                className="btn-toolbar-action"
                onClick={() => handleGenerateSummary(summaryLevel)}
                disabled={loadingSummary}
              >
                <RotateCw size={14} className={loadingSummary ? "spin-icon" : ""} />
                <span>{summaryData ? "Regenerate" : "Generate Summary"}</span>
              </button>
              {summaryData && (
                <>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    onClick={() => copyToClipboard(summaryData.rawSummary, "summary")}
                  >
                    <Copy size={14} />
                    <span>{copiedSection === "summary" ? "Copied!" : "Copy Text"}</span>
                  </button>
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    onClick={downloadSummaryText}
                  >
                    <Download size={14} />
                    <span>Download TXT</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {loadingSummary && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Analyzing & Summarizing Study Text...</h4>
              <p>Applying transformer summarization pipeline with chunking and overlap verification.</p>
            </div>
          )}

          {!loadingSummary && !summaryData && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <FileText size={36} />
              </div>
              <h3>Generate Structured AI Summary</h3>
              <p>Extract core concepts, key definitions, illustrative examples, and grounded conclusions.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => handleGenerateSummary(summaryLevel)}
              >
                <Sparkles size={16} /> Generate {summaryLevel.toUpperCase()} Summary Now
              </button>
            </div>
          )}

          {!loadingSummary && summaryData && (
            <div className="summary-cards-stack">
              {/* Core Topic Card */}
              <div className="summary-hero-card">
                <span className="summary-kicker-badge">MAIN TOPIC</span>
                <h2>{summaryData.mainTopic || selectedMaterial?.title}</h2>
                <p className="summary-intro-paragraph">{summaryData.introduction}</p>
              </div>

              {/* Key Points */}
              {summaryData.keyPoints?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <CheckCircle2 size={20} className="icon-mint" />
                    <h3>Important Takeaways</h3>
                  </div>
                  <ul className="key-points-checklist">
                    {summaryData.keyPoints.map((kp, idx) => (
                      <li key={idx}>
                        <span className="checklist-bullet">{idx + 1}</span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Definitions */}
              {summaryData.importantDefinitions?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <BookOpen size={20} className="icon-blue" />
                    <h3>Essential Definitions & Terminology</h3>
                  </div>
                  <div className="definitions-card-grid">
                    {summaryData.importantDefinitions.map((def, idx) => (
                      <div key={idx} className="definition-card">
                        <strong>{def.term}</strong>
                        <p>{def.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essential Concepts */}
              {summaryData.importantConcepts?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <Lightbulb size={20} className="icon-purple" />
                    <h3>Key Concepts & Ideas</h3>
                  </div>
                  <div className="concepts-pill-cloud">
                    {summaryData.importantConcepts.map((concept, idx) => (
                      <span key={idx} className="concept-cloud-pill">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Illustrative Examples */}
              {summaryData.examples?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <HelpCircle size={20} className="icon-peach" />
                    <h3>Practical & Illustrative Examples</h3>
                  </div>
                  <div className="examples-cards-list">
                    {summaryData.examples.map((ex, idx) => (
                      <div key={idx} className="example-item-box">
                        <span className="example-marker">Example {idx + 1}</span>
                        <p>{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              {summaryData.conclusion && (
                <div className="summary-conclusion-card">
                  <div className="block-header">
                    <Sparkles size={20} className="icon-purple" />
                    <h3>Conclusion & Synthesis</h3>
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
        <div className="studio-tab-view">
          <div className="simplify-prompt-bar">
            <div className="simplify-bar-header">
              <Lightbulb size={18} className="icon-purple" />
              <span>Feynman Simplifier: Explain Complex Material in Plain, Conversational Language</span>
            </div>
            <div className="simplify-input-layout">
              <input
                id="custom-topic-input"
                type="text"
                placeholder="Optional: Enter a specific sub-topic or paragraph (leave blank to simplify entire text)"
                value={customParagraph}
                onChange={(e) => setCustomParagraph(e.target.value)}
                className="simplify-text-input"
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
                    <Lightbulb size={16} /> Explain in Simple Language
                  </>
                )}
              </button>
            </div>
          </div>

          {loadingSimplify && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Translating Jargon into Plain English...</h4>
              <p>Applying the Feynman learning technique to formulate analogies and relatable examples.</p>
            </div>
          )}

          {!loadingSimplify && !simplifiedData && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <Lightbulb size={36} />
              </div>
              <h3>Plain Language Learning</h3>
              <p>Break down intimidating terminology and difficult theories into intuitive mental models.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateSimplification}
              >
                <Sparkles size={16} /> Explain This Material Simply
              </button>
            </div>
          )}

          {!loadingSimplify && simplifiedData && (
            <div className="simplify-results-stack">
              {/* Intuitive Explanation Card */}
              <div className="simplify-hero-card">
                <span className="summary-kicker-badge">PLAIN ENGLISH EXPLANATION</span>
                <p className="simplify-body-text">{simplifiedData.simplifiedText}</p>
              </div>

              {/* Analogies */}
              {simplifiedData.analogies?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <Sparkles size={20} className="icon-peach" />
                    <h3>Relatable Real-World Analogies</h3>
                  </div>
                  <div className="analogies-grid">
                    {simplifiedData.analogies.map((analogy, i) => (
                      <div key={i} className="analogy-item-card">
                        <span className="analogy-lightbulb">💡</span>
                        <p>{analogy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Glossary */}
              {simplifiedData.technicalGlossary?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <BookOpen size={20} className="icon-blue" />
                    <h3>Technical Jargon Demystified</h3>
                  </div>
                  <div className="glossary-cards-grid">
                    {simplifiedData.technicalGlossary.map((item, i) => (
                      <div key={i} className="glossary-item-card">
                        <strong className="glossary-term-badge">{item.term}</strong>
                        <p className="glossary-expl-text">{item.simpleExplanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {simplifiedData.keyTakeaways?.length > 0 && (
                <div className="summary-content-block">
                  <div className="block-header">
                    <CheckCircle2 size={20} className="icon-mint" />
                    <h3>Core Takeaways in 10 Seconds</h3>
                  </div>
                  <ul className="key-points-checklist">
                    {simplifiedData.keyTakeaways.map((t, i) => (
                      <li key={i}>
                        <span className="checklist-bullet">✓</span>
                        <span>{t}</span>
                      </li>
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
        <div className="studio-tab-view">
          {loadingVisual && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Building Concept Mind Map...</h4>
              <p>Analyzing semantic relationships, parent topics, and subtopics.</p>
            </div>
          )}

          {!loadingVisual && !visualData?.mindMapData && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <GitFork size={36} />
              </div>
              <h3>Visual Concept Mind Map</h3>
              <p>Generate an interactive conceptual hierarchy branching out from the core theme.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
              >
                <Sparkles size={16} /> Generate Mind Map
              </button>
            </div>
          )}

          {!loadingVisual && visualData?.mindMapData && (
            <div className="mindmap-visual-board">
              <div className="board-top-controls">
                <div>
                  <h3 className="board-title">{visualData.mindMapData.topic}</h3>
                  <span className="board-subtitle">Interactive conceptual relationship branches</span>
                </div>
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleGenerateVisualLearning}
                  disabled={loadingVisual}
                >
                  <RotateCw size={14} /> Regenerate Mind Map
                </button>
              </div>

              {/* Center Core Node */}
              <div className="mindmap-core-anchor">
                <span className="core-node-label">CENTRAL THEME</span>
                <h2 className="core-node-title">{visualData.mindMapData.topic}</h2>
              </div>

              {/* Connecting Lines & Branches Grid */}
              <div className="mindmap-branches-board">
                {(visualData.mindMapData.nodes || [])
                  .filter((n) => n.type === "branch" || n.parentId === "root")
                  .map((branch, bIdx) => {
                    const children = (visualData.mindMapData.nodes || []).filter(
                      (child) => child.parentId === branch.id
                    );
                    return (
                      <div key={branch.id || bIdx} className="mindmap-branch-node">
                        <div className="branch-header-row">
                          <span className="branch-index-pill">{bIdx + 1}</span>
                          <h4>{branch.label}</h4>
                        </div>
                        {branch.description && (
                          <p className="branch-summary-p">{branch.description}</p>
                        )}
                        {children.length > 0 && (
                          <div className="branch-subnodes-list">
                            {children.map((sub, sIdx) => (
                              <div key={sub.id || sIdx} className="subnode-card">
                                <ChevronRight size={14} className="subnode-arrow" />
                                <div className="subnode-text">
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
          )}
        </div>
      )}

      {/* TAB 4: FLOWCHART */}
      {activeSubTab === "flowchart" && (
        <div className="studio-tab-view">
          {loadingVisual && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Constructing Process Flowchart...</h4>
              <p>Tracing sequential algorithms, lifecycles, and chronological steps.</p>
            </div>
          )}

          {!loadingVisual && !visualData?.flowchartData && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <ArrowRight size={36} />
              </div>
              <h3>Sequential Process Flowchart</h3>
              <p>Convert procedural or chronological ideas into a step-by-step visual pipeline.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
              >
                <Sparkles size={16} /> Generate Flowchart
              </button>
            </div>
          )}

          {!loadingVisual && visualData?.flowchartData && (
            <div className="flowchart-board-container">
              <div className="board-top-controls">
                <div>
                  <h3 className="board-title">{visualData.flowchartData.title || "Step-by-Step Flowchart"}</h3>
                  <span className="board-subtitle">Sequential execution and decision flow</span>
                </div>
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleGenerateVisualLearning}
                  disabled={loadingVisual}
                >
                  <RotateCw size={14} /> Regenerate Flowchart
                </button>
              </div>

              {/* Timeline Flow Steps */}
              <div className="flowchart-vertical-pipeline">
                {(visualData.flowchartData.steps || []).map((step, idx, arr) => {
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  const isDecision = step.type === "decision";

                  let badgeColor = "var(--purple-primary)";
                  let badgeBg = "var(--lavender)";
                  if (isFirst) {
                    badgeColor = "var(--mint-accent)";
                    badgeBg = "var(--mint-soft)";
                  } else if (isLast) {
                    badgeColor = "var(--blue-accent)";
                    badgeBg = "var(--blue-soft)";
                  } else if (isDecision) {
                    badgeColor = "var(--peach-accent)";
                    badgeBg = "var(--peach-soft)";
                  }

                  return (
                    <div key={step.id || idx} className="flowchart-node-wrapper">
                      <div className="flowchart-step-card">
                        <div
                          className="step-badge-circle"
                          style={{ backgroundColor: badgeBg, color: badgeColor }}
                        >
                          {step.stepNumber || idx + 1}
                        </div>

                        <div className="step-content-area">
                          <div className="step-type-header">
                            <span
                              className="step-type-pill"
                              style={{ backgroundColor: badgeBg, color: badgeColor }}
                            >
                              {step.type?.toUpperCase() || (isFirst ? "START" : isLast ? "END" : "PROCESS")}
                            </span>
                            <h4>{step.label}</h4>
                          </div>
                          <p>{step.description}</p>
                          {step.condition && (
                            <div className="step-condition-note">
                              <span>Condition: </span> {step.condition}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLast && (
                        <div className="flowchart-arrow-connector">
                          <div className="connector-line"></div>
                          <div className="connector-arrowhead">↓</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMPARISON TABLES (FIXED & BEAUTIFULLY STYLED) */}
      {activeSubTab === "comparison" && (
        <div className="studio-tab-view">
          {loadingVisual && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Synthesizing Concept Comparison Matrices...</h4>
              <p>Analyzing contrasting frameworks, trade-offs, and feature differentials.</p>
            </div>
          )}

          {!loadingVisual && !visualData?.comparisonTables && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <Table size={36} />
              </div>
              <h3>Concept Comparison Tables</h3>
              <p>Compare and contrast related ideas, approaches, trade-offs, and alternative methods.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
              >
                <Sparkles size={16} /> Generate Comparison Tables
              </button>
            </div>
          )}

          {!loadingVisual && visualData?.comparisonTables && (
            <div className="comparison-matrices-deck">
              <div className="board-top-controls">
                <div>
                  <h3 className="board-title">Concept & Framework Comparison Matrices</h3>
                  <span className="board-subtitle">Side-by-side dimension analysis and trade-offs</span>
                </div>
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleGenerateVisualLearning}
                  disabled={loadingVisual}
                >
                  <RotateCw size={14} /> Regenerate Tables
                </button>
              </div>

              {(visualData.comparisonTables || []).map((tbl, idx) => (
                <div key={idx} className="comparison-table-surface">
                  <div className="table-surface-header">
                    <span className="matrix-number-tag">Matrix {idx + 1}</span>
                    <h3 className="table-surface-title">{tbl.title || `Concept Matrix ${idx + 1}`}</h3>
                  </div>

                  <div className="table-responsive-viewport">
                    <table className="modern-comparison-table">
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
                              <td key={cIdx} className={cIdx === 0 ? "feature-header-cell" : ""}>
                                {cell}
                              </td>
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
        <div className="studio-tab-view">
          {loadingVisual && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Scanning Document for Numerical Metrics...</h4>
              <p>Validating factual numbers, percentages, and statistical distributions.</p>
            </div>
          )}

          {!loadingVisual && !visualData?.chartsData && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <BarChart2 size={36} />
              </div>
              <h3>Data Grounded Visualizations</h3>
              <p>Extract verified numerical statistics and figures into charts with zero hallucinated data.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
              >
                <Sparkles size={16} /> Scan & Generate Charts
              </button>
            </div>
          )}

          {!loadingVisual && visualData?.chartsData && (
            <div className="charts-board-deck">
              <div className="board-top-controls">
                <div>
                  <h3 className="board-title">Quantitative Metrics & Visualizations</h3>
                  <span className="board-subtitle">Strictly grounded on actual statistics from your material</span>
                </div>
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleGenerateVisualLearning}
                  disabled={loadingVisual}
                >
                  <RotateCw size={14} /> Rescan Metrics
                </button>
              </div>

              {!visualData.chartsData.hasNumericalData ? (
                <div className="no-data-honest-card">
                  <div className="honest-card-icon">
                    <Info size={28} />
                  </div>
                  <div>
                    <h4>Conceptual Study Material — No Numerical Data</h4>
                    <p>
                      {visualData.chartsData.message ||
                        "This document covers qualitative and conceptual principles without quantitative statistics, percentages, or measurements. Under our academic integrity rules, no artificial or fake numbers were fabricated."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="charts-grid-layout">
                  {(visualData.chartsData.charts || []).map((chart, idx) => {
                    const maxValue = Math.max(
                      ...chart.dataPoints.map((d) => d.value),
                      1
                    );
                    return (
                      <div key={idx} className="metric-chart-card">
                        <div className="metric-chart-header">
                          <div>
                            <h4>{chart.title}</h4>
                            <p>{chart.description}</p>
                          </div>
                          <span className="chart-type-tag">{chart.type?.toUpperCase()} CHART</span>
                        </div>

                        <div className="horizontal-bars-canvas">
                          {chart.dataPoints.map((dp, dIdx) => {
                            const pct = Math.round((dp.value / maxValue) * 100);
                            return (
                              <div key={dIdx} className="bar-data-row">
                                <span className="bar-category-name">{dp.label}</span>
                                <div className="bar-track-shell">
                                  <div
                                    className="bar-fill-fluid"
                                    style={{ width: `${Math.max(5, pct)}%` }}
                                    title={`${dp.value} ${chart.unit || ""}`}
                                  ></div>
                                </div>
                                <span className="bar-metric-value">
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
        <div className="studio-tab-view">
          {loadingVisual && (
            <div className="studio-card-loading">
              <div className="btn-spinner large"></div>
              <h4>Crafting Active Recall Flashcards...</h4>
              <p>Formulating high-yield question prompts and answer explanations.</p>
            </div>
          )}

          {!loadingVisual && (!visualData?.flashcards || visualData.flashcards.length === 0) && (
            <div className="studio-prompt-card">
              <div className="prompt-card-icon-wrapper">
                <Layers size={36} />
              </div>
              <h3>Interactive Study Flashcards</h3>
              <p>Generate high-yield question & answer study cards to test active recall.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateVisualLearning}
              >
                <Sparkles size={16} /> Generate Flashcards
              </button>
            </div>
          )}

          {!loadingVisual && visualData?.flashcards && visualData.flashcards.length > 0 && (
            <div className="flashcards-deck-arena">
              <div className="deck-status-bar">
                <div className="deck-status-left">
                  <span className="deck-card-counter">
                    Card {activeFlashcardIndex + 1} of {visualData.flashcards.length}
                  </span>
                  <span className="deck-topic-category">
                    {visualData.flashcards[activeFlashcardIndex]?.category?.toUpperCase() || "CONCEPT"}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleGenerateVisualLearning}
                  disabled={loadingVisual}
                >
                  <RotateCw size={14} /> Regenerate Deck
                </button>
              </div>

              {/* 3D Flippable Card Arena */}
              <div
                className={`flashcard-3d-scene ${isFlipped ? "is-flipped" : ""}`}
                onClick={() => setIsFlipped(!isFlipped)}
                role="button"
                tabIndex={0}
                aria-label="Click to flip flashcard"
              >
                <div className="flashcard-3d-object">
                  {/* Front: Question */}
                  <div className="flashcard-face flashcard-front-face">
                    <div className="face-header">
                      <span className="face-type-badge question-badge">QUESTION / PROMPT</span>
                      <span className="face-flip-hint">Click card to reveal answer ↻</span>
                    </div>
                    <div className="face-body">
                      <h3>{visualData.flashcards[activeFlashcardIndex]?.front}</h3>
                    </div>
                    <div className="face-footer">
                      <span>QuizCraft AI Active Recall</span>
                    </div>
                  </div>

                  {/* Back: Answer */}
                  <div className="flashcard-face flashcard-back-face">
                    <div className="face-header">
                      <span className="face-type-badge answer-badge">ANSWER / EXPLANATION</span>
                      <span className="face-flip-hint">Click card to flip back ↻</span>
                    </div>
                    <div className="face-body">
                      <p>{visualData.flashcards[activeFlashcardIndex]?.back}</p>
                    </div>
                    <div className="face-footer">
                      <span>Verified against uploaded notes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deck Navigation Controls */}
              <div className="deck-nav-controls">
                <button
                  type="button"
                  className="btn-deck-nav"
                  disabled={activeFlashcardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                  }}
                >
                  ← Previous Card
                </button>
                <button
                  type="button"
                  className="btn-deck-flip"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  Flip Card ↻
                </button>
                <button
                  type="button"
                  className="btn-deck-nav primary-nav"
                  disabled={activeFlashcardIndex === visualData.flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setActiveFlashcardIndex((prev) =>
                      Math.min(visualData.flashcards.length - 1, prev + 1)
                    );
                  }}
                >
                  Next Card →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
