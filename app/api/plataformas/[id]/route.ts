import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const plataforma = await prisma.plataforma.findUnique({
            where: { id },
        });

        if (!plataforma || plataforma.userId !== MOCK_USER_ID) {
            return NextResponse.json(
                { error: "Plataforma not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(plataforma);
    } catch (error: any) {
        console.error("Error fetching plataforma:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch plataforma" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const plataforma = await prisma.plataforma.update({
            where: { id, userId: MOCK_USER_ID },
            data: {
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
        console.error("Error updating plataforma:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update plataforma" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.plataforma.delete({
            where: { id, userId: MOCK_USER_ID },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting plataforma:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete plataforma" },
            { status: 500 }
        );
    }
}
