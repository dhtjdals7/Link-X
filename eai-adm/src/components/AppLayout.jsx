import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", icon: "◈", label: "대시보드" },
  { path: "/test", icon: "⚡", label: "전문 테스트" },
  { path: "/layout", icon: "☰", label: "레이아웃 관리" },
  { path: "/history", icon: "◷", label: "송수신 이력" },
  { path: "/profile", icon: "⊞", label: "접속 프로파일" },
  { path: "/simulator", icon: "🖥", label: "Simulator" },  // ⭐ 추가
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={s.wrapper}>
      {/* Sidebar */}
      <nav style={{ ...s.sidebar, width: collapsed ? 56 : 200 }}>
        <div style={s.logoArea} onClick={() => setCollapsed(!collapsed)}>
          <span style={s.logoIcon}>⚡</span>
          {!collapsed && <span style={s.logoText}>Link-X</span>}
        </div>
        <div style={s.navList}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...s.navItem,
                  ...(active ? s.navItemActive : {}),
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "10px 16px",
                }}
              >
                <span style={{ ...s.navIcon, color: active ? "#36a2eb" : "#5c5f73" }}>
                  {item.icon}
                </span>
                {!collapsed && <span style={s.navLabel}>{item.label}</span>}
                {active && <div style={s.activeIndicator} />}
              </button>
            );
          })}
        </div>
        <div style={s.sidebarFooter}>
          {!collapsed && (
            <span style={{ fontSize: 10, color: "#5c5f73", letterSpacing: 0.5 }}>
              v1.0.0
            </span>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main style={{ ...s.main, marginLeft: collapsed ? 56 : 200 }}>
        {children}
      </main>
    </div>
  );
}

const s = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#1a1b2e" },
  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    background: "#141526",
    borderRight: "1px solid #2d2e4a",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.2s ease",
    zIndex: 100,
    overflow: "hidden",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #2d2e4a",
    minHeight: 58,
  },
  logoIcon: { fontSize: 20, flexShrink: 0 },
  logoText: {
    fontSize: 17,
    fontWeight: 700,
    background: "linear-gradient(135deg, #36a2eb, #00bfb3)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    whiteSpace: "nowrap",
  },
  navList: { flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    color: "#9ea2b0",
    fontSize: 13,
    cursor: "pointer",
    position: "relative",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  navItemActive: {
    background: "rgba(54,162,235,0.08)",
    color: "#e8eaed",
  },
  navIcon: { fontSize: 16, flexShrink: 0, width: 20, textAlign: "center" },
  navLabel: { fontWeight: 500 },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    width: 3,
    height: 20,
    borderRadius: "0 3px 3px 0",
    background: "#36a2eb",
  },
  sidebarFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #2d2e4a",
    textAlign: "center",
  },
  main: {
    flex: 1,
    minHeight: "100vh",
    transition: "margin-left 0.2s ease",
  },
};
