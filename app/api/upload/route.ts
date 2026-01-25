import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filepath = join(process.cwd(), "uploads", filename);

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Create job in database
        const job = await prisma.job.create({
            data: {
                status: "RECEIVED",
                owner: "User",
                storagePath: `uploads/${filename}`,
                fileType: file.type || "application/octet-stream",
            },
        });

        return NextResponse.json({
            success: true,
            job,
            message: "File uploaded successfully"
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
