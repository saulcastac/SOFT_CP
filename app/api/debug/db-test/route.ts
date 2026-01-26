import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Diagnostic endpoint to verify Turso connection and data
 * Access at: /api/debug/db-test
 */
export async function GET() {
    try {
        // Test 1: Count regímenes fiscales
        const count = await prisma.regimenFiscal.count();

        // Test 2: Get all regímenes
        const regimenes = await prisma.regimenFiscal.findMany({
            select: {
                clave: true,
                descripcion: true,
            },
            take: 5, // Only first 5 for testing
        });

        // Test 3: Database URL info (masked for security)
        const dbUrl = process.env.DATABASE_URL || "";
        const maskedUrl = dbUrl.substring(0, 30) + "..." + dbUrl.substring(dbUrl.length - 10);

        return NextResponse.json({
            success: true,
            database: {
                url: maskedUrl,
                type: dbUrl.startsWith("libsql://") ? "Turso" : dbUrl.startsWith("file:") ? "SQLite Local" : "Unknown",
            },
            regimenFiscal: {
                total: count,
                sample: regimenes,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            database: {
                url: process.env.DATABASE_URL?.substring(0, 30) + "...",
            },
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
