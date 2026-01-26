import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/emisor - Get the current Emisor profile
 */
export async function GET() {
    try {
        // For MVP, we assume a single Emisor per user
        const emisor = await prisma.emisor.findFirst({
            where: { userId: "user_default" },
        });

        if (!emisor) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({ exists: true, data: emisor });
    } catch (error: unknown) {
        console.error("Error fetching emisor:", error);
        return NextResponse.json(
            { error: "Failed to fetch emisor" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/emisor - Create or update Emisor profile
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { rfc, nombre, regimenFiscal, codigoPostal, calle, numeroExterior, numeroInterior, colonia, municipio, estado } = body;

        // Validate required fields
        if (!rfc || !nombre || !regimenFiscal || !codigoPostal) {
            return NextResponse.json(
                { error: "RFC, Nombre, Régimen Fiscal y Código Postal son requeridos" },
                { status: 400 }
            );
        }

        // Upsert - update if exists, create if not
        const emisor = await prisma.emisor.upsert({
            where: { rfc },
            update: {
                nombre,
                regimenFiscal,
                codigoPostal,
                calle: calle || null,
                numeroExterior: numeroExterior || null,
                numeroInterior: numeroInterior || null,
                colonia: colonia || null,
                municipio: municipio || null,
                estado: estado || null,
            },
            create: {
                rfc,
                nombre,
                regimenFiscal,
                codigoPostal,
                calle: calle || null,
                numeroExterior: numeroExterior || null,
                numeroInterior: numeroInterior || null,
                colonia: colonia || null,
                municipio: municipio || null,
                estado: estado || null,
                userId: "user_default",
            },
        });

        return NextResponse.json({ success: true, data: emisor });
    } catch (error: unknown) {
        console.error("Error saving emisor:", error);
        return NextResponse.json(
            { error: "Failed to save emisor" },
            { status: 500 }
        );
    }
}
