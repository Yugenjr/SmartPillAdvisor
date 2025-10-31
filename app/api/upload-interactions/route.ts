import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { parse } from "csv-parse/sync";

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    let totalCount = 0;
    let batch = db.batch();
    let batchCount = 0;
    const startTime = Date.now();

    for (const file of files) {
      console.log(`Processing ${file.name}...`);
      
      const fileContent = await file.text();
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      console.log(`  Found ${records.length} records in ${file.name}`);

      for (const row of records) {
        const docRef = db.collection("interactions").doc();
        const record = row as any;
        batch.set(docRef, {
          Drug_A: record.Drug_A,
          Drug_B: record.Drug_B,
          Level: record.Level,
          DDInterID_A: record.DDInterID_A || null,
          DDInterID_B: record.DDInterID_B || null
        });

        batchCount++;
        totalCount++;

        // Firestore batch limit is 500, use 400 for safety
        if (batchCount >= 400) {
          console.log(`  Committing batch at ${totalCount} records...`);
          await batch.commit();
          batch = db.batch(); // Create new batch after commit
          batchCount = 0;
        }
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      console.log(`  Committing final batch...`);
      await batch.commit();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Import complete! ${totalCount} records in ${duration}s`);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${totalCount} drug interactions from ${files.length} files in ${duration} seconds!` 
    }, { status: 200 });

  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Increase timeout for this route (Vercel default is 10s)
export const maxDuration = 300; // 5 minutes
