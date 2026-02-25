"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Client } from "@/lib/types";

interface ClientFormData {
  fullName: string;
  phone: string;
  address: string;
  notes: string;
}

const emptyForm: ClientFormData = {
  fullName: "",
  phone: "",
  address: "",
  notes: "",
};

export default function Clients() {
  const { clients, motorcycles, receptions, serviceOrders, payments, addClient, updateClient, deleteClient } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateClient(editingId, form);
    } else {
      addClient(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (client: Client) => {
    setForm({
      fullName: client.fullName,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este cliente?")) {
      deleteClient(id);
    }
  };

  const getClientStats = (clientId: string) => {
    const motos = motorcycles.filter(m => m.clientId === clientId);
    const orders = serviceOrders.filter(o => o.clientId === clientId);
    const pays = payments.filter(p => p.clientId === clientId);
    const totalPaid = pays.reduce((sum, p) => sum + p.amount, 0);
    return { motos: motos.length, orders: orders.length, totalPaid };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Clientes</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
          + Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* List */}
      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            No hay clientes registrados
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(client => {
              const stats = getClientStats(client.id);
              return (
                <div key={client.id} style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "#1e293b", border: "1px solid #334155",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{client.fullName}</div>
                    <div style={{ color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>
                      📞 {client.phone}{client.address ? ` · ${client.address}` : ""}
                    </div>
                    <div style={{ color: "#94a3b8", fontWeight: 500, fontSize: 11, marginTop: 2 }}>
                      Ingreso: {new Date(client.createdAt).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span className="badge badge-blue" title="Motos">🏍️ {stats.motos}</span>
                    <span className="badge badge-yellow" title="Órdenes">🔧 {stats.orders}</span>
                    <span style={{ fontWeight: 800, color: "#22c55e", fontSize: 13 }}>
                      ${stats.totalPaid.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setViewingClient(client)}>👁️</button>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(client)}>✏️</button>
                    <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(client.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input
                  className="form-input"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required
                  placeholder="Ej: Juan García"
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Celular *</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                    placeholder="Ej: 11-1234-5678"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Dirección</label>
                  <input
                    className="form-input"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observaciones adicionales..."
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {viewingClient && (
        <div className="modal-overlay" onClick={() => setViewingClient(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">👤 {viewingClient.fullName}</h2>
              <button onClick={() => setViewingClient(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div>
                <div className="section-title">Información Personal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div><strong>Teléfono:</strong> {viewingClient.phone}</div>
                  <div><strong>Dirección:</strong> {viewingClient.address || "—"}</div>
                  <div><strong>Fecha de ingreso:</strong> {new Date(viewingClient.createdAt).toLocaleDateString("es-AR")}</div>
                  {viewingClient.notes && <div><strong>Notas:</strong> {viewingClient.notes}</div>}
                </div>
              </div>
              <div>
                <div className="section-title">Resumen</div>
                {(() => {
                  const stats = getClientStats(viewingClient.id);
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>🏍️ <strong>{stats.motos}</strong> moto(s) registrada(s)</div>
                      <div>🔧 <strong>{stats.orders}</strong> orden(es) de servicio</div>
                      <div>💰 Total pagado: <strong style={{ color: "#4ade80" }}>${stats.totalPaid.toLocaleString("es-AR")}</strong></div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Motorcycles */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Motos</div>
              {motorcycles.filter(m => m.clientId === viewingClient.id).length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Sin motos registradas</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {motorcycles.filter(m => m.clientId === viewingClient.id).map(m => (
                    <div key={m.id} style={{ padding: "8px 12px", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", fontSize: 13, color: "#ffffff", fontWeight: 700 }}>
                      🏍️ <strong>{m.brand} {m.model}</strong> — <span style={{ color: "#94a3b8", fontWeight: 500 }}>{m.year} — Dom: {m.plate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Orders */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-title">Órdenes de Servicio</div>
              {serviceOrders.filter(o => o.clientId === viewingClient.id).length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Sin órdenes registradas</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {serviceOrders.filter(o => o.clientId === viewingClient.id).map(o => (
                    <div key={o.id} style={{ padding: "8px 12px", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#ffffff", fontWeight: 700 }}>🔧 {o.performedService}</span>
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>{new Date(o.date + "T00:00:00").toLocaleDateString("es-AR")} — <span style={{ color: "#22c55e", fontWeight: 800 }}>${o.totalCost.toLocaleString("es-AR")}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payments */}
            <div>
              <div className="section-title">Pagos</div>
              {payments.filter(p => p.clientId === viewingClient.id).length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13 }}>Sin pagos registrados</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {payments.filter(p => p.clientId === viewingClient.id).map(p => (
                    <div key={p.id} style={{ padding: "8px 12px", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#ffffff", fontWeight: 700 }}>💰 {p.type} ({p.method})</span>
                      <span style={{ color: "#94a3b8", fontWeight: 500 }}>{new Date(p.date + "T00:00:00").toLocaleDateString("es-AR")} — <span style={{ color: "#22c55e", fontWeight: 800 }}>${p.amount.toLocaleString("es-AR")}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
