import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { facturamaService } from "@/lib/facturamaService";
import { ExtractedData } from "@/lib/extractionService";

/**
 * Transform extracted data to Facturama CFDI 4.0 + Carta Porte 3.1 format
 */
function transformToCFDI(extractedData: ExtractedData) {
    return {
        // CFDI 4.0 Base
        Serie: "CP",
        Currency: "MXN",
        ExpeditionPlace: "64000", // Default CP - should come from config
        PaymentForm: "99", // Por definir
        PaymentMethod: "PUE", // Pago en una sola exhibición
        CfdiType: "T", // T = Traslado (no cobro)

        // Receptor (Cliente)
        Receiver: {
            Rfc: extractedData.receptor.rfc,
            Name: extractedData.receptor.nombre,
            CfdiUse: "S01", // Sin efectos fiscales
            FiscalRegime: extractedData.receptor.regimenFiscal || "601",
            TaxZipCode: extractedData.receptor.codigoPostal,
        },

        // Conceptos (Servicio de transporte)
        Items: [
            {
                ProductCode: "78101800", // Servicios de transporte de carga por carretera
                IdentificationNumber: "001",
                Description: "Servicio de transporte de mercancías",
                Unit: "E48", // Unidad de servicio
                UnitCode: "E48",
                UnitPrice: 0,
                Quantity: 1,
                Subtotal: 0,
                Total: 0,
            },
        ],

        // Complemento Carta Porte 3.1
        Complement: {
            CartaPorte: {
                Version: "3.1",
                TranspInternac: "No",
                TotalDistRec: 100, // KM - should be calculated from extractedData

                // Ubicaciones
                Locations: [
                    {
                        TipoUbicacion: "Origen",
                        RFCRemitenteDestinatario: extractedData.ubicaciones.origen.rfc || "",
                        NombreRemitenteDestinatario: extractedData.ubicaciones.origen.nombre,
                        FechaHoraSalidaLlegada: new Date().toISOString(),
                        Domicilio: {
                            CodigoPostal: extractedData.ubicaciones.origen.codigoPostal,
                            Estado: extractedData.ubicaciones.origen.estado,
                            Pais: "MEX",
                        },
                    },
                    {
                        TipoUbicacion: "Destino",
                        RFCRemitenteDestinatario: "",
                        NombreRemitenteDestinatario: extractedData.ubicaciones.destino.nombre,
                        FechaHoraSalidaLlegada: new Date(Date.now() + 3600000).toISOString(),
                        Domicilio: {
                            CodigoPostal: extractedData.ubicaciones.destino.codigoPostal,
                            Estado: extractedData.ubicaciones.destino.estado,
                            Pais: "MEX",
                        },
                    },
                ],

                // Mercancías
                Mercancias: {
                    PesoBrutoTotal: extractedData.mercancias.reduce((sum, m) => sum + m.pesoKg, 0),
                    UnidadPeso: "KGM",
                    NumTotalMercancias: extractedData.mercancias.length,
                    Mercancia: extractedData.mercancias.map((m) => ({
                        BienesTransp: "01010101", // Clave SAT - should come from extractedData
                        Descripcion: m.descripcion,
                        Cantidad: m.cantidad,
                        ClaveUnidad: "KGM",
                        Unidad: m.unidad,
                        PesoEnKg: m.pesoKg,
                        ValorMercancia: m.valorMercancia,
                        Moneda: "MXN",
                    })),

                    // Autotransporte
                    Autotransporte: {
                        PermSCT: "TPAF01", // Autotransporte Federal de Carga
                        NumPermisoSCT: "ABC123456", // Should come from config/extractedData
                        IdentificacionVehicular: {
                            ConfigVehicular: "C2", // Should come from extractedData
                            PlacaVM: extractedData.autotransporte.placaVehiculo,
                            AnioModeloVM: extractedData.autotransporte.modeloAnio,
                        },
                        Seguros: {
                            AseguraRespCivil: extractedData.autotransporte.aseguradora || "",
                            PolizaRespCivil: extractedData.autotransporte.numPolizaSeguro || "",
                        },
                    },
                },

                // Figura Transporte (Operador)
                FiguraTransporte: [
                    {
                        TipoFigura: "01", // Operador
                        RFCFigura: extractedData.operador.rfc,
                        NombreFigura: extractedData.operador.nombre,
                        NumLicencia: extractedData.operador.licencia,
                    },
                ],
            },
        },
    };
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // Get job
        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        if (job.status !== "READY") {
            return NextResponse.json(
                { error: "Job must be in READY status to emit" },
                { status: 400 }
            );
        }

        if (!job.extractedJson) {
            return NextResponse.json(
                { error: "No extracted data found" },
                { status: 400 }
            );
        }

        // Update status to ISSUING
        await prisma.job.update({
            where: { id },
            data: { status: "ISSUING" },
        });

        // Parse extracted data
        const extractedData: ExtractedData = JSON.parse(job.extractedJson);

        // Transform to CFDI format
        const cfdiData = transformToCFDI(extractedData);

        // Call Facturama API
        const result = await facturamaService.issueCFDI(cfdiData);

        if (result.success) {
            // Update job with success
            await prisma.job.update({
                where: { id },
                data: {
                    status: "ISSUED",
                    facturamaId: result.data?.Id || "",
                    uuid: result.uuid || "",
                },
            });

            return NextResponse.json({
                success: true,
                message: "CFDI emitido exitosamente",
                folio: result.folio,
                uuid: result.uuid,
                facturamaId: result.data?.Id || "",
                pdfUrl: result.pdfUrl,
                xmlUrl: result.xmlUrl,
            });
        } else {
            // Update job with failure
            await prisma.job.update({
                where: { id },
                data: {
                    status: "FAILED",
                },
            });

            return NextResponse.json(
                {
                    success: false,
                    error: result.error || "Error al emitir CFDI",
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Emission error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
