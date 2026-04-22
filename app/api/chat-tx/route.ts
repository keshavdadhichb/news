import { NextRequest, NextResponse } from "next/server";

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

If you are unsure about the ticker, provide your best guess based on common NSE/BSE symbols.
If the message is not a transaction, return { "error": "Could not identify a transaction." }`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Message: ${message}` }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        }
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Gemini API Error:", errData);
      throw new Error(`Gemini API failed: ${res.status}`);
    }

    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean JSON formatting from AI response
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Chat parse error:", err);
    return NextResponse.json({ 
      error: "Failed to parse transaction",
      details: err.message 
    }, { status: 500 });
  }
}
