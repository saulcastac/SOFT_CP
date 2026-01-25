import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractCartaPorteData } from "@/lib/extractionService";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get job from database
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        if (job.status !== "RECEIVED") {
            return NextResponse.json(
                { error: "Job is not in RECEIVED status" },
                { status: 400 }
            );
        }

        // Update status to EXTRACTING
        await prisma.job.update({
            where: { id },
            data: { status: "EXTRACTING" },
        });

        // Perform extraction (async, this is a mock so it's quick)
        const extractedData = await extractCartaPorteData(
            job.storagePath || "",
            job.fileType || ""
        );

        // Update job with extracted data and change status to NEEDS_REVIEW
        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                status: "NEEDS_REVIEW",
                extractedJson: JSON.stringify(extractedData),
            },
        });

        return NextResponse.json({
            success: true,
            job: updatedJob,
            message: "Extraction completed successfully",
        });
    } catch (error) {
        console.error("Extraction error:", error);

        // Update job status to FAILED
        const { id } = await params;
        await prisma.job.update({
            where: { id },
            data: { status: "FAILED" },
        });

        return NextResponse.json(
            { error: "Failed to extract data" },
            { status: 500 }
        );
    }
}
