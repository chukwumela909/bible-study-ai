import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get("translationId");
    const chapterId = searchParams.get("chapterId");

    if (!translationId || !chapterId) {
      return NextResponse.json(
        { error: "Translation ID and Chapter ID are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/chapters/${chapterId}/verses`,
      {
        headers: {
          "api-key": API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const verses = result.data.map((verse: any) => ({
      id: verse.id,
      orgId: verse.orgId,
      reference: verse.reference,
    }));

    return NextResponse.json(verses);
  } catch (error: any) {
    console.error("Failed to fetch verses:", error);
    return NextResponse.json(
      { error: "Failed to fetch verses" },
      { status: 500 }
    );
  }
}
