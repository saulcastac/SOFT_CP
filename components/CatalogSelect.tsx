"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

type CatalogOption = {
    value: string;
    name: string;
    description?: string;
};

type CatalogSelectProps = {
    catalog: "products" | "units" | "regimes" | "states" | "vehiculos" | "remolques";
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

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

    // Update coordinates when opening
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4, // 4px gap
                left: rect.left + window.scrollX,
                width: rect.width,
            });
        }
    }, [isOpen]);

    // Verify window resize to close or adjust? 
    // Simple fix: close on resize to avoid misalignment
    useEffect(() => {
        const handleResize = () => setIsOpen(false);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Find selected option
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative">
            {/* Selected value display */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-left flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
                    } ${className} relative`} // Added relative to ensure button works
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

            {/* Dropdown - Using Portal */}
            {isOpen && !disabled && (
                typeof document !== "undefined" ? createPortal(
                    <div
                        className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-lg flex flex-col"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                            maxHeight: "300px", // Limit height
                        }}
                    >
                        {/* Search input */}
                        <div className="p-2 border-b border-border">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full px-3 py-1.5 text-sm rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        </div>

                        {/* Options list */}
                        <div className="overflow-y-auto flex-1">
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
                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${option.value === value ? "bg-primary/10 text-primary" : "text-foreground"
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

                        {/* Backdrop to handle clicks outside - Transparent fixed cover */}
                        <div
                            className="fixed inset-0 z-[-1]"
                            onClick={() => {
                                setIsOpen(false);
                                setSearchTerm("");
                            }}
                        />
                    </div>,
                    document.body
                ) : null
            )}

            {/* Global backdrop for clicking outside (redundant if using z-[-1] trick but needed for safety) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[50] bg-transparent"
                    style={{ pointerEvents: 'auto' }} // Capture clicks
                    onClick={() => {
                        setIsOpen(false);
                        setSearchTerm("");
                    }}
                />
            )}
            {/* 
                Correction: The Portal's internal backdrop z-[-1] approach is risky if there are other z-indexes. 
                Better approach: 
                Render the Menu in a Portal.
                Render a transparent Backdrop in a Portal (or same portal) that covers screen.
                Z-index of Menu > Backdrop.
            */}
        </div>
    );
}
