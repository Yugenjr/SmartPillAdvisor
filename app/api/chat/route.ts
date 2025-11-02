import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { message, userId, sessionId } = await req.json();
    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

    const client = new Groq({ apiKey });
    const chat = await client.chat.completions.create({
      model: "groq/compound",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an intelligent, empathetic medical assistant designed to help users with accurate, clear, and safe advice regarding their medicines and health conditions. Always respond with kindness, clear explanations, and encourage users to consult healthcare professionals for serious or urgent issues. Avoid giving medical diagnoses or prescribing treatments but provide helpful information about medicine usage, drug interactions, side effects, symptoms, and general health guidance based on trusted medical knowledge. Use simple language and provide supportive, respectful answers to build user trust and ensure safety."
        },
        { role: "user", content: message },
      ],
    });

    const text = chat.choices?.[0]?.message?.content || "";

    // Save chat to MongoDB if userId provided
    if (userId) {
      try {
        const { db } = await connectToDatabase();
        const chatData = {
          userId,
          sessionId: sessionId || `session_${Date.now()}`,
          userMessage: message,
          aiResponse: text,
          createdAt: new Date(),
        };

        await db.collection("chatSessions").insertOne(chatData);
      } catch (dbError) {
        console.error("MongoDB save error:", dbError);
        // Continue without saving to database, don't fail the request
      }
    }

    return NextResponse.json({ reply: text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
