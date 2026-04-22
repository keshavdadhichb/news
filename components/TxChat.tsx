"use client";
import { useState, useRef, useEffect } from "react";
import { usePortfolioStore, Holding } from "@/store/portfolioStore";
import { Send, Bot, User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/formatters";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  transaction?: any;
}

export default function TxChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! You can tell me about your transactions today in plain English. For example: 'Bought 10 Reliance shares at 2500'. I'll parse it and add it to your dashboard.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addHolding, updateHolding, holdings } = usePortfolioStore();

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: "I couldn't quite catch those details. Could you specify the ticker, quantity, and price?" },
        ]);
      } else {
        const assistantMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: `Got it! You ${data.action.toLowerCase()} ${data.quantity} ${data.name} (${data.ticker}) at ${formatINR(data.price)}.`,
          transaction: data,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        
        // Auto-apply logic
        applyTransaction(data);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Something went wrong with my processing. Try again?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyTransaction = (tx: any) => {
    const existing = holdings.find((h) => h.ticker === tx.ticker);
    
    if (tx.action === "BUY") {
      if (existing) {
        // Update average cost
        const newQty = existing.quantity + tx.quantity;
        const newAvg = (existing.quantity * existing.averageBuyPrice + tx.quantity * tx.price) / newQty;
        updateHolding(existing.id, { quantity: newQty, averageBuyPrice: newAvg });
      } else {
        // Add new
        const newHolding: Holding = {
          id: Date.now().toString(),
          ticker: tx.ticker,
          name: tx.name,
          assetType: tx.assetType ?? "stock",
          quantity: tx.quantity,
          averageBuyPrice: tx.price,
          currentPrice: tx.price,
          daysChangePct: 0,
          lastUpdated: new Date().toISOString(),
        };
        addHolding(newHolding);
      }
    } else if (tx.action === "SELL" && existing) {
       const newQty = Math.max(0, existing.quantity - tx.quantity);
       if (newQty === 0) {
         // Optionally remove, but let's just zero it for now or remove
         // removeHolding(existing.id);
         updateHolding(existing.id, { quantity: 0 });
       } else {
         updateHolding(existing.id, { quantity: newQty });
       }
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", padding: "16px" }}>
      <div 
        ref={scrollRef}
        style={{ flex: 1, overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ 
            display: "flex", 
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            alignItems: "flex-end",
            gap: "8px"
          }}>
            {m.role === "assistant" && (
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                 <Bot size={16} color="white" />
              </div>
            )}
            <div style={{
              maxWidth: "80%",
              padding: "12px 16px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "var(--text-primary)" : "white",
              color: m.role === "user" ? "white" : "var(--text-primary)",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: m.role === "assistant" ? "1px solid rgba(0,0,0,0.06)" : "none"
            }}>
              {m.content}
              {m.transaction && (
                <div style={{ marginTop: "10px", padding: "8px", background: "rgba(0,0,0,0.03)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} color="var(--color-success)" />
                  <span style={{ fontSize: "12px", fontWeight: 700 }}>Reflected in Dashboard</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--text-muted)" }}>
            <Loader2 size={16} className="spin" />
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Gemini is thinking...</span>
          </div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="e.g. Bought 5 TCS at 4000"
          style={{
            width: "100%",
            padding: "16px 50px 16px 20px",
            borderRadius: "16px",
            border: "2px solid rgba(0,0,0,0.06)",
            background: "white",
            fontSize: "15px",
            fontWeight: 500,
            outline: "none",
            transition: "all 0.2s"
          }}
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--text-primary)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1
          }}
        >
          <Send size={18} color="white" />
        </button>
      </div>
    </div>
  );
}
