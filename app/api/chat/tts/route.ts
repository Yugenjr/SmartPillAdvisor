import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { text, voice = "alloy" } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

    const client = new Groq({ apiKey });

    // Use Groq's TTS API (if available) or return a helpful error
    try {
      // Groq's TTS API might not be available, let's try a different approach
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'dummy'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'alloy',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS service not available');
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (ttsError) {
      // If TTS is not available, return a helpful message
      console.error("TTS not available:", ttsError);
      return NextResponse.json({
        error: "TTS service temporarily unavailable",
        message: "Text-to-speech is not currently supported through this API. This feature will be available soon!"
      }, { status: 503 });
    }

  } catch (e: any) {
    console.error("TTS API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
