"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

    const getConfidenceColor = (confidence: number) => {
        const level = getConfidenceLevel(confidence);
        if (level === "high") return "text-green-500";
        if (level === "medium") return "text-yellow-500";
        return "text-red-500";
    };

    const getConfidenceIcon = (confidence: number) => {
        const level = getConfidenceLevel(confidence);
        if (level === "high") return "🟢";
        if (level === "medium") return "🟡";
        return "🔴";
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <header className="mb-8">
                <button
                    onClick={() => router.push("/")}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    ← Volver al Dashboard
                </button>
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Revisar Datos Extraídos</h1>
                        <p className="text-muted-foreground">
                            {job.status === "NEEDS_REVIEW" && "Verifica y edita los datos antes de marcarlos como listos"}
                            {job.status === "READY" && "Datos verificados - Listo para timbrar"}
                            {job.status === "ISSUED" && "CFDI Timbrado exitosamente"}
                            {job.status === "FAILED" && "Error en el timbrado"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {job.status === "NEEDS_REVIEW" && (
                            <button
                                onClick={handleMarkReady}
                                disabled={saving}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Marcar como LISTO"}
                            </button>
                        )}
                        {job.status === "READY" && (
                            <button
                                onClick={handleEmit}
                                disabled={emitting}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                            >
                                {emitting ? "Timbrando..." : "🚀 Timbrar CFDI"}
                            </button>
                        )}
                        {job.status === "ISSUED" && (
                            <div className="px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg font-medium">
                                ✅ Timbrado - UUID: {job.uuid || "N/A"}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="space-y-6 max-w-6xl">
                {/* 1. CFDI / Receptor */}
                <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">📋 Datos del Receptor (Cliente)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                RFC {getConfidenceIcon(extractedData.confidence["receptor.rfc"] || 0)}
                            </label>
                            <input
                                type="text"
                                value={extractedData.receptor.rfc}
                                onChange={(e) => handleFieldChange("receptor.rfc", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Nombre / Razón Social {getConfidenceIcon(extractedData.confidence["receptor.nombre"] || 0)}
                            </label>
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
                            <input
                                type="text"
                                value={extractedData.receptor.regimenFiscal}
                                onChange={(e) => handleFieldChange("receptor.regimenFiscal", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                    </div>
                </section>

                {/* 2. Ubicaciones (Origen / Destino) */}
                <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">📍 Ubicaciones (Origen → Destino)</h2>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Origen {getConfidenceIcon(extractedData.confidence["ubicaciones.origen"] || 0)}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.nombre}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.nombre", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">RFC (opcional)</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.rfc || ""}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.rfc", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Código Postal</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.codigoPostal}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.codigoPostal", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado</label>
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.origen.estado}
                                    onChange={(e) => handleFieldChange("ubicaciones.origen.estado", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-3">Destino {getConfidenceIcon(extractedData.confidence["ubicaciones.destino"] || 0)}</h3>
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
                                <input
                                    type="text"
                                    value={extractedData.ubicaciones.destino.estado}
                                    onChange={(e) => handleFieldChange("ubicaciones.destino.estado", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border bg-background"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Mercancías */}
                <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">📦 Mercancías {getConfidenceIcon(extractedData.confidence["mercancias"] || 0)}</h2>
                    {extractedData.mercancias.map((item, index) => (
                        <div key={index} className="mb-4 p-4 border rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <label className="block text-sm font-medium mb-1">Unidad</label>
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
                                    <label className="block text-sm font-medium mb-1">Valor</label>
                                    <input
                                        type="number"
                                        value={item.valorMercancia}
                                        onChange={(e) => handleFieldChange(`mercancias.${index}.valorMercancia`, Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border bg-background"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 4. Autotransporte */}
                <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">🚛 Autotransporte {getConfidenceIcon(extractedData.confidence["autotransporte"] || 0)}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Placa Vehículo</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.placaVehiculo}
                                onChange={(e) => handleFieldChange("autotransporte.placaVehiculo", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Modelo/Año</label>
                            <input
                                type="number"
                                value={extractedData.autotransporte.modeloAnio}
                                onChange={(e) => handleFieldChange("autotransporte.modeloAnio", Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Aseguradora</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.aseguradora || ""}
                                onChange={(e) => handleFieldChange("autotransporte.aseguradora", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Número de Póliza</label>
                            <input
                                type="text"
                                value={extractedData.autotransporte.numPolizaSeguro || ""}
                                onChange={(e) => handleFieldChange("autotransporte.numPolizaSeguro", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                    </div>
                </section>

                {/* 5. Operador */}
                <section className="rounded-xl border bg-card p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">👤 Operador {getConfidenceIcon(extractedData.confidence["operador"] || 0)}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre</label>
                            <input
                                type="text"
                                value={extractedData.operador.nombre}
                                onChange={(e) => handleFieldChange("operador.nombre", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">RFC</label>
                            <input
                                type="text"
                                value={extractedData.operador.rfc}
                                onChange={(e) => handleFieldChange("operador.rfc", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">No. Licencia</label>
                            <input
                                type="text"
                                value={extractedData.operador.licencia}
                                onChange={(e) => handleFieldChange("operador.licencia", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-background"
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
