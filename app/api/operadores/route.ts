import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const operadores = await prisma.operador.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(operadores);
    } catch (error: any) {
        console.error("Error fetching operadores:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch operadores" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Auto-generate Custom ID
        const lastOperador = await prisma.operador.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        let newIdNumber = 1;
        if (lastOperador && lastOperador.customId) {
            const match = lastOperador.customId.match(/OP-(\d+)/);
            if (match) {
                newIdNumber = parseInt(match[1]) + 1;
            }
        }

        const customId = `OP-${newIdNumber.toString().padStart(3, '0')}`;

        const operador = await prisma.operador.create({
            data: {
                customId,
                nombre: body.nombre,
                apellidoPaterno: body.apellidoPaterno,
                apellidoMaterno: body.apellidoMaterno || null,
                // Optional fields
                rfc: body.rfc || null,
                licencia: body.licencia || null,
                telefono: body.telefono || null,
                email: body.email || null,
                activo: true
            },
        });

        return NextResponse.json(operador);
    } catch (error: any) {
        console.error("Error creating operador:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create operador" },
            { status: 500 }
        );
    }
}
