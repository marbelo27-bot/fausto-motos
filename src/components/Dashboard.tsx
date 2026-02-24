"use client";
import { useStore } from "@/lib/store";

export default function Dashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { clients, motorcycles, receptions, serviceOrders, payments, parts } = useStore();

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
    { label: "Clientes", value: clients.length, icon: "👥", color: "#CAF404", section: "clients" },
    { label: "Motos registradas", value: motorcycles.length, icon: "🏍️", color: "#0F0", section: "motorcycles" },
    { label: "Recepciones", value: receptions.length, icon: "📋", color: "#11A900", section: "reception" },
    { label: "Órdenes activas", value: pendingOrders, icon: "🔧", color: "#CAF404", section: "serviceOrders" },
    { label: "Órdenes completadas", value: completedOrders, icon: "✅", color: "#11A900", section: "serviceOrders" },
    { label: "Ingresos totales", value: `$${totalRevenue.toLocaleString("es-AR")}`, icon: "💰", color: "#0F0", section: "payments" },
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
          <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
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
              (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${stat.color}30`;
              (e.currentTarget as HTMLElement).style.borderColor = `${stat.color}50`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "";
              (e.currentTarget as HTMLElement).style.borderColor = "";
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
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Últimas Órdenes de Servicio</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("serviceOrders")}>
              Ver todas
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
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
                    background: "#111", border: "1px solid #2a2a2a",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#666", fontSize: 12 }}>
                        {moto ? `${moto.brand} ${moto.model}` : "—"} · {order.performedService}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className={`badge ${statusColors[order.status] || "badge-gray"}`}>
                        {order.status}
                      </span>
                      <span style={{ fontSize: 11, color: "#555" }}>
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
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Últimos Pagos</h3>
            <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("payments")}>
              Ver todos
            </button>
          </div>
          {recentPayments.length === 0 ? (
            <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "20px 0" }}>
              No hay pagos registrados
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentPayments.map(payment => {
                const client = useStore.getState().clients.find(c => c.id === payment.clientId);
                return (
                  <div key={payment.id} style={{
                    padding: "10px 12px", borderRadius: 8,
                    background: "#111", border: "1px solid #2a2a2a",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#fff" }}>{client?.fullName || "—"}</div>
                      <div style={{ color: "#666", fontSize: 12 }}>
                        {payment.type} · {payment.method}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontWeight: 700, color: "#11A900", fontSize: 14 }}>
                        ${payment.amount.toLocaleString("es-AR")}
                      </span>
                      <span style={{ fontSize: 11, color: "#555" }}>
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
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#fff" }}>Acciones Rápidas</h3>
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
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>📊 Resumen de Ganancias</h3>
            <p style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
              Basado en órdenes de servicio registradas
            </p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("serviceOrders")}>
            Ver órdenes
          </button>
        </div>

        {/* Total earnings highlight */}
        <div style={{
          background: "linear-gradient(135deg, #000 0%, #1a2200 100%)",
          border: "1px solid #CAF40440",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "#CAF40480", fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
              INGRESOS TOTALES (Mano de obra + Repuestos)
            </div>
            <div style={{ color: "#CAF404", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
              ${totalEarnings.toLocaleString("es-AR")}
            </div>
          </div>
          <div style={{ fontSize: 36 }}>💵</div>
        </div>

        {/* Breakdown cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {/* Labor */}
          <div style={{
            background: "#0a1a00",
            border: "1px solid #11A90040",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#11A90020",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>🔧</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#11A900" }}>Mano de Obra</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#11A900" }}>
              ${totalLaborIncome.toLocaleString("es-AR")}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {laborPct}% del total
            </div>
          </div>

          {/* Parts */}
          <div style={{
            background: "#1a1a00",
            border: "1px solid #CAF40440",
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "#CAF40420",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>⚙️</div>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#CAF404" }}>Repuestos</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#CAF404" }}>
              ${totalPartsIncome.toLocaleString("es-AR")}
            </div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {partsPct}% del total
            </div>
          </div>
        </div>

        {/* Visual bar */}
        {totalEarnings > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 6 }}>
              <span>🔧 Mano de obra ({laborPct}%)</span>
              <span>⚙️ Repuestos ({partsPct}%)</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: "#222", overflow: "hidden", display: "flex" }}>
              <div style={{
                width: `${laborPct}%`,
                background: "#11A900",
                borderRadius: "99px 0 0 99px",
                transition: "width 0.5s ease",
              }} />
              <div style={{
                width: `${partsPct}%`,
                background: "#CAF404",
                borderRadius: "0 99px 99px 0",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}

        {totalEarnings === 0 && (
          <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
            Aún no hay órdenes de servicio con costos registrados.
          </p>
        )}
      </div>

      {/* Parts Inventory Margin */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>📦 Margen de Repuestos (Inventario)</h3>
            <p style={{ color: "#666", fontSize: 12, marginTop: 2 }}>
              Diferencia entre precio de costo y precio de venta del stock actual
            </p>
          </div>
          <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => onNavigate("parts")}>
            Ver repuestos
          </button>
        </div>

        {parts.length === 0 ? (
          <p style={{ color: "#555", fontSize: 14, textAlign: "center", padding: "8px 0" }}>
            Aún no hay repuestos registrados en el inventario.
          </p>
        ) : (
          <>
            {/* Three metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Cost price */}
              <div style={{
                background: "#1a0000",
                border: "1px solid #ff444430",
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#ff444420",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>🏷️</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "#ff4444" }}>Costo Total</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ff4444" }}>
                  ${totalInventoryCost.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  Precio de compra × stock
                </div>
              </div>

              {/* Sale price */}
              <div style={{
                background: "#0a1a00",
                border: "1px solid #11A90040",
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "#11A90020",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>💲</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: "#11A900" }}>Venta Total</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#11A900" }}>
                  ${totalInventorySale.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  Precio de venta × stock
                </div>
              </div>

              {/* Margin */}
              <div style={{
                background: marginPct >= 0 ? "#1a1a00" : "#1a0000",
                border: `1px solid ${marginPct >= 0 ? "#CAF40440" : "#ff444430"}`,
                borderRadius: 10,
                padding: "16px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: marginPct >= 0 ? "#CAF40420" : "#ff444420",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>📈</div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: marginPct >= 0 ? "#CAF404" : "#ff4444" }}>
                    Ganancia Potencial
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: marginPct >= 0 ? "#CAF404" : "#ff4444" }}>
                  ${totalInventoryMargin.toLocaleString("es-AR")}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                  Margen: {marginPct}%
                </div>
              </div>
            </div>

            {/* Visual margin bar */}
            {totalInventorySale > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", marginBottom: 6 }}>
                  <span>🏷️ Costo ({100 - marginPct}%)</span>
                  <span>📈 Ganancia ({marginPct}%)</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: "#222", overflow: "hidden", display: "flex" }}>
                  <div style={{
                    width: `${100 - marginPct}%`,
                    background: "#ff4444",
                    borderRadius: "99px 0 0 99px",
                    transition: "width 0.5s ease",
                  }} />
                  <div style={{
                    width: `${marginPct}%`,
                    background: "#CAF404",
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
