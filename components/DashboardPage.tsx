"use client";
import { usePortfolioStore, Holding } from "@/store/portfolioStore";
import {
  formatINR,
  formatPct,
  getHoldingPnl,
} from "@/lib/formatters";
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, TrendingDown, ChevronRight, X, MessageSquare, History, 
  Search, SlidersHorizontal, ArrowUpDown, LayoutGrid, List
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GROWW_GREEN = "#00D09C";
const GROWW_RED = "#EB5B3C";
const GROWW_BG = "#F4F7F7";

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
      background: "rgba(0,0,0,0.6)",
      zIndex: 1000,
      display: "flex",
      alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: "500px",
        margin: "0 auto",
        maxHeight: "94dvh",
        borderTopLeftRadius: "28px",
        borderTopRightRadius: "28px",
        padding: "24px 20px",
        overflowY: "auto",
        position: "relative",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: "40px", height: "4px", background: "#E0E0E0", borderRadius: "2px", margin: "0 auto 20px auto" }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800 }}>{holding.name}</h2>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginTop: "2px" }}>
              {holding.ticker} · {holding.sector}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", padding: "8px" }}>
            <X size={24} color="#666" />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <div style={{ padding: "16px", borderRadius: "16px", background: GROWW_BG }}>
            <div style={{ fontSize: "12px", color: "#777", fontWeight: 700, marginBottom: "4px" }}>CURRENT VALUE</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatINR(current)}</div>
            <div style={{ color: pnl >= 0 ? GROWW_GREEN : GROWW_RED, fontWeight: 700, fontSize: "14px", marginTop: "4px" }}>
              {formatINR(pnl)} ({formatPct(pnlPct)})
            </div>
          </div>
          <div style={{ padding: "16px", borderRadius: "16px", background: GROWW_BG }}>
            <div style={{ fontSize: "12px", color: "#777", fontWeight: 700, marginBottom: "4px" }}>TOTAL INVESTED</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatINR(invested)}</div>
            <div style={{ fontSize: "12px", color: "#777", fontWeight: 600, marginTop: "4px" }}>Avg: {formatINR(holding.averageBuyPrice)}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <MessageSquare size={18} color={GROWW_GREEN} />
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Market Intel</h3>
            </div>
            <div style={{ background: GROWW_BG, padding: "16px", borderRadius: "16px" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div className="skeleton" style={{ height: "14px", width: "100%" }} />
                  <div className="skeleton" style={{ height: "14px", width: "90%" }} />
                </div>
              ) : (
                <div className="markdown-content" style={{ fontSize: "14px", lineHeight: 1.6, color: "#333" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{intel || "No specific intel available right now."}</ReactMarkdown>
                </div>
              )}
            </div>
          </section>

          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <History size={18} color={GROWW_GREEN} />
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Transaction History</h3>
            </div>
            {holding.transactions?.map(tx => (
              <div key={tx.id} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px",
                borderBottom: "1px solid #F0F0F0"
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px" }}>{tx.type === 'buy' ? 'BOUGHT' : 'SOLD'}</div>
                  <div style={{ fontSize: "12px", color: "#999", fontWeight: 600 }}>{new Date(tx.date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "14px" }}>{formatINR(tx.total)}</div>
                  <div style={{ fontSize: "12px", color: "#999", fontWeight: 600 }}>{tx.quantity} units @ {formatINR(tx.price)}</div>
                </div>
              </div>
            )) || <div style={{ color: "#999" }}>No record.</div>}
          </section>
        </div>

        <button 
          className="btn-primary" 
          onClick={onClose} 
          style={{ marginTop: "40px", width: "100%", background: GROWW_GREEN, border: "none" }}
        >
          Close Full View
        </button>
      </div>
    </div>
  );
}

function HoldingRow({ holding, onClick }: { holding: Holding; onClick: () => void }) {
  const { invested, current, pnl, pnlPct } = getHoldingPnl(holding);
  const pnlColor = pnl >= 0 ? GROWW_GREEN : GROWW_RED;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F0F0F0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        background: "white"
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#222" }}>{holding.name}</div>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>{holding.ticker.replace(".NS", "")}</span>
          <span style={{ fontSize: "9px", fontWeight: 800, background: "#F0F0F0", color: "#666", padding: "1px 4px", borderRadius: "3px" }}>
            {holding.assetType.toUpperCase()}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#222" }}>{formatINR(current)}</div>
        <div style={{ fontSize: "12px", fontWeight: 800, color: pnlColor, marginTop: "2px" }}>
          {formatINR(pnl)} ({formatPct(pnlPct)})
        </div>
      </div>
      <ChevronRight size={16} color="#DDD" style={{ marginLeft: "12px" }} />
    </div>
  );
}

