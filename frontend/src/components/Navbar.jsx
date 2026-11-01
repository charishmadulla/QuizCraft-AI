import React from "react";
import {
  Menu,
  Sparkles,
  Settings as SettingsIcon,
  Search,
  LogOut,
  User,
} from "lucide-react";

export default function Navbar({
  activeTab,
  onOpenSidebar,
  onGenerateClick,
  onSettingsClick,
  onLogout,
  user,
  searchQuery = "",
  setSearchQuery,
  showSearch = false,
  searchPlaceholder = "Search...",
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return {
          title: `Welcome, ${user?.name ? user.name.split(" ")[0] : "Student"}!`,
          subtitle: "Your personal AI study dashboard & learning hub",
        };
      case "materials":
        return {
          title: "Study Materials",
          subtitle: "Upload and organize your private documents & notes",
        };
      case "generate":
        return {
          title: "AI Quiz Generator",
          subtitle: "Generate tailored practice assessments with Google Gemini",
        };
      case "history":
        return {
          title: "My Quizzes",
          subtitle: "Review your individual quiz attempts & past results",
        };
      case "bookmarks":
        return {
          title: "Bookmarked Questions",
          subtitle: "Your saved revision deck of challenging questions",
        };
      case "analytics":
        return {
          title: "Performance Analytics",
          subtitle: "Real-time accuracy metrics and score progression",
        };
      case "settings":
        return {
          title: "Settings & Profile",
          subtitle: "Account information and system diagnostics",
        };
      default:
        return { title: "QuizCraft AI", subtitle: "Smart Learning Platform" };
    }
  };

  const { title, subtitle } = getTabTitle();
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "S";

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="navbar-heading">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="navbar-right">
        {showSearch && setSearchQuery && (
          <div className="navbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <button
          type="button"
          className="quick-generate-btn"
          onClick={onGenerateClick}
          title="Create New Quiz"
        >
          <Sparkles size={16} />
          <span>New Quiz</span>
        </button>

        <div className="status-pill" title="Private access connected">
          <span className="status-dot"></span>
          <span>Online</span>
        </div>

        {/* User Pill */}
        <div
          className="navbar-user-pill"
          onClick={onSettingsClick}
          title="View Profile Settings"
        >
          <div className="navbar-avatar-initial">{initial}</div>
          <span className="navbar-user-name">
            {user?.name ? user.name.split(" ")[0] : "Account"}
          </span>
        </div>

        <button
          type="button"
          className="icon-action-btn"
          onClick={onLogout}
          title="Log Out of Account"
          aria-label="Log Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
