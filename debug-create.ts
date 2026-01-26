
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const MOCK_USER_ID = "user_1";

async function main() {
    console.log("Attempting to create Tractocamion...");
    try {
        const tractocamion = await prisma.tractocamion.create({
            data: {
                userId: MOCK_USER_ID,
                customId: `TEST-${Date.now()}`,
                marca: "TestMarca",
                subMarca: "TestSub",
                modelo: "2024",
                placa: `PL-${Date.now()}`, // Unique
                pesoBrutoVehicular: 15000,
                color: "Blanco",
                vin: `VIN-${Date.now()}`,
                configuracionVehicular: "T3S2",
                // Optional fields null
            },
        });
        console.log("Success:", tractocamion);
    } catch (error) {
        console.error("Error creating details:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
