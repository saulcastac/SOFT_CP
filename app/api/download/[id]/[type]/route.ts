import { NextRequest, NextResponse } from "next/server";
import { facturamaService } from "@/lib/facturamaService";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string; type: string }> }
) {
    try {
        const { id, type } = await context.params;

        if (type !== "pdf" && type !== "xml") {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        if (type === "pdf") {
            const pdfBuffer = await facturamaService.downloadPDF(id);

            if (!pdfBuffer) {
                return NextResponse.json({ error: "PDF not found" }, { status: 404 });
            }

            return new NextResponse(pdfBuffer, {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="CFDI_${id}.pdf"`,
                },
            });
        } else {
            const xmlContent = await facturamaService.downloadXML(id);

            if (!xmlContent) {
                return NextResponse.json({ error: "XML not found" }, { status: 404 });
            }

            return new NextResponse(xmlContent, {
                headers: {
                    "Content-Type": "application/xml",
                    "Content-Disposition": `attachment; filename="CFDI_${id}.xml"`,
                },
            });
        }
    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
