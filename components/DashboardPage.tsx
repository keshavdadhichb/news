"use client";
import { usePortfolioStore, Holding } from "@/store/portfolioStore";
import {
  formatINR,
  formatPct,
  getHoldingPnl,
  isNearBoundary,
  getStopLossProximity,
  getTargetProximity,
} from "@/lib/formatters";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, AlertTriangle, Target } from "lucide-react";

const ASSET_TYPE_LABEL: Record<string, string> = {
  stock: "STOCK",
  mutual_fund: "MF",
  etf: "ETF",
};

const SIGNAL_STYLE: Record<string, string> = {
  Buy: "tag-success",
  Hold: "tag-warning",
  Exit: "tag-danger",
};

function HoldingCard({ holding }: { holding: Holding }) {
  const [expanded, setExpanded] = useState(false);
  const { invested, current, pnl, pnlPct } = getHoldingPnl(holding);
  const isProfit = pnl >= 0;
  const near = isNearBoundary(holding, 5);
  const stopProximity = getStopLossProximity(holding);
  const targetProximity = getTargetProximity(holding);
  const dayChange = holding.daysChangePct;

  const pnlColor = isProfit ? "var(--color-success-text)" : "var(--color-danger-text)";
  const dayColor = dayChange >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)";

  return (
    <div
      className={`card fade-up`}
      style={{
        padding: "16px",
        marginBottom: "12px",
        cursor: "pointer",
        borderLeft: near ? "3px solid var(--color-warning)" : undefined,
      }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-primary)" }}>
              {holding.name}
            </span>
            {near && <AlertTriangle size={14} color="var(--color-warning)" />}
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            <span className="label-muted">{holding.ticker.replace(".NS", "").replace(".BO", "")}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, background: "var(--bg-muted)", borderRadius: "6px", padding: "1px 6px", color: "var(--text-secondary)" }}>
              {ASSET_TYPE_LABEL[holding.assetType]}
            </span>
            {holding.sector && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                {holding.sector}
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="num-md" style={{ color: "var(--text-primary)" }}>
            {formatINR(current)}
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: pnlColor }}>
            {formatPct(pnlPct)} {isProfit ? "↑" : "↓"}
          </div>
        </div>
      </div>

      {/* P&L Row */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "12px",
        padding: "10px 12px",
        background: isProfit ? "var(--color-success-bg)" : "var(--color-danger-bg)",
        borderRadius: "12px",
        flexWrap: "wrap",
      }}>
        <div>
          <div className="label-muted">Invested</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>{formatINR(invested)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="label-muted">P&amp;L</div>
          <div style={{ fontWeight: 800, fontSize: "15px", color: pnlColor }}>
            {isProfit ? "+" : ""}{formatINR(pnl)}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="label-muted">Today</div>
          <div style={{ fontWeight: 700, fontSize: "14px", color: dayColor }}>
            {formatPct(dayChange)}
          </div>
        </div>
      </div>

      {/* AI Signal */}
      {holding.aiSignal && (
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="label-muted">AI SAYS:</span>
          <span className={SIGNAL_STYLE[holding.aiSignal]}>{holding.aiSignal}</span>
        </div>
      )}

      {/* Expanded: Technical Details */}
      {expanded && (
        <div style={{ marginTop: "14px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px" }}>
          {/* Price Info */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div>
              <div className="label-muted">Avg Buy Price</div>
              <div style={{ fontWeight: 700 }}>{formatINR(holding.averageBuyPrice)}</div>
            </div>
            <div>
              <div className="label-muted">CMP</div>
              <div style={{ fontWeight: 700 }}>{formatINR(holding.currentPrice)}</div>
            </div>
            <div>
              <div className="label-muted">Qty</div>
              <div style={{ fontWeight: 700 }}>{holding.quantity}</div>
            </div>
          </div>

          {/* Stop Loss Progress */}
          {holding.stopLoss && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-danger-text)" }}>
                  Stop Loss: {formatINR(holding.stopLoss)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Distance: {(((holding.currentPrice - holding.stopLoss) / holding.currentPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, stopProximity ?? 0))}%`,
                    background: `var(--color-danger)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Target Price Progress */}
          {holding.targetPrice && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-success-text)" }}>
                  <Target size={12} style={{ display: "inline", marginRight: "3px" }} />
                  Target: {formatINR(holding.targetPrice)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Upside: {(((holding.targetPrice - holding.currentPrice) / holding.currentPrice) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, targetProximity ?? 0))}%`,
                    background: `var(--color-success)`,
                  }}
                />
              </div>
            </div>
          )}

          {/* AI Signal */}
          {holding.aiSignal && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span className="label-muted">AI Signal:</span>
              <span className={SIGNAL_STYLE[holding.aiSignal]}>{holding.aiSignal}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
        {expanded ? (
          <ChevronUp size={16} color="var(--text-muted)" />
        ) : (
          <ChevronDown size={16} color="var(--text-muted)" />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { holdings, lastSyncTime, updatePrices } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    // Initial fetch if never synced
    if (!lastSyncTime && holdings.length > 0) {
      refreshPrices();
    }

    const interval = setInterval(() => {
      if (holdings.length > 0) {
        refreshPrices();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [holdings.length]);

  // Calculate portfolio totals
  let totalInvested = 0;
  let totalCurrent = 0;
  holdings.forEach((h) => {
    const { invested, current } = getHoldingPnl(h);
    totalInvested += invested;
    totalCurrent += current;
  });
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isProfit = totalPnl >= 0;

  // Refresh live prices
  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const stocksEtfs = holdings
        .filter((h) => h.assetType !== "mutual_fund")
        .map((h) => h.ticker);
      const mfs = holdings
        .filter((h) => h.assetType === "mutual_fund" && h.isinCode)
        .map((h) => h.isinCode!);

      if (stocksEtfs.length > 0) {
        const res = await fetch(`/api/prices?symbols=${stocksEtfs.join(",")}`);
        const data = await res.json();
        if (data.data) {
          const priceMap: Record<string, { price: number; changePct: number }> = {};
          Object.entries(data.data).forEach(([k, v]: [string, unknown]) => {
            const val = v as { price: number; changePct: number };
            priceMap[k] = { price: val.price, changePct: val.changePct };
          });
          updatePrices(priceMap);
        }
      }

      if (mfs.length > 0) {
        const res = await fetch(`/api/mf-nav?isins=${mfs.join(",")}`);
        const data = await res.json();
        if (data.data) {
          const priceMap: Record<string, { price: number; changePct: number }> = {};
          holdings
            .filter((h) => h.assetType === "mutual_fund" && h.isinCode)
            .forEach((h) => {
              const nav = data.data[h.isinCode!];
              if (nav) {
                priceMap[h.ticker] = { price: nav.nav, changePct: 0 };
              }
            });
          updatePrices(priceMap);
        }
      }
    } catch (err) {
      console.error("Price refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingTop: "20px" }}>
      {/* Portfolio Summary Card */}
      <div
        className="card"
        style={{
          padding: "24px",
          marginBottom: "20px",
          background: "var(--text-primary)",
          color: "white",
          border: "none",
        }}
      >
        <div className="label-muted" style={{ color: "rgba(255,255,255,0.5)" }}>
          Total Portfolio Value
        </div>
        <div className="num-xl" style={{ color: "white", marginTop: "4px" }}>
          {formatINR(totalCurrent, true)}
        </div>

        <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Invested
            </div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>{formatINR(totalInvested, true)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total P&amp;L
            </div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: isProfit ? "#4ADE80" : "#F87171" }}>
              {isProfit ? "+" : ""}{formatINR(totalPnl, true)} ({formatPct(totalPnlPct)})
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {isProfit ? (
              <TrendingUp size={32} color="#4ADE80" />
            ) : (
              <TrendingDown size={32} color="#F87171" />
            )}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={(e) => { e.stopPropagation(); refreshPrices(); }}
          style={{
            marginTop: "16px",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "10px",
            color: "white",
            fontWeight: 600,
            fontSize: "13px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>{refreshing ? "↻ Refreshing…" : "↻ Refresh Prices"}</span>
            {lastSyncTime && (
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                Synced {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Holdings Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800 }}>Your Holdings</h2>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
          {holdings.length} assets
        </span>
      </div>

      {/* Holdings List */}
      {holdings.length === 0 ? (
        <div className="card" style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>No holdings yet</div>
          <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Add your first trade from the Portfolio tab
          </div>
        </div>
      ) : (
        holdings.map((holding) => (
          <HoldingCard key={holding.id} holding={holding} />
        ))
      )}
    </div>
  );
}
