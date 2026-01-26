import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tractocamion = await prisma.tractocamion.findUnique({
            where: { id },
        });

        if (!tractocamion || tractocamion.userId !== MOCK_USER_ID) {
            return NextResponse.json(
                { error: "Tractocamion not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(tractocamion);
    } catch (error: any) {
        console.error("Error fetching tractocamion:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch tractocamion" },
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

        const tractocamion = await prisma.tractocamion.update({
            where: { id, userId: MOCK_USER_ID },
            data: {
                customId: body.customId,
                marca: body.marca,
                subMarca: body.subMarca || null,
                modelo: body.modelo,
                placa: body.placa,
                kilometrajeInicial: body.kilometrajeInicial ? parseFloat(body.kilometrajeInicial) : null,
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

        return NextResponse.json(tractocamion);
    } catch (error: any) {
        console.error("Error updating tractocamion:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update tractocamion" },
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

        await prisma.tractocamion.delete({
            where: { id, userId: MOCK_USER_ID },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting tractocamion:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete tractocamion" },
            { status: 500 }
        );
    }
}
