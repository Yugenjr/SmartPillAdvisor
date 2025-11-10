import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    const medicines = await db.collection('predictions').find({}).sort({ name: 1 }).toArray();

    return NextResponse.json(medicines);
  } catch (error: any) {
    console.error("Predictions fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch predictions",
      message: error.message
    }, { status: 500 });
  }
}
