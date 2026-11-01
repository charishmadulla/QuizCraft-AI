import React, { useState } from "react";
import { FileText, X, Copy, Check, BookOpen } from "lucide-react";

export default function MaterialPreviewModal({
  isOpen,
  material,
  onClose,
  onGenerateQuiz,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !material) return null;

  const handleCopy = () => {
    if (material.extractedText) {
      navigator.clipboard.writeText(material.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const charCount = material.extractedText?.length || 0;
  const wordCount = material.extractedText
    ? material.extractedText.trim().split(/\s+/).length
    : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-icon-wrapper" style={{
            backgroundColor: "var(--blue-soft)",
            color: "var(--blue-accent)"
          }}>
            <FileText size={20} />
          </div>
          <div className="modal-title-group">
            <h3>{material.title}</h3>
            <p className="modal-subtitle">
              {material.sourceType?.toUpperCase()} · {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body modal-scrollable">
          <div className="preview-content-box">
            <pre className="preview-text">{material.extractedText || "No text available."}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Content
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onClose();
              onGenerateQuiz(material._id);
            }}
          >
            <BookOpen size={16} /> Generate Quiz from This Material
          </button>
        </div>
      </div>
    </div>
  );
}
