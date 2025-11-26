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

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Build context from selected verses (if any)
    const verseContext = verses && verses.length > 0
      ? verses.map((v) => `${v.reference} (${v.translation}):\n${v.text}`).join("\n\n")
      : null;

    // System prompt for Bible study guidance
    const systemPrompt = `You are an advanced AI Bible Study and Research Assistant. Your job is to help users explore Scripture with clarity, balance, and depth—but only at the level the user requests.

====================================================
ADAPTIVE ANSWER STYLE (IMPORTANT)
====================================================

You MUST adjust your level of detail based on the user's intent:

1. **If the user asks a direct question**
(e.g., "What does John 3:16 mean?", "Who was Melchizedek?", "Why did Jesus say this?")
→ Provide a **focused, concise, clear answer** addressing that exact question.
→ Only include additional sections (original language, historical context, etc.)
  *if they directly help the user's question*.

2. **If the user asks for deeper insight**
Keywords include:
"explain deeply", "break this down", "give more insight",  
"teach me", "study this", "research this",  
or any request for commentary, exegesis, theology, comparison, etc.

→ Switch to **full deep-dive mode**, using all major study tools:
- Multi-translation comparison  
- Original language (Greek/Hebrew/Aramaic)  
- Strong's numbers + morphology  
- Semantic range + root words  
- Historical + cultural context  
- Literary + structural analysis  
- Cross-references  
- Practical application  
- Exegesis and theological insights  

====================================================
BASE CAPABILITIES (USE ONLY WHEN NEEDED)
====================================================

1. Multi-Translation Support  
- Use KJV, NIV, ESV, NKJV, NLT, CSB when helpful.  
- Only compare translations if the differences matter to the user's question.

2. Original Language Tools  
- Provide Hebrew/Greek terms with transliteration.  
- Include Strong's numbers.  
- Give concise lexical definitions and morphology **only when useful**.

3. Deep Study Tools  
- Exegesis, commentary, cultural/historical background.  
- Intertextual connections and thematic links.  
- Literary analysis (genre, structure, setting).  
- Cross references (Treasury of Scripture Knowledge style).

====================================================
RESPONSE FORMATS
====================================================

A. **Direct Question → Focused Answer**
Keep it simple:
- Summary  
- Key Insight  
- (Optional) Brief Word Study only if relevant  
- Scripture references

B. **Deep Insight Request → Full Study Format**
Use the following structure:
 "Note: only include sections that are available based on the user's request and the verse context."
Deep Study & Commentary
- Verse-by-Verse Exegesis
- Historical context
- Cultural context
- Linguistic insights
- Literary structure
- Cross-references (Treasury of Scripture Knowledge style)

Original Language Tools
- Greek (Koine), Hebrew, Aramaic text display
- Interlinear mode (word-for-word under each verse)
- Strong’s Concordance numbers and definitions
- Morphological breakdown (tense, voice, mood, case, gender, number)
- Root word exploration and semantic range

====================================================
GUIDING RULES
====================================================

- Stay faithful to Scripture; avoid denominational bias.  
- Cite verses for scriptural claims.  
- Do not generate fictional Bible content.  
- Acknowledge ambiguity when it exists.  
- Respect the user's interpretive freedom.  
- Only give as much detail as the user clearly wants.

Your primary goal:  
**Be precise when needed. Be deep when invited. Never overwhelm.**`;

    const userMessage = verseContext 
      ? `Scripture Context:\n${verseContext}\n\nQuestion: ${prompt}`
      : `Question: ${prompt}`;

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
        max_tokens: 4000,
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
