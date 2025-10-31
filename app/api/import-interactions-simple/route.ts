import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Simpler import without batching - slower but more reliable
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
    const interactionsRef = db.collection("interactions");

    for (const csvFile of csvFiles) {
      const filePath = path.join(CSV_DIR, csvFile);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      console.log(`Processing ${csvFile}...`);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      // Process in smaller chunks
      const chunkSize = 100;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const promises = chunk.map((row: any) => {
          return interactionsRef.add({
            Drug_A: row.Drug_A,
            Drug_B: row.Drug_B,
            Level: row.Level,
            DDInterID_A: row.DDInterID_A || null,
            DDInterID_B: row.DDInterID_B || null
          });
        });

        await Promise.all(promises);
        totalCount += chunk.length;
        console.log(`  Imported ${totalCount} records so far...`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${totalCount} drug interactions successfully!` 
    }, { status: 200 });

  } catch (e: any) {
    console.error("Import error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
