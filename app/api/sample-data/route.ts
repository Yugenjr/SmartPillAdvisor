import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Sample medicines data
    const sampleMedicines = [
      {
        name: "Paracetamol",
        company: "Pfizer",
        dosage: "500mg",
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        code: "PARA500PF2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Aspirin",
        company: "Bayer",
        dosage: "100mg",
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        code: "ASP100BY2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Ibuprofen",
        company: "Johnson & Johnson",
        dosage: "200mg",
        expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days from now
        purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
        code: "IBU200JJ2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Amoxicillin",
        company: "GSK",
        dosage: "250mg",
        expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (expired)
        purchaseDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
        code: "AMOX250GSK2023",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Vitamin C",
        company: "Nature Made",
        dosage: "1000mg",
        expiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days from now
        purchaseDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        code: "VITC1000NM2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Omeprazole",
        company: "AstraZeneca",
        dosage: "20mg",
        expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now (expiring soon)
        purchaseDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
        code: "OME20AZ2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Cetirizine",
        company: "Dr. Reddy's",
        dosage: "10mg",
        expiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days from now
        purchaseDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
        code: "CET10DR2024",
        userId,
        createdAt: new Date().toISOString()
      },
      {
        name: "Metformin",
        company: "Sun Pharma",
        dosage: "500mg",
        expiryDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000).toISOString(), // 300 days from now
        purchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
        code: "MET500SP2024",
        userId,
        createdAt: new Date().toISOString()
      }
    ];

    // Insert sample medicines
    const result = await db.collection("medicines").insertMany(sampleMedicines);

    return NextResponse.json({
      success: true,
      message: `Added ${result.insertedCount} sample medicines`,
      insertedIds: result.insertedIds
    }, { status: 201 });

  } catch (e: any) {
    console.error("Error creating sample data:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
