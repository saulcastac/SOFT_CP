import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";
import { parsePdfText } from "./pdfService";

// Type definitions
export interface ExtractedData {
    receptor: {
        rfc: string;
        nombre: string;
        codigoPostal: string;
        regimenFiscal: string;
    };
    ubicaciones: {
        origen: {
            nombre: string;
            rfc?: string;
            calle?: string;
            numeroExterior?: string;
            numeroInterior?: string;
            colonia?: string;
            localidad?: string;
            municipio?: string;
            codigoPostal: string;
            estado: string;
            distanciaRecorrida?: number;
            fechaSalida?: string;
        };
        destino: {
            nombre: string;
            rfc?: string;
            calle?: string;
            numeroExterior?: string;
            numeroInterior?: string;
            colonia?: string;
            localidad?: string;
            municipio?: string;
            codigoPostal: string;
            estado: string;
            distanciaRecorrida?: number;
            fechaLlegada?: string;
        };
    };
    mercancias: {
        descripcion: string;
        cantidad: number;
        unidad: string;
        pesoKg: number;
        valorMercancia: number;
        moneda: string;
        claveProdServ?: string; // SAT product/service code (BienesTransp)
        claveUnidad?: string;   // SAT unit code
        materialPeligroso?: string; // "Sí" or "No"
        cveMaterialPeligroso?: string;
        embalaje?: string;
        descripEmbalaje?: string;
    }[];
    mercanciasTotales: {
        unidadPeso: string;
        pesoBrutoTotal: number;
        numTotalMercancias: number;
    };
    autotransporte: {
        placaVehiculo: string;
        modeloAnio: number;
        aseguradora?: string;
        numPolizaSeguro?: string;
        permSCT?: string;
        numPermisoSCT?: string;
        configVehicular?: string;
        pesoBrutoVehicular?: number;
        aseguraCarga?: string;
        polizaCarga?: string;
        primaSeguro?: number;
    };
    operador: {
        nombre: string;
        rfc: string;
        licencia: string;
        domicilio?: {
            calle?: string;
            numeroExterior?: string;
            numeroInterior?: string;
            colonia?: string;
            localidad?: string;
            municipio?: string;
            codigoPostal?: string;
            estado?: string;
        };
    };
    remolques: {
        subTipoRem: string;
        placa: string;
    }[];
    confidence: {
        [key: string]: number;
    };
}

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Extract text from different file types
 */
async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
        // Convert relative paths to absolute paths
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(process.cwd(), filePath);

        if (
            fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            fileType === "application/vnd.ms-excel"
        ) {
            // Read Excel file as buffer and parse with XLSX
            const fileBuffer = await fs.readFile(absolutePath);
            const workbook = XLSX.read(fileBuffer, { type: "buffer" });
            let text = "";
            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                text += XLSX.utils.sheet_to_txt(sheet) + "\n\n";
            });
            return text;
        } else if (fileType === "application/pdf") {
            // Read PDF file and extract text using the separate service
            return await parsePdfText(absolutePath);
        } else if (fileType.startsWith("image/")) {
            // For images, we'll use OpenAI Vision API directly
            return "[VISION_FILE]";
        } else {
            // Plain text files
            return await fs.readFile(absolutePath, "utf-8");
        }
    } catch (error) {
        console.error("Text extraction error:", error);
        throw new Error("Failed to extract text from file");
    }
}

/**
 * OpenAI-powered extraction function
 */
