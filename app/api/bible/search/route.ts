import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const translationId = searchParams.get("translationId");

    if (!query || !translationId) {
      return NextResponse.json(
        { error: "query and translationId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/search?query=${encodeURIComponent(query)}&limit=10`,
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
    const verses = result.data.verses || [];
    
    const searchResults = verses.map((verse: any) => ({
      reference: verse.reference,
      text: verse.text.replace(/<[^>]*>/g, ""), // Strip HTML tags
      verseId: verse.id,
    }));

    return NextResponse.json(searchResults);
  } catch (error: any) {
    console.error("Failed to search verse:", error);
    return NextResponse.json(
      { error: "Failed to search verse" },
      { status: 500 }
    );
  }
}
