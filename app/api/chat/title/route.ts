import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

    // Extract conversation text for title generation
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n')
      .slice(0, 2000); // Limit to avoid token limits

    const client = new Groq({ apiKey });
    const titleResponse = await client.chat.completions.create({
      model: "groq/compound",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, descriptive titles for chat conversations. Create a title that is 3-8 words long, captures the main topic or question, and is suitable for a chat history. Focus on the key medical/health topic discussed. Examples: 'Paracetamol Dosage Questions', 'Blood Pressure Medication Concerns', 'Diabetes Management Advice', 'Allergy Medication Options'."
        },
        {
          role: "user",
          content: `Based on this conversation, create a brief, descriptive title (3-8 words):\n\n${conversationText}`
        },
      ],
    });

    const title = titleResponse.choices?.[0]?.message?.content?.trim() || "Medical Chat";

    // Clean up the title (remove quotes, limit length)
    const cleanTitle = title.replace(/^["']|["']$/g, '').slice(0, 50);

    return NextResponse.json({ title: cleanTitle });
  } catch (e: any) {
    console.error("Error generating chat title:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
