"use client";
import { useStore } from "@/lib/store";

export default function Dashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { clients, motorcycles, receptions, serviceOrders, payments } = useStore();

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingOrders = serviceOrders.filter(o => o.status === "pendiente" || o.status === "en proceso").length;
  const completedOrders = serviceOrders.filter(o => o.status === "completado" || o.status === "entregado").length;

  const recentOrders = [...serviceOrders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const stats = [
    { label: "Clientes", value: clients.length, icon: "👥", color: "#2596be", section: "clients" },
    { label: "Motos registradas", value: motorcycles.length, icon: "🏍️", color: "#7c3aed", section: "motorcycles" },
    { label: "Recepciones", value: receptions.length, icon: "📋", color: "#0891b2", section: "reception" },
    { label: "Órdenes activas", value: pendingOrders, icon: "🔧", color: "#d97706", section: "serviceOrders" },
    { label: "Órdenes completadas", value: completedOrders, icon: "✅", color: "#16a34a", section: "serviceOrders" },
    { label: "Ingresos totales", value: `$${totalRevenue.toLocaleString("es-AR")}`, icon: "💰", color: "#dc2626", section: "payments" },
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
            {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
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
                background: `${stat.color}15`,
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
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Últimas Órdenes de Servicio</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("serviceOrders")}>
              Ver todas
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
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
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {moto ? `${moto.brand} ${moto.model}` : "—"} · {order.performedService}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className={`badge ${statusColors[order.status] || "badge-gray"}`}>
                        {order.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(order.date).toLocaleDateString("es-AR")}
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
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Últimos Pagos</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("payments")}>
              Ver todos
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No hay pagos registrados
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentPayments.map(payment => {
                const client = useStore.getState().clients.find(c => c.id === payment.clientId);
                return (
                  <div key={payment.id} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        {payment.type} · {payment.method}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>
                        ${payment.amount.toLocaleString("es-AR")}
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {new Date(payment.date).toLocaleDateString("es-AR")}
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
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Acciones Rápidas</h3>
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
    </div>
  );
}
