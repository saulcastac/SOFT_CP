"use client";

import { useEffect, useState, useCallback } from "react";

type CatalogOption = {
    value: string;
    name: string;
    description?: string;
};

type CatalogSelectProps = {
    catalog: "products" | "units" | "regimes" | "states";
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
};

export default function CatalogSelect({
    catalog,
    value,
    onChange,
    placeholder = "Seleccionar...",
    className = "",
    disabled = false,
}: CatalogSelectProps) {
    const [options, setOptions] = useState<CatalogOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    // Fetch catalog options
    const fetchOptions = useCallback(async (keyword: string = "") => {
        setLoading(true);
        try {
            const url = keyword
                ? `/api/catalogs/${catalog}?keyword=${encodeURIComponent(keyword)}`
                : `/api/catalogs/${catalog}`;

            const response = await fetch(url);
            const data = await response.json();

            if (Array.isArray(data)) {
                setOptions(data);
            }
        } catch (error) {
            console.error("Failed to fetch catalog:", error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [catalog]);

    // Load initial options
    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchOptions(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, isOpen, fetchOptions]);

    // Find selected option
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative">
            {/* Selected value display */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-left flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
                    } ${className}`}
            >
                <span className={value ? "text-foreground" : "text-muted-foreground"}>
                    {selectedOption
                        ? `${selectedOption.value} - ${selectedOption.name}`
                        : placeholder}
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search input */}
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

                    {/* Options list */}
                    <div className="overflow-y-auto max-h-48">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Cargando...
                            </div>
                        ) : options.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No se encontraron resultados
                            </div>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${option.value === value ? "bg-primary/10 text-primary" : ""
                                        }`}
                                >
                                    <div className="font-medium">{option.value}</div>
                                    <div className="text-xs text-muted-foreground truncate">
                                        {option.name}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                        setIsOpen(false);
                        setSearchTerm("");
                    }}
                />
            )}
        </div>
    );
}
