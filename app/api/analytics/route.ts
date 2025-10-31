import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";

// Simple DS concept: bucket medicines by days-to-expiry for a risk overview
export async function GET() {
  try {
    const db = getDb();
    const today = new Date();

    const buckets = { ">30d": 0, "7-30d": 0, "<7d": 0 } as Record<string, number>;

    if (db) {
      const snapshot = await db.collection("medicines").get();
      snapshot.forEach((doc) => {
        const data = doc.data() as any;
        const exp = new Date(data.expiryDate);
        const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 30) buckets[">30d"]++;
        else if (diff >= 7) buckets["7-30d"]++;
        else buckets["<7d"]++;
      });
    }

    const labels = Object.keys(buckets);
    const values = labels.map((k) => buckets[k]);

    return NextResponse.json({ risk: { labels, values } });
  } catch {
    // Fallback if DB not configured yet
    return NextResponse.json({ risk: { labels: [">30d", "7-30d", "<7d"], values: [2, 1, 0] } });
  }
}
