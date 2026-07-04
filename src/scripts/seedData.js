// Quick seed script - run directly with: node src/scripts/seedData.js
import { seedQPData } from "@/lib/qpSeeder.js";

async function main() {
    try {
        console.log("🌱 Starting QP data seeding...");
        await seedQPData();
        console.log("✅ Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

main();
