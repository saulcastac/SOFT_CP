import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_USER_ID } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const operador = await prisma.operador.findUnique({
            where: { id },
        });

        if (!operador || operador.userId !== MOCK_USER_ID) {
            return NextResponse.json(
                { error: "Operador not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(operador);
    } catch (error: any) {
        console.error("Error fetching operador:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch operador" },
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

        const operador = await prisma.operador.update({
            where: { id, userId: MOCK_USER_ID },
            data: {
                nombre: body.nombre,
                apellidoPaterno: body.apellidoPaterno,
                apellidoMaterno: body.apellidoMaterno,
                rfc: body.rfc,
                licencia: body.licencia,
                telefono: body.telefono,
                email: body.email,
                activo: body.activo
            },
        });

        return NextResponse.json(operador);
    } catch (error: any) {
        console.error("Error updating operador:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update operador" },
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

        await prisma.operador.delete({
            where: { id, userId: MOCK_USER_ID },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting operador:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete operador" },
            { status: 500 }
        );
    }
}
