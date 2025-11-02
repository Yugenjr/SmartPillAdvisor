import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('DB_NAME:', process.env.DB_NAME);

    const { db } = await connectToDatabase();

    // Test basic connection
    const collections = await db.collections();
    const collectionNames = collections.map(col => col.collectionName);

    // Check interactions collection specifically
    const interactionsCount = await db.collection("interactions").countDocuments();
    const sampleInteraction = await db.collection("interactions").findOne({});

    // Check users collection
    let usersCount = 0;
    let sampleUser = null;
    try {
      usersCount = await db.collection("users").countDocuments();
      sampleUser = await db.collection("users").findOne({});
    } catch (error) {
      // Users collection might not exist yet, that's okay
      console.log('Users collection not found or empty:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      database: process.env.DB_NAME,
      collections: collectionNames,
      interactionsCount,
      usersCount,
      sampleDocuments: {
        interaction: sampleInteraction ? {
          ...sampleInteraction,
          _id: sampleInteraction._id.toString()
        } : null,
        user: sampleUser ? {
          ...sampleUser,
          _id: sampleUser._id.toString()
        } : null
      },
      connectionString: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@') // Mask credentials
    });

  } catch (error: any) {
    console.error('MongoDB connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        code: error.code,
        codeName: error.codeName,
        connectionString: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')
      }
    }, { status: 500 });
  }
}
