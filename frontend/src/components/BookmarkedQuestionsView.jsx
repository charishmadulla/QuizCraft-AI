import React, { useState } from "react";
import {
  Bookmark,
  Search,
  Filter,
  Trash2,
  HelpCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react";

export default function BookmarkedQuestionsView({
  bookmarks = [],
  loading = false,
  onRemoveBookmark,
  onNavigateToGenerate,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [revealedMap, setRevealedMap] = useState({});
  const [practiceAnswers, setPracticeAnswers] = useState({});

  // Unique materials in bookmarks
  const uniqueMaterials = Array.from(
    new Set(bookmarks.map((b) => b.materialTitle).filter(Boolean))
  );

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      b.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.explanation &&
        b.explanation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.materialTitle &&
        b.materialTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMaterial =
      materialFilter === "all" || b.materialTitle === materialFilter;
    return matchesSearch && matchesMaterial;
  });

  const toggleReveal = (id) => {
    setRevealedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectPracticeAnswer = (bookmarkId, optIdx) => {
    setPracticeAnswers((prev) => ({
      ...prev,
      [bookmarkId]: optIdx,
    }));
    // automatically reveal answer after trying
    setRevealedMap((prev) => ({
      ...prev,
      [bookmarkId]: true,
    }));
  };

  return (
    <div className="bookmarks-container">
      {/* Search & Filter Header */}
      <div className="bookmarks-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search bookmarked questions or topics..."
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
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              aria-label="Filter by material"
            >
              <option value="all">All Study Materials</option>
              {uniqueMaterials.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state-card">
          <div className="spinner"></div>
          <p>Loading your bookmarked questions...</p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="empty-state-card">
          <Bookmark size={44} className="empty-state-icon" />
          <h3>No Bookmarked Questions</h3>
          <p>
            {searchQuery || materialFilter !== "all"
              ? "No bookmarked questions match your search or filter."
              : "When you complete quizzes, click 'Bookmark' on challenging questions to save them here for revision."}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToGenerate}
          >
            <Sparkles size={16} /> Take a Practice Quiz
          </button>
        </div>
      ) : (
        <div className="bookmarks-grid-list">
          {filteredBookmarks.map((bookmark, idx) => {
            const isRevealed = revealedMap[bookmark._id];
            const userAnswer = practiceAnswers[bookmark._id];
            const hasAnswered = userAnswer !== undefined;

            return (
              <article key={bookmark._id} className="bookmark-card">
                <div className="bookmark-card-header">
                  <div className="bookmark-tags">
                    <span className="source-tag" title={bookmark.materialTitle}>
                      <BookOpen size={12} /> {bookmark.materialTitle || "Study Material"}
                    </span>
                    <span className="difficulty-tag">
                      {bookmark.difficulty?.toUpperCase() || "MEDIUM"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-remove-bookmark"
                    onClick={() => onRemoveBookmark(bookmark._id)}
                    title="Remove from bookmarks"
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="bookmark-question-body">
                  <h4>Q{idx + 1}. {bookmark.question}</h4>
                </div>

                {/* Practice Options */}
                <div className="bookmark-options-list">
                  {bookmark.options?.map((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isRight = bookmark.correctAnswer === optIdx;
                    const isSelected = userAnswer === optIdx;

                    let optClass = "bookmark-opt-btn";
                    if (isRevealed && isRight) {
                      optClass += " opt-correct";
                    } else if (isRevealed && isSelected && !isRight) {
                      optClass += " opt-incorrect";
                    } else if (isSelected) {
                      optClass += " opt-selected";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={optClass}
                        onClick={() =>
                          handleSelectPracticeAnswer(bookmark._id, optIdx)
                        }
                      >
                        <span className="opt-letter">{letter}</span>
                        <span className="opt-text">{opt}</span>
                        {isRevealed && isRight && (
                          <span className="opt-status-tag">Correct Answer</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Controls & Explanation */}
                <div className="bookmark-card-footer">
                  <button
                    type="button"
                    className="btn-toggle-answer"
                    onClick={() => toggleReveal(bookmark._id)}
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff size={15} /> Hide Answer & Explanation
                      </>
                    ) : (
                      <>
                        <Eye size={15} /> Reveal Answer & Explanation
                      </>
                    )}
                  </button>

                  {isRevealed && bookmark.explanation && (
                    <div className="bookmark-explanation-content">
                      <strong>Explanation:</strong>
                      <p>{bookmark.explanation}</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
