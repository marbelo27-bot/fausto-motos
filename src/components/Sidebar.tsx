"use client";
import Image from "next/image";
import { useState } from "react";

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "clients", label: "Clientes", icon: "👥" },
  { id: "motorcycles", label: "Motos", icon: "🏍️" },
  { id: "reception", label: "Recepción", icon: "📋" },
  { id: "serviceOrders", label: "Órdenes de Servicio", icon: "🔧" },
  { id: "quotes", label: "Cotizaciones", icon: "📝" },
  { id: "parts", label: "Repuestos", icon: "⚙️" },
  { id: "payments", label: "Pagos", icon: "💰" },
];

export default function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        {!logoError ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 56 }}>
            <Image
              src="/logo.svg"
              alt="Logo del Taller"
              width={160}
              height={56}
              style={{ objectFit: "contain", maxWidth: "100%" }}
              onError={() => setLogoError(true)}
              priority
            />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #2596be, #1a7a9e)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20
            }}>🏍️</div>
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                FAUSTO MOTOS
              </div>
              <div style={{ color: "#64748b", fontSize: 11 }}>Sistema de Gestión</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: "12px 0" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none" }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        color: "#475569", fontSize: 11, textAlign: "center"
      }}>
        v1.0.0 © 2025
      </div>
    </div>
  );
}
