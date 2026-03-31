import { createAppRoute } from "@trigger.dev/nextjs";
import { imageGenerationTask } from "../../../trigger/imageGeneration.js";
import { tasks } from "@trigger.dev/sdk/v3";

tasks.register?.(imageGenerationTask);

export const { POST } = createAppRoute(tasks);
