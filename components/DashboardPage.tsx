"use client";
import { usePortfolioStore, Holding } from "@/store/portfolioStore";
import {
  formatINR,
  formatPct,
  getHoldingPnl,
} from "@/lib/formatters";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, ChevronRight, AlertTriangle, Target, X, MessageSquare, History, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function HoldingDetailModal({ 
  holding, 
  onClose 
}: { 
  holding: Holding; 
  onClose: () => void 
}) {
  const [intel, setIntel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { invested, current, pnl, pnlPct } = getHoldingPnl(holding);
  const isProfit = pnl >= 0;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/ai-briefing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [holding.ticker], holdings: [holding] })
        });
        const data = await res.json();
        setIntel(data.briefing);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [holding.id, holding.ticker]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 1000,
      display: "flex",
      alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-base)",
        width: "100%",
        maxWidth: "500px",
        margin: "0 auto",
        maxHeight: "92dvh",
        borderTopLeftRadius: "24px",
        borderTopRightRadius: "24px",
        padding: "24px 20px",
        overflowY: "auto",
        position: "relative",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900 }}>{holding.name}</h2>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginTop: "2px" }}>
              {holding.ticker} · {holding.sector}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-muted)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div className="card" style={{ padding: "16px", background: "var(--bg-muted)" }}>
            <div className="label-muted">Current Value</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatINR(current)}</div>
            <div style={{ color: isProfit ? "var(--color-success-text)" : "var(--color-danger-text)", fontWeight: 800, fontSize: "14px", marginTop: "4px" }}>
              {isProfit ? "+" : ""}{formatINR(pnl)} ({formatPct(pnlPct)})
            </div>
          </div>
          <div className="card" style={{ padding: "16px", background: "var(--bg-muted)" }}>
            <div className="label-muted">Units Held</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{holding.quantity}</div>
            <div className="label-muted" style={{ marginTop: "4px" }}>Avg: {formatINR(holding.averageBuyPrice)}</div>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Market Intel section */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <MessageSquare size={18} color="var(--text-primary)" />
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Market Intel</h3>
            </div>
            <div className="card" style={{ background: "var(--bg-card)", padding: "16px", minHeight: "100px" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="skeleton" style={{ height: "14px", width: "100%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "90%" }} />
                </div>
              ) : (
                <div className="markdown-content" style={{ fontSize: "14px", lineHeight: 1.6 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{intel || "No specific intel available right now."}</ReactMarkdown>
                </div>
              )}
            </div>
          </section>

          {/* Transaction History */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <History size={18} color="var(--text-primary)" />
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Transaction Log</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {holding.transactions?.map(tx => (
                <div key={tx.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "var(--bg-card)",
                  borderRadius: "12px",
                  border: "var(--border-default)"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{tx.type === 'buy' ? 'BOUGHT' : 'SOLD'}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "14px" }}>{formatINR(tx.total)}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                      {tx.quantity} units @ {formatINR(tx.price)}
                    </div>
                  </div>
                </div>
              )) || <div className="label-muted">No transactions found.</div>}
            </div>
          </section>
        </div>

        <button 
          className="btn-primary" 
          onClick={onClose} 
          style={{ marginTop: "32px", width: "100%" }}
        >
          Close Full View
        </button>
      </div>
    </div>
  );
}

function HoldingCard({ holding, onClick }: { holding: Holding; onClick: () => void }) {
  const { invested, current, pnl, pnlPct } = getHoldingPnl(holding);
  const isProfit = pnl >= 0;
  const pnlColor = isProfit ? "var(--color-success-text)" : "var(--color-danger-text)";

  return (
    <div
      className="card fade-up"
      style={{
        padding: "16px",
        marginBottom: "12px",
        cursor: "pointer",
        transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 800 }}>{holding.name}</div>
          <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
            <span className="label-muted">{holding.ticker.replace(".NS", "")}</span>
            <span style={{ fontSize: "10px", fontWeight: 800, background: "var(--bg-muted)", borderRadius: "4px", padding: "1px 5px", color: "var(--text-secondary)" }}>
              {holding.assetType.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: 900 }}>{formatINR(current)}</div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: pnlColor }}>
            {isProfit ? "+" : ""}{formatPct(pnlPct)}
          </div>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" style={{ marginLeft: "12px" }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { holdings, lastSyncTime, updatePrices } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  useEffect(() => {
    if (!lastSyncTime && holdings.length > 0) refreshPrices();
    const interval = setInterval(() => { if (holdings.length > 0) refreshPrices(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [holdings.length]);

  // Calculate totals
  const stocks = holdings.filter(h => h.assetType !== "mutual_fund");
  const mfs = holdings.filter(h => h.assetType === "mutual_fund");

  const calc = (list: Holding[]) => {
    let inv = 0, cur = 0;
    list.forEach(h => {
      const { invested, current } = getHoldingPnl(h);
      inv += invested; cur += current;
    });
    return { inv, cur, pnl: cur - inv, pct: inv > 0 ? ((cur - inv) / inv) * 100 : 0 };
  };

  const stockStats = calc(stocks);
  const mfStats = calc(mfs);
  const grandTotal = stockStats.cur + mfStats.cur;
  const grandInv = stockStats.inv + mfStats.inv;
  const grandPnl = grandTotal - grandInv;
  const grandPnlPct = grandInv > 0 ? (grandPnl / grandInv) * 100 : 0;

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const stockTickers = stocks.map(h => h.ticker);
      const mfIsins = mfs.filter(h => h.isinCode).map(h => h.isinCode!);
      
      const priceMap: Record<string, { price: number; changePct: number }> = {};

      if (stockTickers.length > 0) {
        const res = await fetch(`/api/prices?symbols=${stockTickers.join(",")}`);
        const data = await res.json();
        if (data.data) {
          Object.entries(data.data).forEach(([k, v]: [any, any]) => {
            priceMap[k] = { price: v.price, changePct: v.changePct };
          });
        }
      }

      if (mfIsins.length > 0) {
        const res = await fetch(`/api/mf-nav?isins=${mfIsins.join(",")}`);
        const data = await res.json();
        if (data.data) {
          mfs.forEach(h => {
            const nav = data.data[h.isinCode!];
            if (nav) priceMap[h.ticker] = { price: nav.nav, changePct: 0 };
          });
        }
      }
      updatePrices(priceMap);
    } catch (err) { console.error(err); } 
    finally { setRefreshing(false); }
  };

  return (
    <div className="page-container" style={{ paddingTop: "20px" }}>
      {/* Black Summary Card - Cumulative View */}
      <div className="card" style={{
        padding: "24px",
        marginBottom: "24px",
        background: "var(--text-primary)",
        color: "white",
        border: "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
      }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
          Net Portfolio Value
        </div>
        <div style={{ fontSize: "32px", fontWeight: 900, marginTop: "4px", color: "white" }}>
          {formatINR(grandTotal, true)}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <div style={{ 
            color: grandPnl >= 0 ? "#4ADE80" : "#F87171", 
            fontWeight: 800, 
            fontSize: "15px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            {grandPnl >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
            {grandPnl >= 0 ? "+" : ""}{formatINR(grandPnl, true)} ({formatPct(grandPnlPct)})
          </div>
        </div>

        {/* Breakdown Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div>
            <div className="label-muted" style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={10} /> STOCKS/ETFs
            </div>
            <div style={{ fontWeight: 800, fontSize: "16px" }}>{formatINR(stockStats.cur)}</div>
          </div>
          <div>
            <div className="label-muted" style={{ color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp size={10} /> MUTUAL FUNDS
            </div>
            <div style={{ fontWeight: 800, fontSize: "16px" }}>{formatINR(mfStats.cur)}</div>
          </div>
        </div>

        <button 
          onClick={refreshPrices} 
          disabled={refreshing}
          style={{ 
            marginTop: "20px", width: "100%", background: "rgba(255,255,255,0.1)", border: "none", 
            borderRadius: "10px", color: "white", padding: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" 
          }}
        >
          {refreshing ? "Refreshing Data..." : "Refresh Market Prices"}
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 900 }}>Top Holdings</h2>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>{holdings.length} ASSETS</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {holdings.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>No holdings found.</div>
        ) : (
          holdings.map(h => (
            <HoldingCard key={h.id} holding={h} onClick={() => setSelectedHolding(h)} />
          ))
        )}
      </div>

      {selectedHolding && (
        <HoldingDetailModal holding={selectedHolding} onClose={() => setSelectedHolding(null)} />
      )}
    </div>
  );
}
