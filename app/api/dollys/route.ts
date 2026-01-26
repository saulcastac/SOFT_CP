import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET() {
    try {
        const dollys = await prisma.dolly.findMany({
            where: { userId: MOCK_USER_ID },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(dollys);
    } catch (error: any) {
        console.error("Error fetching dollys:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch dollys" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const dolly = await prisma.dolly.create({
            data: {
                userId: MOCK_USER_ID,
                customId: body.customId,
                marca: body.marca,
                subMarca: body.subMarca || null,
                modelo: body.modelo,
                pesoBrutoVehicular: parseFloat(body.pesoBrutoVehicular),
                color: body.color || null,
                vin: body.vin || null,
                ejes: body.ejes ? parseInt(body.ejes) : null,
                configuracionVehicular: body.configuracionVehicular || null,
                subtipoRemolque: body.subtipoRemolque || null,
                aseguradora: body.aseguradora || null,
                numeroPoliza: body.numeroPoliza || null,
                vigenciaPoliza: body.vigenciaPoliza ? new Date(body.vigenciaPoliza) : null,
            },
        });

        return NextResponse.json(dolly);
    } catch (error: any) {
        console.error("Error creating dolly:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create dolly" },
            { status: 500 }
        );
    }
}
