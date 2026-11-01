import React, { useState } from "react";
import {
  Upload,
  FileText,
  FilePlus,
  Trash2,
  Edit2,
  Eye,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  FileUp,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";

export default function StudyMaterialsView({
  materials = [],
  loading = false,
  onSaveNotes,
  onUploadFile,
  onRenameMaterial,
  onDeleteMaterial,
  onPreviewMaterial,
  onGenerateQuiz,
  savingNotes = false,
  uploadingFile = false,
}) {
  // Tabs: "library", "upload", "notes"
  const [activeTab, setActiveTab] = useState("library");

  // Notes form
  const [noteTitle, setNoteTitle] = useState("");
  const [notesContent, setNotesContent] = useState("");

  // Upload form
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Inline rename state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Handle Notes Submit
  const handleNotesSubmit = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !notesContent.trim()) return;
    const success = await onSaveNotes({
      title: noteTitle.trim(),
      sourceType: "pasted_text",
      extractedText: notesContent.trim(),
    });
    if (success) {
      setNoteTitle("");
      setNotesContent("");
      setActiveTab("library");
    }
  };

  // Handle File Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    const success = await onUploadFile(selectedFile);
    if (success) {
      setSelectedFile(null);
      setActiveTab("library");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "pdf" || ext === "docx") {
        setSelectedFile(file);
      }
    }
  };

  // Filter & Sort Materials
  const filteredMaterials = materials
    .filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.originalName &&
          m.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType =
        typeFilter === "all" || m.sourceType === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const formatDate = (date) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="study-materials-container">
      {/* Top action bar with tabs */}
      <div className="materials-header-tabs">
        <div className="tab-pill-group">
          <button
            type="button"
            className={`tab-pill ${activeTab === "library" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            <Layers size={16} /> Material Library ({materials.length})
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === "upload" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload size={16} /> Upload Document
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === "notes" ? "tab-pill-active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <FilePlus size={16} /> Paste Notes
          </button>
        </div>
      </div>

      {/* TAB 1: MATERIAL LIBRARY */}
      {activeTab === "library" && (
        <div className="materials-library-view">
          {/* Filter Bar */}
          <div className="materials-filter-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search materials by title or filename..."
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by document type"
                >
                  <option value="all">All File Types</option>
                  <option value="pdf">PDF Documents</option>
                  <option value="docx">Word (DOCX)</option>
                  <option value="pasted_text">Pasted Notes</option>
                </select>
              </div>

              <div className="select-pill-wrapper">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort materials"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Materials Grid */}
          {loading ? (
            <div className="loading-state-card">
              <div className="spinner"></div>
              <p>Loading study material library...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="empty-state-card">
              <FileText size={44} className="empty-state-icon" />
              <h3>No Study Materials Found</h3>
              <p>
                {searchQuery || typeFilter !== "all"
                  ? "No materials match your current search or filter criteria."
                  : "Start by uploading a lecture PDF, Word document, or pasting your study notes."}
              </p>
              <div className="empty-state-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab("upload")}
                >
                  <Upload size={16} /> Upload Document
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab("notes")}
                >
                  <FilePlus size={16} /> Paste Notes
                </button>
              </div>
            </div>
          ) : (
            <div className="materials-cards-grid">
              {filteredMaterials.map((material) => {
                const isPdf = material.sourceType === "pdf";
                const isDocx = material.sourceType === "docx";

                return (
                  <article key={material._id} className="material-doc-card">
                    <div className="doc-card-top">
                      <span
                        className="doc-type-badge"
                        style={{
                          backgroundColor: isPdf
                            ? "var(--pink-pastel)"
                            : isDocx
                            ? "var(--blue-soft)"
                            : "var(--lavender)",
                          color: isPdf
                            ? "var(--pink-accent)"
                            : isDocx
                            ? "var(--blue-accent)"
                            : "var(--purple-primary)",
                        }}
                      >
                        {isPdf ? "PDF Document" : isDocx ? "Word Document" : "Pasted Notes"}
                      </span>

                      <div className="doc-card-quick-actions">
                        <button
                          type="button"
                          className="action-icon-subtle"
                          title="Rename title"
                          onClick={() => {
                            setEditingId(material._id);
                            setEditTitle(material.title);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-danger"
                          title="Delete material"
                          onClick={() => onDeleteMaterial(material._id, material.title)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Rename Form or Title Display */}
                    {editingId === material._id ? (
                      <div className="inline-rename-form">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          maxLength={120}
                        />
                        <div className="inline-rename-actions">
                          <button
                            type="button"
                            className="btn-inline-save"
                            onClick={async () => {
                              if (editTitle.trim()) {
                                await onRenameMaterial(material._id, editTitle.trim());
                                setEditingId(null);
                              }
                            }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-inline-cancel"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <h3 className="doc-card-title" title={material.title}>
                        {material.title}
                      </h3>
                    )}

                    {material.originalName && (
                      <p className="doc-original-filename" title={material.originalName}>
                        <FileText size={12} /> {material.originalName}
                      </p>
                    )}

                    <div className="doc-card-metadata">
                      <span>
                        <Calendar size={13} /> {formatDate(material.createdAt)}
                      </span>
                    </div>

                    <div className="doc-card-footer">
                      <button
                        type="button"
                        className="btn-card-preview"
                        onClick={() => onPreviewMaterial(material._id)}
                      >
                        <Eye size={15} /> Preview Text
                      </button>
                      <button
                        type="button"
                        className="btn-card-quiz"
                        onClick={() => onGenerateQuiz(material._id)}
                      >
                        <Sparkles size={15} /> Generate Quiz
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD DOCUMENT */}
      {activeTab === "upload" && (
        <div className="upload-form-card">
          <div className="form-card-header">
            <div className="form-icon-circle" style={{ backgroundColor: "var(--lavender)", color: "var(--purple-primary)" }}>
              <Upload size={22} />
            </div>
            <div>
              <h3>Upload Study Document</h3>
              <p>Upload lecture notes, textbooks, or reference papers in PDF or DOCX format</p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className="upload-drop-form">
            <div
              className={`dropzone-box ${isDragOver ? "dropzone-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileUp size={44} className="dropzone-icon" />
              <h4>{selectedFile ? selectedFile.name : "Choose a file or drag & drop it here"}</h4>
              <p>Supports text-based PDF and DOCX documents up to 10 MB</p>

              <input
                id="doc-file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                style={{ display: "none" }}
              />

              <label htmlFor="doc-file-input" className="btn-secondary" style={{ marginTop: "12px" }}>
                Browse Computer Files
              </label>

              {selectedFile && (
                <div className="selected-file-pill">
                  <FileText size={15} />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    aria-label="Remove selected file"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="upload-info-note">
              <AlertCircle size={16} />
              <span>
                Note: Scanned images inside PDFs without a text layer require OCR. For best results, use digital documents with selectable text.
              </span>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedFile(null);
                  setActiveTab("library");
                }}
                disabled={uploadingFile}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!selectedFile || uploadingFile}
              >
                {uploadingFile ? (
                  <>
                    <div className="btn-spinner"></div> Extracting & Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Upload & Extract Text
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PASTE NOTES */}
      {activeTab === "notes" && (
        <div className="notes-form-card">
          <div className="form-card-header">
            <div className="form-icon-circle" style={{ backgroundColor: "var(--mint-soft)", color: "var(--mint-accent)" }}>
              <FilePlus size={22} />
            </div>
            <div>
              <h3>Add Study Notes</h3>
              <p>Paste notes from your lectures, online tutorials, or flashcards</p>
            </div>
          </div>

          <form onSubmit={handleNotesSubmit} className="study-form">
            <div className="form-group">
              <label htmlFor="note-title-input">Material Title *</label>
              <input
                id="note-title-input"
                type="text"
                placeholder="e.g. Machine Learning Chapter 4 - Neural Networks"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes-content-textarea">Study Notes Content *</label>
              <textarea
                id="notes-content-textarea"
                placeholder="Paste your study content, key definitions, formulas, or summaries here..."
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                rows={10}
                required
              />
              <span className="char-count">
                {notesContent.length} characters ({notesContent.trim() ? notesContent.trim().split(/\s+/).length : 0} words)
              </span>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setNoteTitle("");
                  setNotesContent("");
                  setActiveTab("library");
                }}
                disabled={savingNotes}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!noteTitle.trim() || !notesContent.trim() || savingNotes}
              >
                {savingNotes ? (
                  <>
                    <div className="btn-spinner"></div> Saving Notes...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Save to Study Library
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