export default function DashboardPage() {
  const { holdings, lastSyncTime, updatePrices } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  
  // UI States
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "stock" | "mutual_fund" | "etf">("all");
  const [sortBy, setSortBy] = useState<"market_value" | "pnl" | "name">("market_value");

  useEffect(() => {
    if (!lastSyncTime && holdings.length > 0) refreshPrices();
    const interval = setInterval(() => { if (holdings.length > 0) refreshPrices(); }, 300000);
    return () => clearInterval(interval);
  }, [holdings.length]);

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      const stocks = holdings.filter(h => h.assetType !== "mutual_fund");
      const mfs = holdings.filter(h => h.assetType === "mutual_fund");
      const priceMap: Record<string, { price: number; changePct: number }> = {};

      if (stocks.length > 0) {
        const res = await fetch(`/api/prices?symbols=${stocks.map(h => h.ticker).join(",")}`);
        const data = await res.json();
        if (data.data) {
          Object.entries(data.data).forEach(([k, v]: [any, any]) => {
            priceMap[k] = { price: v.price, changePct: v.changePct };
          });
        }
      }

      if (mfs.length > 0) {
        const res = await fetch(`/api/mf-nav?isins=${mfs.map(h => h.isinCode).join(",")}`);
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

  const filteredHoldings = useMemo(() => {
    return holdings
      .filter(h => {
        if (activeTab !== "all" && h.assetType !== activeTab) return false;
        if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.ticker.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const aPnl = getHoldingPnl(a);
        const bPnl = getHoldingPnl(b);
        if (sortBy === "market_value") return bPnl.current - aPnl.current;
        if (sortBy === "pnl") return bPnl.pnl - aPnl.pnl;
        return 0;
      });
  }, [holdings, activeTab, search, sortBy]);

  const totals = useMemo(() => {
    let inv = 0, cur = 0;
    holdings.forEach(h => {
      const { invested, current } = getHoldingPnl(h);
      inv += invested; cur += current;
    });
    return { inv, cur, pnl: cur - inv, pct: inv > 0 ? ((cur - inv) / inv) * 100 : 0 };
  }, [holdings]);

  return (
    <div style={{ background: "white", minHeight: "100dvh", paddingBottom: "100px" }}>
      {/* Groww Header */}
      <div style={{ padding: "20px 20px 10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#222" }}>Investments</h1>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: GROWW_BG, display: "flex", alignItems: "center", justifyItems: "center" }}>
          <Search size={18} style={{ margin: "0 auto" }} />
        </div>
      </div>

      {/* Summary Card - Groww White Style */}
      <div style={{ padding: "0 20px 24px 20px" }}>
        <div style={{ 
          background: "white", 
          borderRadius: "24px", 
          padding: "24px", 
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid #F0F0F0"
        }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>Current Value</div>
          <div style={{ fontSize: "36px", fontWeight: 900, marginTop: "4px", color: "#222" }}>{formatINR(totals.cur)}</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F8F8F8" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>TOTAL RETURNS</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: totals.pnl >= 0 ? GROWW_GREEN : GROWW_RED, marginTop: "2px" }}>
                {formatINR(totals.pnl)} ({formatPct(totals.pct)})
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>INVESTED VALUE</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#222", marginTop: "2px" }}>{formatINR(totals.inv)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "24px", 
        padding: "0 20px", 
        marginBottom: "20px",
        borderBottom: "1px solid #F0F0F0"
      }}>
        {["all", "stock", "mutual_fund", "etf"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t as any)}
            style={{
              padding: "12px 2px",
              background: "transparent",
              border: "none",
              fontSize: "14px",
              fontWeight: 800,
              color: activeTab === t ? GROWW_GREEN : "#999",
              borderBottom: activeTab === t ? `3px solid ${GROWW_GREEN}` : "3px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {t.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Sorting / Controls */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        padding: "0 20px", 
        marginBottom: "12px",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666", fontSize: "13px", fontWeight: 700 }}>
          <ArrowUpDown size={14} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ border: "none", background: "none", fontWeight: 700, color: "#222", outline: "none" }}
          >
            <option value="market_value">Market Value</option>
            <option value="pnl">Total Returns</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
        <div style={{ color: "#999", fontSize: "11px", fontWeight: 800 }}>
          {filteredHoldings.length} {filteredHoldings.length === 1 ? "ITEM" : "ITEMS"}
        </div>
      </div>

      {/* Holdings List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filteredHoldings.map(h => (
          <HoldingRow key={h.id} holding={h} onClick={() => setSelectedHolding(h)} />
        ))}
      </div>

      {selectedHolding && (
        <HoldingDetailModal holding={selectedHolding} onClose={() => setSelectedHolding(null)} />
      )}

      {/* Refresh Floating Button */}
      <button
        onClick={refreshPrices}
        disabled={refreshing}
        style={{
          position: "fixed",
          bottom: "100px",
          right: "24px",
          background: GROWW_GREEN,
          color: "white",
          border: "none",
          borderRadius: "100px",
          padding: "12px 20px",
          fontWeight: 900,
          boxShadow: "0 10px 20px rgba(0,208,156,0.25)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 90,
          fontSize: "13px"
        }}
      >
        <TrendingUp size={16} />
        {refreshing ? "Updating..." : "Market Update"}
      </button>
    </div>
  );
}
