import { NextRequest, NextResponse } from "next/server";
import { facturamaService } from "@/lib/facturamaService";

// Map frontend catalog names to Facturama API catalog names
const CATALOG_MAP: Record<string, string> = {
    products: "ProductsOrServices", // Or "CartaPorte/ClaveProdServCP" if available
    units: "Units",
    regimes: "FiscalRegimes",
    states: "States",
    countries: "Countries",
    municipalities: "Municipalities", // Needs state
    localities: "Localities",
    neighborhoods: "Neighborhoods",
};

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;
    const searchParams = req.nextUrl.searchParams;
    const keyword = searchParams.get("keyword");

    // Determine Facturama catalog name
    const facturamaName = CATALOG_MAP[name] || name;

    try {
        let data = [];

        // Specific handling for complex catalogs
        if (name === "states") {
            // States usually requires a country. Default to Mexico if not specified
            // Note: facturamaService.getCatalog takes a single string name. 
            // If the API expects query params, we might need to modify the service or append them here if the service allows.
            // Assuming facturamaService handles standard catalogs. 
            // If we need query params, we might need to handle it.
            // Facturama API: GET /catalogs/States?country=MEX
            // But strict url encoding in service might prevent "States?country=MEX"
            // Let's assume for now default is used or we can't easily pass it without changing service.
            // However, "States" usually returns all or requires country.
            // Let's try passing "States?country=MEX" to the service if it just appends it.
            data = await facturamaService.getCatalog("States?country=MEX");
        }
        else if (name === "products" && keyword) {
            // Search products
            data = await facturamaService.getCatalog(`ProductsOrServices?keyword=${encodeURIComponent(keyword)}`);
        }
        else {
            data = await facturamaService.getCatalog(facturamaName);
        }

        // Transform data if needed to match {value, name} format expected by frontend
        // Facturama returns { Value, Name, ... } usually (PascalCase)
        const transformedData = data.map((item: any) => ({
            value: item.Value || item.value || item.Id,
            name: item.Name || item.name || item.Description,
            description: item.Description || item.Name
        }));

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error(`Catalog ${name} fetch error:`, error);
        return NextResponse.json(
            { error: "Failed to fetch catalog" },
            { status: 500 }
        );
    }
}
