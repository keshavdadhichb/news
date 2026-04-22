"use client";
import { useState, useEffect } from "react";
import { usePortfolioStore } from "@/store/portfolioStore";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function PinGateway() {
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState("");
  const { pin, setAuthenticated } = usePortfolioStore();

  useEffect(() => {
    if (hint) {
      const t = setTimeout(() => setHint(""), 1800);
      return () => clearTimeout(t);
    }
  }, [hint]);

  const handleDigit = (digit: string) => {
    if (digit === "⌫") {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (digit === "") return;
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);

    if (next.length === 4) {
      setTimeout(() => {
        if (next === pin) {
          setAuthenticated(true);
        } else {
          setShake(true);
          setHint("Wrong PIN. Try again.");
          setTimeout(() => {
            setShake(false);
            setInput("");
          }, 600);
        }
      }, 100);
    }
  };

  return (
    <div className="pin-gateway">
      {/* Logo */}
      <div className="pin-logo">
        <span className="pin-logo-iv">IV</span>
        <span className="pin-logo-name">IntelVest</span>
      </div>

      <p className="pin-subtitle">Enter your 4-digit PIN to continue</p>

      {/* Dots */}
      <div className={`pin-dots-row ${shake ? "shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`pin-dot ${i < input.length ? "filled" : ""}`}
          />
        ))}
      </div>

      {/* Hint */}
      <div className="pin-hint">{hint}</div>

      {/* Numpad */}
      <div className="pin-numpad">
        {DIGITS.map((d, idx) => (
          <button
            key={idx}
            className={`pin-key ${d === "" ? "pin-key-empty" : ""} ${d === "⌫" ? "pin-key-backspace" : ""}`}
            onClick={() => handleDigit(d)}
            disabled={d === ""}
            aria-label={d === "⌫" ? "Backspace" : d || ""}
          >
            {d}
          </button>
        ))}
      </div>

      <p className="pin-default-hint">Default PIN: 1411</p>

      <style jsx>{`
        .pin-gateway {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100dvh;
          padding: 40px 24px;
          background: var(--bg-base);
          gap: 0;
        }

        .pin-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 32px;
        }

        .pin-logo-iv {
          width: 72px;
          height: 72px;
          background: var(--text-primary);
          color: white;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -1px;
          margin-bottom: 12px;
          box-shadow: var(--shadow-card);
        }

        .pin-logo-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .pin-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 32px;
          text-align: center;
        }

        .pin-dots-row {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          transition: transform 0.1s ease;
        }

        .pin-dots-row.shake {
          animation: shake 0.5s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }

        .pin-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid var(--text-primary);
          background: transparent;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .pin-dot.filled {
          background: var(--text-primary);
          transform: scale(1.1);
        }

        .pin-hint {
          height: 20px;
          font-size: 13px;
          color: var(--color-danger-text);
          font-weight: 600;
          text-align: center;
          margin-bottom: 24px;
        }

        .pin-numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 300px;
        }

        .pin-key {
          height: 72px;
          border-radius: 18px;
          border: var(--border-default);
          background: var(--bg-card);
          box-shadow: var(--shadow-card);
          font-family: var(--font-primary);
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
          -webkit-user-select: none;
          user-select: none;
        }

        .pin-key:active {
          transform: scale(0.94);
          box-shadow: 1px 1px 0px 0px rgba(0,0,0,0.1);
          background: var(--bg-muted);
        }

        .pin-key-empty {
          background: transparent;
          border: none;
          box-shadow: none;
          cursor: default;
        }

        .pin-key-backspace {
          font-size: 20px;
        }

        .pin-default-hint {
          margin-top: 32px;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
