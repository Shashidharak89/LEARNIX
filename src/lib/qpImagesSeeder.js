import fs from "fs";
import path from "path";
import { connectDB } from "@/lib/db";
import QPImages from "@/models/QPImages";

export async function seedQPImagesData() {
    try {
        await connectDB();

        console.log("🗑️  Deleting all existing QPImages records...");
        await QPImages.deleteMany({});
        console.log("✓ Deleted all QPImages");

        console.log("\n📸 Seeding QPImages...");

        const qpImagesData = [
            {
                semister: "MCA Semester 1",
                batches: [
                    {
                        batchname: "2022-2024",
                        final: {
                            id: "QP0103",
                            imageurls: {
                                "Research Methodology and Publication Ethics": [
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394145/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/cevfvymouzafh76aedqh.jpg",
                                ],
                                "Advanced Database Systems": [
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394206/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/o6ohsihocrfttggtxkjc.jpg",
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394388/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/gocrxbknhcvomxxacfhm.jpg",
                                ],
                                "Data Structures with Algorithms": [
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394687/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/ekbs7gfdwopcbulnmkma.jpg",
                                ],
                                "Mathematical Foundation for Computer Applications": [
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394790/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/ovrvswrot6t8v8chjpde.jpg",
                                    "https://res.cloudinary.com/ddycnd409/image/upload/v1766394804/users/NN25MCA119/Previous%20year%20Question%20papers/1-Sem%20Exam%20QP%20%5B2022-24%5D/ju47soq5aryotgnuk4kc.jpg",
                                ],
                            },
                            visitlink: ["694908f49095ea0a29bf5b33"],
                        },
                    },
                ]
            }
        ];

        const qpImages = await QPImages.insertMany(qpImagesData);
        console.log(`✓ Seeded ${qpImages.length} QPImages records`);

        console.log("\n✅ QPImages data seeding completed successfully!");
        return {
            success: true,
            message: "QPImages data seeded successfully",
            data: {
                qpImages: qpImages.length
            }
        };
    } catch (error) {
        console.error("Error seeding QPImages data:", error);
        throw error;
    }
}
