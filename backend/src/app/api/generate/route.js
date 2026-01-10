import { generateEmailTemplates } from "@/lib/gemini";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const templates = await generateEmailTemplates(prompt);

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json(
      { error: "Failed to generate templates" },
      { status: 500 }
    );
  }
}
