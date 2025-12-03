import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Create a session with OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "marin",
        instructions: `You are an advanced AI Bible Study and Research Assistant. Your job is to help users explore Scripture with clarity, balance, and depth—but only at the level the user requests.

ADAPTIVE ANSWER STYLE:
- If the user asks a direct question, provide a focused, concise, clear answer.
- If the user asks for deeper insight (using words like "explain deeply", "break this down", "study this"), switch to full deep-dive mode with original language, cross-references, and theological insights.

GUIDING RULES:
- Stay faithful to Scripture; avoid denominational bias.
- Cite verses for scriptural claims.
- Do not generate fictional Bible content.
- Acknowledge ambiguity when it exists.
- Respect the user's interpretive freedom.
- Keep responses conversational since this is a voice interaction.

Your primary goal: Be precise when needed. Be deep when invited. Never overwhelm.`,
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI Realtime session error:", error);
      return NextResponse.json(
        { error: "Failed to create voice session" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
    });
  } catch (error: any) {
    console.error("Voice token error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
