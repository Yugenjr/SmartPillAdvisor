import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const drugList: { name: string }[] = body.drugList || [];

    console.log('=== INTERACTIONS API DEBUG ===');
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Drug list:', drugList);

    if (!drugList || drugList.length < 2) {
      console.log('ERROR: Not enough drugs provided');
      return NextResponse.json({ error: "At least 2 drugs required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    if (!db) {
      console.log('ERROR: Database connection failed');
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Check total interactions in DB
    const totalCount = await db.collection("interactions").countDocuments();
    console.log('Total interactions in database:', totalCount);

    if (totalCount === 0) {
      console.log('WARNING: No interactions in database!');
      return NextResponse.json({
        interactions: [],
        success: true,
        debug: {
          totalInDB: 0,
          message: "No interaction data in database. Please upload data using MongoDB Compass."
        }
      });
    }

    const interactions: any[] = [];

    // Check all pairs of drugs
    for (let i = 0; i < drugList.length; i++) {
      for (let j = i + 1; j < drugList.length; j++) {
        // Clean and normalize drug names
        const drug1 = drugList[i].name.trim().toLowerCase();
        const drug2 = drugList[j].name.trim().toLowerCase();

        console.log(`Searching for: "${drug1}" + "${drug2}"`);

        // Improved query with better regex and exact matches
        const query = {
          $or: [
            {
              $and: [
                { Drug_A: { $regex: `^${drug1}$`, $options: 'i' } },
                { Drug_B: { $regex: `^${drug2}$`, $options: 'i' } }
              ]
            },
            {
              $and: [
                { Drug_A: { $regex: `^${drug2}$`, $options: 'i' } },
                { Drug_B: { $regex: `^${drug1}$`, $options: 'i' } }
              ]
            }
          ]
        };

        console.log('Query:', JSON.stringify(query, null, 2));

        const results = await db.collection("interactions").find(query).limit(50).toArray();

        console.log(`Found ${results.length} interactions for this pair`);

        if (results.length > 0) {
          console.log('Sample result:', JSON.stringify(results[0], null, 2));
        }

        interactions.push(...results);
      }
    }

    // Sort by severity
    const levelToInt: Record<string, number> = { Major: 0, Moderate: 1, Minor: 2, Unknown: 3 };
    interactions.sort((a, b) => (levelToInt[a.Level] ?? 9) - (levelToInt[b.Level] ?? 9));

    // Remove duplicates based on drug pair and description
    const seen = new Set<string>();
    const uniqueInteractions = interactions.filter(interaction => {
      const key = `${interaction.Drug_A}-${interaction.Drug_B}-${interaction.Level}-${interaction.Description || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Total interactions found: ${interactions.length}, unique: ${uniqueInteractions.length}`);
    console.log('=== END DEBUG ===');

    return NextResponse.json({
      interactions: uniqueInteractions,
      success: true,
      debug: {
        totalInDB: totalCount,
        drugsSearched: drugList.map(d => d.name),
        found: interactions.length,
        unique: uniqueInteractions.length
      }
    }, { status: 200 });
  } catch (e: any) {
    console.error('Interactions API error:', e);
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
}
