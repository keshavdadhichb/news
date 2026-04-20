export interface Holding {
  id: string;
  ticker: string;
  name: string;
  assetType: "stock" | "mutual_fund" | "etf";
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  daysChangePct: number;
  stopLoss?: number;
  targetPrice?: number;
  sector?: string;
  isinCode?: string;
  aiSignal?: "Buy" | "Hold" | "Exit";
}

export function formatINR(value: number, compact = false): string {
  if (compact) {
    if (Math.abs(value) >= 1e7) {
      return `₹${(value / 1e7).toFixed(2)}Cr`;
    }
    if (Math.abs(value) >= 1e5) {
      return `₹${(value / 1e5).toFixed(2)}L`;
    }
    if (Math.abs(value) >= 1e3) {
      return `₹${(value / 1e3).toFixed(1)}K`;
    }
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getHoldingPnl(h: Holding) {
  const invested = h.averageBuyPrice * h.quantity;
  const current = h.currentPrice * h.quantity;
  const pnl = current - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
  return { invested, current, pnl, pnlPct };
}

export function getProximityPct(
  current: number,
  boundary: number,
  reference: number
): number {
  // Returns 0–100 where 100 = at boundary
  const range = Math.abs(boundary - reference);
  if (range === 0) return 100;
  const dist = Math.abs(current - reference);
  return Math.min(100, (dist / range) * 100);
}

export function getStopLossProximity(h: Holding): number | null {
  if (!h.stopLoss) return null;
  return getProximityPct(h.currentPrice, h.stopLoss, h.averageBuyPrice);
}

export function getTargetProximity(h: Holding): number | null {
  if (!h.targetPrice) return null;
  return getProximityPct(h.currentPrice, h.targetPrice, h.averageBuyPrice);
}

export function isNearBoundary(h: Holding, thresholdPct = 5): boolean {
  if (h.stopLoss) {
    const distPct =
      ((h.currentPrice - h.stopLoss) / h.currentPrice) * 100;
    if (Math.abs(distPct) <= thresholdPct) return true;
  }
  if (h.targetPrice) {
    const distPct =
      ((h.targetPrice - h.currentPrice) / h.currentPrice) * 100;
    if (Math.abs(distPct) <= thresholdPct) return true;
  }
  return false;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
