import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");
    const translationId = searchParams.get("translationId");

    if (!chapterId || !translationId) {
      return NextResponse.json(
        { error: "chapterId and translationId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/chapters/${chapterId}?content-type=text`,
      {
        headers: {
          "api-key": API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API.Bible error: ${response.status}`);
    }

    const result = await response.json();
    const chapter = {
      content: result.data.content.replace(/<[^>]*>/g, ""), // Strip HTML
      reference: result.data.reference,
    };

    return NextResponse.json(chapter);
  } catch (error: any) {
    console.error("Failed to fetch chapter:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}
