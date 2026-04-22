"use client";
import { usePortfolioStore, Holding, Transaction } from "@/store/portfolioStore";
import {
  formatINR,
  formatPct,
  getHoldingPnl,
  generateId
} from "@/lib/formatters";
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, TrendingDown, ChevronRight, X, MessageSquare, History, 
  Search, ArrowUpDown, Plus, LayoutDashboard, Wallet, Briefcase
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const GROWW_GREEN = "#00D09C";
const GROWW_RED = "#EB5B3C";
const GROWW_BG = "#F4F7F7";

/**
 * Add Investment Modal
 */
function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const { addHolding } = usePortfolioStore();
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"stock" | "mutual_fund" | "etf">("stock");

  const handleAdd = () => {
    if (!name || !amount) return;
    const amt = parseFloat(amount);
    // Baseline logic: Start with currentPrice = 1, qty = amount
    // The next refresh will fix the price, but baseline (inv) will be 'amount'
    const newHolding: Holding = {
      id: generateId(),
      name,
      ticker: ticker || name.toUpperCase().replace(/\s+/g, ""),
      assetType: type,
      quantity: amt, // Temporarily 1 unit = 1 Rs for baseline shift
      averageBuyPrice: 1, 
      currentPrice: 1,
      daysChangePct: 0,
      sector: "New",
      transactions: [{
        id: generateId(),
        date: new Date().toISOString(),
        type: "buy",
        quantity: amt,
        price: 1,
        total: amt
      }]
    };
    addHolding(newHolding);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{ background: "white", width: "100%", maxWidth: "400px", borderRadius: "24px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Add Investment</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input className="input-field" placeholder="Asset Name (e.g. Reliance)" value={name} onChange={e => setName(e.target.value)} />
          <input className="input-field" placeholder="Ticker/Symbol (Optional)" value={ticker} onChange={e => setTicker(e.target.value)} />
          <input className="input-field" type="number" placeholder="Amount Invested (₹)" value={amount} onChange={e => setAmount(e.target.value)} />
          <select className="input-field" value={type} onChange={e => setType(e.target.value as any)}>
            <option value="stock">Stock</option>
            <option value="mutual_fund">Mutual Fund</option>
            <option value="etf">ETF</option>
          </select>
          <button onClick={handleAdd} className="btn-primary" style={{ background: GROWW_GREEN, marginTop: "10px" }}>Update Baseline</button>
        </div>
      </div>
    </div>
  );
}

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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        background: "white", width: "100%", maxWidth: "500px", margin: "0 auto",
        maxHeight: "94dvh", borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
        padding: "24px 20px", overflowY: "auto", position: "relative",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ width: "40px", height: "4px", background: "#E0E0E0", borderRadius: "2px", margin: "0 auto 20px auto" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800 }}>{holding.name}</h2>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#999" }}>{holding.ticker} · {holding.sector}</div>
          </div>
          <X onClick={onClose} style={{ cursor: "pointer" }} color="#666" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <div style={{ padding: "16px", borderRadius: "16px", background: GROWW_BG }}>
            <div style={{ fontSize: "11px", color: "#777", fontWeight: 700, marginBottom: "4px" }}>CURRENT VALUE</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatINR(current)}</div>
            <div style={{ color: pnl >= 0 ? GROWW_GREEN : GROWW_RED, fontWeight: 700, fontSize: "14px", marginTop: "4px" }}>
              {formatINR(pnl)} ({formatPct(pnlPct)})
            </div>
          </div>
          <div style={{ padding: "16px", borderRadius: "16px", background: GROWW_BG }}>
            <div style={{ fontSize: "11px", color: "#777", fontWeight: 700, marginBottom: "4px" }}>INVESTED</div>
            <div style={{ fontSize: "20px", fontWeight: 900 }}>{formatINR(invested)}</div>
            <div style={{ fontSize: "11px", color: "#777", fontWeight: 600, marginTop: "4px" }}>Qty: {holding.quantity.toFixed(2)}</div>
          </div>
        </div>

        <section style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <MessageSquare size={18} color={GROWW_GREEN} />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>AI Market Intelligence</h3>
          </div>
          <div style={{ background: "#F9FAFB", padding: "16px", borderRadius: "16px", fontSize: "14px", lineHeight: 1.6 }}>
            {loading ? <div className="skeleton" style={{ height: "60px" }} /> : 
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{intel || "Monitoring market signals for this asset..."}</ReactMarkdown>}
          </div>
        </section>

        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <History size={18} color={GROWW_GREEN} />
            <h3 style={{ fontSize: "16px", fontWeight: 800 }}>Buy History</h3>
          </div>
          {holding.transactions?.map(tx => (
            <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>BOUGHT</div>
                <div style={{ fontSize: "12px", color: "#999" }}>{new Date(tx.date).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "14px" }}>{formatINR(tx.total)}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>{tx.quantity.toFixed(2)} @ {formatINR(tx.price)}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function HoldingRow({ holding, onClick }: { holding: Holding; onClick: () => void }) {
  const { invested, current, pnl, pnlPct } = getHoldingPnl(holding);
  const pnlColor = pnl >= 0 ? GROWW_GREEN : GROWW_RED;

  return (
    <div onClick={onClick} style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", background: "white", cursor: "pointer" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: 800 }}>{holding.name}</div>
        <div style={{ fontSize: "11px", color: "#999", fontWeight: 600, marginTop: "2px" }}>{holding.ticker} · <span style={{ color: "#777" }}>{holding.assetType.toUpperCase()}</span></div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "15px", fontWeight: 800 }}>{formatINR(current)}</div>
        <div style={{ fontSize: "12px", fontWeight: 800, color: pnlColor }}>{formatINR(pnl)} ({formatPct(pnlPct)})</div>
      </div>
      <ChevronRight size={16} color="#DDD" style={{ marginLeft: "12px" }} />
    </div>
  );
}

