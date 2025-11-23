import { NextResponse } from "next/server";

const API_KEY = process.env.BIBLE_API_KEY || "DGicKIBPAN0D3-aq8aXC_";
const API_BASE = "https://rest.api.bible/v1";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/bibles`, {
      headers: {
        "api-key": API_KEY,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API.Bible error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const translations = result.data.map((bible: any) => ({
      id: bible.id,
      name: bible.name,
      abbreviation: bible.abbreviation || bible.nameLocal,
      language: bible.language.name,
    }));

    return NextResponse.json(translations);
  } catch (error: any) {
    console.error("Failed to fetch translations:", error);
    return NextResponse.json(
      { error: "Failed to fetch translations" },
      { status: 500 }
    );
  }
}
