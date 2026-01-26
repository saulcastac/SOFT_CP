"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";

type Operador = {
    id: string;
    customId: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    rfc?: string;
    licencia?: string;
    activo: boolean;
};

export default function OperadoresTab() {
    const [items, setItems] = useState<Operador[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        rfc: "",
        licencia: "",
        telefono: "",
        email: ""
    });

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch("/api/operadores");
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

    const handleEdit = (item: Operador) => {
        setEditingId(item.id);
        const fullItem = item as any;
        setFormData({
            nombre: fullItem.nombre,
            apellidoPaterno: fullItem.apellidoPaterno,
            apellidoMaterno: fullItem.apellidoMaterno || "",
            rfc: fullItem.rfc || "",
            licencia: fullItem.licencia || "",
            telefono: fullItem.telefono || "",
            email: fullItem.email || ""
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/operadores/${editingId}` : "/api/operadores";
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
                    nombre: "",
                    apellidoPaterno: "",
                    apellidoMaterno: "",
                    rfc: "",
                    licencia: "",
                    telefono: "",
                    email: ""
                });
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro?")) return;
        try {
            await fetch(`/api/operadores/${id}`, { method: "DELETE" });
            fetchData();
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <p className="text-muted-foreground">
                    {items.length} operador{items.length !== 1 ? "es" : ""} registrado{items.length !== 1 ? "s" : ""}
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
                    No hay operadores registrados
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full">
                        <thead className="border-b border-border bg-muted/50">
                            <tr className="text-left text-sm">
                                <th className="p-4 font-medium">ID</th>
                                <th className="p-4 font-medium">Nombre Completo</th>
                                <th className="p-4 font-medium">RFC</th>
                                <th className="p-4 font-medium">Licencia</th>
                                <th className="p-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30">
                                    <td className="p-4 font-mono text-sm">{item.customId}</td>
                                    <td className="p-4">
                                        {item.nombre} {item.apellidoPaterno} {item.apellidoMaterno}
                                    </td>
                                    <td className="p-4 font-mono text-sm">{item.rfc || "-"}</td>
                                    <td className="p-4 font-mono text-sm">{item.licencia || "-"}</td>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingId ? "Editar" : "Agregar"} Operador</h2>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">Nombre(s) *</label>
                                    <input required type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Juan" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">Apellido Paterno *</label>
                                        <input required type="text" value={formData.apellidoPaterno} onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })} placeholder="Ej. Pérez" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">Apellido Materno</label>
                                        <input type="text" value={formData.apellidoMaterno} onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })} placeholder="Ej. López" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border mt-4">
                                    <p className="text-xs text-muted-foreground mb-4">Información Adicional (Opcional)</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-muted-foreground">RFC</label>
                                            <input type="text" value={formData.rfc} onChange={(e) => setFormData({ ...formData, rfc: e.target.value })} placeholder="RFC" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-muted-foreground">Licencia</label>
                                            <input type="text" value={formData.licencia} onChange={(e) => setFormData({ ...formData, licencia: e.target.value })} placeholder="No. Licencia" className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 justify-end">
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
