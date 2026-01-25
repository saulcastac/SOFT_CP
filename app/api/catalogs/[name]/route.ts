import { NextRequest, NextResponse } from "next/server";
import { facturamaService } from "@/lib/facturamaService";

// Map friendly names to Facturama catalog endpoints
const CATALOG_MAP: Record<string, string> = {
    products: "ProductsOrServices",
    units: "Units",
    regimes: "FiscalRegimes",
    states: "FederalEntities",
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get("keyword") || "";

        const catalogEndpoint = CATALOG_MAP[name];

        if (!catalogEndpoint) {
            return NextResponse.json(
                { error: `Unknown catalog: ${name}. Available: ${Object.keys(CATALOG_MAP).join(", ")}` },
                { status: 400 }
            );
        }

        // Build the query URL
        const queryPath = keyword
            ? `${catalogEndpoint}?keyword=${encodeURIComponent(keyword)}`
            : catalogEndpoint;

        const data = await facturamaService.getCatalog(queryPath);

        // Normalize response format
        const normalizedData = Array.isArray(data)
            ? data.map((item: any) => ({
                value: item.Value || item.Name || item.value,
                name: item.Name || item.Description || item.name,
                description: item.Description || item.Name || "",
            }))
            : [];

        return NextResponse.json(normalizedData);
    } catch (error: any) {
        console.error("Catalog fetch error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch catalog" },
            { status: 500 }
        );
    }
}
