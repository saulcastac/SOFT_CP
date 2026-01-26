"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Rocket, Truck, Building2 } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

type NavItem = {
    label: string;
    href: string;
    icon: ReactNode;
};

const navItems: NavItem[] = [
    {
        label: "Emitir Carta Porte",
        href: "/",
        icon: <Rocket className="w-5 h-5" />,
    },
    {
        label: "Flota",
        href: "/flota",
        icon: <Truck className="w-5 h-5" />,
    },
    {
        label: "Perfil Emisor",
        href: "/perfil",
        icon: <Building2 className="w-5 h-5" />,
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-foreground">Carta Porte</h1>
                <p className="text-sm text-muted-foreground">Copilot</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-xs text-muted-foreground">Tema</span>
                    <ModeToggle />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                    © 2026 RTC Transporte
                </p>
            </div>
        </aside>
    );
}
