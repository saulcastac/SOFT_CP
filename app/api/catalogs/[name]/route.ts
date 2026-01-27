import { NextRequest, NextResponse } from "next/server";
import { facturamaService } from "@/lib/facturamaService";
import { prisma } from "@/lib/prisma";

// Map frontend catalog names to Facturama API catalog names
const CATALOG_MAP: Record<string, string> = {
    products: "ProductsOrServices", // Or "CartaPorte/ClaveProdServCP" if available
    units: "Units",
    // regimes - now handled from local DB
    states: "States",
    countries: "Countries",
    municipalities: "Municipalities", // Needs state
    localities: "Localities",
    neighborhoods: "Neighborhoods",
};

// Static Catalogs
const VEHICLE_CONFIGS = [
    { value: "VL", name: "Vehículo ligero de carga (2 llantas en el eje delantero y 2 llantas en el eje trasero)" },
    { value: "C2", name: "Camión Unitario (2 llantas en el eje delantero y 4 llantas en el eje trasero)" },
    { value: "C3", name: "Camión Unitario (2 llantas en el eje delantero y 6 o 8 llantas en los dos ejes traseros)" },
    { value: "C2R2", name: "Camión-Remolque (6 llantas en el camión y 8 llantas en remolque)" },
    { value: "C3R2", name: "Camión-Remolque (10 llantas en el camión y 8 llantas en remolque)" },
    { value: "C2R3", name: "Camión-Remolque (6 llantas en el camión y 12 llantas en remolque)" },
    { value: "C3R3", name: "Camión-Remolque (10 llantas en el camión y 12 llantas en remolque)" },
    { value: "T2S1", name: "Tractocamión Articulado (6 llantas en el tractocamión, 4 llantas en el semirremolque)" },
    { value: "T2S2", name: "Tractocamión Articulado (6 llantas en el tractocamión, 8 llantas en el semirremolque)" },
    { value: "T2S3", name: "Tractocamión Articulado (6 llantas en el tractocamión, 12 llantas en el semirremolque)" },
    { value: "T3S1", name: "Tractocamión Articulado (10 llantas en el tractocamión, 4 llantas en el semirremolque)" },
    { value: "T3S2", name: "Tractocamión Articulado (10 llantas en el tractocamión, 8 llantas en el semirremolque)" },
    { value: "T3S3", name: "Tractocamión Articulado (10 llantas en el tractocamión, 12 llantas en el semirremolque)" },
    { value: "T2S1R2", name: "Tractocamión Semirremolque-Remolque (6 llantas en el tractocamión, 4 llantas en el semirremolque y 8 llantas en el remolque)" },
    { value: "T2S2R2", name: "Tractocamión Semirremolque-Remolque (6 llantas en el tractocamión, 8 llantas en el semirremolque y 8 llantas en el remolque)" },
    { value: "T2S1R3", name: "Tractocamión Semirremolque-Remolque (6 llantas en el tractocamión, 4 llantas en el semirremolque y 12 llantas en el remolque)" },
    { value: "T3S1R2", name: "Tractocamión Semirremolque-Remolque (10 llantas en el tractocamión, 4 llantas en el semirremolque y 8 llantas en el remolque)" },
    { value: "T3S1R3", name: "Tractocamión Semirremolque-Remolque (10 llantas en el tractocamión, 4 llantas en el semirremolque y 12 llantas en el remolque)" },
    { value: "T3S2R2", name: "Tractocamión Semirremolque-Remolque (10 llantas en el tractocamión, 8 llantas en el semirremolque y 8 llantas en el remolque)" },
    { value: "T3S2R3", name: "Tractocamión Semirremolque-Remolque (10 llantas en el tractocamión, 8 llantas en el semirremolque y 12 llantas en el remolque)" },
    { value: "T3S2R4", name: "Tractocamión Semirremolque-Remolque (10 llantas en el tractocamión, 8 llantas en el semirremolque y 16 llantas en el remolque)" },
    { value: "T2S2S2", name: "Tractocamión Semirremolque-Semirremolque (6 llantas en el tractocamión, 8 llantas en el semirremolque delantero y 8 llantas en el semirremolque trasero)" },
    { value: "T3S2S2", name: "Tractocamión Semirremolque-Semirremolque (10 llantas en el tractocamión, 8 llantas en el semirremolque delantero y 8 llantas en el semirremolque trasero)" },
    { value: "T3S3S2", name: "Tractocamión Semirremolque-Semirremolque (10 llantas en el tractocamión, 12 llantas en el semirremolque delantero y 8 llantas en el semirremolque trasero)" },
    { value: "OTROEVGP", name: "Especializado de carga Voluminosa y/o Gran Peso" },
    { value: "OTROSG", name: "Servicio de Grúas" },
    { value: "GPLUTA", name: "Grúa de Pluma Tipo A" },
    { value: "GPLUTB", name: "Grúa de Pluma Tipo B" },
    { value: "GPLUTC", name: "Grúa de Pluma Tipo C" },
    { value: "GPLUTD", name: "Grúa de Pluma Tipo D" },
    { value: "GPLATA", name: "Grúa de Plataforma Tipo A" },
    { value: "GPLATB", name: "Grúa de Plataforma Tipo B" },
    { value: "GPLATC", name: "Grúa de Plataforma Tipo C" },
    { value: "GPLATD", name: "Grúa de Plataforma Tipo D" },
];

