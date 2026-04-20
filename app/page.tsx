"use client";
import { useEffect, useState } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";
import PinGateway from "@/components/PinGateway";
import DashboardPage from "@/components/DashboardPage";
import PortfolioManager from "@/components/PortfolioManager";
import AiBriefing from "@/components/AiBriefing";
import BottomNav from "@/components/BottomNav";
import DadModeToggle from "@/components/DadModeToggle";

type Tab = "dashboard" | "portfolio" | "briefing";

const TAB_TITLES: Record<Tab, string> = {
  dashboard: "IntelVest",
  portfolio: "Portfolio",
  briefing: "AI Briefing",
};

export default function Home() {
  const { isAuthenticated } = usePortfolioStore();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch — Zustand store reads localStorage on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        background: "var(--bg-base)",
      }}>
        <div style={{ fontSize: "32px" }}>IV</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinGateway />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)" }}>
      {/* Top Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(250, 250, 250, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "12px 16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Logo */}
            <div style={{
              width: "32px",
              height: "32px",
              background: "var(--text-primary)",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 900,
              color: "white",
            }}>
              IV
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 900 }}>
              {TAB_TITLES[activeTab]}
            </h1>
          </div>

          {/* Badge: live indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success)",
            borderRadius: "8px",
            padding: "4px 10px",
          }}>
            <span
              className="pulse-soft"
              style={{
                width: "6px",
                height: "6px",
                background: "var(--color-success)",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success-text)" }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Dad Mode Toggle — always visible at top */}
        <DadModeToggle />
      </header>

      {/* Page Content */}
      <main>
        {activeTab === "dashboard" && <DashboardPage />}
        {activeTab === "portfolio" && <PortfolioManager />}
        {activeTab === "briefing" && <AiBriefing />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
