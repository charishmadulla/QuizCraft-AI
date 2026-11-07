import React, { useState } from "react";
import {
  Brain,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { loginUser, registerUser, resetPassword } from "../services/api";

export default function AuthView({ onAuthSuccess, onShowToast }) {
  // 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    // Forgot Password Flow
    if (authMode === "forgot") {
      if (!password) {
        setErrorMessage("Please enter a new password.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("New password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("New passwords do not match.");
        return;
      }

      setLoading(true);
      try {
        const res = await resetPassword({
          email: email.trim(),
          newPassword: password,
        });
        setSuccessMessage(res.message || "Password reset successfully! Please sign in.");
        if (onShowToast) {
          onShowToast("Password reset! You can now sign in.", "success");
        }
        setPassword("");
        setConfirmPassword("");
        setAuthMode("login");
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Could not reset password. Please check your email.";
        setErrorMessage(msg);
        if (onShowToast) onShowToast(msg, "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login or Register Flow
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (authMode === "register") {
      if (!name.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      let res;
      if (authMode === "login") {
        res = await loginUser({ email: email.trim(), password });
      } else {
        res = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }

      if (res.token && res.user) {
        localStorage.setItem("quizcraft_token", res.token);
        localStorage.setItem("quizcraft_user", JSON.stringify(res.user));
        if (onShowToast) {
          onShowToast(res.message || "Welcome to QuizCraft AI!", "success");
        }
        onAuthSuccess(res.user, res.token);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Authentication failed. Please check your details.";
      setErrorMessage(msg);
      if (onShowToast) {
        onShowToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setName("Demo Student");
    setEmail("student@quizcraft.ai");
    setPassword("password123");
    setConfirmPassword("password123");

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let res;
      try {
        res = await loginUser({
          email: "student@quizcraft.ai",
          password: "password123",
        });
      } catch (loginErr) {
        res = await registerUser({
          name: "Demo Student",
          email: "student@quizcraft.ai",
          password: "password123",
        });
      }

      if (res.token && res.user) {
        localStorage.setItem("quizcraft_token", res.token);
        localStorage.setItem("quizcraft_user", JSON.stringify(res.user));
        if (onShowToast) {
          onShowToast("Logged in with Demo Account!", "success");
        }
        onAuthSuccess(res.user, res.token);
      }
    } catch (err) {
      setErrorMessage("Could not launch demo account. Please try registering below.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-wrapper">
      <div className="auth-portal-card">
        {/* Left Side: Brand Showcase */}
        <div className="auth-brand-side">
          <div className="auth-brand-header">
            <div className="auth-brand-icon">
              <Brain size={28} />
            </div>
            <h2>QuizCraft <span>AI</span></h2>
          </div>

          <div className="auth-brand-content">
            <span className="auth-tag">
              <Sparkles size={14} /> SECURE LEARNING PLATFORM
            </span>
            <h3>
              Your Personalized AI Assessment Portal
            </h3>
            <p>
              Every learner enjoys their own isolated workspace. Upload study materials, generate custom Gemini quizzes, bookmark key concepts, and track your individual mastery.
            </p>

            <div className="auth-features-list">
              <div className="auth-feature-item">
                <CheckCircle2 size={16} />
                <span>Private & isolated student study records</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} />
                <span>AI-generated quizzes with full question secrecy</span>
              </div>
              <div className="auth-feature-item">
                <CheckCircle2 size={16} />
                <span>Downloadable PDF progress & mastery reports</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            <span>Secured with JWT & bcrypt encryption</span>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <div className="auth-mode-toggle">
            <button
              type="button"
              className={`mode-toggle-btn ${authMode === "login" ? "mode-active" : ""}`}
              onClick={() => {
                setAuthMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${authMode === "register" ? "mode-active" : ""}`}
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-form-header">
            <h3>
              {authMode === "forgot"
                ? "Reset Account Password"
                : authMode === "login"
                ? "Welcome Back!"
                : "Join QuizCraft AI"}
            </h3>
            <p>
              {authMode === "forgot"
                ? "Enter your registered email address and choose a new password."
                : authMode === "login"
                ? "Sign in to access your study library and quiz history"
                : "Create your free student account to start learning"}
            </p>
          </div>

          {errorMessage && (
            <div className="auth-error-box">
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-success-box" style={{
              backgroundColor: "var(--mint-soft)",
              color: "var(--mint-accent)",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-actual-form">
            {authMode === "register" && (
              <div className="auth-input-group">
                <label htmlFor="reg-name">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="field-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label htmlFor="auth-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="field-icon" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="auth-password">
                  {authMode === "forgot" ? "New Password" : "Password"}
                </label>
                {authMode === "login" && (
                  <button
                    type="button"
                    className="btn-forgot-password-link"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--purple-primary)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: "500",
                      padding: 0
                    }}
                    onClick={() => {
                      setAuthMode("forgot");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={18} className="field-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    authMode === "login"
                      ? "••••••••"
                      : "At least 6 characters"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {(authMode === "register" || authMode === "forgot") && (
              <div className="auth-input-group">
                <label htmlFor="auth-confirm-password">
                  {authMode === "forgot" ? "Confirm New Password" : "Confirm Password"}
                </label>
                <div className="input-with-icon">
                  <Lock size={18} className="field-icon" />
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>
                    {authMode === "forgot"
                      ? "Resetting Password..."
                      : authMode === "login"
                      ? "Signing In..."
                      : "Creating Account..."}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {authMode === "forgot"
                      ? "Reset Password & Continue"
                      : authMode === "login"
                      ? "Sign In to Workspace"
                      : "Register Account"}
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {authMode === "forgot" && (
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  textAlign: "center",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                <RotateCcw size={14} /> Back to Sign In
              </button>
            )}
          </form>

          {/* Quick Demo Access Bar */}
          <div className="quick-demo-divider">
            <span>or test with one click</span>
          </div>

          <button
            type="button"
            className="btn-quick-demo"
            onClick={handleQuickDemo}
            disabled={loading}
          >
            <Sparkles size={16} />
            <span>Launch Demo Student Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