export async function extractCartaPorteData(
    filePath: string,
    fileType: string
): Promise<ExtractedData> {
    try {
        const fileText = await extractTextFromFile(filePath, fileType);

        const systemPrompt = `Eres un experto en logística y transporte en México, especializado en Carta Porte 3.1 y CFDI 4.0.

Tu tarea es extraer información de documentos de transporte y organizarla según la estructura de Carta Porte.

REGLAS IMPORTANTES:
- Extrae SOLO información que encuentres explícitamente en el documento
- Si NO encuentras un dato, déjalo como cadena vacía "" para strings o 0 para números
- NO inventes datos ni uses placeholders como "NO_ENCONTRADO"
- Para RFCs, busca patrones como: 3-4 letras seguidas de 6 dígitos y 3 caracteres (ej: ABC123456XYZ)
- Para placas, busca patrones alfanuméricos (ej: ABC1234, 123ABC)
- Para códigos postales, busca números de 5 dígitos
- Si encuentras datos parciales o incompletos, extráelos de todas formas y asigna un confidence bajo

MAPEO DE CAMPOS EXCEL (Prioritario):
- "NUMERO DE REFERENCIA" -> Referencia interna
- "FECHA DE RECOLECCION" -> ubicaciones.origen.fechaSalida (Formato ISO: YYYY-MM-DDTHH:mm). Si solo hay fecha, asume 06:00 AM.
- "FECHA DE ENTREGA" -> ubicaciones.destino.fechaLlegada (Formato ISO: YYYY-MM-DDTHH:mm). Si solo hay fecha, asume 20:00 PM.
- "DIRECCION COMPLETA ORIGEN" / "DIRECCION COMPLETA DESTINO" -> Descompón la dirección en calle, número, colonia, CP, municipio y estado.
- "PESO BRUTO" -> mercancias.pesoKg (Convertir a número limpio)
- "CLAVE DE PRODUCTO SAT" -> mercancias.claveProdServ
- "DESCRIPCION DEL PRODUCTO SAT" -> mercancias.descripcion
- "CANTIDAD" -> mercancias.cantidad
- "TIPO DE UNIDAD" -> mercancias.unidad. Si dice "FULL", probablemente se refiere al tipo de transporte, busca otra unidad o asigna una genérica si es claro.
- "VALOR DE LA MERCANCIA" -> mercancias.valorMercancia
- "PEDIMENTO" -> mercancias.pedimentos
- "HAZMAT SI/NO" -> mercancias.materialPeligroso ("Sí" o "No")

MAPEO DE CAMPOS (FORMATO CARTA DE INSTRUCCIONES):
- "Origen" (Texto cercano) -> ubicaciones.origen.nombre / dirección.
- "Destino" (Texto cercano) -> ubicaciones.destino.nombre / dirección.
- "Cita en terminal" o "Fecha Solicitud" -> ubicaciones.origen.fechaSalida.
- "Clave SAT del producto" -> mercancias.claveProdServ.
- "Cantidad de las mercancias" o "# Bultos" -> mercancias.cantidad.
- "Peso de las mercancias" o "Peso / Kg" -> mercancias.pesoKg.
- "Pedimento de importacion" -> mercancias.pedimentos.
- "RFC" (Cercano a encabezado) -> receptor.rfc.
- "Embalaje" -> mercancias.descripEmbalaje (y trata de inferir clave de unidad genérica si es posible, e.g. "XBX" para cajas).

MAPEO DE CAMPOS (FORMATO ESTRUCTURADO SAT - GRID):
- "RFCRemitente" / "RFC Remitente" -> ubicaciones.origen.rfc.
- "NombreRemitente" / "Nombre Remitente" -> ubicaciones.origen.nombre.
- Dirección Origen (Calle, NumeroExterior, Colonia, etc.) -> ubicaciones.origen.[campo].
- "RFCDestinatario" / "RFC Destinatario" -> ubicaciones.destino.rfc.
- "NombreDestinatario" / "Nombre Destinatario" -> ubicaciones.destino.nombre.
- Dirección Destino (Calle, NumeroExterior, Colonia, etc.) -> ubicaciones.destino.[campo].
- "BienesTransp" / "Bien Transportado" -> mercancias.claveProdServ.
- "Descripcion" / "Descripción" -> mercancias.descripcion.
- "Cantidad" -> mercancias.cantidad.
- "ClaveUnidad" / "Clave Unidad" -> mercancias.claveUnidad.
- "Unidad" -> mercancias.unidad.
- "MaterialPeligroso" / "Clave Material Peligroso" -> mercancias.materialPeligroso.
- "UnidadPeso" / "Unidad de Peso" -> mercanciasTotales.unidadPeso (si es global) o ignora si es por partida.
- "PesoBruto" / "Peso Bruto" -> mercancias.pesoKg.
- "FraccionArancelaria" -> (Opcional, no está en el esquema base pero es útil saberlo).

MAPEO DE CAMPOS (FORMATO PDF - SOLICITUD DE CARGA / INFO MERCANCÍA):
- "Origen" (Texto cercano) -> ubicaciones.origen.nombre / dirección.
- "Destino final" -> ubicaciones.destino.nombre / dirección.
- "Fecha retiro" -> ubicaciones.origen.fechaSalida (Formato ISO: YYYY-MM-DDTHH:mm).
- "Fecha descarga" -> ubicaciones.destino.fechaLlegada (Formato ISO: YYYY-MM-DDTHH:mm).
- Tabla "INFORMACION DE MERCANCIA" (o similar):
  - "Bienes Transportados (clave SAT)" -> mercancias.claveProdServ.
  - "Cantidad" -> mercancias.cantidad.
  - "Clave de Unidad (Clave SAT)" -> mercancias.claveUnidad.
  - "Peso en Kilogramos" -> mercancias.pesoKg.
  - "Embalaje (Clave SAT)" -> mercancias.embalaje.
  - "Descripcion del embalaje (SAT)" -> mercancias.descripEmbalaje.
  - "Numero de Pedimento" -> mercancias.pedimentos.
  - "VALOR DE LA MERCANCIA" -> mercancias.valorMercancia.
  - "Material Peligroso" -> mercancias.materialPeligroso.

MAPEO DE CAMPOS (FORMATO LISTA VERTICAL CON SECCIONES):
- Detecta secciones: "ORIGEN", "DESTINO", "SECCIÓN MERCANCIAS".
- Dentro de "ORIGEN":
  - "Fecha de salida" -> ubicaciones.origen.fechaSalida.
  - "Nombre del remitente" -> ubicaciones.origen.nombre.
  - "RFC del remitente" -> ubicaciones.origen.rfc.
  - Dirección (Calle, Número exterior, etc.) -> ubicaciones.origen.[campo].
- Dentro de "DESTINO":
  - "Nombre del remitente" (o Destinatario) -> ubicaciones.destino.nombre.
  - "RFC del remitente" (o Destinatario) -> ubicaciones.destino.rfc.
  - Dirección -> ubicaciones.destino.[campo].
- Dentro de "SECCIÓN MERCANCIAS":
  - "Peso bruto total" -> mercancias.pesoKg (limpiar "KGS").
  - "Cantidad de mercancias" -> mercancias.cantidad (limpiar "BULTOS").
  - "Clave de producto" -> mercancias.claveProdServ.
  - "Clave de unidad" -> mercancias.claveUnidad.
  - "Descripción" -> mercancias.descripcion.
  // Mapea "Tipo de Documento Aduanero" como pedimento
  - "Tipo de Documento Aduanero" -> mercancias.pedimentos.

MAPEO DE CAMPOS (FORMATO PUNTO DE RECOLECCIÓN / ENTREGA):
- "PUNTO DE RECOLECCIÓN" -> Datos de Origen.
- "PUNTO DE ENTREGA" -> Datos de Destino.
- "FECHA DE SERVICIO" -> ubicaciones.origen.fechaSalida (y posible fecha entrega si es misma fecha + tiempo viaje).
- "INSTRUCCIONES ESPECIALES" -> Busca texto como "ENTREGA MARTES..." para extraer ubicaciones.destino.fechaLlegada.
- "NO. DE PEDIMENTO" -> mercancias.pedimentos (si dice "Pdte." ignora o pon pendiente).
- Tabla "DETALLE DE LA MERCANCIA":
  - "DESCRIPCIÓN" -> mercancias.descripcion.
  - "CLAVE SAT" -> mercancias.claveProdServ.
  - "CANTIDAD" -> mercancias.cantidad.
  - "EMBALAJE / CLAVE" -> mercancias.claveUnidad (si parece unidad) o mercancias.embalaje.
  - "PESO" -> mercancias.pesoKg (7072 -> 7072).

MAPEO DE CAMPOS (FORMATO DETALLADO / ANCHO):
- "Origen RFC (Mex)" -> ubicaciones.origen.rfc.
- "Origen Nombre" -> ubicaciones.origen.nombre.
- Dirección Origen (Origen Calle, Origen Num. Ext, etc.) -> ubicaciones.origen.[campo].
- "Destino RFC (Mex)" -> ubicaciones.destino.rfc.
- "Destino Nombre" -> ubicaciones.destino.nombre.
- Dirección Destino (Destino Calle, Destino Num. Ext, etc.) -> ubicaciones.destino.[campo].
- "Fecha Salida" + "Hora Salida" -> Combínalos en ubicaciones.origen.fechaSalida (ISO YYYY-MM-DDTHH:mm).
- "Fecha Llegada" + "Hora Llegada" -> Combínalos en ubicaciones.destino.fechaLlegada (ISO YYYY-MM-DDTHH:mm).
- "Bienes Transportados(Codigo SAT)" -> mercancias.claveProdServ.
- "Descripcion Bienes/Mercancias" -> mercancias.descripcion.
- "Cantidad" -> mercancias.cantidad.
- "Clave Unidad SAT" -> mercancias.claveUnidad.
- "Peso (KGS)" / "Peso Bruto Total" -> mercancias.pesoKg.
- "Material Peligroso (Si/No)" -> mercancias.materialPeligroso.
- "Pedimento" -> mercancias.pedimentos.
- "UUID Comercio Exterior (A1)" -> mercancias.uuidComercioExt (si aplica, o añadir a descripción).
- "Chofer Nombre" -> operador.nombre.
- "Chofer RFC" -> operador.rfc.
- "Licencia Chofer" -> operador.licencia.
- "Placa Vehic. Motor" -> autotransporte.placaVehiculo.

CLASIFICACIÓN DE MERCANCÍAS (MUY IMPORTANTE):
Esta sección es CRÍTICA para Carta Porte. Debes extraer y clasificar cada mercancía con sus claves SAT.

**Clave Producto/Servicio (claveProdServ - campo BienesTransp en Carta Porte)**
- Solo asigna si tienes ALTA CONFIANZA (90%+) basándote en el catálogo c_ClaveProdServCP del SAT
- Si no estás seguro, déjala VACÍA ("") para que el usuario la asigne

EJEMPLOS COMUNES en transporte mexicano:
• Cemento Portland gris → "14111509"
• Acero en barras/varillas → "30161701"
• Cintas adhesivas/etiquetas → "55121611"
• Productos alimenticios procesados → "50000000"
• Materiales de construcción (genérico) → "30100000"
• Fertilizantes → "10121500"
• Productos químicos → "11000000"
• Papel y cartón → "14110000"
• Plásticos y derivados → "11160000"
• Madera y productos de madera → "30100000"

**Clave Unidad (claveUnidad)**
- Extrae la unidad de medida y asigna su clave SAT del catálogo c_ClaveUnidadPeso
- SIEMPRE debe tener una clave válida basada en lo que encuentres en el documento
- Mapea abreviaturas comunes a las claves SAT oficiales

EJEMPLOS de mapeo de unidades (CRÍTICO - usa estas claves SAT):
• Kilogramo / kg / KG / Kgs / kilos → "KGM"
• Tonelada / ton / TON / Tons / toneladas / t → "TNE"
• Libra / lb / LB / Lbs / libras → "LBR"
• Gramo / g / gr / GR / gramos → "GRM"
• Onza / oz / OZ / onzas → "ONZ"
• Metro cúbico / m³ / m3 / M3 → "MTQ"
• Litro / lt / LT / L / litros → "LTR"
• Mililitro / ml / ML → "MLT"
• Galón / gal / GAL / galones → "GLL"
• Pieza / pza / PZA / pz / unidad / und → "H87"
• Caja / caja / cajas → "XBX"
• Pallet / tarima / pallets → "XPX"
• Paquete / paq / paquetes → "XPK"
• Metro / m / M / metros / mts → "MTR"
• Barril / barr / barriles → "XBA"
• Saco / sacos → "XSA"
• Rollo / rollos → "XRO"
• Bulto / bultos → "XBH"
• Tambor / tambores / tambo → "XDR"

**Material Peligroso**
- Detecta si por la naturaleza de la carga es material peligroso (químicos, combustibles, gases, etc.)
- Si es "Sí", intenta identificar la clave de material peligroso de la NOM-002-SCT/2011

Estructura JSON requerida (Carta Porte 3.1):
{
  "receptor": {
    "rfc": "string o vacío",
    "nombre": "string o vacío", 
    "codigoPostal": "string o vacío",
    "regimenFiscal": "string o vacío (601 por defecto)"
  },
  "ubicaciones": {
    "origen": {
      "nombre": "string o vacío",
      "rfc": "string o vacío",
      "calle": "string o vacío",
      "numeroExterior": "string o vacío",
      "numeroInterior": "string o vacío",
      "colonia": "string o vacío",
      "localidad": "string o vacío",
      "municipio": "string o vacío",
      "codigoPostal": "string o vacío",
      "estado": "string o vacío",
      "fechaSalida": "string ISO 8601 YYYY-MM-DDTHH:mm"
    },
    "destino": {
      "nombre": "string o vacío",
      "rfc": "string o vacío",
      "calle": "string o vacío",
      "numeroExterior": "string o vacío",
      "numeroInterior": "string o vacío",
      "colonia": "string o vacío",
      "localidad": "string o vacío",
      "municipio": "string o vacío",
      "codigoPostal": "string o vacío",
      "estado": "string o vacío",
      "fechaLlegada": "string ISO 8601 YYYY-MM-DDTHH:mm"
    }
  },
  "mercancias": [{
    "descripcion": "string o vacío",
    "cantidad": 0,
    "unidad": "string o vacío (kg, caja, piezas, etc)",
    "pesoKg": 0,
    "valorMercancia": 0,
    "moneda": "MXN",
    "claveProdServ": "string (clave SAT sugerida)",
    "claveUnidad": "string (clave SAT sugerida)",
    "materialPeligroso": "No",
    "cveMaterialPeligroso": "",
    "embalaje": "",
    "descripEmbalaje": ""
  }],
  "autotransporte": {
    "placaVehiculo": "string o vacío",
    "modeloAnio": 0,
    "aseguradora": "string o vacío",
    "numPolizaSeguro": "string o vacío",
    "permSCT": "string o vacío",
    "numPermisoSCT": "string o vacío",
    "configVehicular": "string o vacío"
  },
  "operador": {
    "nombre": "string o vacío",
    "rfc": "string o vacío",
    "licencia": "string o vacío"
  },
  "confidence": {
    "receptor.rfc": 0.0,
    "receptor.nombre": 0.0,
    "ubicaciones.origen": 0.0,
    "ubicaciones.destino": 0.0,
    "mercancias": 0.0,
    "autotransporte": 0.0,
    "operador": 0.0
  }
}`;

        // Use Vision API for PDFs and images
        if (fileType === "application/pdf" || fileType.startsWith("image/")) {
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(process.cwd(), filePath);

            const fileBuffer = await fs.readFile(absolutePath);
            const base64File = fileBuffer.toString("base64");
            const mediaType = fileType === "application/pdf" ? "application/pdf" : fileType;

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Extrae la información de Carta Porte de este documento:",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mediaType};base64,${base64File}`,
                                },
                            },
                        ],
                    },
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            });

            const extractedData = JSON.parse(response.choices[0].message.content || "{}");
            return extractedData as ExtractedData;
        }

        // Use standard completion for text/Excel
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: `Extrae la información de Carta Porte del siguiente documento:\n\n${fileText}`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const extractedData = JSON.parse(response.choices[0].message.content || "{}");
        return extractedData as ExtractedData;
    } catch (error: any) {
        console.error("OpenAI extraction error:", error);
        console.warn("Falling back to empty data due to extraction error");
        return getEmptyData();
    }
}

