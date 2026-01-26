"use client";

import { useState } from "react";
import { Truck, Container, Link, User } from "lucide-react";
import TractocamionesTab from "./tabs/TractocamionesTab";
import PlataformasTab from "./tabs/PlataformasTab";
import DollysTab from "./tabs/DollysTab";
import OperadoresTab from "./tabs/OperadoresTab";

type Tab = "tractocamiones" | "plataformas" | "dollys" | "operadores";

export default function FlotaPage() {
    const [activeTab, setActiveTab] = useState<Tab>("tractocamiones");

    const tabs = [
        { id: "tractocamiones" as Tab, label: "Tractocamiones", icon: <Truck className="w-5 h-5" /> },
        { id: "plataformas" as Tab, label: "Plataformas", icon: <Container className="w-5 h-5" /> },
        { id: "dollys" as Tab, label: "Dollys", icon: <Link className="w-5 h-5" /> },
        { id: "operadores" as Tab, label: "Operadores", icon: <User className="w-5 h-5" /> },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Gestión de Flota</h1>
                <p className="text-muted-foreground">
                    Administra tus vehículos y operadores
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6">
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors rounded-t-lg ${activeTab === tab.id
                                ? "bg-card text-primary border-b-2 border-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "tractocamiones" && <TractocamionesTab />}
                {activeTab === "plataformas" && <PlataformasTab />}
                {activeTab === "dollys" && <DollysTab />}
                {activeTab === "operadores" && <OperadoresTab />}
            </div>
        </div>
    );
}
