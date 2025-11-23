import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface StudyRequest {
  prompt: string;
  verses: Array<{
    reference: string;
    text: string;
    translation: string;
  }>;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const body: StudyRequest = await request.json();
    const { prompt, verses, conversationHistory = [] } = body;

    if (!prompt || !verses || verses.length === 0) {
      return NextResponse.json(
        { error: "Prompt and verses are required" },
        { status: 400 }
      );
    }

    // Build context from selected verses
    const verseContext = verses
      .map((v) => `${v.reference} (${v.translation}):\n${v.text}`)
      .join("\n\n");

    // System prompt for Bible study guidance
    const systemPrompt = `You are a knowledgeable Bible study assistant. Your role is to help users understand Scripture deeply and accurately.

Guidelines:
- Stay faithful to the biblical text and avoid denominational bias
- Provide historical and cultural context when relevant
- Explain word meanings and original language insights when helpful
- Connect themes across Scripture with cross-references
- Offer practical application while respecting the user's interpretive freedom
- When uncertain, acknowledge limitations and suggest resources
- Structure your response in clear sections: Summary, Key Themes, Word Study (if applicable), Cross References, and Application

Always cite verse references for any claims about Scripture.`;

    const userMessage = `Scripture Context:\n${verseContext}\n\nQuestion: ${prompt}`;

    // Build messages array for OpenAI
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
      { role: "user" as const, content: userMessage },
    ];

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "AI service error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    return NextResponse.json({
      response: aiResponse,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error("Study API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
