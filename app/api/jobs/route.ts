import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// const prisma = new PrismaClient(); // Removed local instance definition

export async function GET() {
    const jobs = await prisma.job.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
    // Mock creation for now, real implementation will handle file upload metadata
    try {
        const body = await req.json();
        const job = await prisma.job.create({
            data: {
                status: "RECEIVED",
                owner: "User",
                // ... other fields
            }
        });
        return NextResponse.json(job);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }
}
