"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import Clients from "@/components/Clients";
import Motorcycles from "@/components/Motorcycles";
import Reception from "@/components/Reception";
import Turnos from "@/components/Turnos";
import ServiceOrders from "@/components/ServiceOrders";
import Parts from "@/components/Parts";
import Payments from "@/components/Payments";
import Quotes from "@/components/Quotes";

type Section = "dashboard" | "clients" | "motorcycles" | "reception" | "turnos" | "serviceOrders" | "parts" | "payments" | "quotes";

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={(s) => setActiveSection(s as Section)} />;
      case "clients":
        return <Clients />;
      case "motorcycles":
        return <Motorcycles />;
      case "reception":
        return <Reception />;
      case "turnos":
        return <Turnos />;
      case "serviceOrders":
        return <ServiceOrders />;
      case "parts":
        return <Parts />;
      case "payments":
        return <Payments />;
      case "quotes":
        return <Quotes />;
      default:
        return <Dashboard onNavigate={(s) => setActiveSection(s as Section)} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activeSection={activeSection} onNavigate={(s) => setActiveSection(s as Section)} />
      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
}
