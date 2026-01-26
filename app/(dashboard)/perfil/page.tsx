"use client";

import { useEffect, useState } from "react";
import { Building2, Save, CheckCircle, AlertCircle } from "lucide-react";
import CatalogSelect from "@/components/CatalogSelect";

type EmisorData = {
    rfc: string;
    nombre: string;
    regimenFiscal: string;
    codigoPostal: string;
    calle?: string;
    numeroExterior?: string;
    numeroInterior?: string;
    colonia?: string;
    municipio?: string;
    estado?: string;
};

export default function PerfilPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [formData, setFormData] = useState<EmisorData>({
        rfc: "",
        nombre: "",
        regimenFiscal: "",
        codigoPostal: "",
        calle: "",
        numeroExterior: "",
        numeroInterior: "",
        colonia: "",
        municipio: "",
        estado: "",
    });

    useEffect(() => {
        fetchEmisor();
    }, []);

    const fetchEmisor = async () => {
        try {
            const response = await fetch("/api/emisor");
            const data = await response.json();
            if (data.exists && data.data) {
                setFormData({
                    rfc: data.data.rfc || "",
                    nombre: data.data.nombre || "",
                    regimenFiscal: data.data.regimenFiscal || "",
                    codigoPostal: data.data.codigoPostal || "",
                    calle: data.data.calle || "",
                    numeroExterior: data.data.numeroExterior || "",
                    numeroInterior: data.data.numeroInterior || "",
                    colonia: data.data.colonia || "",
                    municipio: data.data.municipio || "",
                    estado: data.data.estado || "",
                });
            }
        } catch (error) {
            console.error("Error fetching emisor:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch("/api/emisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setMessage({ type: "success", text: "Datos guardados exitosamente" });
            } else {
                setMessage({ type: "error", text: data.error || "Error al guardar" });
            }
        } catch (error) {
            console.error("Error saving emisor:", error);
            setMessage({ type: "error", text: "Error de conexión" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-primary" />
                    Perfil del Emisor
                </h1>
                <p className="text-muted-foreground mt-2">
                    Configura los datos fiscales de tu empresa para la emisión de Cartas Porte.
                </p>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === "success"
                            ? "bg-green-500/10 text-green-600 border border-green-500/20"
                            : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                >
                    {message.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Datos Fiscales (Required) */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Datos Fiscales (Requeridos)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">RFC *</label>
                            <input
                                required
                                type="text"
                                value={formData.rfc}
                                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                placeholder="ABC123456XYZ"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                maxLength={13}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Razón Social *</label>
                            <input
                                required
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Mi Empresa S.A. de C.V."
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Régimen Fiscal *</label>
                            <CatalogSelect
                                catalog="regimes"
                                value={formData.regimenFiscal}
                                onChange={(value) => setFormData({ ...formData, regimenFiscal: value })}
                                placeholder="Seleccionar régimen"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Código Postal de Expedición *</label>
                            <input
                                required
                                type="text"
                                value={formData.codigoPostal}
                                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                                placeholder="64000"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                maxLength={5}
                            />
                        </div>
                    </div>
                </section>

                {/* Domicilio (Optional) */}
                <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Domicilio Fiscal (Opcional)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Calle</label>
                            <input
                                type="text"
                                value={formData.calle || ""}
                                onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
                                placeholder="Av. Principal"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">No. Exterior</label>
                            <input
                                type="text"
                                value={formData.numeroExterior || ""}
                                onChange={(e) => setFormData({ ...formData, numeroExterior: e.target.value })}
                                placeholder="123"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">No. Interior</label>
                            <input
                                type="text"
                                value={formData.numeroInterior || ""}
                                onChange={(e) => setFormData({ ...formData, numeroInterior: e.target.value })}
                                placeholder="A"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Colonia</label>
                            <input
                                type="text"
                                value={formData.colonia || ""}
                                onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                                placeholder="Centro"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Municipio</label>
                            <input
                                type="text"
                                value={formData.municipio || ""}
                                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                                placeholder="Monterrey"
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Estado</label>
                            <CatalogSelect
                                catalog="states"
                                value={formData.estado || ""}
                                onChange={(value) => setFormData({ ...formData, estado: value })}
                                placeholder="Seleccionar estado"
                            />
                        </div>
                    </div>
                </section>

                {/* Submit */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
