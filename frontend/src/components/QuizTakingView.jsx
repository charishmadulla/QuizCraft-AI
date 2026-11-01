import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  AlertTriangle,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";

export default function QuizTakingView({
  quiz,
  onSubmitQuiz,
  onCancelQuiz,
  submitting = false,
  error = "",
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeLeft, setTimeLeft] = useState(
    (quiz?.questions?.length || 5) * 60
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;

  // Format countdown mm:ss
  const formatTime = (seconds) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Timer effect
  useEffect(() => {
    if (!quiz || submittedRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz]);

  // Auto-submit when timer expires
  const handleAutoSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const answersArray = questions.map((_, idx) =>
      selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null
    );

    const timeSpent = totalQuestions * 60 - timeLeft;
    onSubmitQuiz({
      quizId: quiz.quizId,
      answers: answersArray,
      timeTaken: timeSpent > 0 ? timeSpent : totalQuestions * 60,
      autoSubmit: true,
    });
  };

  // Manual submit trigger
  const handleManualSubmitConfirm = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setShowConfirmModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const answersArray = questions.map((_, idx) =>
      selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : null
    );

    const timeSpent = Math.max(1, totalQuestions * 60 - timeLeft);
    onSubmitQuiz({
      quizId: quiz.quizId,
      answers: answersArray,
      timeTaken: timeSpent,
      autoSubmit: false,
    });
  };

  // Answer selection handler
  const handleSelectAnswer = (optionIdx) => {
    if (submitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIdx,
    }));
  };

  // Mark for review toggle
  const toggleMarkForReview = (index) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Answered questions count
  const answeredCount = Object.keys(selectedAnswers).filter(
    (k) => selectedAnswers[k] !== undefined && selectedAnswers[k] !== null
  ).length;

  const isLowTime = timeLeft <= 60;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="quiz-taking-container">
      {/* Quiz Top Status Bar */}
      <div className="quiz-taking-topbar">
        <div className="quiz-info-group">
          <h2>{quiz.materialTitle || "QuizCraft Assessment"}</h2>
          <div className="quiz-tags-row">
            <span className="quiz-tag-pill difficulty-pill">
              {quiz.difficulty?.toUpperCase()}
            </span>
            <span className="quiz-tag-pill">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        <div className="quiz-status-right">
          <div
            className={`timer-display-box ${isLowTime ? "timer-warning" : ""}`}
            title="Remaining time"
          >
            <Clock size={18} />
            <span className="timer-digits">{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            className="btn-submit-quiz-header"
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting}
          >
            <Send size={15} />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="quiz-progress-section">
        <div className="progress-info-labels">
          <span>
            <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> answered
          </span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}% Completed</span>
        </div>
        <div className="quiz-progress-track">
          <div
            className="quiz-progress-fill"
            style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Assessment Body Grid */}
      <div className="quiz-taking-main-grid">
        {/* Left: Active Question Card */}
        <section className="quiz-question-box">
          {currentQuestion && (
            <div className="active-question-wrapper">
              <div className="question-header-row">
                <span className="question-counter-badge">
                  Question {currentIndex + 1}
                </span>

                {currentQuestion.questionType && (
                  <span className="question-type-label">
                    {currentQuestion.questionType === "true_false"
                      ? "True / False"
                      : currentQuestion.questionType === "fill_in_the_blank"
                      ? "Fill in the Blank"
                      : "Multiple Choice"}
                  </span>
                )}

                <button
                  type="button"
                  className={`btn-flag-review ${
                    markedForReview[currentIndex] ? "flagged-active" : ""
                  }`}
                  onClick={() => toggleMarkForReview(currentIndex)}
                  title="Flag this question to review before submitting"
                >
                  <Flag size={15} />
                  <span>
                    {markedForReview[currentIndex] ? "Marked for Review" : "Mark for Review"}
                  </span>
                </button>
              </div>

              {/* Question Text */}
              <div className="question-prompt-text">
                <p>{currentQuestion.question}</p>
              </div>

              {/* Options List */}
              <div className="question-options-list">
                {currentQuestion.options?.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`option-choice-button ${
                        isSelected ? "option-choice-selected" : ""
                      }`}
                      onClick={() => handleSelectAnswer(optIdx)}
                      disabled={submitting}
                    >
                      <div className="option-letter-badge">{letter}</div>
                      <div className="option-text-content">{option}</div>
                      {isSelected && (
                        <div className="option-check-circle">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Action Buttons */}
              <div className="question-nav-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0 || submitting}
                >
                  <ArrowLeft size={16} /> Previous
                </button>

                {currentIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() =>
                      setCurrentIndex((idx) => Math.min(totalQuestions - 1, idx + 1))
                    }
                    disabled={submitting}
                  >
                    Next Question <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowConfirmModal(true)}
                    disabled={submitting}
                  >
                    Review & Submit <Send size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right: Question Navigation Panel */}
        <aside className="quiz-nav-sidebar">
          <div className="nav-panel-card">
            <h4>Question Palette</h4>
            <p className="palette-desc">Click any number to jump to question</p>

            <div className="palette-grid">
              {questions.map((_, idx) => {
                const isCurrent = currentIndex === idx;
                const isAnswered =
                  selectedAnswers[idx] !== undefined &&
                  selectedAnswers[idx] !== null;
                const isFlagged = markedForReview[idx];

                let itemClass = "palette-btn";
                if (isCurrent) itemClass += " palette-btn-current";
                if (isAnswered) itemClass += " palette-btn-answered";
                if (isFlagged) itemClass += " palette-btn-flagged";

                return (
                  <button
                    key={idx}
                    type="button"
                    className={itemClass}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Jump to question ${idx + 1}`}
                  >
                    {idx + 1}
                    {isFlagged && <span className="flag-dot" />}
                  </button>
                );
              })}
            </div>

            <div className="palette-legend">
              <div className="legend-item">
                <span className="legend-sample sample-answered" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-unanswered" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="legend-item">
                <span className="legend-sample sample-flagged" />
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
            </div>

            <div className="palette-footer-actions">
              <button
                type="button"
                className="btn-submit-palette"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
              <button
                type="button"
                className="btn-cancel-quiz"
                onClick={onCancelQuiz}
                disabled={submitting}
              >
                Exit Assessment
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Submission Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Submit Quiz Assessment?"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered ${
                unansweredCount === 1 ? "question" : "questions"
              }. Are you sure you want to finalize your submission? Unanswered questions will receive 0 points.`
            : `You have answered all ${totalQuestions} questions! Would you like to submit your answers now and calculate your score?`
        }
        confirmText={submitting ? "Grading Quiz..." : "Yes, Submit Quiz"}
        cancelText="Return to Questions"
        isDanger={unansweredCount > 0}
        onConfirm={handleManualSubmitConfirm}
        onCancel={() => setShowConfirmModal(false)}
        loading={submitting}
      />
    </div>
  );
}
