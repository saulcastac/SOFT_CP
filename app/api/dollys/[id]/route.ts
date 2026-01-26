import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const dolly = await prisma.dolly.findUnique({
            where: { id },
        });

        if (!dolly || dolly.userId !== MOCK_USER_ID) {
            return NextResponse.json(
                { error: "Dolly not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(dolly);
    } catch (error: any) {
        console.error("Error fetching dolly:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch dolly" },
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

        const dolly = await prisma.dolly.update({
            where: { id, userId: MOCK_USER_ID },
            data: {
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
        console.error("Error updating dolly:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update dolly" },
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

        await prisma.dolly.delete({
            where: { id, userId: MOCK_USER_ID },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting dolly:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete dolly" },
            { status: 500 }
        );
    }
}