/**
 * Fallback empty data
 */
function getEmptyData(): ExtractedData {
    return {
        receptor: {
            rfc: "",
            nombre: "",
            codigoPostal: "",
            regimenFiscal: "601",
        },
        ubicaciones: {
            origen: {
                nombre: "",
                rfc: "",
                calle: "",
                numeroExterior: "",
                numeroInterior: "",
                colonia: "",
                localidad: "",
                municipio: "",
                codigoPostal: "",
                estado: "",
                distanciaRecorrida: 0,
                fechaSalida: "",
            },
            destino: {
                nombre: "",
                rfc: "",
                calle: "",
                numeroExterior: "",
                numeroInterior: "",
                colonia: "",
                localidad: "",
                municipio: "",
                codigoPostal: "",
                estado: "",
                distanciaRecorrida: 0,
                fechaLlegada: "",
            },
        },
        mercancias: [
            {
                descripcion: "",
                cantidad: 0,
                unidad: "",
                pesoKg: 0,
                valorMercancia: 0,
                moneda: "MXN",
                claveProdServ: "",
                claveUnidad: "",
                materialPeligroso: "No",
                cveMaterialPeligroso: "",
                embalaje: "",
                descripEmbalaje: "",
            },
        ],
        mercanciasTotales: {
            unidadPeso: "KGM",
            pesoBrutoTotal: 0,
            numTotalMercancias: 1,
        },
        autotransporte: {
            placaVehiculo: "",
            modeloAnio: 0,
            aseguradora: "",
            numPolizaSeguro: "",
            permSCT: "",
            numPermisoSCT: "",
            configVehicular: "",
            pesoBrutoVehicular: 0,
            aseguraCarga: "",
            polizaCarga: "",
            primaSeguro: 0,
        },
        operador: {
            nombre: "",
            rfc: "",
            licencia: "",
            domicilio: {
                calle: "",
                numeroExterior: "",
                numeroInterior: "",
                colonia: "",
                localidad: "",
                municipio: "",
                codigoPostal: "",
                estado: "",
            },
        },
        remolques: [],
        confidence: {
            "receptor.rfc": 0.0,
            "receptor.nombre": 0.0,
            "ubicaciones.origen": 0.0,
            "ubicaciones.destino": 0.0,
            "mercancias": 0.0,
            "autotransporte": 0.0,
            "operador": 0.0,
        },
    };
}

/**
 * Get confidence level classification
 */
export function getConfidenceLevel(score: number): "high" | "medium" | "low" {
    if (score >= 0.9) return "high";
    if (score >= 0.7) return "medium";
    return "low";
}
