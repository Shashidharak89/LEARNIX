import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export async function POST(req) {
  try {
    const token = process.env.HF_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Missing HF_TOKEN in environment" }, { status: 500 });
    }

    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const steps = toPositiveInt(body?.numInferenceSteps, 5);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const client = new InferenceClient(token);
    const imageBlob = await client.textToImage({
      provider: "nscale",
      model: "stabilityai/stable-diffusion-xl-base-1.0",
      inputs: prompt,
      parameters: { num_inference_steps: steps },
    });

    const imageBuffer = await imageBlob.arrayBuffer();

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": imageBlob.type || "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error?.message || "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}