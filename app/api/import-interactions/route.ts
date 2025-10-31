import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Define the structure of CSV rows
interface DrugInteractionRow {
  Drug_A: string;
  Drug_B: string;
  Level: string;
  DDInterID_A?: string;
  DDInterID_B?: string;
}

// API route to import drug interactions from CSV files
// Call this once to populate the database
export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ error: "Firestore not configured" }, { status: 500 });
    }

    const CSV_DIR = path.join(process.cwd(), "ddinterpy");
    
    const csvFiles = [
      "ddinter_downloads_code_A.csv",
      "ddinter_downloads_code_B.csv",
      "ddinter_downloads_code_D.csv",
      "ddinter_downloads_code_H.csv",
      "ddinter_downloads_code_L.csv",
      "ddinter_downloads_code_P.csv",
      "ddinter_downloads_code_R.csv",
      "ddinter_downloads_code_V.csv"
    ];

    let totalCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const csvFile of csvFiles) {
      const filePath = path.join(CSV_DIR, csvFile);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      }) as DrugInteractionRow[];

      for (const row of records) {
        const docRef = db.collection("interactions").doc();
        batch.set(docRef, {
          Drug_A: row.Drug_A,
          Drug_B: row.Drug_B,
          Level: row.Level,
          DDInterID_A: row.DDInterID_A || null,
          DDInterID_B: row.DDInterID_B || null
        });

        batchCount++;
        totalCount++;

        // Firestore batch limit is 500
        if (batchCount >= 450) {
          await batch.commit();
          batch = db.batch(); // Create new batch after commit
          batchCount = 0;
        }
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${totalCount} drug interactions` 
    }, { status: 200 });

  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