export default function DashboardPage() {
  const { holdings, updatePrices, lastBriefing, resetBaseline } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "stock" | "mutual_fund" | "etf">("all");
  const [sortBy, setSortBy] = useState<"market_value" | "pnl" | "name">("market_value");

  // Initial Fetch
  useEffect(() => {
    // Only fetch on mount if never fetched before
    if (holdings.length > 0) refreshPrices();
  }, []);

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

      // Trigger high-level AI Summary
      await fetch(`/api/ai-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "summary", holdings })
      });
    } catch (err) { console.error(err); } 
    finally { setRefreshing(false); }
  };

  const totals = useMemo(() => {
    let inv = 0, cur = 0;
    holdings.forEach(h => {
      const { invested, current } = getHoldingPnl(h);
      inv += invested; cur += current;
    });
    return { inv, cur, pnl: cur - inv, pct: inv > 0 ? ((cur - inv) / inv) * 100 : 0 };
  }, [holdings]);

  const filteredItems = useMemo(() => {
    return holdings
      .filter(h => activeTab === "all" || h.assetType === activeTab)
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        const aPnl = getHoldingPnl(a);
        const bPnl = getHoldingPnl(b);
        if (sortBy === "market_value") return bPnl.current - aPnl.current;
        return bPnl.pnl - aPnl.pnl;
      });
  }, [holdings, activeTab, sortBy]);

  return (
    <div style={{ background: "white", minHeight: "100dvh", paddingBottom: "120px" }}>
      {/* Header */}
      <div style={{ padding: "24px 20px 10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 900 }}>Investments</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <div onClick={() => setIsAdding(true)} style={{ width: "36px", height: "36px", borderRadius: "50%", background: GROWW_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Plus size={20} color={GROWW_GREEN} />
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: GROWW_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Search size={18} color="#666" />
          </div>
        </div>
      </div>

      {/* Main Stats Card */}
      <div style={{ padding: "0 20px 24px 20px" }}>
        <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)", border: "1px solid #F0F0F0" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>Current Value</div>
          <div style={{ fontSize: "36px", fontWeight: 900, marginTop: "4px", color: "#222" }}>{formatINR(totals.cur, true)}</div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #F9FAFB" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>TOTAL RETURNS</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: totals.pnl >= 0 ? GROWW_GREEN : GROWW_RED, marginTop: "2px" }}>
                {formatINR(totals.pnl, true)} ({formatPct(totals.pct)})
              </div>
              {/* AI Pulse Summary */}
              {lastBriefing && (
                <div style={{ marginTop: "12px", padding: "10px", background: GROWW_BG, borderRadius: "12px", fontSize: "11px", color: "#444", fontWeight: 600, borderLeft: `3px solid ${GROWW_GREEN}` }}>
                  <TrendingUp size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {lastBriefing.split(". ").slice(0, 2).join(". ")}.
                </div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>INVESTED</div>
                <button 
                  onClick={() => {
                    if(confirm("Confirm Perfect Reset? This will set your current values as the new baseline (Zero Returns).")) {
                      resetBaseline();
                    }
                  }}
                  style={{ fontSize: "9px", background: "none", border: `1px solid ${GROWW_GREEN}`, color: GROWW_GREEN, borderRadius: "4px", padding: "1px 4px", fontWeight: 700, cursor: "pointer" }}
                >
                  SYNC
                </button>
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#222", marginTop: "2px" }}>{formatINR(totals.inv, true)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "24px", padding: "0 20px", marginBottom: "16px", borderBottom: "1px solid #F3F4F6" }}>
        {["all", "stock", "mutual_fund", "etf"].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)} style={{ padding: "12px 2px", background: "transparent", border: "none", fontSize: "14px", fontWeight: 800, color: activeTab === t ? GROWW_GREEN : "#999", borderBottom: activeTab === t ? `3px solid ${GROWW_GREEN}` : "3px solid transparent", cursor: "pointer" }}>
            {t.toUpperCase().replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Sort Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 22px", marginBottom: "10px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666", fontSize: "13px", fontWeight: 700 }}>
          <ArrowUpDown size={14} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ border: "none", background: "none", fontWeight: 700, outline: "none" }}>
            <option value="market_value">Value</option>
            <option value="pnl">Returns</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div style={{ color: "#999", fontSize: "11px", fontWeight: 800 }}>{filteredItems.length} ASSETS</div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filteredItems.map(h => <HoldingRow key={h.id} holding={h} onClick={() => setSelectedHolding(h)} />)}
      </div>

      {/* Modals */}
      {selectedHolding && <HoldingDetailModal holding={selectedHolding} onClose={() => setSelectedHolding(null)} />}
      {isAdding && <AddInvestmentModal onClose={() => setIsAdding(false)} />}

      {/* Update Button */}
      <button onClick={refreshPrices} disabled={refreshing} style={{ 
        position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", 
        background: GROWW_GREEN, color: "white", border: "none", borderRadius: "100px", padding: "14px 28px", 
        fontWeight: 900, boxShadow: "0 10px 25px rgba(0,208,156,0.3)", zIndex: 90, fontSize: "14px"
      }}>
        {refreshing ? "Fetching Market..." : "Update Market Data"}
      </button>
    </div>
  );
}
