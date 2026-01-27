"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

type CatalogOption = {
    value: string;
    name: string;
    description?: string;
};

type CatalogSelectProps = {
    catalog: "products" | "units" | "regimes" | "states" | "vehiculos" | "remolques" | "unidadespeso";
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

    // Update coordinates
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

            setCoords({
                top: rect.bottom + scrollTop + 4,
                left: rect.left + scrollLeft,
                width: rect.width,
            });
        }
    }, []);

    // Handle open/close
    // Use click handler properly to toggle and update position
    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent immediate close

        if (disabled) return;

        if (!isOpen) {
            // Opening
            updatePosition();
            setIsOpen(true);
        } else {
            // Closing
            setIsOpen(false);
        }
    };

    // Update position on scroll/resize when open
    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // Handle click outside with explicit delay to avoid race conditions
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            // Check if click is on the button itself (already handled by toggleOpen)
            if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
                return;
            }

            // Check if click is inside the portal menu
            if ((event.target as Element).closest('.catalog-portal-menu')) {
                return;
            }

            setIsOpen(false);
            setSearchTerm("");
        };

        // Add listener directly - the e.stopPropagation() in toggleOpen handles the immediate conflict
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Update position when options change or loading finishes
    useEffect(() => {
        if (isOpen) {
            updatePosition();
        }
    }, [options, loading, isOpen, updatePosition]);

    // Find selected option
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="relative">
            {/* Selected value display */}
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleOpen}
                disabled={disabled}
                className={`w-full px-3 py-2 rounded-lg border bg-background text-foreground text-left flex items-center justify-between ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
                    } ${className}`}
            >
                <div className="flex-1 truncate mr-2">
                    <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {selectedOption
                            ? `${selectedOption.value} - ${selectedOption.name}`
                            : (value || placeholder)}
                    </span>
                    {selectedOption?.description && selectedOption.description !== selectedOption.name && (
                        <p className="text-xs text-muted-foreground truncate">{selectedOption.description}</p>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown - Using Portal to avoid clipping */}
            {isOpen && !disabled && (
                typeof document !== "undefined" ? createPortal(
                    <div
                        className="catalog-portal-menu fixed z-[99999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-opacity duration-150"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                            maxHeight: "300px",
                            minWidth: "300px", // Made wider for better readability
                            opacity: coords.top ? 1 : 0,
                            visibility: coords.top ? "visible" : "hidden"
                        }}
                    >
                        {/* Search input */}
                        <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()} // Prevent outside click handler
                            />
                        </div>

                        {/* Options list */}
                        <div className="overflow-y-auto flex-1 p-1 bg-white dark:bg-slate-900">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                    Cargando...
                                </div>
                            ) : options.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500">
                                    {catalog === 'products' && !searchTerm
                                        ? "Escriba para buscar..."
                                        : "No se encontraron resultados"}
                                </div>
                            ) : (
                                options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors mb-1 last:mb-0 ${option.value === value
                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs opacity-70 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{option.value}</span>
                                        </div>
                                        <div className="truncate mt-0.5">{option.name}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body
                ) : null
            )}
        </div>
    );
}
