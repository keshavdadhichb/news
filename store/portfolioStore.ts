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
  isFirstSync: boolean; // Flag to force zero-returns on first update

  // Actions
  setAuthenticated: (val: boolean) => void;
  setPin: (pin: string) => void;
  addHolding: (holding: Holding) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  removeHolding: (id: string) => void;
  updatePrices: (prices: Record<string, { price: number; changePct: number }>) => void;
  setBriefing: (text: string) => void;
  resetBaseline: () => void;
  nukeAndReset: () => void;
}

const createTx = (qty: number, price: number): Transaction[] => [{
  id: Math.random().toString(36).substr(2, 9),
  date: new Date().toISOString(),
  type: "buy",
  quantity: qty,
  price: price,
  total: qty * price
}];

const INITIAL_HOLDINGS: Holding[] = [
  { id: "h1", ticker: "HAL.NS", name: "HAL", assetType: "stock", quantity: 26.9382, averageBuyPrice: 4401.05, currentPrice: 4401.05, daysChangePct: 0, sector: "Aerospace", transactions: createTx(26.9382, 4401.05) },
  { id: "h2", ticker: "GROWWSLVR.NS", name: "Groww Silver ETF", assetType: "etf", quantity: 447, averageBuyPrice: 89.47, currentPrice: 89.47, daysChangePct: 0, sector: "Commodities", transactions: createTx(447, 89.47) },
  { id: "h3", ticker: "HDFCNSM250.NS", name: "HDFC Nifty Smallcap 250 ETF", assetType: "etf", quantity: 877.01, averageBuyPrice: 44.09, currentPrice: 44.09, daysChangePct: 0, sector: "Smallcap", transactions: createTx(877.01, 44.09) },
  { id: "h4", ticker: "MOM50.NS", name: "Motilal Oswal Nifty 50 ETF", assetType: "etf", quantity: 134.73, averageBuyPrice: 254.00, currentPrice: 254.00, daysChangePct: 0, sector: "Index", transactions: createTx(134.73, 254.00) },
  { id: "h5", ticker: "GROWWDEFNC.NS", name: "Groww Nifty India Defence", assetType: "etf", quantity: 295.4, averageBuyPrice: 33.84, currentPrice: 33.84, daysChangePct: 0, sector: "Defence", transactions: createTx(295.4, 33.84) },
  { id: "h6", ticker: "TATSILV.NS", name: "Tata Silver ETF", assetType: "etf", quantity: 1.5, averageBuyPrice: 95.34, currentPrice: 95.34, daysChangePct: 0, sector: "Commodities", transactions: createTx(1.5, 95.34) },
  { id: "h7", ticker: "MON100.NS", name: "Motilal Oswal NASDAQ 100", assetType: "etf", quantity: 186.95, averageBuyPrice: 310.00, currentPrice: 310.00, daysChangePct: 0, sector: "Technology", transactions: createTx(186.95, 310.00) },
  { id: "mf1", ticker: "INF200K01UY4", name: "SBI PSU Direct Plan Growth", assetType: "mutual_fund", isinCode: "INF200K01UY4", quantity: 3769.31, averageBuyPrice: 40.47, currentPrice: 40.47, daysChangePct: 0, sector: "PSU", transactions: createTx(3769.31, 40.47) },
  { id: "mf2", ticker: "INF209K01Z76", name: "Aditya Birla Sun Life PSU Equity", assetType: "mutual_fund", isinCode: "INF209K01Z76", quantity: 8516.68, averageBuyPrice: 41.24, currentPrice: 41.24, daysChangePct: 0, sector: "PSU", transactions: createTx(8516.68, 41.24) },
  { id: "mf3", ticker: "INF227K01231", name: "UTI Gold ETF FoF", assetType: "mutual_fund", isinCode: "INF227K01231", quantity: 2766.07, averageBuyPrice: 29.12, currentPrice: 29.12, daysChangePct: 0, sector: "Gold", transactions: createTx(2766.07, 29.12) },
  { id: "mf4", ticker: "INF179K01QS3", name: "HDFC NIFTY50 Equal Weight", assetType: "mutual_fund", isinCode: "INF179K01QS3", quantity: 5328.07, averageBuyPrice: 18.49, currentPrice: 18.49, daysChangePct: 0, sector: "Index", transactions: createTx(5328.07, 18.49) },
  { id: "mf5", ticker: "INF200K01642", name: "SBI Banking & Financial Services", assetType: "mutual_fund", isinCode: "INF200K01642", quantity: 1955.12, averageBuyPrice: 50.33, currentPrice: 50.33, daysChangePct: 0, sector: "Banking", transactions: createTx(1955.12, 50.33) },
  { id: "mf6", ticker: "INF666M01AA2", name: "JioBlackRock Flexi Cap", assetType: "mutual_fund", isinCode: "INF666M01AA2", quantity: 11047.07, averageBuyPrice: 9.90, currentPrice: 9.90, daysChangePct: 0, sector: "Equity", transactions: createTx(11047.07, 9.90) },
  { id: "mf7", ticker: "INF767K01011", name: "Parag Parikh Flexi Cap", assetType: "mutual_fund", isinCode: "INF767K01011", quantity: 2120.17, averageBuyPrice: 92.19, currentPrice: 92.19, daysChangePct: 0, sector: "Equity", transactions: createTx(2120.17, 92.19) }
];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: INITIAL_HOLDINGS,
      isAuthenticated: false,
      pin: "1411",
      lastBriefing: null,
      lastBriefingDate: null,
      lastSyncTime: null,
      isFirstSync: true,

      setAuthenticated: (val) => set({ isAuthenticated: val }),
      setPin: (pin) => set({ pin }),
      addHolding: (holding) => set((state) => ({ holdings: [...state.holdings, holding] })),
      updateHolding: (id, updates) => set((state) => ({
        holdings: state.holdings.map((h) => h.id === id ? { ...h, ...updates } : h),
      })),
      removeHolding: (id) => set((state) => ({ holdings: state.holdings.filter((h) => h.id !== id) })),

      updatePrices: (prices) => set((state) => ({
        holdings: state.holdings.map((h) => {
          const update = prices[h.ticker];
          if (!update) return h;
          const newPrice = update.price;
          // If this is the first sync, set baseline = current price
          const avgPrice = state.isFirstSync ? newPrice : h.averageBuyPrice;
          
          return {
            ...h,
            currentPrice: newPrice,
            averageBuyPrice: avgPrice,
            daysChangePct: update.changePct,
            lastUpdated: new Date().toISOString(),
          };
        }),
        isFirstSync: false,
        lastSyncTime: new Date().toISOString(),
      })),

      setBriefing: (text) => set({ lastBriefing: text, lastBriefingDate: new Date().toISOString() }),

      resetBaseline: () => set((state) => ({
        holdings: state.holdings.map((h) => ({
          ...h,
          averageBuyPrice: h.currentPrice,
          transactions: h.transactions?.map((tx) => ({ ...tx, price: h.currentPrice, total: tx.quantity * h.currentPrice })),
        })),
      })),

      nukeAndReset: () => set({ holdings: INITIAL_HOLDINGS, isFirstSync: true, lastSyncTime: null }),
    }),
    {
      name: "intelVest-portfolio-v10",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        holdings: state.holdings,
        pin: state.pin,
        lastBriefing: state.lastBriefing,
        lastBriefingDate: state.lastBriefingDate,
        lastSyncTime: state.lastSyncTime,
        isFirstSync: state.isFirstSync
      }),
    }
  )
);
