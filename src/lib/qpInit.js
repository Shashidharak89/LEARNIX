import { seedQPData } from "@/lib/qpSeeder";

let seedingDone = false;

export async function initializeQPData() {
    if (seedingDone) {
        return;
    }

    try {
        console.log("[QP Init] Starting data initialization...");
        await seedQPData();
        seedingDone = true;
        console.log("[QP Init] Data initialization completed!");
    } catch (error) {
        console.error("[QP Init] Error:", error);
        seedingDone = false;
    }
}
