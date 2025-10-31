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
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log(`Processing ${file.name}...`);
    
    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Found ${records.length} records`);

    let batch = db.batch();
    let batchCount = 0;
    let totalCount = 0;

    for (const row of records) {
      const record = row as any;
      const docRef = db.collection("interactions").doc();
      
      batch.set(docRef, {
        Drug_A: record.Drug_A,
        Drug_B: record.Drug_B,
        Level: record.Level,
        DDInterID_A: record.DDInterID_A || null,
        DDInterID_B: record.DDInterID_B || null
      });

      batchCount++;
      totalCount++;

      if (batchCount >= 400) {
        await batch.commit();
        console.log(`Committed batch at ${totalCount} records`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Imported ${totalCount} records from ${file.name}`);

    return NextResponse.json({ 
      success: true, 
      count: totalCount,
      message: `Imported ${totalCount} records from ${file.name}` 
    }, { status: 200 });

  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
}

export const maxDuration = 300;
