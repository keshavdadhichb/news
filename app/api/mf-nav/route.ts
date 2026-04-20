import { NextRequest, NextResponse } from "next/server";

const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

interface NavEntry {
  schemeCode: string;
  isinGrowth: string;
  isinDividend: string;
  schemeName: string;
  nav: number;
  date: string;
}

async function fetchAmfiNavs(): Promise<NavEntry[]> {
  const res = await fetch(AMFI_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("AMFI feed failed");
  const text = await res.text();
  const lines = text.split("\n");

  const entries: NavEntry[] = [];
  for (const line of lines) {
    const parts = line.split(";");
    if (parts.length < 6) continue;
    const nav = parseFloat(parts[4]);
    if (isNaN(nav)) continue;
    entries.push({
      schemeCode: parts[0]?.trim(),
      isinGrowth: parts[1]?.trim(),
      isinDividend: parts[2]?.trim(),
      schemeName: parts[3]?.trim(),
      nav,
      date: parts[5]?.trim(),
    });
  }
  return entries;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isins = searchParams.get("isins");

  try {
    const allNavs = await fetchAmfiNavs();

    if (isins) {
      const isinList = isins.split(",").map((s) => s.trim());
      const result: Record<string, { nav: number; name: string; date: string }> = {};

      for (const isin of isinList) {
        const match = allNavs.find(
          (e) => e.isinGrowth === isin || e.isinDividend === isin || e.schemeCode === isin
        );
        if (match) {
          result[isin] = {
            nav: match.nav,
            name: match.schemeName,
            date: match.date,
          };
        }
      }
      return NextResponse.json({ data: result });
    }

    // Return count for health check
    return NextResponse.json({ count: allNavs.length, message: "AMFI feed active" });
  } catch (err) {
    console.error("AMFI fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch AMFI NAVs" }, { status: 500 });
  }
}
