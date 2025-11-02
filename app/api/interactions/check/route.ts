import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    const count = await db.collection("interactions").countDocuments();
    const sample = await db.collection("interactions").find({}).limit(5).toArray();

    return NextResponse.json({
      count,
      sample,
      message: count > 0 ? "Interactions found" : "No interactions in database"
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
