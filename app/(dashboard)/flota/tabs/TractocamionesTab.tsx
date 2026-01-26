"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import CatalogSelect from "@/components/CatalogSelect";

type Tractocamion = {
    id: string;
    customId: string;
    marca: string;
    subMarca?: string;
    modelo: string;
    placa: string;
    pesoBrutoVehicular: number;
    vin?: string;
    configuracionVehicular?: string;
};

export default function TractocamionesTab() {
    const [items, setItems] = useState<Tractocamion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customId: "",
        marca: "",
        subMarca: "",
        modelo: "",
        placa: "",
        kilometrajeInicial: "",
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
            const response = await fetch("/api/tractocamiones");
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

    const handleEdit = (item: Tractocamion) => {
        setEditingId(item.id);
        setFormData({
            customId: item.customId,
            marca: item.marca,
            subMarca: item.subMarca || "",
            modelo: item.modelo,
            placa: item.placa,
            kilometrajeInicial: "", // Often optional or not in list view, keeping empty for now
            pesoBrutoVehicular: item.pesoBrutoVehicular.toString(),
            color: "", // Not in list view type, might need to be optional
            vin: item.vin || "",
            ejesTraseros: "",
            configuracionVehicular: item.configuracionVehicular || "",
            subtipoRemolque: "",
            aseguradora: "",
            numeroPoliza: "",
            vigenciaPoliza: "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/tractocamiones/${editingId}` : "/api/tractocamiones";
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
                // Reset form
                setFormData({
                    customId: "",
                    marca: "",
                    subMarca: "",
                    modelo: "",
                    placa: "",
                    kilometrajeInicial: "",
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
        if (!confirm("¿Estás seguro de eliminar este registro?")) return;
        try {
            await fetch(`/api/tractocamiones/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <p className="text-muted-foreground">
                    {items.length} tractocamion{items.length !== 1 ? "es" : ""} registrado{items.length !== 1 ? "s" : ""}
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    + Agregar
                </button>
            </div>

            {loading ? (
                <div className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    No hay tractocamiones registrados
                </div>
            ) : (
                <div className="rounded-xl border bg-card overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr className="text-left text-sm">
                                <th className="p-4 font-medium">ID</th>
                                <th className="p-4 font-medium">Marca</th>
                                <th className="p-4 font-medium">Modelo</th>
                                <th className="p-4 font-medium">Placa</th>
                                <th className="p-4 font-medium">VIN</th>
                                <th className="p-4 font-medium">Config.</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-mono text-sm">{item.customId}</td>
                                    <td className="p-4">
                                        {item.marca} {item.subMarca && <span className="text-muted-foreground">({item.subMarca})</span>}
                                    </td>
                                    <td className="p-4">{item.modelo}</td>
                                    <td className="p-4 font-mono">{item.placa}</td>
                                    <td className="p-4 font-mono text-xs text-muted-foreground">{item.vin || "-"}</td>
                                    <td className="p-4 text-sm">{item.configuracionVehicular || "-"}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border shadow-lg">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingId ? "Editar" : "Agregar"} Tractocamión</h2>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">ID *</label>
                                    <input required type="text" value={formData.customId} onChange={(e) => setFormData({ ...formData, customId: e.target.value })} placeholder="R-147" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Marca *</label>
                                    <input required type="text" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} placeholder="Scania" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Sub Marca</label>
                                    <input type="text" value={formData.subMarca} onChange={(e) => setFormData({ ...formData, subMarca: e.target.value })} placeholder="R500" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Modelo *</label>
                                    <input required type="text" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} placeholder="2023" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Placa *</label>
                                    <input required type="text" value={formData.placa} onChange={(e) => setFormData({ ...formData, placa: e.target.value })} placeholder="90BH1Y" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Peso Bruto (kg) *</label>
                                    <input required type="number" value={formData.pesoBrutoVehicular} onChange={(e) => setFormData({ ...formData, pesoBrutoVehicular: e.target.value })} placeholder="66500" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Color</label>
                                    <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} placeholder="Blanco" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">VIN</label>
                                    <input type="text" value={formData.vin} onChange={(e) => setFormData({ ...formData, vin: e.target.value })} placeholder="ABC123XYZ" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Aseguradora</label>
                                    <input type="text" value={formData.aseguradora} onChange={(e) => setFormData({ ...formData, aseguradora: e.target.value })} placeholder="AXA" className="w-full px-3 py-2 rounded-lg border bg-background" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Configuración vehicular</label>
                                    <CatalogSelect
                                        catalog="vehiculos"
                                        value={formData.configuracionVehicular}
                                        onChange={(value) => setFormData({ ...formData, configuracionVehicular: value })}
                                        placeholder="Seleccionar configuración"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex gap-3 justify-end">
                                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-6 py-2 rounded-lg border hover:bg-muted">Cancelar</button>
                                <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
