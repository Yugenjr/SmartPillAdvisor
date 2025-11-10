import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminApp } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminApp = getAdminApp();
    let decodedToken;
    try {
      decodedToken = await adminApp.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { db } = await connectToDatabase();

    const predictionData = await req.json();
    const prediction = {
      userId,
      ...predictionData,
      createdAt: new Date()
    };

    const result = await db.collection('predictionsforuser').insertOne(prediction);

    return NextResponse.json({
      success: true,
      predictionId: result.insertedId
    });
  } catch (error: any) {
    console.error("User prediction store error:", error);
    return NextResponse.json({
      error: "Failed to store prediction",
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const adminApp = getAdminApp();
    let decodedToken;
    try {
      decodedToken = await adminApp.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { db } = await connectToDatabase();

    const predictions = await db.collection('predictionsforuser')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(predictions);
  } catch (error: any) {
    console.error("User predictions fetch error:", error);
    return NextResponse.json({
      error: "Failed to fetch predictions",
      message: error.message
    }, { status: 500 });
  }
}
