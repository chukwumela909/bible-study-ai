import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verseId = searchParams.get("verseId");
    const translationId = searchParams.get("translationId");

    if (!verseId || !translationId) {
      return NextResponse.json(
        { error: "verseId and translationId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/verses/${verseId}?content-type=text`,
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
    const verse = {
      id: result.data.id,
      reference: result.data.reference,
      content: result.data.content.replace(/<[^>]*>/g, ""), // Strip HTML
      copyright: result.data.copyright,
    };

    return NextResponse.json(verse);
  } catch (error: any) {
    console.error("Failed to fetch verse:", error);
    return NextResponse.json(
      { error: "Failed to fetch verse" },
      { status: 500 }
    );
  }
}
