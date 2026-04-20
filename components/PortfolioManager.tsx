"use client";
import { useState } from "react";
import { usePortfolioStore, Holding, AssetType } from "@/store/portfolioStore";
import { formatINR, getHoldingPnl, generateId } from "@/lib/formatters";
import { Trash2, Plus, X } from "lucide-react";

const ASSET_TYPES: AssetType[] = ["stock", "etf", "mutual_fund"];
const ASSET_LABELS = { stock: "Stock (NSE/BSE)", etf: "ETF", mutual_fund: "Mutual Fund" };

const SECTORS = [
  "Banking", "IT", "Energy", "Pharma", "FMCG", "Auto",
  "Metals", "Index", "Equity", "Infrastructure", "Telecom", "Other"
];

interface FormState {
  ticker: string;
  name: string;
  assetType: AssetType;
  quantity: string;
  averageBuyPrice: string;
  currentPrice: string;
  stopLoss: string;
  targetPrice: string;
  sector: string;
  isinCode: string;
}

const EMPTY_FORM: FormState = {
  ticker: "",
  name: "",
  assetType: "stock",
  quantity: "",
  averageBuyPrice: "",
  currentPrice: "",
  stopLoss: "",
  targetPrice: "",
  sector: "",
  isinCode: "",
};

function HoldingRow({
  holding,
  onDelete,
}: {
  holding: Holding;
  onDelete: (id: string) => void;
}) {
  const { pnl, pnlPct } = getHoldingPnl(holding);
  const isProfit = pnl >= 0;

  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        marginBottom: "10px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {holding.name}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginTop: "2px" }}>
          {holding.ticker} · {holding.quantity} units · Avg {formatINR(holding.averageBuyPrice)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "14px", color: isProfit ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
          {isProfit ? "+" : ""}
          {pnlPct.toFixed(1)}%
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
          {formatINR(holding.currentPrice, true)}
        </div>
      </div>
      <button
        onClick={() => onDelete(holding.id)}
        style={{
          background: "var(--color-danger-bg)",
          border: "1px solid var(--color-danger)",
          borderRadius: "10px",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-label="Delete holding"
      >
        <Trash2 size={15} color="var(--color-danger-text)" />
      </button>
    </div>
  );
}

export default function PortfolioManager() {
  const { holdings, addHolding, removeHolding } = usePortfolioStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.ticker.trim()) e.ticker = "Ticker is required";
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) e.quantity = "Valid quantity required";
    const avg = parseFloat(form.averageBuyPrice);
    if (isNaN(avg) || avg <= 0) e.averageBuyPrice = "Valid buy price required";
    const cur = parseFloat(form.currentPrice);
    if (isNaN(cur) || cur <= 0) e.currentPrice = "Valid current price required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const newHolding: Holding = {
      id: generateId(),
      ticker: form.ticker.trim().toUpperCase(),
      name: form.name.trim(),
      assetType: form.assetType,
      quantity: parseFloat(form.quantity),
      averageBuyPrice: parseFloat(form.averageBuyPrice),
      currentPrice: parseFloat(form.currentPrice),
      daysChangePct: 0,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : undefined,
      sector: form.sector || undefined,
      isinCode: form.isinCode || undefined,
      aiSignal: "Hold",
    };
    addHolding(newHolding);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const Field = ({
    label,
    field,
    placeholder,
    type = "text",
  }: {
    label: string;
    field: keyof FormState;
    placeholder: string;
    type?: string;
  }) => (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "12px",
          border: errors[field] ? "2px solid var(--color-danger)" : "var(--border-default)",
          background: "var(--bg-card)",
          fontSize: "15px",
          fontWeight: 600,
          fontFamily: "var(--font-primary)",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {errors[field] && (
        <div style={{ fontSize: "12px", color: "var(--color-danger-text)", marginTop: "4px", fontWeight: 600 }}>
          {errors[field]}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container" style={{ paddingTop: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 900 }}>Portfolio</h1>
        <button
          id="add-holding-btn"
          className="btn-primary"
          style={{ width: "auto", padding: "10px 18px", fontSize: "14px" }}
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Add Trade
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div
            style={{
              background: "var(--bg-base)",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px",
              width: "100%",
              maxWidth: "430px",
              margin: "0 auto",
              maxHeight: "90dvh",
              overflowY: "auto",
            }}
          >
            {/* Sheet Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 900 }}>Add New Trade</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <X size={22} color="var(--text-primary)" />
              </button>
            </div>

            {/* Asset Type Selector */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Asset Type
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {ASSET_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((prev) => ({ ...prev, assetType: t }))}
                    style={{
                      flex: 1,
                      padding: "10px 4px",
                      borderRadius: "12px",
                      border: form.assetType === t ? "2px solid var(--text-primary)" : "var(--border-default)",
                      background: form.assetType === t ? "var(--text-primary)" : "var(--bg-card)",
                      color: form.assetType === t ? "white" : "var(--text-secondary)",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "var(--font-primary)",
                    }}
                  >
                    {ASSET_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Asset Name" field="name" placeholder="e.g. Reliance Industries" />
            <Field
              label={form.assetType === "mutual_fund" ? "Scheme / ISIN Code" : "Ticker Symbol"}
              field="ticker"
              placeholder={form.assetType === "stock" ? "e.g. RELIANCE.NS" : form.assetType === "etf" ? "e.g. NIFTYBEES.NS" : "e.g. INF174K01LS2"}
            />
            {form.assetType === "mutual_fund" && (
              <Field label="ISIN Code (Growth)" field="isinCode" placeholder="e.g. INF174K01LS2" />
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Field label="Quantity / Units" field="quantity" placeholder="e.g. 10" type="number" />
              </div>
              <div>
                <Field label="Avg Buy Price (₹)" field="averageBuyPrice" placeholder="e.g. 2450" type="number" />
              </div>
            </div>

            <Field label="Current Price / NAV (₹)" field="currentPrice" placeholder="e.g. 2510" type="number" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Field label="Stop Loss (₹)" field="stopLoss" placeholder="Optional" type="number" />
              </div>
              <div>
                <Field label="Target Price (₹)" field="targetPrice" placeholder="Optional" type="number" />
              </div>
            </div>

            {/* Sector */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sector
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm((prev) => ({ ...prev, sector: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "var(--border-default)",
                  background: "var(--bg-card)",
                  fontSize: "15px",
                  fontWeight: 600,
                  fontFamily: "var(--font-primary)",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Select sector…</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button id="submit-holding-btn" className="btn-primary" onClick={handleSubmit} style={{ marginBottom: "8px" }}>
              <Plus size={18} />
              Add to Portfolio
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Holdings List */}
      {holdings.length === 0 ? (
        <div className="card" style={{ padding: "40px 24px", textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📈</div>
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>No trades yet</div>
          <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Tap &quot;Add Trade&quot; to log your first investment
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
              {holdings.length} {holdings.length === 1 ? "holding" : "holdings"}
            </span>
          </div>
          {holdings.map((h) => (
            <HoldingRow key={h.id} holding={h} onDelete={removeHolding} />
          ))}
        </>
      )}
    </div>
  );
}
