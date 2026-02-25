"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

export default function Dashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { clients, motorcycles, receptions, serviceOrders, payments, parts } = useStore();
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingOrders = serviceOrders.filter(o => o.status === "pendiente" || o.status === "en proceso").length;
  const completedOrders = serviceOrders.filter(o => o.status === "completado" || o.status === "entregado").length;

  // Earnings breakdown from service orders
  const totalLaborIncome = serviceOrders.reduce((sum, o) => sum + (o.laborCost || 0), 0);
  const totalPartsIncome = serviceOrders.reduce((sum, o) => sum + (o.partsCost || 0), 0);
  const totalEarnings = totalLaborIncome + totalPartsIncome;
  const laborPct = totalEarnings > 0 ? Math.round((totalLaborIncome / totalEarnings) * 100) : 0;
  const partsPct = totalEarnings > 0 ? Math.round((totalPartsIncome / totalEarnings) * 100) : 0;

  // Parts inventory margin
  const totalInventoryCost = parts.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalInventorySale = parts.reduce((sum, p) => sum + p.salePrice * p.stock, 0);
  const totalInventoryMargin = totalInventorySale - totalInventoryCost;
  const marginPct = totalInventorySale > 0 ? Math.round((totalInventoryMargin / totalInventorySale) * 100) : 0;

  const recentOrders = [...serviceOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Clientes", value: clients.length, icon: "👥", color: "#38bdf8", section: "clients" },
    { label: "Motos registradas", value: motorcycles.length, icon: "🏍️", color: "#a78bfa", section: "motorcycles" },
    { label: "Recepciones", value: receptions.length, icon: "📋", color: "#22d3ee", section: "reception" },
    { label: "Órdenes activas", value: pendingOrders, icon: "🔧", color: "#fbbf24", section: "serviceOrders" },
    { label: "Órdenes completadas", value: completedOrders, icon: "✅", color: "#4ade80", section: "serviceOrders" },
    { label: "Ingresos totales", value: `$${totalRevenue.toLocaleString("es-AR")}`, icon: "💰", color: "#f87171", section: "payments" },
  ];

  const statusColors: Record<string, string> = {
    pendiente: "badge-yellow",
    "en proceso": "badge-blue",
    completado: "badge-green",
    entregado: "badge-gray",
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            {currentDate}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="stat-card"
            style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
            onClick={() => onNavigate(stat.section)}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${stat.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent Service Orders */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Últimas Órdenes de Servicio</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("serviceOrders")}>
              Ver todas
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No hay órdenes registradas
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentOrders.map(order => {
                const client = useStore.getState().clients.find(c => c.id === order.clientId);
                const moto = useStore.getState().motorcycles.find(m => m.id === order.motorcycleId);
                return (
                  <div key={order.id} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "#0f172a", border: "1px solid #334155",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {moto ? `${moto.brand} ${moto.model}` : "—"} · {order.performedServices.join(", ")}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className={`badge ${statusColors[order.status] || "badge-gray"}`}>
                        {order.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {new Date(order.date + "T00:00:00").toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>Últimos Pagos</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("payments")}>
              Ver todos
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No hay pagos registrados
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentPayments.map(payment => {
                const client = useStore.getState().clients.find(c => c.id === payment.clientId);
                return (
                  <div key={payment.id} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "#0f172a", border: "1px solid #334155",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {payment.type} · {payment.method}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontWeight: 700, color: "#4ade80", fontSize: 14 }}>
                        ${payment.amount.toLocaleString("es-AR")}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {new Date(payment.date + "T00:00:00").toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#f1f5f9" }}>Acciones Rápidas</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Nuevo Cliente", icon: "👤", section: "clients" },
            { label: "Nueva Recepción", icon: "📋", section: "reception" },
            { label: "Nueva Orden", icon: "🔧", section: "serviceOrders" },
            { label: "Registrar Pago", icon: "💰", section: "payments" },
            { label: "Agregar Repuesto", icon: "⚙️", section: "parts" },
          ].map(action => (
            <button
              key={action.label}
              className="btn-primary"
              onClick={() => onNavigate(action.section)}
            >
              {action.icon} {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>📊 Resumen de Ganancias</h3>
            <p style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
              Basado en órdenes de servicio registradas
            </p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("serviceOrders")}>
            Ver órdenes
          </button>
        </div>

        {/* Total earnings highlight */}
        <div style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
              INGRESOS TOTALES (Mano de obra + Repuestos)
            </div>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
              ${totalEarnings.toLocaleString("es-AR")}
            </div>
          </div>
          <div style={{ fontSize: 36 }}>💵</div>
        </div>

        {/* Breakdown cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Labor */}
          <div style={{
            background: "rgba(22, 163, 74, 0.1)",
            border: "1px solid rgba(22, 163, 74, 0.25)",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(22, 163, 74, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>🔧</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#4ade80" }}>Mano de Obra</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80" }}>
              ${totalLaborIncome.toLocaleString("es-AR")}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {laborPct}% del total
            </div>
          </div>

          {/* Parts */}
          <div style={{
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(59, 130, 246, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>⚙️</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#60a5fa" }}>Repuestos</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>
              ${totalPartsIncome.toLocaleString("es-AR")}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {partsPct}% del total
            </div>
          </div>
        </div>

        {/* Visual bar */}
        {totalEarnings > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              <span>🔧 Mano de obra ({laborPct}%)</span>
              <span>⚙️ Repuestos ({partsPct}%)</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: "#0f172a", overflow: "hidden", display: "flex" }}>
              <div style={{
                width: `${laborPct}%`,
                background: "#4ade80",
                borderRadius: "99px 0 0 99px",
                transition: "width 0.5s ease",
              }} />
              <div style={{
                width: `${partsPct}%`,
                background: "#3b82f6",
                borderRadius: "0 99px 99px 0",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}

        {totalEarnings === 0 && (
          <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
            Aún no hay órdenes de servicio con costos registrados.
          </p>
        )}
      </div>

      {/* Parts Inventory Margin */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>📦 Margen de Repuestos (Inventario)</h3>
            <p style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
              Diferencia entre precio de costo y precio de venta del stock actual
            </p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("parts")}>
            Ver repuestos
          </button>
        </div>

        {parts.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
            Aún no hay repuestos registrados en el inventario.
          </p>
        ) : (
          <>
            {/* Three metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Cost price */}
              <div style={{
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.25)",
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(220, 38, 38, 0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>🏷️</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "#f87171" }}>Costo Total</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#f87171" }}>
                  ${totalInventoryCost.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Precio de compra × stock
                </div>
              </div>

              {/* Sale price */}
              <div style={{
                background: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(22, 163, 74, 0.25)",
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(22, 163, 74, 0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>💲</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "#4ade80" }}>Venta Total</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>
                  ${totalInventorySale.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Precio de venta × stock
                </div>
              </div>

              {/* Margin */}
              <div style={{
                background: marginPct >= 0 ? "rgba(251, 191, 36, 0.1)" : "rgba(220, 38, 38, 0.1)",
                border: `1px solid ${marginPct >= 0 ? "rgba(251, 191, 36, 0.25)" : "rgba(220, 38, 38, 0.25)"}`,
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: marginPct >= 0 ? "rgba(251, 191, 36, 0.2)" : "rgba(220, 38, 38, 0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>📈</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: marginPct >= 0 ? "#fbbf24" : "#f87171" }}>
                    Ganancia Potencial
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: marginPct >= 0 ? "#fbbf24" : "#f87171" }}>
                  ${totalInventoryMargin.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Margen: {marginPct}%
                </div>
              </div>
            </div>

            {/* Visual margin bar */}
            {totalInventorySale > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  <span>🏷️ Costo ({100 - marginPct}%)</span>
                  <span>📈 Ganancia ({marginPct}%)</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: "#0f172a", overflow: "hidden", display: "flex" }}>
                  <div style={{
                    width: `${100 - marginPct}%`,
                    background: "#f87171",
                    borderRadius: "99px 0 0 99px",
                    transition: "width 0.5s ease",
                  }} />
                  <div style={{
                    width: `${marginPct}%`,
                    background: "#fbbf24",
                    borderRadius: "0 99px 99px 0",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
