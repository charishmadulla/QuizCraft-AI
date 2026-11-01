import React, { useState } from "react";
import {
  User,
  Cpu,
  Database,
  CheckCircle2,
  Palette,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  Calendar,
  LogOut,
  Key,
} from "lucide-react";
import { updateUserProfile } from "../services/api";

export default function SettingsView({ user, onUpdateUser, onLogout, onShowToast }) {
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [preferredDifficulty, setPreferredDifficulty] = useState(
    () => localStorage.getItem("quizcraft_default_difficulty") || "medium"
  );
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
      localStorage.setItem("quizcraft_default_difficulty", preferredDifficulty);

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
        onShowToast("Profile updated successfully!", "success");
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
      <div className="settings-cards-grid">
        {/* User Account & Profile Card */}
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
              <h3>User Profile & Account Access</h3>
              <p>Manage your login credentials and personal workspace details</p>
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

          <form onSubmit={handleSaveProfile} className="settings-form">
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

            <div className="form-group">
              <label htmlFor="pref-difficulty">Default Difficulty Preference</label>
              <select
                id="pref-difficulty"
                value={preferredDifficulty}
                onChange={(e) => setPreferredDifficulty(e.target.value)}
              >
                <option value="easy">Easy (Foundations)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced Analytics)</option>
              </select>
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
                <label htmlFor="new-password">New Password (Min. 6 chars)</label>
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
              <span className="save-confirm-text">✓ Profile saved successfully!</span>
            )}
          </form>
        </section>

        {/* AI & System Integration Status Card */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div
              className="settings-icon-wrapper"
              style={{
                backgroundColor: "var(--mint-soft)",
                color: "var(--mint-accent)",
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h3>Security & Architecture</h3>
              <p>User data isolation and AI system status</p>
            </div>
          </div>

          <div className="system-status-list">
            <div className="system-status-row">
              <div className="status-label-group">
                <ShieldCheck size={16} style={{ color: "var(--mint-accent)" }} />
                <span>Account Access</span>
              </div>
              <span className="status-badge-active">Private User Isolation (Active)</span>
            </div>

            <div className="system-status-row">
              <div className="status-label-group">
                <Lock size={16} style={{ color: "var(--purple-primary)" }} />
                <span>Password Encryption</span>
              </div>
              <span className="status-badge-active">bcrypt Salted Hash</span>
            </div>

            <div className="system-status-row">
              <div className="status-label-group">
                <Key size={16} style={{ color: "var(--blue-accent)" }} />
                <span>API Authorization</span>
              </div>
              <span className="status-badge-active">JWT Bearer Tokens</span>
            </div>

            <div className="system-status-row">
              <div className="status-label-group">
                <Sparkles size={16} style={{ color: "var(--purple-primary)" }} />
                <span>AI Model</span>
              </div>
              <span className="status-badge-active">Google Gemini 3.8 Flash</span>
            </div>

            <div className="system-status-row">
              <div className="status-label-group">
                <Database size={16} style={{ color: "var(--mint-accent)" }} />
                <span>Database</span>
              </div>
              <span className="status-badge-active">MongoDB (User-Filtered Collections)</span>
            </div>

            <div className="system-status-row">
              <div className="status-label-group">
                <Palette size={16} style={{ color: "var(--peach-accent)" }} />
                <span>Theme Design</span>
              </div>
              <span className="theme-tag">Soft Pastel Study Theme</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
