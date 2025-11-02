import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const sessionData = await req.json();

    if (!sessionData.userId || !sessionData.sessionId) {
      return NextResponse.json({ error: "userId and sessionId required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if session already exists
    const existingSession = await db.collection("chatSessions").findOne({
      userId: sessionData.userId,
      sessionId: sessionData.sessionId
    });

    if (!existingSession) {
      // Create new session document
      await db.collection("chatSessions").insertOne({
        userId: sessionData.userId,
        sessionId: sessionData.sessionId,
        title: sessionData.title || "New Chat",
        messages: sessionData.messages || [],
        createdAt: new Date(sessionData.createdAt || Date.now()),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error creating chat session:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, userId, messages, title } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "sessionId and userId required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Update session with new messages and title
    await db.collection("chatSessions").updateMany(
      { userId, sessionId },
      {
        $set: {
          messages: messages || [],
          title: title || "New Chat",
          updatedAt: new Date(),
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error updating chat session:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
