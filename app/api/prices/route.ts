import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const tickers = symbols.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const results: Record<string, { price: number; changePct: number; name: string }> = {};

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const quote = await yahooFinance.quote(ticker, {}, { validateResult: false });
          results[ticker] = {
            price: quote.regularMarketPrice ?? 0,
            changePct: quote.regularMarketChangePercent ?? 0,
            name: quote.shortName ?? ticker,
          };
        } catch {
          results[ticker] = { price: 0, changePct: 0, name: ticker };
        }
      })
    );

    return NextResponse.json({ data: results }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("Price fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
