import { task } from "@trigger.dev/sdk/v3";
import { connectDB } from "../src/lib/db.js";
import ImageGeneration from "../src/models/ImageGeneration.js";
import cloudinary from "../src/lib/cloudinary.js";

const HF_ENDPOINT = process.env.HF_TEXT_TO_IMAGE_ENDPOINT ||
  "https://shashidharak99-text-image.hf.space/run/predict";

export const imageGenerationTask = task({
  id: "image-generation",
  maxDuration: 3600,
  run: async (payload) => {
    const { generationId, prompt } = payload || {};

    await connectDB();

    if (generationId) {
      await ImageGeneration.findByIdAndUpdate(generationId, { status: "running" });
    }

    try {
      const response = await fetch(HF_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: [prompt] }),
      });

      if (!response.ok) {
        throw new Error(`Model API error: ${response.status}`);
      }

      const result = await response.json();
      const base64Data = result?.data?.[0]?.data;
      if (!base64Data) {
        throw new Error("No image data returned by model API");
      }

      const upload = await cloudinary.uploader.upload(base64Data, {
        folder: "learnix/generated",
        resource_type: "image",
      });

      const cloudinaryUrl = upload?.secure_url || upload?.url || "";

      if (generationId) {
        await ImageGeneration.findByIdAndUpdate(generationId, {
          status: "completed",
          cloudinaryUrl,
          error: "",
        });
      }

      return { cloudinaryUrl };
    } catch (error) {
      if (generationId) {
        await ImageGeneration.findByIdAndUpdate(generationId, {
          status: "failed",
          error: error?.message || "Generation failed",
        });
      }

      throw error;
    }
  },
});
