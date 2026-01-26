import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET() {
    try {
        const plataformas = await prisma.plataforma.findMany({
            where: { userId: MOCK_USER_ID },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(plataformas);
    } catch (error: any) {
        console.error("Error fetching plataformas:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch plataformas" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const plataforma = await prisma.plataforma.create({
            data: {
                userId: MOCK_USER_ID,
                customId: body.customId,
                marca: body.marca,
                subMarca: body.subMarca || null,
                modelo: body.modelo,
                placa: body.placa,
                pesoBrutoVehicular: parseFloat(body.pesoBrutoVehicular),
                color: body.color || null,
                vin: body.vin || null,
                ejesTraseros: body.ejesTraseros ? parseInt(body.ejesTraseros) : null,
                configuracionVehicular: body.configuracionVehicular || null,
                subtipoRemolque: body.subtipoRemolque || null,
                aseguradora: body.aseguradora || null,
                numeroPoliza: body.numeroPoliza || null,
                vigenciaPoliza: body.vigenciaPoliza ? new Date(body.vigenciaPoliza) : null,
            },
        });

        return NextResponse.json(plataforma);
    } catch (error: any) {
        console.error("Error creating plataforma:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create plataforma" },
            { status: 500 }
        );
    }
}
