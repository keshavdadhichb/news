"use client";
import { useState } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, RefreshCw, Calendar } from "lucide-react";

export default function AiBriefing() {
  const { holdings, lastBriefing, lastBriefingDate, setBriefing, isDadMode } = usePortfolioStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateBriefing = async () => {
    if (holdings.length === 0) {
      setError("Add holdings first to generate a briefing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "API error");
      setBriefing(data.briefing);
    } catch (e) {
      setError("Failed to generate briefing. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = lastBriefingDate
    ? new Date(lastBriefingDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="page-container" style={{ paddingTop: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "var(--text-primary)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={18} color="white" />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 900 }}>AI Briefing</h1>
        </div>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
          Powered by Gemini · Your personalized daily financial report
        </p>
      </div>

      {/* Dad Mode Notice */}
      {isDadMode && lastBriefing && (
        <div
          className="card"
          style={{
            padding: "16px",
            background: "var(--text-primary)",
            color: "white",
            border: "none",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            👴 Dad&apos;s Simple Summary
          </div>
          {/* Extract Dad Mode Summary from briefing */}
          <div style={{ fontSize: "16px", lineHeight: 1.6, fontWeight: 500 }}>
            {extractDadSummary(lastBriefing)}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        id="generate-briefing-btn"
        className="btn-primary"
        onClick={generateBriefing}
        disabled={loading}
        style={{ marginBottom: "16px", opacity: loading ? 0.7 : 1 }}
      >
        <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
        {loading ? "Generating Briefing…" : lastBriefing ? "Regenerate Briefing" : "Generate Today's Briefing"}
      </button>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "16px",
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-danger-text)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="card" style={{ padding: "20px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: i === 1 ? "20px" : "14px",
                marginBottom: "10px",
                width: i % 2 === 0 ? "80%" : "100%",
              }}
            />
          ))}
        </div>
      )}

      {/* Briefing Content */}
      {!loading && lastBriefing && (
        <div className="card" style={{ padding: "20px" }}>
          {formattedDate && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "16px",
              padding: "8px 12px",
              background: "var(--bg-muted)",
              borderRadius: "10px",
            }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>
                Last updated: {formattedDate}
              </span>
            </div>
          )}

          <div className="markdown-content">
            {isDadMode ? (
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>Dad Mode Summary</h2>
                <p style={{ fontSize: "16px", lineHeight: 1.8 }}>{extractDadSummary(lastBriefing)}</p>
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lastBriefing}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !lastBriefing && !error && (
        <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</div>
          <div style={{ fontWeight: 800, fontSize: "18px", marginBottom: "8px" }}>
            Ready to Analyze
          </div>
          <div style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "260px", margin: "0 auto" }}>
            Tap the button above to get your personalized Gemini-powered market briefing
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function extractDadSummary(briefing: string): string {
  // Extract Dad Mode Summary section from the markdown
  const match = briefing.match(/\*\*Dad Mode Summary[^*]*\*\*[:\s]*([\s\S]+?)(?=\n#{1,3}|\n\*\*|$)/i);
  if (match) {
    return match[1].trim().replace(/\*\*/g, "");
  }
  // Fallback to first 2 sentences
  const sentences = briefing.replace(/\*\*.*?\*\*:?\s*/g, "").split(/\.\s+/);
  return sentences.slice(0, 2).join(". ").trim() + ".";
}
