
"use client";

import { useEffect, useState } from "react";

type FleetSelectProps = {
    type: "tractocamiones" | "operadores";
    onSelect: (item: any) => void;
    placeholder?: string;
    className?: string;
};

export default function FleetSelect({
    type,
    onSelect,
    placeholder = "Seleccionar...",
    className = "",
}: FleetSelectProps) {
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // Remove search for now to keep it simple, or add client-side filtering
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/${type}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    setOptions(data);
                }
            } catch (error) {
                console.error(`Failed to fetch ${type}:`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [type]);

    const getDisplayLabel = (item: any) => {
        if (type === "tractocamiones") {
            return `${item.customId} - ${item.marca} ${item.modelo} (${item.placa})`;
        }
        if (type === "operadores") {
            return `${item.customId} - ${item.nombre} ${item.apellidoPaterno}`;
        }
        return JSON.stringify(item);
    };

    const filteredOptions = options.filter(item =>
        getDisplayLabel(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-left flex items-center justify-between hover:border-primary/50"
            >
                <span className={filteredOptions.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                    {placeholder}
                </span>
                <span className="text-xs text-muted-foreground">▼</span>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full px-3 py-1.5 text-sm rounded border bg-background"
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">Cargando...</div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">No hay resultados</div>
                        ) : (
                            filteredOptions.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(item);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                                >
                                    <div className="font-medium">{getDisplayLabel(item)}</div>
                                    {type === "tractocamiones" && (
                                        <div className="text-xs text-muted-foreground">
                                            Placa: {item.placa} • Config: {item.configuracionVehicular}
                                        </div>
                                    )}
                                    {type === "operadores" && (
                                        <div className="text-xs text-muted-foreground">
                                            RFC: {item.rfc} • Lic: {item.licencia}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
