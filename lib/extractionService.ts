import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";


// Type definitions
export type ExtractedData = {
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
            codigoPostal: string;
            estado: string;
        };
        destino: {
            nombre: string;
            rfc?: string;
            codigoPostal: string;
            estado: string;
        };
    };
    mercancias: {
        descripcion: string;
        cantidad: number;
        unidad: string;
        pesoKg: number;
        valorMercancia: number;
        claveProdServ?: string; // SAT product/service code
        claveUnidad?: string;   // SAT unit code
    }[];
    autotransporte: {
        placaVehiculo: string;
        modeloAnio: number;
        aseguradora?: string;
        numPolizaSeguro?: string;
    };
    operador: {
        nombre: string;
        rfc: string;
        licencia: string;
    };
    confidence: {
        [key: string]: number;
    };
};

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
            // Using buffer approach instead of readFile for better Next.js compatibility
            const fileBuffer = await fs.readFile(absolutePath);
            const workbook = XLSX.read(fileBuffer, { type: "buffer" });
            let text = "";
            workbook.SheetNames.forEach((sheetName) => {
                const sheet = workbook.Sheets[sheetName];
                text += XLSX.utils.sheet_to_txt(sheet) + "\n\n";
            });
            return text;
        } else if (fileType === "application/pdf" || fileType.startsWith("image/")) {
            // For PDFs and images, we'll use OpenAI Vision API directly
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
        // Extract text from file
        const fileText = await extractTextFromFile(filePath, fileType);

        // System prompt for structured extraction
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

Para confidence scores (0.0 a 1.0):
- 0.9-1.0: Dato explícito y claramente visible
- 0.7-0.89: Dato inferido pero razonable
- 0.5-0.69: Dato parcial o ambiguo
- 0.0-0.49: Dato no encontrado o muy incierto

Devuelve ÚNICAMENTE un JSON válido con esta estructura EXACTA:
{
  "receptor": {
    "rfc": "string o vacío",
    "nombre": "string o vacío", 
    "codigoPostal": "string o vacío",
    "regimenFiscal": "string o vacío (601 por defecto si no encuentras)"
  },
  "ubicaciones": {
    "origen": {
      "nombre": "string o vacío",
      "rfc": "string o vacío",
      "codigoPostal": "string o vacío",
      "estado": "string o vacío"
    },
    "destino": {
      "nombre": "string o vacío",
      "rfc": "string o vacío",
      "codigoPostal": "string o vacío",
      "estado": "string o vacío"
    }
  },
  "mercancias": [{
    "descripcion": "string o vacío",
    "cantidad": 0,
    "unidad": "string o vacío",
    "pesoKg": 0,
    "valorMercancia": 0,
    "claveProdServ": "string o vacío (código SAT si visible)",
    "claveUnidad": "string o vacío (código SAT si visible)"
  }],
  "autotransporte": {
    "placaVehiculo": "string o vacío",
    "modeloAnio": 0,
    "aseguradora": "string o vacío",
    "numPolizaSeguro": "string o vacío"
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
            // Convert relative paths to absolute paths
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(process.cwd(), filePath);

            const fileBuffer = await fs.readFile(absolutePath);
            const base64File = fileBuffer.toString("base64");

            // Determine media type
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

        // Fallback to empty data if OpenAI fails
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
            regimenFiscal: "601", // Default regime
        },
        ubicaciones: {
            origen: {
                nombre: "",
                rfc: "",
                codigoPostal: "",
                estado: "",
            },
            destino: {
                nombre: "",
                codigoPostal: "",
                estado: "",
            },
        },
        mercancias: [
            {
                descripcion: "",
                cantidad: 0,
                unidad: "",
                pesoKg: 0,
                valorMercancia: 0,
                claveProdServ: "",
                claveUnidad: "",
            },
        ],
        autotransporte: {
            placaVehiculo: "",
            modeloAnio: 0,
            aseguradora: "",
            numPolizaSeguro: "",
        },
        operador: {
            nombre: "",
            rfc: "",
            licencia: "",
        },
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
