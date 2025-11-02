import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get all chat sessions for this user, sorted by creation date
    const sessions = await db.collection("chatSessions")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    // Group by sessionId and get the latest message for each session
    const sessionMap = new Map();

    for (const chat of sessions) {
      const sessionId = chat.sessionId;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          sessionId,
          title: chat.userMessage?.slice(0, 50) || "New Chat",
          messages: [],
          createdAt: chat.createdAt,
          userId: chat.userId,
        });
      }
    }

    // For each session, get all messages and sort them
    for (const session of sessionMap.values()) {
      const sessionChats = sessions
        .filter(chat => chat.sessionId === session.sessionId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      session.messages = sessionChats.map(chat => ({
        role: "user",
        content: chat.userMessage,
        timestamp: new Date(chat.createdAt).getTime(),
      }));

      // Add AI responses
      sessionChats.forEach(chat => {
        if (chat.aiResponse) {
          session.messages.push({
            role: "assistant",
            content: chat.aiResponse,
            timestamp: new Date(chat.createdAt).getTime() + 1000, // Add 1 second for AI response
          });
        }
      });
    }

    const result = Array.from(sessionMap.values());

    return NextResponse.json({ sessions: result });
  } catch (e: any) {
    console.error("Error fetching chat sessions:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

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
      // Create new session document (this will be updated with messages later)
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
