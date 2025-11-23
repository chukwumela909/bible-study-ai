import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const translationId = searchParams.get("translationId");

    if (!translationId) {
      return NextResponse.json(
        { error: "translationId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE}/bibles/${translationId}/books`, {
      headers: {
        "api-key": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API.Bible error: ${response.status}`);
    }

    const result = await response.json();
    const books = result.data.map((book: any) => ({
      id: book.id,
      name: book.name,
      abbreviation: book.abbreviation,
    }));

    return NextResponse.json(books);
  } catch (error: any) {
    console.error("Failed to fetch books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
