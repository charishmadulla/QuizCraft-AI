import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  History,
  Bookmark,
  BarChart3,
  Settings,
  Brain,
  X,
  User as UserIcon,
  LogOut,
} from "lucide-react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  materialsCount = 0,
  bookmarksCount = 0,
  quizzesCount = 0,
  user,
  onLogout,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "materials",
      label: "Study Materials",
      icon: FolderOpen,
      badge: materialsCount > 0 ? materialsCount : null,
    },
    {
      id: "generate",
      label: "Generate Quiz",
      icon: Sparkles,
      badge: "AI",
      badgeColor: "var(--lavender)",
    },
    {
      id: "history",
      label: "My Quizzes",
      icon: History,
      badge: quizzesCount > 0 ? quizzesCount : null,
    },
    {
      id: "bookmarks",
      label: "Bookmarked Questions",
      icon: Bookmark,
      badge: bookmarksCount > 0 ? bookmarksCount : null,
    },
    {
      id: "analytics",
      label: "Performance Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "settings",
      label: "Settings & Profile",
      icon: Settings,
      badge: null,
    },
  ];

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "S";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`sidebar-container ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Brain size={22} />
            </div>
            <div className="logo-text">
              <h2>QuizCraft <span>AI</span></h2>
              <p>Smart Learning Platform</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">LEARNING MENU</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? "nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
              >
                <div className="nav-item-left">
                  <Icon size={19} className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className="nav-badge"
                    style={{
                      backgroundColor: item.badgeColor || "var(--purple-pastel)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar-initial">
              {initial}
            </div>
            <div className="user-info">
              <h4 title={user?.name || "Student"}>{user?.name || "Student"}</h4>
              <p title={user?.email || ""}>{user?.email || "Personal Account"}</p>
            </div>
            {onLogout && (
              <button
                type="button"
                className="btn-sidebar-logout"
                onClick={onLogout}
                title="Log Out of Account"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
