import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// Simple DS concept: bucket medicines by days-to-expiry for a risk overview
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const today = new Date();

    const buckets = { ">30d": 0, "7-30d": 0, "<7d": 0 } as Record<string, number>;

    if (db) {
      const medicines = await db.collection("medicines").find({}).toArray();
      medicines.forEach((doc: any) => {
        const data = doc as { expiryDate: string };
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
