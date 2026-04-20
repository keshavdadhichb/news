"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AssetType = "stock" | "mutual_fund" | "etf";

export interface Holding {
  id: string;
  ticker: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  daysChangePct: number;
  stopLoss?: number;
  targetPrice?: number;
  sector?: string;
  lastUpdated?: string;
  // For MFs: isinCode
  isinCode?: string;
  aiSignal?: "Buy" | "Hold" | "Exit";
}

export interface PortfolioState {
  holdings: Holding[];
  isDadMode: boolean;
  isAuthenticated: boolean;
  pin: string;
  lastBriefing: string | null;
  lastBriefingDate: string | null;

  // Actions
  setAuthenticated: (val: boolean) => void;
  setPin: (pin: string) => void;
  setDadMode: (val: boolean) => void;
  addHolding: (holding: Holding) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  updatePrices: (prices: Record<string, { price: number; changePct: number }>) => void;
  setBriefing: (text: string) => void;
}

// Sample initial holdings for demonstration
const SAMPLE_HOLDINGS: Holding[] = [
  {
    id: "1",
    ticker: "RELIANCE.NS",
    name: "Reliance Industries",
    assetType: "stock",
    quantity: 10,
    averageBuyPrice: 2450,
    currentPrice: 2510,
    daysChangePct: 1.2,
    stopLoss: 2300,
    targetPrice: 2800,
    sector: "Energy",
    aiSignal: "Hold",
  },
  {
    id: "2",
    ticker: "HDFCBANK.NS",
    name: "HDFC Bank",
    assetType: "stock",
    quantity: 15,
    averageBuyPrice: 1620,
    currentPrice: 1580,
    daysChangePct: -0.8,
    stopLoss: 1500,
    targetPrice: 1900,
    sector: "Banking",
    aiSignal: "Hold",
  },
  {
    id: "3",
    ticker: "NIFTYBEES.NS",
    name: "Nippon Nifty BeES ETF",
    assetType: "etf",
    quantity: 100,
    averageBuyPrice: 220,
    currentPrice: 232,
    daysChangePct: 0.5,
    stopLoss: 200,
    targetPrice: 260,
    sector: "Index",
    aiSignal: "Buy",
  },
  {
    id: "4",
    ticker: "INF174K01LS2",
    name: "Kotak Flexi Cap Fund",
    assetType: "mutual_fund",
    quantity: 120.5,
    averageBuyPrice: 52,
    currentPrice: 58.3,
    daysChangePct: 0.3,
    sector: "Equity",
    isinCode: "INF174K01LS2",
    aiSignal: "Hold",
  },
  {
    id: "5",
    ticker: "TCS.NS",
    name: "Tata Consultancy Services",
    assetType: "stock",
    quantity: 5,
    averageBuyPrice: 3900,
    currentPrice: 4150,
    daysChangePct: 2.1,
    stopLoss: 3600,
    targetPrice: 4500,
    sector: "IT",
    aiSignal: "Buy",
  },
];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: SAMPLE_HOLDINGS,
      isDadMode: false,
      isAuthenticated: false,
      pin: "1234",
      lastBriefing: null,
      lastBriefingDate: null,

      setAuthenticated: (val) => set({ isAuthenticated: val }),
      setPin: (pin) => set({ pin }),
      setDadMode: (val) => set({ isDadMode: val }),

      addHolding: (holding) =>
        set((state) => ({ holdings: [...state.holdings, holding] })),

      updateHolding: (id, updates) =>
        set((state) => ({
          holdings: state.holdings.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      removeHolding: (id) =>
        set((state) => ({
          holdings: state.holdings.filter((h) => h.id !== id),
        })),

      updatePrices: (prices) =>
        set((state) => ({
          holdings: state.holdings.map((h) => {
            const update = prices[h.ticker];
            if (!update) return h;
            return {
              ...h,
              currentPrice: update.price,
              daysChangePct: update.changePct,
              lastUpdated: new Date().toISOString(),
            };
          }),
        })),

      setBriefing: (text) =>
        set({
          lastBriefing: text,
          lastBriefingDate: new Date().toISOString(),
        }),
    }),
    {
      name: "intelVest-portfolio",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        isDadMode: state.isDadMode,
        pin: state.pin,
        lastBriefing: state.lastBriefing,
        lastBriefingDate: state.lastBriefingDate,
        // isAuthenticated intentionally NOT persisted
      }),
    }
  )
);
