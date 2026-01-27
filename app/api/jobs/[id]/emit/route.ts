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
                ProductCode: "78101802", // Servicios transporte de carga por carretera (en camión) a nivel regional y nacional
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
                        IDUbicacion: `OR${extractedData.ubicaciones.origen.codigoPostal}`,
                        TipoUbicacion: "Origen",
                        RFCRemitenteDestinatario: extractedData.ubicaciones.origen.rfc || "XAXX010101000", // Fallback generic RFC if missing
                        NombreRemitenteDestinatario: extractedData.ubicaciones.origen.nombre,
                        FechaHoraSalidaLlegada: new Date().toISOString(),
                        Domicilio: {
                            Calle: extractedData.ubicaciones.origen.calle,
                            NumeroExterior: extractedData.ubicaciones.origen.numeroExterior,
                            NumeroInterior: extractedData.ubicaciones.origen.numeroInterior,
                            Colonia: extractedData.ubicaciones.origen.colonia,
                            Localidad: extractedData.ubicaciones.origen.localidad,
                            Municipio: extractedData.ubicaciones.origen.municipio,
                            CodigoPostal: extractedData.ubicaciones.origen.codigoPostal,
                            Estado: extractedData.ubicaciones.origen.estado,
                            Pais: "MEX",
                        },
                        DistanciaRecorrida: extractedData.ubicaciones.origen.distanciaRecorrida || 0,
                    },
                    {
                        IDUbicacion: `DE${extractedData.ubicaciones.destino.codigoPostal}`,
                        TipoUbicacion: "Destino",
                        RFCRemitenteDestinatario: extractedData.ubicaciones.destino.rfc || "XAXX010101000",
                        NombreRemitenteDestinatario: extractedData.ubicaciones.destino.nombre,
                        FechaHoraSalidaLlegada: new Date(Date.now() + 3600000).toISOString(),
                        Domicilio: {
                            Calle: extractedData.ubicaciones.destino.calle,
                            NumeroExterior: extractedData.ubicaciones.destino.numeroExterior,
                            NumeroInterior: extractedData.ubicaciones.destino.numeroInterior,
                            Colonia: extractedData.ubicaciones.destino.colonia,
                            Localidad: extractedData.ubicaciones.destino.localidad,
                            Municipio: extractedData.ubicaciones.destino.municipio,
                            CodigoPostal: extractedData.ubicaciones.destino.codigoPostal,
                            Estado: extractedData.ubicaciones.destino.estado,
                            Pais: "MEX",
                        },
                        DistanciaRecorrida: extractedData.ubicaciones.destino.distanciaRecorrida || 0,
                    },
                ],

                // Mercancías
                Mercancias: {
                    PesoBrutoTotal: extractedData.mercanciasTotales.pesoBrutoTotal,
                    UnidadPeso: extractedData.mercanciasTotales.unidadPeso,
                    NumTotalMercancias: extractedData.mercanciasTotales.numTotalMercancias,
                    Mercancia: extractedData.mercancias.map((m) => {
                        const mercancia: any = {
                            BienesTransp: m.claveProdServ || "01010101",
                            Descripcion: m.descripcion,
                            Cantidad: m.cantidad,
                            ClaveUnidad: m.claveUnidad || "KGM",
                            Unidad: m.unidad,
                            PesoEnKg: m.pesoKg,
                            ValorMercancia: m.valorMercancia,
                            Moneda: m.moneda || "MXN",
                            MaterialPeligroso: m.materialPeligroso || "No",
                            CantidadTransportada: [
                                {
                                    Cantidad: m.cantidad,
                                    IDOrigen: `OR${extractedData.ubicaciones.origen.codigoPostal}`,
                                    IDDestino: `DE${extractedData.ubicaciones.destino.codigoPostal}`,
                                }
                            ]
                        };

                        if (m.materialPeligroso === "Sí" && m.cveMaterialPeligroso) {
                            mercancia.CveMaterialPeligroso = m.cveMaterialPeligroso;
                        }

                        if (m.embalaje) {
                            mercancia.Embalaje = m.embalaje;
                            mercancia.DescripEmbalaje = m.descripEmbalaje || "";
                        }

                        return mercancia;
                    }),

                    // Autotransporte
                    Autotransporte: {
                        PermSCT: extractedData.autotransporte.permSCT || "TPAF01",
                        NumPermisoSCT: extractedData.autotransporte.numPermisoSCT || "000000",
                        IdentificacionVehicular: {
                            ConfigVehicular: extractedData.autotransporte.configVehicular || "C2",
                            PlacaVM: extractedData.autotransporte.placaVehiculo,
                            AnioModeloVM: extractedData.autotransporte.modeloAnio,
                        },
                        Seguros: {
                            AseguraRespCivil: extractedData.autotransporte.aseguradora || "",
                            PolizaRespCivil: extractedData.autotransporte.numPolizaSeguro || "",
                            AseguraCarga: extractedData.autotransporte.aseguraCarga,
                            PolizaCarga: extractedData.autotransporte.polizaCarga,
                            PrimaSeguro: extractedData.autotransporte.primaSeguro,
                        },
                        Remolques: extractedData.remolques.map(r => ({
                            SubTipoRem: r.subTipoRem,
                            Placa: r.placa,
                        })),
                    },
                },

                // Figura Transporte (Operador)
                FiguraTransporte: [
                    {
                        TipoFigura: "01", // Operador
                        RFCFigura: extractedData.operador.rfc,
                        NombreFigura: extractedData.operador.nombre,
                        NumLicencia: extractedData.operador.licencia,
                        Domicilio: extractedData.operador.domicilio ? {
                            Calle: extractedData.operador.domicilio.calle,
                            NumeroExterior: extractedData.operador.domicilio.numeroExterior,
                            NumeroInterior: extractedData.operador.domicilio.numeroInterior,
                            Colonia: extractedData.operador.domicilio.colonia,
                            Localidad: extractedData.operador.domicilio.localidad,
                            Municipio: extractedData.operador.domicilio.municipio,
                            CodigoPostal: extractedData.operador.domicilio.codigoPostal,
                            Estado: extractedData.operador.domicilio.estado,
                            Pais: "MEX",
                        } : undefined,
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
