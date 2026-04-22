import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "AIzaSyDEzuR5NT-n0NYq18VGbYfmL0rKHE0yRig";

const SYSTEM_PROMPT = `You are a world-class financial risk analyst and personalized investment advisor. Your goal is to provide a "Serious Warnings & Opportunities" briefing.

Context Constraints:
1. High-Precision Analysis: Focus exclusively on the user's provided holdings and how current news affects them directly.
2. Serious Tone: Be direct, analytical, and pull no punches. If an investment is at risk, say it clearly.
3. Actionable Insights: Provide specific suggestions (e.g., "Consider tightening stop-loss" or "Sector headwinds detected").
4. Output must be clean Markdown.

Output Requirements:
1. **Critical Alerts & Warnings:** List any serious risks (stop-loss breaches, negative sector news, earnings misses for these specific tickers). Use ⚠️ for high risk.
2. **Real-time News Matrix:** 2-3 bullet points of news specifically relevant to the user's tickers or their sectors.
3. **Strategic Suggestions:** Tactical advice based on today's price action and news.
4. **Portfolio Pulse:** A one-sentence summary of the overall health.

Tone: Serious, professional, and deeply analytical.`;

// Fetch simulated news headlines using a lightweight source
async function fetchIndianFinanceHeadlines(symbols: string[] = []): Promise<string[]> {
  try {
    const symbolQuery = symbols.length > 0 ? `(${symbols.join(" OR ")})` : "Indian Stock Market";
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(symbolQuery + " NSE BSE Finance")}&language=en&pageSize=10&sortBy=publishedAt`,
      { headers: { "X-Api-Key": "demo" }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error("News API failed");
    const data = await res.json();
    return (data.articles ?? []).slice(0, 10).map((a: { title: string }) => a.title);
  } catch {
    // Fall back to static contextual headlines
    return [
      "Market Update: Nifty 50 and Sensex show volatility amid global cues",
      "Banking & Infrastructure sectors lead as FII investment shifts",
      "Regulatory updates: New rules for derivative trading on NSE discussed",
      "Corporate Earnings: Major Indian firms report mixed quarterly results",
      "Macro Update: RBI MPC meeting hints at future interest rate trajectory",
    ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { holdings } = body;

    if (!holdings || !Array.isArray(holdings)) {
      return NextResponse.json({ error: "holdings array required" }, { status: 400 });
    }

    const tickerNames = holdings.map((h: any) => h.name.split(" ")[0]); // Use first word of company name for better news search
    const headlines = await fetchIndianFinanceHeadlines(tickerNames);

    const portfolioData = holdings.map((h: {
      ticker: string;
      name: string;
      quantity: number;
      averageBuyPrice: number;
      currentPrice: number;
      daysChangePct: number;
      stopLoss?: number;
      targetPrice?: number;
      sector?: string;
    }) => ({
      ticker: h.ticker,
      name: h.name,
      quantity: h.quantity,
      average_buy_price: h.averageBuyPrice,
      current_price: h.currentPrice,
      days_change_pct: h.daysChangePct,
      stop_loss: h.stopLoss ?? null,
      target_price: h.targetPrice ?? null,
      sector: h.sector ?? "Unknown",
    }));

    const userMessage = `Today's Date: ${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Portfolio Holdings:
${JSON.stringify(portfolioData, null, 2)}

Today's Top Financial Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Please generate the daily briefing.`;

    const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    const text = response.text || "No briefing generated. Please try again.";

    return NextResponse.json({ briefing: text });
  } catch (err: any) {
    console.error("AI Briefing error details:", err);
    return NextResponse.json({ 
      error: "Failed to generate briefing", 
      details: err.message 
    }, { status: 500 });
  }
}
