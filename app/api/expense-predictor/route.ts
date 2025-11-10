import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from '@/lib/firebaseAdmin';
import { connectToDatabase } from "@/lib/mongodb";
import { expensePredictionEngine, MedicineRecord } from "@/lib/expensePrediction";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 });
    }

    let decodedToken;
    try {
      decodedToken = await adminApp.auth().verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decodedToken.uid;

    const { db } = await connectToDatabase();
    const rawMedicines = await db.collection("medicines").find({ userId }).sort({ createdAt: -1 }).toArray();
    const medicines: MedicineRecord[] = rawMedicines.map((doc: any) => ({
      _id: doc._id.toString(),
      name: doc.name,
      dosage: doc.dosage,
      price: doc.price,
      frequency: doc.frequency,
      duration: doc.duration,
      condition: doc.condition,
      severity: doc.severity,
      createdAt: new Date(doc.createdAt),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined,
      purchaseDate: doc.purchaseDate ? new Date(doc.purchaseDate) : undefined,
    }));

    if (medicines.length === 0) {
      return NextResponse.json({
        error: "Insufficient data for expense prediction",
        message: "Add some medicine records to enable expense prediction"
      }, { status: 400 });
    }

    // Process data for prediction
    const predictionData = await expensePredictionEngine.predictExpenses(medicines);

    return NextResponse.json({
      success: true,
      predictions: predictionData.predictions,
      insights: predictionData.insights,
      charts: predictionData.charts,
      confidence: predictionData.confidence
    });

  } catch (error: any) {
    console.error("Expense prediction error:", error);
    return NextResponse.json({
      error: "Failed to generate expense predictions",
      message: error.message
    }, { status: 500 });
  }
}
