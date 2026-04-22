import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "AIzaSyDEzuR5NT-n0NYq18VGbYfmL0rKHE0yRig";

const SYSTEM_PROMPT = `You are a financial parsing engine. Your job is to extract transaction details from a user's plain English message.

Supported Actions: "BUY", "SELL"

Output Format: You MUST output ONLY a JSON object with this structure:
{
  "action": "BUY" | "SELL",
  "ticker": "STOCK_SYMBOL.NS" (Must append .NS for Indian stocks if not provided),
  "quantity": number,
  "price": number,
  "assetType": "stock" | "mutual_fund",
  "name": "Full Name of Asset"
}

Common Patterns:
- "Bought 10 Reliance at 2500" -> { "action": "BUY", "ticker": "RELIANCE.NS", "quantity": 10, "price": 2500, "assetType": "stock", "name": "Reliance Industries" }
- "Sold 5 units of HDFC Bank for 1600 each" -> { "action": "SELL", "ticker": "HDFCBANK.NS", "quantity": 5, "price": 1600, "assetType": "stock", "name": "HDFC Bank" }

If you are unsure about the ticker, provide your best guess based on common NSE/BSE symbols.
If the message is not a transaction, return { "error": "Could not identify a transaction." }`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const result = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
      },
    });

    const responseText = result.text ?? "{}";
    const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ""));

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Chat parse error:", err);
    return NextResponse.json({ error: "Failed to parse transaction" }, { status: 500 });
  }
}
