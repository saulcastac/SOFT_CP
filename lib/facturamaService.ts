/**
 * Facturama API Service
 * 
 * Wrapper for Facturama CFDI 4.0 with Carta Porte 3.1
 * Uses Sandbox environment for testing
 */

type FacturamaConfig = {
    username: string;
    password: string;
    sandbox: boolean;
};

type FacturamaResponse = {
    success: boolean;
    data?: any;
    error?: string;
    folio?: string;
    uuid?: string;
    pdfUrl?: string;
    xmlUrl?: string;
};

export class FacturamaService {
    private config: FacturamaConfig;
    private baseUrl: string;

    constructor(config?: Partial<FacturamaConfig>) {
        this.config = {
            username: config?.username || process.env.FACTURAMA_USERNAME || "",
            password: config?.password || process.env.FACTURAMA_PASSWORD || "",
            sandbox: config?.sandbox ?? false,
        };

        this.baseUrl = this.config.sandbox
            ? "https://apisandbox.facturama.mx"
            : "https://api.facturama.mx";
    }

    /**
     * Get Basic Auth header
     */
    private getAuthHeader(): string {
        const credentials = `${this.config.username}:${this.config.password}`;
        return `Basic ${Buffer.from(credentials).toString("base64")}`;
    }

    /**
     * Issue a CFDI 4.0 with Carta Porte 3.1
     */
    async issueCFDI(cartaPorteData: any): Promise<FacturamaResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api-lite/cfdis`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.getAuthHeader(),
                },
                body: JSON.stringify(cartaPorteData),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.Message || data.message || "Facturama API error",
                };
            }

            return {
                success: true,
                data,
                folio: data.Folio,
                uuid: data.Complement?.TaxStamp?.Uuid,
                pdfUrl: data.CfdiType === "issued" ? `${this.baseUrl}/api-lite/cfdis/${data.Id}/pdf` : undefined,
                xmlUrl: data.CfdiType === "issued" ? `${this.baseUrl}/api-lite/cfdis/${data.Id}/xml` : undefined,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || "Network error",
            };
        }
    }

    /**
     * Download CFDI PDF
     */
    async downloadPDF(cfdiId: string): Promise<Buffer | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api-lite/cfdis/${cfdiId}/pdf`, {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
            });

            if (!response.ok) return null;

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error("PDF download error:", error);
            return null;
        }
    }

    /**
     * Download CFDI XML
     */
    async downloadXML(cfdiId: string): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api-lite/cfdis/${cfdiId}/xml`, {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
            });

            if (!response.ok) return null;

            return await response.text();
        } catch (error) {
            console.error("XML download error:", error);
            return null;
        }
    }

    /**
     * Validate Customer (RFC lookup)
     */
    async validateCustomer(rfc: string): Promise<{ valid: boolean; data?: any; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api-lite/catalogs/TaxEntities?rfc=${rfc}`, {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
            });

            if (!response.ok) {
                return { valid: false, error: "RFC not found" };
            }

            const data = await response.json();
            return { valid: true, data };
        } catch (error: any) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get SAT Catalogs
     */
    async getCatalog(catalogName: string): Promise<any[]> {
        try {
            const url = `${this.baseUrl}/api-lite/catalogs/${catalogName}`;
            console.log(`[Facturama] Fetching catalog: ${url}`);
            console.log(`[Facturama] Using credentials: ${this.config.username} (sandbox: ${this.config.sandbox})`);

            const response = await fetch(url, {
                headers: {
                    Authorization: this.getAuthHeader(),
                },
            });

            console.log(`[Facturama] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Facturama] Error response body:`, errorText);
                return [];
            }

            const text = await response.text();
            console.log(`[Facturama] Response body (first 200 chars):`, text.substring(0, 200));

            if (!text || text.trim() === '') {
                console.error(`[Facturama] Empty response body`);
                return [];
            }

            try {
                const data = JSON.parse(text);
                console.log(`[Facturama] Parsed ${data.length || 0} items`);
                return data;
            } catch (parseError) {
                console.error(`[Facturama] JSON parse error:`, parseError);
                console.error(`[Facturama] Response was:`, text);
                return [];
            }
        } catch (error) {
            console.error("[Facturama] Catalog fetch error:", error);
            return [];
        }
    }
}

// Singleton instance
export const facturamaService = new FacturamaService();
