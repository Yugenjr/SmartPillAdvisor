import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const drugList: { name: string }[] = body.drugList || [];
    
    console.log('Checking interactions for:', drugList.map(d => d.name));
    
    if (!drugList || drugList.length < 2) {
      return NextResponse.json({ error: "At least 2 drugs required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('Database connection failed');
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const interactions: any[] = [];

    // Check all pairs of drugs
    for (let i = 0; i < drugList.length; i++) {
      for (let j = i + 1; j < drugList.length; j++) {
        const drug1 = drugList[i].name.trim();
        const drug2 = drugList[j].name.trim();

        console.log(`Searching: ${drug1} + ${drug2}`);

        // Query MongoDB for interactions (check both directions)
        const results = await db.collection("interactions").find({
          $or: [
            { Drug_A: { $regex: drug1, $options: 'i' }, Drug_B: { $regex: drug2, $options: 'i' } },
            { Drug_A: { $regex: drug2, $options: 'i' }, Drug_B: { $regex: drug1, $options: 'i' } }
          ]
        }).limit(50).toArray();

        console.log(`Found ${results.length} interactions`);
        interactions.push(...results);
      }
    }

    // Sort by severity
    const levelToInt: Record<string, number> = { Major: 0, Moderate: 1, Minor: 2, Unknown: 3 };
    interactions.sort((a, b) => (levelToInt[a.Level] ?? 9) - (levelToInt[b.Level] ?? 9));

    console.log(`Total interactions found: ${interactions.length}`);
    return NextResponse.json({ interactions, success: true }, { status: 200 });
  } catch (e: any) {
    console.error('Interactions API error:', e);
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
}
