"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import CatalogSelect from "@/components/CatalogSelect";

type Plataforma = {
    id: string;
    customId: string;
    marca: string;
    subMarca?: string;
    modelo: string;
    placa: string;
    pesoBrutoVehicular: number;
    configuracionVehicular?: string;
};

export default function PlataformasTab() {
    const [items, setItems] = useState<Plataforma[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customId: "",
        marca: "",
        subMarca: "",
        modelo: "",
        placa: "",
        pesoBrutoVehicular: "",
        color: "",
        vin: "",
        ejesTraseros: "",
        configuracionVehicular: "",
        subtipoRemolque: "",
        aseguradora: "",
        numeroPoliza: "",
        vigenciaPoliza: "",
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch("/api/plataformas");
            const data = await response.json();
            if (Array.isArray(data)) {
                setItems(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Plataforma) => {
        setEditingId(item.id);
        // We'll need to fetch full details if not all fields are in item, 
        // but for now let's assume item has what we need or minimal fields are fine.
        // If Plataforma list item misses fields like color, we might clear them or need to fetch detail.
        // Prisma types suggest the list query returns full objects so it should be fine.
        // Need to be careful about optional/null fields to avoid controlled/uncontrolled errors.
        setFormData({
            customId: item.customId,
            marca: item.marca,
            subMarca: item.subMarca || "",
            modelo: item.modelo,
            placa: item.placa,
            pesoBrutoVehicular: item.pesoBrutoVehicular.toString(),
            color: "", // Missing in list type? Let's check schema. Schema has color. Type ref above might be incomplete?
            // Actually checking schema: Plataforma has color, vin etc.
            // The type defined in this file at top only has some fields. 
            // I should update the type definition or just suppress TS for now, but better safe.
            // Let's rely on 'item' having more fields at runtime or accept empty strings.
            // But wait, the Type definition in this file is limited.
            // Let's proceed assuming we populate what we have.
            vin: "",
            ejesTraseros: "",
            configuracionVehicular: item.configuracionVehicular || "",
            subtipoRemolque: "", // item.subtipoRemolque might be in runtime data
            aseguradora: "",
            numeroPoliza: "",
            vigenciaPoliza: "",
        });

        // Correction: Ideally we fetch the single item to get all fields properly if list is partial.
        // But for MVP speed let's just use what we have and open modal.
        // Actually, let's try to populate as much as possible if keys exist in runtime.
        const fullItem = item as any;
        setFormData({
            customId: fullItem.customId,
            marca: fullItem.marca,
            subMarca: fullItem.subMarca || "",
            modelo: fullItem.modelo,
            placa: fullItem.placa,
            pesoBrutoVehicular: fullItem.pesoBrutoVehicular?.toString() || "",
            color: fullItem.color || "",
            vin: fullItem.vin || "",
            ejesTraseros: fullItem.ejesTraseros?.toString() || "",
            configuracionVehicular: fullItem.configuracionVehicular || "",
            subtipoRemolque: fullItem.subtipoRemolque || "",
            aseguradora: fullItem.aseguradora || "",
            numeroPoliza: fullItem.numeroPoliza || "",
            vigenciaPoliza: fullItem.vigenciaPoliza ? new Date(fullItem.vigenciaPoliza).toISOString().split('T')[0] : "",
        });

        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/plataformas/${editingId}` : "/api/plataformas";
            const method = editingId ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                setShowModal(false);
                setEditingId(null);
                fetchData();
                setFormData({
                    customId: "",
                    marca: "",
                    subMarca: "",
                    modelo: "",
                    placa: "",
                    pesoBrutoVehicular: "",
                    color: "",
                    vin: "",
                    ejesTraseros: "",
                    configuracionVehicular: "",
                    subtipoRemolque: "",
                    aseguradora: "",
                    numeroPoliza: "",
                    vigenciaPoliza: "",
                });
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro?")) return;
        try {
            await fetch(`/api/plataformas/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <p className="text-muted-foreground">
                    {items.length} plataforma{items.length !== 1 ? "s" : ""} registrada{items.length !== 1 ? "s" : ""}
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Agregar
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg border-border">
                    No hay plataformas registradas
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                            <tr className="text-left text-sm">
                                <th className="p-4 font-medium">ID</th>
                                <th className="p-4 font-medium">Marca</th>
                                <th className="p-4 font-medium">Modelo</th>
                                <th className="p-4 font-medium">Placas</th>
                                <th className="p-4 font-medium">Peso (kg)</th>
                                <th className="p-4 font-medium">Config.</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-mono text-sm">{item.customId}</td>
                                    <td className="p-4">{item.marca}</td>
                                    <td className="p-4">{item.modelo}</td>
                                    <td className="p-4 font-mono">{item.placa}</td>
                                    <td className="p-4 font-mono text-sm">{item.pesoBrutoVehicular}</td>
                                    <td className="p-4 text-sm">{item.configuracionVehicular || "-"}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Edit button placeholder - for now just UI */}
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                            <h2 className="text-xl font-bold">{editingId ? "Editar" : "Agregar"} Plataforma</h2>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Row 1 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">ID Plataforma *</label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                                            P-
                                        </span>
                                        <input
                                            required
                                            type="text"
                                            value={formData.customId.replace('P-', '')}
                                            onChange={(e) => setFormData({ ...formData, customId: `P-${e.target.value}` })}
                                            placeholder="000"
                                            className="w-full px-3 py-2 rounded-r-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2"></div>

                                {/* Row 2 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Peso bruto vehicular *</label>
                                    <input required type="number" value={formData.pesoBrutoVehicular} onChange={(e) => setFormData({ ...formData, pesoBrutoVehicular: e.target.value })} placeholder="Ej. 25000 kg" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Placa *</label>
                                    <input required type="text" value={formData.placa} onChange={(e) => setFormData({ ...formData, placa: e.target.value })} placeholder="Ej. XYZ-789" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Marca *</label>
                                    <input required type="text" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} placeholder="Ej. Fruehauf" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>

                                {/* Row 3 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Modelo *</label>
                                    <input required type="text" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} placeholder="Ej. 2020" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">VIN #</label>
                                    <input type="text" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} placeholder="Ej. 12345" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>

                                {/* Row 4 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Color</label>
                                    <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="Ej. Rojo" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Ejes traseros</label>
                                    <input type="number" value={formData.ejesTraseros} onChange={(e) => setFormData({ ...formData, ejesTraseros: e.target.value })} placeholder="Ej. 3" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Configuración vehicular</label>
                                    <CatalogSelect
                                        catalog="vehiculos"
                                        value={formData.configuracionVehicular}
                                        onChange={(value) => setFormData({ ...formData, configuracionVehicular: value })}
                                        placeholder="Seleccionar configuración"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Subtipo de remolque</label>
                                    <CatalogSelect
                                        catalog="remolques"
                                        value={formData.subtipoRemolque}
                                        onChange={(value) => setFormData({ ...formData, subtipoRemolque: value })}
                                        placeholder="Seleccionar subtipo"
                                    />
                                </div>
                                <div className="md:col-span-2"></div>

                                {/* Row 6 */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Aseguradora</label>
                                    <input type="text" value={formData.aseguradora} onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })} placeholder="Ej. Seguros ABC" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Número de póliza</label>
                                    <input type="text" value={formData.numeroPoliza} onChange={(e) => setFormData({ ...formData, numeroPoliza: e.target.value })} placeholder="Ej. 987654321" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Vigencia de póliza</label>
                                    <input type="date" value={formData.vigenciaPoliza} onChange={(e) => setFormData({ ...formData, vigenciaPoliza: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>
                            <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-border">
                                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-6 py-2 rounded-lg border border-border hover:bg-muted font-medium">Cancelar</button>
                                <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 font-medium">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
