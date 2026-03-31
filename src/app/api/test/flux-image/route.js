import { NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

function getOutputUrl(output) {
  if (!output) return "";

  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
    if (first?.url && typeof first.url === "function") return first.url();
    return "";
  }

  if (output?.url && typeof output.url === "function") {
    return output.url();
  }

  if (typeof output?.url === "string") {
    return output.url;
  }

  return "";
}

export async function POST(req) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing REPLICATE_API_TOKEN in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const promptUpsampling = body?.prompt_upsampling ?? true;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const replicate = new Replicate({ auth: token });

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt,
        prompt_upsampling: Boolean(promptUpsampling),
      },
    });

    const imageUrl = getOutputUrl(output);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from Replicate" },
        { status: 502 }
      );
    }

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
