import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import AuthView from "./components/AuthView";
import DashboardView from "./components/DashboardView";
import StudyMaterialsView from "./components/StudyMaterialsView";
import GenerateQuizView from "./components/GenerateQuizView";
import QuizTakingView from "./components/QuizTakingView";
import QuizResultsView from "./components/QuizResultsView";
import MyQuizzesView from "./components/MyQuizzesView";
import BookmarkedQuestionsView from "./components/BookmarkedQuestionsView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import Toast from "./components/Toast";
import ConfirmationModal from "./components/ConfirmationModal";
import MaterialPreviewModal from "./components/MaterialPreviewModal";

import {
  getCurrentUser,
  getMaterials,
  getMaterialById,
  saveMaterial,
  uploadDocument,
  renameMaterial,
  deleteMaterial,
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getQuizAttemptById,
  getQuizById,
  getBookmarks,
  addBookmark,
  removeBookmark,
  removeBookmarkByQuestion,
} from "./services/api";

import "./App.css";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("quizcraft_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem("quizcraft_token")
  );

  // Navigation State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Toast Notifications
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast({ message: "", type: "success" });
  };

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    isDanger: false,
    onConfirm: () => {},
  });

  // Material Preview Modal State
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Application Data States (Isolated per user)
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  // Active Quiz Session States
  const [preSelectedMaterialId, setPreSelectedMaterialId] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generationError, setGenerationError] = useState("");

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Listen for session expiration
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setAuthToken(null);
      showToast("Your session has expired. Please log in again.", "info");
    };

    window.addEventListener("quizcraft_auth_expired", handleAuthExpired);
    return () => {
      window.removeEventListener("quizcraft_auth_expired", handleAuthExpired);
    };
  }, []);

  // Load User Data upon authentication
  useEffect(() => {
    if (authToken && currentUser) {
      loadMaterialsData();
      loadHistoryData();
      loadBookmarksData();
    }
  }, [authToken, currentUser]);

  const loadMaterialsData = async () => {
    setLoadingMaterials(true);
    try {
      const res = await getMaterials();
      const list = Array.isArray(res?.materials) ? res.materials : [];
      setMaterials(list);
    } catch (err) {
      console.error("Load materials failed:", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const loadHistoryData = async () => {
    setLoadingHistory(true);
    try {
      const res = await getQuizHistory();
      const attempts = Array.isArray(res?.attempts) ? res.attempts : [];
      setQuizHistory(attempts);
    } catch (err) {
      console.error("Load history failed:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadBookmarksData = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await getBookmarks();
      const list = Array.isArray(res?.bookmarks) ? res.bookmarks : [];
      setBookmarks(list);
    } catch (err) {
      console.error("Load bookmarks failed:", err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: "Log Out of QuizCraft AI?",
      message: "Are you sure you want to end your current session? You can sign back in anytime.",
      confirmText: "Log Out",
      isDanger: false,
      onConfirm: () => {
        localStorage.removeItem("quizcraft_token");
        localStorage.removeItem("quizcraft_user");
        setCurrentUser(null);
        setAuthToken(null);
        setMaterials([]);
        setQuizHistory([]);
        setBookmarks([]);
        setActiveQuiz(null);
        setQuizResults(null);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast("Logged out successfully.", "info");
      },
    });
  };

  // Study Materials Actions
  const handleSaveNotes = async (noteData) => {
    setSavingNotes(true);
    try {
      const res = await saveMaterial(noteData);
      showToast(res.message || "Notes saved to your study library!", "success");
      await loadMaterialsData();
      return true;
    } catch (err) {
      showToast(err.message || "Failed to save study notes.", "error");
      return false;
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUploadFile = async (file) => {
    setUploadingFile(true);
    try {
      const res = await uploadDocument(file);
      showToast(res.message || "Document uploaded and text extracted!", "success");
      await loadMaterialsData();
      return true;
    } catch (err) {
      showToast(err.message || "Document upload failed.", "error");
      return false;
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePreviewMaterial = async (materialId) => {
    try {
      const res = await getMaterialById(materialId);
      if (res?.material) {
        setPreviewMaterial(res.material);
        setIsPreviewOpen(true);
      } else {
        showToast("Material text not found.", "error");
      }
    } catch (err) {
      showToast("Could not load preview text.", "error");
    }
  };

  const handleRenameMaterial = async (materialId, newTitle) => {
    try {
      await renameMaterial(materialId, newTitle);
      showToast("Material renamed successfully!", "success");
      await loadMaterialsData();
    } catch (err) {
      showToast("Failed to rename material.", "error");
    }
  };

  const handleDeleteMaterial = (materialId, title) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Study Material?",
      message: `Are you sure you want to permanently delete "${title}"? This cannot be undone.`,
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteMaterial(materialId);
          showToast("Study material deleted.", "success");
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          await loadMaterialsData();
        } catch (err) {
          showToast("Failed to delete study material.", "error");
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Quiz Generation & Taking Actions
  const handleStartGenerateQuizForMaterial = (materialId) => {
    setPreSelectedMaterialId(materialId);
    setActiveTab("generate");
  };

  const handleGenerateQuiz = async (config) => {
    setGeneratingQuiz(true);
    setGenerationError("");
    try {
      const res = await generateQuiz(config);
      if (!res.quizId || !Array.isArray(res.questions) || res.questions.length === 0) {
        throw new Error("Received an incomplete quiz from the generator.");
      }

      setActiveQuiz(res);
      setQuizResults(null);
      setActiveTab("quiz-taking");
      showToast("Quiz generated successfully! Good luck!", "success");
    } catch (err) {
      console.error("Quiz generation failed:", err);
      const errMsg =
        err.response?.data?.message || err.message || "Failed to generate quiz.";
      setGenerationError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async ({ quizId, answers, timeTaken, autoSubmit }) => {
    setSubmittingQuiz(true);
    try {
      const res = await submitQuiz({ quizId, answers, timeTaken, autoSubmit });
      setQuizResults({
        ...res,
        quizTitle: activeQuiz?.materialTitle || "Quiz Assessment",
      });
      setActiveTab("quiz-results");
      showToast("Quiz submitted and graded successfully!", "success");
      await loadHistoryData();
    } catch (err) {
      console.error("Quiz submit error:", err);
      showToast(err.message || "Failed to submit quiz.", "error");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleCancelQuizSession = () => {
    setConfirmModal({
      isOpen: true,
      title: "Exit Current Quiz?",
      message: "Are you sure you want to exit? Your current progress will not be saved.",
      confirmText: "Exit Quiz",
      isDanger: true,
      onConfirm: () => {
        setActiveQuiz(null);
        setActiveTab("dashboard");
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRetakeQuiz = () => {
    if (activeQuiz) {
      setActiveTab("quiz-taking");
    } else {
      setActiveTab("generate");
    }
  };

  const handleOpenAttemptResults = async (attemptId) => {
    try {
      const res = await getQuizAttemptById(attemptId);
      if (res?.attempt) {
        setQuizResults({
          ...res.attempt,
          quizTitle: res.attempt.materialTitle || "Quiz Results",
        });
        setActiveTab("quiz-results");
      } else {
        showToast("Attempt details not found.", "error");
      }
    } catch (err) {
      showToast("Could not load attempt results.", "error");
    }
  };

  const handleRetakeFromHistory = async (quizId) => {
    try {
      const res = await getQuizById(quizId);
      if (res?.questions) {
        setActiveQuiz(res);
        setQuizResults(null);
        setActiveTab("quiz-taking");
        showToast("Loaded quiz for retake!", "success");
      }
    } catch (err) {
      showToast("Could not reload quiz questions.", "error");
    }
  };

  // Bookmarking Actions
  const handleBookmarkToggle = async (questionData) => {
    const isBookmarked = bookmarks.some((b) => b.question === questionData.question);

    if (isBookmarked) {
      try {
        await removeBookmarkByQuestion(questionData.question, questionData.quizId);
        showToast("Question removed from bookmarks.", "info");
        await loadBookmarksData();
      } catch (err) {
        showToast("Could not remove bookmark.", "error");
      }
    } else {
      try {
        await addBookmark(questionData);
        showToast("Question saved to your bookmarks!", "success");
        await loadBookmarksData();
      } catch (err) {
        showToast("Could not bookmark question.", "error");
      }
    }
  };

  const handleRemoveBookmarkById = async (bookmarkId) => {
    try {
      await removeBookmark(bookmarkId);
      showToast("Bookmark removed.", "info");
      await loadBookmarksData();
    } catch (err) {
      showToast("Could not remove bookmark.", "error");
    }
  };

  const bookmarkedMap = bookmarks.reduce((acc, b) => {
    acc[b.question] = true;
    return acc;
  }, {});

  // If user is not authenticated, render the pastel Auth Portal
  if (!authToken || !currentUser) {
    return (
      <div className="auth-root-container">
        <AuthView
          onAuthSuccess={handleAuthSuccess}
          onShowToast={showToast}
        />
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        materialsCount={materials.length}
        bookmarksCount={bookmarks.length}
        quizzesCount={quizHistory.length}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="app-main-wrapper">
        <Navbar
          activeTab={activeTab}
          onOpenSidebar={() => setSidebarOpen(true)}
          onGenerateClick={() => setActiveTab("generate")}
          onSettingsClick={() => setActiveTab("settings")}
          onLogout={handleLogout}
          user={currentUser}
          showSearch={false}
        />

        <main className="app-content-body">
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <DashboardView
              materials={materials}
              quizHistory={quizHistory}
              bookmarks={bookmarks}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenPreview={handlePreviewMaterial}
              onSelectMaterialForQuiz={handleStartGenerateQuizForMaterial}
            />
          )}

          {/* STUDY MATERIALS TAB */}
          {activeTab === "materials" && (
            <StudyMaterialsView
              materials={materials}
              loading={loadingMaterials}
              onSaveNotes={handleSaveNotes}
              onUploadFile={handleUploadFile}
              onRenameMaterial={handleRenameMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onPreviewMaterial={handlePreviewMaterial}
              onGenerateQuiz={handleStartGenerateQuizForMaterial}
              savingNotes={savingNotes}
              uploadingFile={uploadingFile}
            />
          )}

          {/* GENERATE QUIZ TAB */}
          {activeTab === "generate" && (
            <GenerateQuizView
              materials={materials}
              selectedMaterialId={preSelectedMaterialId}
              onGenerateQuiz={handleGenerateQuiz}
              generating={generatingQuiz}
              error={generationError}
              onNavigateToUpload={() => setActiveTab("materials")}
            />
          )}

          {/* QUIZ TAKING SESSION */}
          {activeTab === "quiz-taking" && activeQuiz && (
            <QuizTakingView
              quiz={activeQuiz}
              onSubmitQuiz={handleSubmitQuiz}
              onCancelQuiz={handleCancelQuizSession}
              submitting={submittingQuiz}
            />
          )}

          {/* QUIZ RESULTS VIEW */}
          {activeTab === "quiz-results" && quizResults && (
            <QuizResultsView
              resultsData={quizResults}
              onRetakeQuiz={handleRetakeQuiz}
              onGenerateAnother={() => setActiveTab("generate")}
              onBackToDashboard={() => setActiveTab("dashboard")}
              onBookmarkQuestion={handleBookmarkToggle}
              bookmarkedMap={bookmarkedMap}
            />
          )}

          {/* MY QUIZZES TAB */}
          {activeTab === "history" && (
            <MyQuizzesView
              quizHistory={quizHistory}
              loading={loadingHistory}
              onOpenAttemptResults={handleOpenAttemptResults}
              onRetakeQuizFromHistory={handleRetakeFromHistory}
              onNavigateToGenerate={() => setActiveTab("generate")}
            />
          )}

          {/* BOOKMARKED QUESTIONS TAB */}
          {activeTab === "bookmarks" && (
            <BookmarkedQuestionsView
              bookmarks={bookmarks}
              loading={loadingBookmarks}
              onRemoveBookmark={handleRemoveBookmarkById}
              onNavigateToGenerate={() => setActiveTab("generate")}
            />
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <AnalyticsView
              quizHistory={quizHistory}
              materials={materials}
              onNavigateToGenerate={() => setActiveTab("generate")}
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <SettingsView
              user={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onLogout={handleLogout}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Material Text Preview Modal */}
      <MaterialPreviewModal
        isOpen={isPreviewOpen}
        material={previewMaterial}
        onClose={() => setIsPreviewOpen(false)}
        onGenerateQuiz={handleStartGenerateQuizForMaterial}
      />
    </div>
  );
}
