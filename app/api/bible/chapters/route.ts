import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get("translationId");
    const bookId = searchParams.get("bookId");

    if (!translationId || !bookId) {
      return NextResponse.json(
        { error: "Translation ID and Book ID are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/books/${bookId}/chapters`,
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
    const chapters = result.data.map((chapter: any) => ({
      id: chapter.id,
      number: chapter.number,
      reference: chapter.reference,
    }));

    return NextResponse.json(chapters);
  } catch (error: any) {
    console.error("Failed to fetch chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
