import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const ai = new GoogleGenAI({ apiKey });
    
    // We use the available imagen-4.0 model from their key
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-fast-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio: "16:9"
      }
    });

    const b64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!b64) throw new Error("Image generation failed to return bytes.");

    return NextResponse.json({ base64: `data:image/jpeg;base64,${b64}` });

  } catch (error) {
    console.error("Thumbnail gen error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
