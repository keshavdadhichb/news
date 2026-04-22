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

    const tickerNames = holdings.map((h: any) => h.name.split(" ")[0]);
    const headlines = await fetchIndianFinanceHeadlines(tickerNames);

    const portfolioSummary = holdings.map((h: any) => 
      `${h.name} (${h.ticker}): ${h.quantity} units @ ${h.currentPrice}. P&L: ${h.daysChangePct}%`
    ).join("\n");

    const prompt = `
      ${SYSTEM_PROMPT}

      Today's Data: ${new Date().toLocaleDateString("en-IN")}
      User Portfolio:
      ${portfolioSummary}

      Top Headlines:
      ${headlines.join("\n")}
    `;

    // Direct fetch to Gemini API for maximum stability
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      }),
      signal: AbortSignal.timeout(8000)
    });

    let text = "No briefing generated.";
    if (res.ok) {
      const data = await res.json();
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    } else {
      // Create a localized backup briefing if API fails
      const pnlTotal = holdings.reduce((acc, h) => acc + ( (h.currentPrice - h.averageBuyPrice) * h.quantity ), 0);
      text = `### Local Portfolio Briefing (Backup Mode)\n\nEnvironment issues detected with Gemini API. However, here is your portfolio pulse:\n\n- **Stability:** Your portfolio is currently reporting a total P&L of **${formatINR(pnlTotal)}**. \n- **Key Asset:** ${holdings.sort((a,b) => (b.currentPrice*b.quantity) - (a.currentPrice*a.quantity))[0]?.name} remains your largest position.\n- **Action:** Monitor the Nasdaq 100 (MON100) for global tech trends. \n\n*Please check your GEMINI_API_KEY settings for full AI insights.*`;
    }

    return NextResponse.json({ briefing: text });
  } catch (err: any) {
    console.error("Detailed AI Briefing Error:", err);
    // Even on structural error, return a graceful 200 with an error message in the body
    return NextResponse.json({ 
      briefing: "### Briefing Service Maintenance\n\nWe are currently experiencing technical difficulties generating your AI briefing. Please try again in 5 minutes.\n\n*Tip: Ensure your network connection is stable.*" 
    });
  }
}

// Minimalist formatINR for fallback
function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);
}
