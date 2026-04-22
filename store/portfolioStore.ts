"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AssetType = "stock" | "mutual_fund" | "etf";

export interface Transaction {
  id: string;
  date: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
}

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
  isinCode?: string;
  aiSignal?: "Buy" | "Hold" | "Exit";
  transactions?: Transaction[];
}

export interface PortfolioState {
  holdings: Holding[];
  isAuthenticated: boolean;
  pin: string;
  lastBriefing: string | null;
  lastBriefingDate: string | null;
  lastSyncTime: string | null;

  // Actions
  setAuthenticated: (val: boolean) => void;
  setPin: (pin: string) => void;
  addHolding: (holding: Holding) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  updatePrices: (prices: Record<string, { price: number; changePct: number }>) => void;
  setBriefing: (text: string) => void;
}

const createTx = (qty: number, price: number): Transaction[] => [{
  id: Math.random().toString(36).substr(2, 9),
  date: new Date().toISOString(),
  type: "buy",
  quantity: qty,
  price: price,
  total: qty * price
}];

// Seed real data from images
const SAMPLE_HOLDINGS: Holding[] = [
  // Stocks & ETFs
  {
    id: "h1",
    ticker: "HAL.NS",
    name: "HAL",
    assetType: "stock",
    quantity: 27,
    averageBuyPrice: 4393.71,
    currentPrice: 4401.62,
    daysChangePct: 0,
    sector: "Aerospace",
    transactions: createTx(27, 4393.71)
  },
  {
    id: "h2",
    ticker: "GROWWSLVR.NS",
    name: "Groww Silver ETF",
    assetType: "etf",
    quantity: 1654,
    averageBuyPrice: 24.25,
    currentPrice: 24.18,
    daysChangePct: 0,
    sector: "Commodities",
    transactions: createTx(1654, 24.25)
  },
  {
    id: "h3",
    ticker: "HDFCNSM250.NS",
    name: "HDFC Nifty Smallcap 250 ETF",
    assetType: "etf",
    quantity: 877,
    averageBuyPrice: 44.13,
    currentPrice: 44.09,
    daysChangePct: 0,
    sector: "Smallcap",
    transactions: createTx(877, 44.13)
  },
  {
    id: "h4",
    ticker: "MOM50.NS",
    name: "Motilal Oswal Nifty 50 ETF",
    assetType: "etf",
    quantity: 650,
    averageBuyPrice: 52.73,
    currentPrice: 52.65,
    daysChangePct: 0,
    sector: "Index",
    transactions: createTx(650, 52.73)
  },
  {
    id: "h5",
    ticker: "GROWWDEFNC.NS",
    name: "Groww Nifty India Defence ETF",
    assetType: "etf",
    quantity: 112,
    averageBuyPrice: 89.03,
    currentPrice: 89.25,
    daysChangePct: 0,
    sector: "Defence",
    transactions: createTx(112, 89.03)
  },
  {
    id: "h6",
    ticker: "TATSILV.NS",
    name: "TATSILV",
    assetType: "etf",
    quantity: 6,
    averageBuyPrice: 28.43,
    currentPrice: 23.96,
    daysChangePct: 0,
    sector: "Commodities",
    transactions: createTx(6, 28.43)
  },
  {
    id: "h7",
    ticker: "MON100.NS",
    name: "Motilal Oswal NASDAQ 100 ETF",
    assetType: "etf",
    quantity: 200,
    averageBuyPrice: 289.77,
    currentPrice: 289.77,
    daysChangePct: 0,
    sector: "International",
    transactions: createTx(200, 289.77)
  },
  // Mutual Funds (ISIN based)
  {
    id: "mf1",
    ticker: "INF200K01UY4",
    name: "SBI PSU Direct Plan Growth",
    assetType: "mutual_fund",
    isinCode: "INF200K01UY4",
    quantity: 3769.31,
    averageBuyPrice: 34.49,
    currentPrice: 40.47,
    daysChangePct: 0,
    sector: "PSU",
    transactions: createTx(3769.31, 34.49)
  },
  {
    id: "mf2",
    ticker: "INF209K01Z76",
    name: "Aditya Birla Sun Life PSU Equity",
    assetType: "mutual_fund",
    isinCode: "INF209K01Z76",
    quantity: 8516.68,
    averageBuyPrice: 35.22,
    currentPrice: 41.24,
    daysChangePct: 0,
    sector: "PSU",
    transactions: createTx(8516.68, 35.22)
  },
  {
    id: "mf3",
    ticker: "INF227K01231",
    name: "UTI Gold ETF FoF",
    assetType: "mutual_fund",
    isinCode: "INF227K01231",
    quantity: 2766.07,
    averageBuyPrice: 27.11,
    currentPrice: 29.12,
    daysChangePct: 0,
    sector: "Gold",
    transactions: createTx(2766.07, 27.11)
  },
  {
    id: "mf4",
    ticker: "INF179K01QS3",
    name: "HDFC NIFTY50 Equal Weight",
    assetType: "mutual_fund",
    isinCode: "INF179K01QS3",
    quantity: 5328.07,
    averageBuyPrice: 18.77,
    currentPrice: 18.49,
    daysChangePct: 0,
    sector: "Index",
    transactions: createTx(5328.07, 18.77)
  },
  {
    id: "mf5",
    ticker: "INF200K01642",
    name: "SBI Banking & Financial Services",
    assetType: "mutual_fund",
    isinCode: "INF200K01642",
    quantity: 1955.12,
    averageBuyPrice: 51.15,
    currentPrice: 50.33,
    daysChangePct: 0,
    sector: "Banking",
    transactions: createTx(1955.12, 51.15)
  },
  {
    id: "mf6",
    ticker: "INF666M01AA2",
    name: "JioBlackRock Flexi Cap",
    assetType: "mutual_fund",
    isinCode: "INF666M01AA2",
    quantity: 11047.07,
    averageBuyPrice: 10.07,
    currentPrice: 9.90,
    daysChangePct: 0,
    sector: "Equity",
    transactions: createTx(11047.07, 10.07)
  },
  {
    id: "mf7",
    ticker: "INF767K01011",
    name: "Parag Parikh Flexi Cap",
    assetType: "mutual_fund",
    isinCode: "INF767K01011",
    quantity: 2120.17,
    averageBuyPrice: 94.33,
    currentPrice: 92.19,
    daysChangePct: 0,
    sector: "Equity",
    transactions: createTx(2120.17, 94.33)
  }
];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: SAMPLE_HOLDINGS,
      isAuthenticated: false,
      pin: "1411",
      lastBriefing: null,
      lastBriefingDate: null,
      lastSyncTime: null,

      setAuthenticated: (val) => set({ isAuthenticated: val }),
      setPin: (pin) => set({ pin }),

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
          lastSyncTime: new Date().toISOString(),
        })),

      setBriefing: (text) =>
        set({
          lastBriefing: text,
          lastBriefingDate: new Date().toISOString(),
        }),
    }),
    {
      name: "intelVest-portfolio-v6",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        pin: state.pin,
        lastBriefing: state.lastBriefing,
        lastBriefingDate: state.lastBriefingDate,
        lastSyncTime: state.lastSyncTime,
        // isAuthenticated intentionally NOT persisted
      }),
    }
  )
);
