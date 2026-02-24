"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { generatePaymentPDF } from "@/lib/pdfGenerator";
import type { Payment } from "@/lib/types";

interface PaymentFormData {
  clientId: string;
  serviceOrderId: string;
  date: string;
  type: Payment["type"];
  method: Payment["method"];
  amount: number;
  notes: string;
}

const getEmptyForm = (): PaymentFormData => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {
    clientId: "",
    serviceOrderId: "",
    date: today,
    type: "pago total",
    method: "efectivo",
    amount: 0,
    notes: "",
  };
};

const typeColors: Record<string, string> = {
  anticipo: "badge-yellow",
  "pago total": "badge-green",
  "pago saldo": "badge-blue",
};

const methodIcons: Record<string, string> = {
  efectivo: "💵",
  transferencia: "🏦",
  "tarjeta débito": "💳",
  "tarjeta crédito": "💳",
  "mercado pago": "📱",
  otro: "💰",
};

export default function Payments() {
  const { clients, serviceOrders, payments, addPayment, updatePayment, deletePayment } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PaymentFormData>(getEmptyForm());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const clientOrders = form.clientId
    ? serviceOrders.filter(o => o.clientId === form.clientId)
    : [];

  const filtered = payments.filter(p => {
    const client = clients.find(c => c.id === p.clientId);
    const matchSearch = client?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.method.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.type === filterType;
    return matchSearch && matchType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalByType = {
    anticipo: payments.filter(p => p.type === "anticipo").reduce((s, p) => s + p.amount, 0),
    "pago total": payments.filter(p => p.type === "pago total").reduce((s, p) => s + p.amount, 0),
    "pago saldo": payments.filter(p => p.type === "pago saldo").reduce((s, p) => s + p.amount, 0),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePayment(editingId, form);
    } else {
      addPayment(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
  };

  const handleEdit = (payment: Payment) => {
    setForm({
      clientId: payment.clientId,
      serviceOrderId: payment.serviceOrderId || "",
      date: payment.date,
      type: payment.type,
      method: payment.method,
      amount: payment.amount,
      notes: payment.notes,
    });
    setEditingId(payment.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este pago?")) {
      deletePayment(id);
    }
  };

  const handleGeneratePDF = async (payment: Payment) => {
    const client = clients.find(c => c.id === payment.clientId);
    const order = payment.serviceOrderId ? serviceOrders.find(o => o.id === payment.serviceOrderId) : undefined;
    if (client) {
      await generatePaymentPDF(payment, client, order);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💰 Pagos</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(getEmptyForm()); }}>
          + Registrar Pago
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#CAF404" }}>
            ${payments.reduce((s, p) => s + p.amount, 0).toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Total recaudado</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#ff8800" }}>
            ${totalByType.anticipo.toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Anticipos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#11A900" }}>
            ${totalByType["pago total"].toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Pagos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#0F0" }}>
            ${totalByType["pago saldo"].toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Saldos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555" }}>🔍</span>
            <input
              className="search-input"
              placeholder="Buscar por cliente o forma de pago..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36 }}
            />
          </div>
          <select className="form-select" style={{ width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="anticipo">Anticipo</option>
            <option value="pago total">Pago total</option>
            <option value="pago saldo">Pago saldo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Forma de pago</th>
                <th>Orden asociada</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#555", padding: "32px" }}>
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                filtered.map(payment => {
                  const client = clients.find(c => c.id === payment.clientId);
                  const order = payment.serviceOrderId ? serviceOrders.find(o => o.id === payment.serviceOrderId) : null;
                  return (
                    <tr key={payment.id}>
                      <td>{new Date(payment.date + "T00:00:00").toLocaleDateString("es-AR")}</td>
                      <td style={{ fontWeight: 500, color: "#fff" }}>{client?.fullName || "—"}</td>
                      <td>
                        <span className={`badge ${typeColors[payment.type] || "badge-gray"}`}>
                          {payment.type}
                        </span>
                      </td>
                      <td style={{ color: "#ccc" }}>
                        {methodIcons[payment.method]} {payment.method}
                      </td>
                      <td>
                        {order ? (
                          <span style={{ fontSize: 12, color: "#CAF404" }}>
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        ) : (
                          <span style={{ color: "#555", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: "#11A900", fontSize: 15 }}>
                        ${payment.amount.toLocaleString("es-AR")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(payment)}>✏️</button>
                          <button className="btn-success" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleGeneratePDF(payment)}>📄</button>
                          <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(payment.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Editar Pago" : "Registrar Pago"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select className="form-select" value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value, serviceOrderId: "" })} required>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Orden de servicio</label>
                  <select className="form-select" value={form.serviceOrderId}
                    onChange={e => {
                      const order = serviceOrders.find(o => o.id === e.target.value);
                      setForm({ ...form, serviceOrderId: e.target.value, amount: order ? order.totalCost : form.amount });
                    }}
                    disabled={!form.clientId}>
                    <option value="">Sin orden asociada</option>
                    {clientOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id.slice(0, 8).toUpperCase()} — {o.performedService} — ${o.totalCost.toLocaleString("es-AR")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo de pago *</label>
                  <select className="form-select" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as Payment["type"] })} required>
                    <option value="anticipo">Anticipo</option>
                    <option value="pago total">Pago total</option>
                    <option value="pago saldo">Pago saldo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Forma de pago *</label>
                  <select className="form-select" value={form.method}
                    onChange={e => setForm({ ...form, method: e.target.value as Payment["method"] })} required>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="tarjeta débito">💳 Tarjeta débito</option>
                    <option value="tarjeta crédito">💳 Tarjeta crédito</option>
                    <option value="mercado pago">📱 Mercado Pago</option>
                    <option value="otro">💰 Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Monto ($) *</label>
                <input type="number" className="form-input" value={form.amount}
                  onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  required min={0} step={0.01}
                  style={{ fontSize: 18, fontWeight: 700 }} />
              </div>

              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Observaciones adicionales..." />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Registrar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