const TRAILER_SUBTYPES = [
    { value: "CTR001", name: "Caballete" },
    { value: "CTR002", name: "Caja" },
    { value: "CTR003", name: "Caja Abierta" },
    { value: "CTR004", name: "Caja Cerrada" },
    { value: "CTR005", name: "Caja De Recolección Con Cargador Frontal" },
    { value: "CTR006", name: "Caja Refrigerada" },
    { value: "CTR007", name: "Caja Seca" },
    { value: "CTR008", name: "Caja Transferencia" },
    { value: "CTR009", name: "Cama Baja o Cuello Ganso" },
    { value: "CTR010", name: "Chasis Portacontenedor" },
    { value: "CTR011", name: "Convencional De Chasis" },
    { value: "CTR012", name: "Equipo Especial" },
    { value: "CTR013", name: "Estacas" },
    { value: "CTR014", name: "Góndola Madrina" },
    { value: "CTR015", name: "Grúa Industrial" },
    { value: "CTR016", name: "Grúa" },
    { value: "CTR017", name: "Integral" },
    { value: "CTR018", name: "Jaula" },
    { value: "CTR019", name: "Media Redila" },
    { value: "CTR020", name: "Pallet o Celdillas" },
    { value: "CTR021", name: "Plataforma" },
    { value: "CTR022", name: "Plataforma Con Grúa" },
    { value: "CTR023", name: "Plataforma Encortinada" },
    { value: "CTR024", name: "Redilas" },
    { value: "CTR025", name: "Refrigerador" },
    { value: "CTR026", name: "Revolvedora" },
    { value: "CTR027", name: "Semicaja" },
    { value: "CTR028", name: "Tanque" },
    { value: "CTR029", name: "Tolva" },
    { value: "CTR031", name: "Volteo" },
    { value: "CTR032", descripcion: "Volteo Desmontable" },
];

const MEXICAN_STATES = [
    { value: "AGS", name: "Aguascalientes" },
    { value: "BC", name: "Baja California" },
    { value: "BCS", name: "Baja California Sur" },
    { value: "CAM", name: "Campeche" },
    { value: "CHIS", name: "Chiapas" },
    { value: "CHIH", name: "Chihuahua" },
    { value: "CDMX", name: "Ciudad de México" },
    { value: "COAH", name: "Coahuila" },
    { value: "COL", name: "Colima" },
    { value: "DGO", name: "Durango" },
    { value: "GTO", name: "Guanajuato" },
    { value: "GRO", name: "Guerrero" },
    { value: "HGO", name: "Hidalgo" },
    { value: "JAL", name: "Jalisco" },
    { value: "MEX", name: "Estado de México" },
    { value: "MICH", name: "Michoacán" },
    { value: "MOR", name: "Morelos" },
    { value: "NAY", name: "Nayarit" },
    { value: "NL", name: "Nuevo León" },
    { value: "OAX", name: "Oaxaca" },
    { value: "PUE", name: "Puebla" },
    { value: "QRO", name: "Querétaro" },
    { value: "QROO", name: "Quintana Roo" },
    { value: "SLP", name: "San Luis Potosí" },
    { value: "SIN", name: "Sinaloa" },
    { value: "SON", name: "Sonora" },
    { value: "TAB", name: "Tabasco" },
    { value: "TAMPS", name: "Tamaulipas" },
    { value: "TLAX", name: "Tlaxcala" },
    { value: "VER", name: "Veracruz" },
    { value: "YUC", name: "Yucatán" },
    { value: "ZAC", name: "Zacatecas" },
];

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
            // Static catalog for Mexican States
            return NextResponse.json(MEXICAN_STATES);
        }
        else if (name === "vehiculos") {
            // Static catalog for Vehicle Configuration
            return NextResponse.json(VEHICLE_CONFIGS);
        }
        else if (name === "remolques") {
            // Database catalog for Trailer Subtype
            const remolques = await prisma.subtipoRemolque.findMany({
                where: { activo: true },
                select: {
                    clave: true,
                    descripcion: true,
                },
                orderBy: { clave: 'asc' },
            });
            return NextResponse.json(
                remolques.map(r => ({ value: r.clave, name: r.descripcion }))
            );
        }
        else if (name === "regimes") {
            // Fetch from local database
            const regimenes = await prisma.regimenFiscal.findMany({
                where: { activo: true },
                orderBy: { clave: 'asc' }
            });
            const transformedRegimes = regimenes.map(r => ({
                value: r.clave,
                name: r.descripcion,
                description: r.descripcion
            }));
            return NextResponse.json(transformedRegimes);
        }
        else if (name === "unidadespeso") {
            // Database catalog for Weight/Measurement Units (c_ClaveUnidadPeso)
            const unidades = await prisma.claveUnidadPeso.findMany({
                where: { activo: true },
                select: {
                    clave: true,
                    nombre: true,
                    descripcion: true,
                },
                orderBy: { clave: 'asc' },
            });
            return NextResponse.json(
                unidades.map(u => ({ value: u.clave, name: u.nombre, description: u.descripcion || u.nombre }))
            );
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
