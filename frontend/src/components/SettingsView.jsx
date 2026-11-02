import React, { useState } from "react";
import {
  User,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  Calendar,
  LogOut,
  Key,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Database,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";
import { updateUserProfile } from "../services/api";

export default function SettingsView({ user, onUpdateUser, onLogout, onShowToast }) {
  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // User Study Preferences
  const [preferredDifficulty, setPreferredDifficulty] = useState(
    () => localStorage.getItem("quizcraft_default_difficulty") || "medium"
  );
  const [preferredCount, setPreferredCount] = useState(
    () => localStorage.getItem("quizcraft_default_count") || "5"
  );
  const [preferredType, setPreferredType] = useState(
    () => localStorage.getItem("quizcraft_default_type") || "multiple_choice"
  );
  const [autoSubmit, setAutoSubmit] = useState(
    () => localStorage.getItem("quizcraft_auto_submit") !== "false"
  );
  const [timerWarning, setTimerWarning] = useState(
    () => localStorage.getItem("quizcraft_timer_warning") !== "false"
  );

  // Architecture panel collapsed by default
  const [showTechSpecs, setShowTechSpecs] = useState(false);

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSavedSuccess(false);

    if (!name.trim()) {
      setErrorMessage("Name cannot be empty.");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword && !currentPassword) {
      setErrorMessage("Please enter your current password to change it.");
      return;
    }

    setLoading(true);

    try {
      // Save study preferences locally
      localStorage.setItem("quizcraft_default_difficulty", preferredDifficulty);
      localStorage.setItem("quizcraft_default_count", preferredCount);
      localStorage.setItem("quizcraft_default_type", preferredType);
      localStorage.setItem("quizcraft_auto_submit", String(autoSubmit));
      localStorage.setItem("quizcraft_timer_warning", String(timerWarning));

      const payload = { name: name.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await updateUserProfile(payload);
      if (res?.user) {
        localStorage.setItem("quizcraft_user", JSON.stringify(res.user));
        if (onUpdateUser) onUpdateUser(res.user);
      }

      setSavedSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      if (onShowToast) {
        onShowToast("Profile and study preferences updated successfully!", "success");
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to update profile.";
      setErrorMessage(msg);
      if (onShowToast) {
        onShowToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "S";

  const formatDate = (date) => {
    if (!date) return "Recently";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="settings-container">
      <form onSubmit={handleSaveProfile}>
        <div className="settings-cards-grid">
          {/* Card 1: User Profile & Account Settings */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div
                className="settings-icon-wrapper"
                style={{
                  backgroundColor: "var(--lavender)",
                  color: "var(--purple-primary)",
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h3>User Profile & Account</h3>
                <p>Manage your account identity and login credentials</p>
              </div>
            </div>

            <div className="user-profile-badge-card">
              <div className="large-avatar-initial">{initial}</div>
              <div className="profile-badge-info">
                <h4>{user?.name || "Student Learner"}</h4>
                <p className="profile-email-badge">
                  <Mail size={13} /> {user?.email || "student@quizcraft.ai"}
                </p>
                <span className="profile-joined-date">
                  <Calendar size={12} /> Member since {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="auth-error-box" style={{ marginBottom: "16px" }}>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="student-name">Display Full Name</label>
                <input
                  id="student-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                />
              </div>

              <div className="password-change-section">
                <span className="sub-section-title">
                  <Key size={15} /> Change Password (Optional)
                </span>

                <div className="form-group" style={{ marginTop: "10px" }}>
                  <label htmlFor="cur-password">Current Password</label>
                  <input
                    id="cur-password"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-password">New Password (Min. 6 characters)</label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="settings-actions-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div> Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Save Profile Settings
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-logout-settings"
                  onClick={onLogout}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>

              {savedSuccess && (
                <span className="save-confirm-text">✓ Profile and preferences saved!</span>
              )}
            </div>
          </section>

          {/* Card 2: Study & Assessment Preferences */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div
                className="settings-icon-wrapper"
                style={{
                  backgroundColor: "var(--mint-soft)",
                  color: "var(--mint-accent)",
                }}
              >
                <Sliders size={20} />
              </div>
              <div>
                <h3>Study & Quiz Preferences</h3>
                <p>Customize your default quiz generation and assessment flow</p>
              </div>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="pref-difficulty">Default Difficulty Level</label>
                <select
                  id="pref-difficulty"
                  value={preferredDifficulty}
                  onChange={(e) => setPreferredDifficulty(e.target.value)}
                >
                  <option value="easy">Easy (Foundational Concepts)</option>
                  <option value="medium">Medium (Standard Assessment)</option>
                  <option value="hard">Hard (Deep Critical Thinking)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pref-count">Default Question Count</label>
                <select
                  id="pref-count"
                  value={preferredCount}
                  onChange={(e) => setPreferredCount(e.target.value)}
                >
                  <option value="5">5 Questions (Quick Review)</option>
                  <option value="10">10 Questions (Standard Practice)</option>
                  <option value="15">15 Questions (Full Test)</option>
                  <option value="20">20 Questions (Comprehensive Exam)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pref-type">Preferred Question Format</label>
                <select
                  id="pref-type"
                  value={preferredType}
                  onChange={(e) => setPreferredType(e.target.value)}
                >
                  <option value="multiple_choice">Multiple Choice (4 Options)</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_in_the_blank">Fill in the Blanks</option>
                  <option value="mixed">Mixed Formats</option>
                </select>
              </div>

              <div className="pref-checkbox-group">
                <label className="pref-checkbox-row">
                  <input
                    type="checkbox"
                    checked={autoSubmit}
                    onChange={(e) => setAutoSubmit(e.target.checked)}
                  />
                  <div>
                    <span className="pref-checkbox-title">Auto-Submit on Timer Expiry</span>
                    <span className="pref-checkbox-desc">
                      Automatically submit your quiz when the countdown timer hits 00:00.
                    </span>
                  </div>
                </label>

                <label className="pref-checkbox-row">
                  <input
                    type="checkbox"
                    checked={timerWarning}
                    onChange={(e) => setTimerWarning(e.target.checked)}
                  />
                  <div>
                    <span className="pref-checkbox-title">1-Minute Remaining Alert</span>
                    <span className="pref-checkbox-desc">
                      Highlight timer in soft peach when less than 60 seconds remain.
                    </span>
                  </div>
                </label>
              </div>

              {/* User-facing Privacy & Security Assurance */}
              <div className="privacy-assurance-card">
                <div className="privacy-badge-icon">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4>Private & Protected Workspace</h4>
                  <p>
                    All uploaded notes, PDFs, quizzes, bookmarks, and quiz attempts are strictly private to your account.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>

      {/* Collapsible Architecture & Project Info (For Academic / Viva Review) */}
      <div className="tech-specs-accordion">
        <button
          type="button"
          className="tech-specs-toggle-btn"
          onClick={() => setShowTechSpecs(!showTechSpecs)}
          aria-expanded={showTechSpecs}
        >
          <div className="tech-specs-toggle-label">
            <Info size={16} />
            <span>Technical Architecture & Specifications (Academic Review / Viva)</span>
          </div>
          {showTechSpecs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechSpecs && (
          <div className="tech-specs-content">
            <div className="tech-specs-grid">
              <div className="tech-spec-item">
                <div className="tech-spec-icon"><ShieldCheck size={16} /></div>
                <div>
                  <strong>User Access & Privacy</strong>
                  <p>Per-user data isolation with signed JWT bearer tokens.</p>
                </div>
              </div>

              <div className="tech-spec-item">
                <div className="tech-spec-icon"><Lock size={16} /></div>
                <div>
                  <strong>Password Security</strong>
                  <p>bcrypt 10-round salted password hashing.</p>
                </div>
              </div>

              <div className="tech-spec-item">
                <div className="tech-spec-icon"><Sparkles size={16} /></div>
                <div>
                  <strong>AI Generation Engine</strong>
                  <p>Google Gemini API with multi-model fallback pool (gemini-3.5-flash / lite / 3.7).</p>
                </div>
              </div>

              <div className="tech-spec-item">
                <div className="tech-spec-icon"><FileText size={16} /></div>
                <div>
                  <strong>Document Extraction</strong>
                  <p>pdf-parse (PDF documents) & mammoth (DOCX documents).</p>
                </div>
              </div>

              <div className="tech-spec-item">
                <div className="tech-spec-icon"><Database size={16} /></div>
                <div>
                  <strong>Database Architecture</strong>
                  <p>MongoDB Mongoose ODM with user-filtered collections.</p>
                </div>
              </div>

              <div className="tech-spec-item">
                <div className="tech-spec-icon"><Layers size={16} /></div>
                <div>
                  <strong>Frontend Architecture</strong>
                  <p>React 18, Vite, Lucide Icons with custom soft pastel study theme.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
