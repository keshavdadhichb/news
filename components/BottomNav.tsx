"use client";
import { BarChart2, PlusCircle, Brain, Home, MessageSquare } from "lucide-react";

type Tab = "dashboard" | "portfolio" | "chat" | "briefing";

const NAV_ITEMS = [
  { id: "dashboard" as Tab, label: "Home", Icon: Home },
  { id: "portfolio" as Tab, label: "Portfolio", Icon: PlusCircle },
  { id: "chat" as Tab, label: "Chat", Icon: MessageSquare },
  { id: "briefing" as Tab, label: "AI Brief", Icon: Brain },
];

export default function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            id={`nav-${id}`}
            className={`nav-pill ${isActive ? "active" : ""}`}
            onClick={() => onTabChange(id)}
            style={{ border: "none", background: isActive ? "var(--text-primary)" : "transparent", cursor: "pointer" }}
          >
            <Icon size={20} color={isActive ? "white" : "var(--text-muted)"} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isActive ? "white" : "var(--text-muted)",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
