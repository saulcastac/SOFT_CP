"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    MapPin,
    Package,
    Truck,
    User,
    ArrowLeft,
    CheckCircle,
    Rocket,
    AlertCircle,
    Save
} from "lucide-react";
import CatalogSelect from "@/components/CatalogSelect";
import FleetSelect from "@/components/FleetSelect";

// Type definitions (duplicated from server to avoid import issues)
type ExtractedData = {
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
        moneda: string;
        claveProdServ?: string;
        claveUnidad?: string;
        materialPeligroso?: string;
        cveMaterialPeligroso?: string;
        embalaje?: string;
        descripEmbalaje?: string;
    }[];
    autotransporte: {
        placaVehiculo: string;
        modeloAnio: number;
        aseguradora?: string;
        numPolizaSeguro?: string;
        permSCT?: string;
        numPermisoSCT?: string;
        configVehicular?: string;
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

function getConfidenceLevel(score: number): "high" | "medium" | "low" {
    if (score >= 0.9) return "high";
    if (score >= 0.7) return "medium";
    return "low";
}

type Job = {
    id: string;
    status: string;
    createdAt: string;
    storagePath: string | null;
    extractedJson: string | null;
    uuid?: string | null;
    facturamaId?: string | null;
};

export default function JobReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [emitting, setEmitting] = useState(false);
    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);

    useEffect(() => {
        params.then((p) => setUnwrappedParams(p));
    }, [params]);

    useEffect(() => {
        if (unwrappedParams) {
            fetchJob();
        }
    }, [unwrappedParams]);

    const fetchJob = async () => {
        if (!unwrappedParams) return;

        try {
            const response = await fetch(`/api/jobs/${unwrappedParams.id}`);
            const data = await response.json();
            setJob(data);

            if (data.extractedJson) {
                setExtractedData(JSON.parse(data.extractedJson));
            }
        } catch (error) {
            console.error("Failed to fetch job:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (path: string, value: any) => {
        if (!extractedData) return;

        // Update nested object using path
        const keys = path.split(".");
        const newData = { ...extractedData };
        let current: any = newData;

        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        setExtractedData(newData);
    };

    const handleTractocamionSelect = (item: any) => {
        if (!extractedData) return;
        const newData = { ...extractedData };
        // Populate fields from Tractocamion
        newData.autotransporte.placaVehiculo = item.placa;
        newData.autotransporte.modeloAnio = parseInt(item.modelo) || new Date().getFullYear();
        newData.autotransporte.aseguradora = item.aseguradora || "";
        newData.autotransporte.numPolizaSeguro = item.numeroPoliza || "";
        newData.autotransporte.configVehicular = item.configuracionVehicular || "";
        // You might also want to set permSCT if available in catalog
        setExtractedData(newData);
    };

    const handleOperadorSelect = (item: any) => {
        if (!extractedData) return;
        const newData = { ...extractedData };
        newData.operador.nombre = `${item.nombre} ${item.apellidoPaterno} ${item.apellidoMaterno || ""}`.trim();
        newData.operador.rfc = item.rfc || "";
        newData.operador.licencia = item.licencia || "";
        setExtractedData(newData);
    };

    const handleMarkReady = async () => {
        if (!unwrappedParams || !extractedData) return;

        setSaving(true);
        try {
            await fetch(`/api/jobs/${unwrappedParams.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "READY",
                    extractedJson: JSON.stringify(extractedData),
                }),
            });

            router.push("/");
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleEmit = async () => {
        if (!unwrappedParams) return;

        const confirm = window.confirm(
            "¿Estás seguro de timbrar este CFDI? Una vez timbrado no puede ser reversado."
        );

        if (!confirm) return;

        setEmitting(true);
        try {
            const response = await fetch(`/api/jobs/${unwrappedParams.id}/emit`, {
                method: "POST",
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ CFDI Timbrado\nFolio: ${data.folio}\nUUID: ${data.uuid}\n\nDescargando PDF y XML...`);

                // Refresh job to get facturamaId
                await fetchJob();

                // Trigger automatic downloads
                if (data.facturamaId) {
                    // Download PDF
                    const pdfLink = document.createElement('a');
                    pdfLink.href = `/api/download/${data.facturamaId}/pdf`;
                    pdfLink.download = `CFDI_${data.folio}.pdf`;
                    document.body.appendChild(pdfLink);
                    pdfLink.click();
                    document.body.removeChild(pdfLink);

                    // Download XML (with slight delay)
                    setTimeout(() => {
                        const xmlLink = document.createElement('a');
                        xmlLink.href = `/api/download/${data.facturamaId}/xml`;
                        xmlLink.download = `CFDI_${data.folio}.xml`;
                        document.body.appendChild(xmlLink);
                        xmlLink.click();
                        document.body.removeChild(xmlLink);
                    }, 500);
                }
            } else {
                alert(`❌ Error al timbrar:\n${data.error}`);
                await fetchJob(); // Refresh to show FAILED status
            }
        } catch (error) {
            console.error("Emission error:", error);
            alert("Error de conexión al servidor");
        } finally {
            setEmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!job || !extractedData) {
        return (
            <div className="min-h-screen bg-background p-8">
                <p>Job no encontrado o sin datos extraídos.</p>
            </div>
        );
    }

    const ConfidenceIndicator = ({ score }: { score: number }) => {
        const level = getConfidenceLevel(score);

        if (level === "high") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    High
                </span>
            );
        }
        if (level === "medium") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Medium
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                Low
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <header className="mb-8">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
                </button>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Revisar Datos Extraídos</h1>
                        <p className="text-muted-foreground mt-1">
                            {job.status === "NEEDS_REVIEW" && "Verifica y edita los datos antes de marcarlos como listos"}
                            {job.status === "READY" && "Datos verificados - Listo para timbrar"}
                            {job.status === "ISSUED" && "CFDI Timbrado exitosamente"}
                            {job.status === "FAILED" && "Error en el timbrado"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {job.status === "NEEDS_REVIEW" && (
                            <>
                                <button
                                    onClick={handleMarkReady}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-medium disabled:opacity-50 shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Guardando..." : "Marcar como LISTO"}
                                </button>
                                <button
                                    onClick={async () => {
                                        // First mark as ready, then emit
                                        if (!unwrappedParams || !extractedData) return;
                                        setSaving(true);
                                        try {
                                            await fetch(`/api/jobs/${unwrappedParams.id}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    status: "READY",
                                                    extractedJson: JSON.stringify(extractedData),
                                                }),
                                            });
                                            setSaving(false);
                                            // Now emit
                                            handleEmit();
                                        } catch (error) {
                                            console.error("Failed to save:", error);
                                            alert("Error al guardar");
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving || emitting}
                                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 shadow-sm"
                                >
                                    <Rocket className="w-4 h-4" />
                                    {saving || emitting ? "Procesando..." : "Guardar y Emitir"}
                                </button>
                            </>
                        )}
                        {job.status === "READY" && (
                            <button
                                onClick={handleEmit}
                                disabled={emitting}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 shadow-sm"
                            >
                                {emitting ? (
                                    <span className="flex items-center gap-2">Timbrando...</span>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" /> Timbrar CFDI
                                    </>
                                )}
                            </button>
                        )}
                        {job.status === "ISSUED" && (
                            <div className="px-6 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Timbrado - UUID: {job.uuid || "N/A"}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="space-y-6 max-w-6xl">
                {/* 1. CFDI / Receptor */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-xl font-bold mb-6 pb-2 border-b border-border">
                        <FileText className="w-5 h-5 text-primary" />
                        Datos del Receptor (Cliente)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">RFC</label>
                                <ConfidenceIndicator score={extractedData.confidence["receptor.rfc"] || 0} />
                            </div>
                            <input
                                type="text"
                                value={extractedData.receptor.rfc}
                                onChange={(e) => handleFieldChange("receptor.rfc", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium">Nombre / Razón Social</label>
                                <ConfidenceIndicator score={extractedData.confidence["receptor.nombre"] || 0} />
                            </div>
                            <input
                                type="text"
                                value={extractedData.receptor.nombre}
                                onChange={(e) => handleFieldChange("receptor.nombre", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Código Postal Fiscal
                            </label>
                            <input
                                type="text"
                                value={extractedData.receptor.codigoPostal}
                                onChange={(e) => handleFieldChange("receptor.codigoPostal", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Régimen Fiscal
                            </label>
                            <CatalogSelect
                                catalog="regimes"
                                value={extractedData.receptor.regimenFiscal}
                                onChange={(value) => handleFieldChange("receptor.regimenFiscal", value)}
                                placeholder="Seleccionar régimen fiscal"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Ubicaciones (Origen / Destino) */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-xl font-bold mb-6 pb-2 border-b border-border">
                        <MapPin className="w-5 h-5 text-primary" />
                        Ubicaciones (Origen → Destino)
                    </h2>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-semibold">Origen</h3>
                            <ConfidenceIndicator score={extractedData.confidence["ubicaciones.origen"] || 0} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.nombre}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.nombre", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">RFC (opcional)</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.rfc || ""}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.rfc", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Código Postal</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.codigoPostal}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.codigoPostal", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado</label>
                                <CatalogSelect
                                    catalog="states"
                                    value={extractedData.ubicaciones.origen.estado}
                                    onChange={(value) => handleFieldChange("ubicaciones.origen.estado", value)}
                                    placeholder="Seleccionar estado"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-semibold">Destino</h3>
                            <ConfidenceIndicator score={extractedData.confidence["ubicaciones.destino"] || 0} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.destino.nombre}
                                    onChange={(e) => handleFieldChange("ubicaciones.destino.nombre", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Código Postal</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.destino.codigoPostal}
                                    onChange={(e) => handleFieldChange("ubicaciones.destino.codigoPostal", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado</label>
                                <CatalogSelect
                                    catalog="states"
                                    value={extractedData.ubicaciones.destino.estado}
                                    onChange={(value) => handleFieldChange("ubicaciones.destino.estado", value)}
                                    placeholder="Seleccionar estado"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Mercancías */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="flex items-center gap-2 text-xl font-bold mb-6 pb-2 border-b border-border">
                        <Package className="w-5 h-5 text-primary" />
                        Mercancías
                        <ConfidenceIndicator score={extractedData.confidence["mercancias"] || 0} />
                    </h2>
                    {extractedData.mercancias.map((item, index) => (
                        <div key={index} className="mb-4 p-4 border border-border rounded-lg bg-background/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium">Clave Producto/Servicio (SAT)</label>
                                        {!item.claveProdServ && (
                                            <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-medium">
                                                ⚠️ Requiere selección
                                            </span>
                                        )}
                                    </div>
                                    <CatalogSelect
                                        catalog="products"
                                        value={item.claveProdServ || ""}
                                        onChange={(value) => handleFieldChange(`mercancias.${index}.claveProdServ`, value)}
                                        placeholder="Buscar clave de producto/servicio"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={item.descripcion}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.descripcion`, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cantidad</label>
                                    <input
                                        type="number"
                                        value={item.cantidad}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.cantidad`, Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium">Clave Unidad (SAT)</label>
                                        {!item.claveUnidad && (
                                            <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-medium">
                                                ⚠️ Requerido
                                            </span>
                                        )}
                                    </div>
                                    <CatalogSelect
                                        catalog="units"
                                        value={item.claveUnidad || ""}
                                        onChange={(value) => handleFieldChange(`mercancias.${index}.claveUnidad`, value)}
                                        placeholder="Seleccionar unidad"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Unidad (descripción)</label>
                                    <input
                                        type="text"
                                        value={item.unidad}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.unidad`, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Peso (KG)</label>
                                    <input
                                        type="number"
                                        value={item.pesoKg}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.pesoKg`, Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Valor Mercancía</label>
                                    <input
                                        type="number"
                                        value={item.valorMercancia}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.valorMercancia`, Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Moneda</label>
                                    <select
                                        value={item.moneda || "MXN"}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.moneda`, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    >
                                        <option value="MXN">MXN</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Material Peligroso</label>
                                    <select
                                        value={item.materialPeligroso || "No"}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.materialPeligroso`, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    >
                                        <option value="No">No</option>
                                        <option value="Sí">Sí</option>
                                    </select>
                                </div>
                                {item.materialPeligroso === "Sí" && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Clave Mat. Peligroso</label>
                                        <input
                                            type="text"
                                            value={item.cveMaterialPeligroso || ""}
                                            onChange={(e) => handleFieldChange(`mercancias.${index}.cveMaterialPeligroso`, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border bg-background"
                                            placeholder="Ej: 1263"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Embalaje</label>
                                    <input
                                        type="text"
                                        value={item.embalaje || ""}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.embalaje`, e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                        placeholder="Ej: 4H2"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 4. Autotransporte */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-2 border-b border-border">
                        <h2 className="flex items-center gap-2 text-xl font-bold">
                            <Truck className="w-5 h-5 text-primary" />
                            Autotransporte
                            <ConfidenceIndicator score={extractedData.confidence["autotransporte"] || 0} />
                        </h2>
                        <div className="w-full md:w-1/3">
                            <FleetSelect
                                type="tractocamiones"
                                onSelect={handleTractocamionSelect}
                                placeholder="Seleccionar del catálogo..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Placa Vehículo</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.placaVehiculo}
                                onChange={(e) => handleFieldChange("autotransporte.placaVehiculo", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Modelo/Año</label>
                            <input
                                type="number"
                                value={extractedData.autotransporte.modeloAnio}
                                onChange={(e) => handleFieldChange("autotransporte.modeloAnio", Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Aseguradora</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.aseguradora || ""}
                                onChange={(e) => handleFieldChange("autotransporte.aseguradora", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Número de Póliza</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.numPolizaSeguro || ""}
                                onChange={(e) => handleFieldChange("autotransporte.numPolizaSeguro", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Permiso SCT</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.permSCT || ""}
                                onChange={(e) => handleFieldChange("autotransporte.permSCT", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Ej: TPAF01"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Núm. Permiso SCT</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.numPermisoSCT || ""}
                                onChange={(e) => handleFieldChange("autotransporte.numPermisoSCT", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Config Vehicular</label>
                            <CatalogSelect
                                catalog="vehiculos"
                                value={extractedData.autotransporte.configVehicular || ""}
                                onChange={(value) => handleFieldChange("autotransporte.configVehicular", value)}
                                placeholder="Seleccionar configuración"
                            />
                        </div>
                    </div>
                </section>

                {/* 5. Operador */}
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-2 border-b border-border">
                        <h2 className="flex items-center gap-2 text-xl font-bold">
                            <User className="w-5 h-5 text-primary" />
                            Operador
                            <ConfidenceIndicator score={extractedData.confidence["operador"] || 0} />
                        </h2>
                        <div className="w-full md:w-1/3">
                            <FleetSelect
                                type="operadores"
                                onSelect={handleOperadorSelect}
                                placeholder="Seleccionar del catálogo..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input
                                type="text"
                                value={extractedData.operador.nombre}
                                onChange={(e) => handleFieldChange("operador.nombre", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">RFC</label>
                            <input
                                type="text"
                                value={extractedData.operador.rfc}
                                onChange={(e) => handleFieldChange("operador.rfc", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">No. Licencia</label>
                            <input
                                type="text"
                                value={extractedData.operador.licencia}
                                onChange={(e) => handleFieldChange("operador.licencia", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
