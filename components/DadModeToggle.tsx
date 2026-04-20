"use client";
import { usePortfolioStore } from "@/store/portfolioStore";

export default function DadModeToggle() {
  const { isDadMode, setDadMode } = usePortfolioStore();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: isDadMode ? "var(--text-primary)" : "var(--bg-card)",
        border: "var(--border-default)",
        borderRadius: "16px",
        padding: "12px 16px",
        boxShadow: "var(--shadow-card)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onClick={() => setDadMode(!isDadMode)}
      id="dad-mode-toggle"
    >
      {/* Icon */}
      <div
        style={{
          fontSize: "26px",
          lineHeight: 1,
          filter: isDadMode ? "none" : "grayscale(0.4)",
          transition: "filter 0.25s ease",
        }}
      >
        👴
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: "15px",
            color: isDadMode ? "white" : "var(--text-primary)",
            transition: "color 0.25s ease",
            lineHeight: 1.3,
          }}
        >
          Dad Mode {isDadMode ? "ON" : "OFF"}
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: isDadMode ? "rgba(255,255,255,0.6)" : "var(--text-muted)",
            transition: "color 0.25s ease",
            marginTop: "2px",
          }}
        >
          {isDadMode ? "Simple view active — technicals hidden" : "Tap to simplify for Dad"}
        </div>
      </div>

      {/* Toggle Switch */}
      <div
        className="toggle-track"
        style={{
          background: isDadMode ? "rgba(255,255,255,0.3)" : "#E5E7EB",
          borderColor: isDadMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="toggle-thumb"
          style={{
            transform: isDadMode ? "translateX(24px)" : "translateX(0)",
            background: isDadMode ? "white" : "white",
          }}
        />
      </div>
    </div>
  );
}
