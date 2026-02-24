"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { generateServiceOrderPDF } from "@/lib/pdfGenerator";
import type { ServiceOrder, ServiceOrderPart } from "@/lib/types";

interface OrderFormData {
  clientId: string;
  motorcycleId: string;
  receptionId: string;
  date: string;
  requiredService: string;
  performedService: string;
  parts: ServiceOrderPart[];
  laborCost: number;
  partsCost: number;
  totalCost: number;
  warranty: string;
  status: ServiceOrder["status"];
  notes: string;
}

const getEmptyForm = (): OrderFormData => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {
    clientId: "",
    motorcycleId: "",
    receptionId: "",
    date: today,
    requiredService: "",
    performedService: "",
    parts: [],
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    warranty: "",
    status: "pendiente",
    notes: "",
  };
};

const statusColors: Record<string, string> = {
  pendiente: "badge-yellow",
  "en proceso": "badge-blue",
  completado: "badge-green",
  entregado: "badge-gray",
};

export default function ServiceOrders() {
  const {
    clients, motorcycles, receptions, serviceOrders, parts, serviceTypes,
    addServiceOrder, updateServiceOrder, deleteServiceOrder, addServiceType
  } = useStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormData>(getEmptyForm());
  const [search, setSearch] = useState("");
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [newServiceType, setNewServiceType] = useState("");
  const [showAddServiceType, setShowAddServiceType] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");

  const clientMotorcycles = form.clientId
    ? motorcycles.filter(m => m.clientId === form.clientId)
    : [];

  const clientReceptions = form.motorcycleId
    ? receptions.filter(r => r.motorcycleId === form.motorcycleId)
    : [];

  const filtered = serviceOrders.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    const moto = motorcycles.find(m => m.id === o.motorcycleId);
    const matchSearch = (
      client?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      moto?.plate.toLowerCase().includes(search.toLowerCase()) ||
      o.performedService.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recalcTotals = (updatedParts: ServiceOrderPart[], laborCost: number) => {
    const partsCost = updatedParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    return { partsCost, totalCost: partsCost + laborCost };
  };

  const addPartToOrder = () => {
    if (!selectedPartId) return;
    const part = parts.find(p => p.id === selectedPartId);
    if (!part) return;
    const existing = form.parts.find(p => p.partId === selectedPartId);
    let updatedParts: ServiceOrderPart[];
    if (existing) {
      updatedParts = form.parts.map(p =>
        p.partId === selectedPartId ? { ...p, quantity: p.quantity + partQty } : p
      );
    } else {
      updatedParts = [...form.parts, {
        partId: part.id,
        description: part.description,
        quantity: partQty,
        unitPrice: part.salePrice,
      }];
    }
    const { partsCost, totalCost } = recalcTotals(updatedParts, form.laborCost);
    setForm({ ...form, parts: updatedParts, partsCost, totalCost });
    setSelectedPartId("");
    setPartQty(1);
  };

  const removePartFromOrder = (partId: string) => {
    const updatedParts = form.parts.filter(p => p.partId !== partId);
    const { partsCost, totalCost } = recalcTotals(updatedParts, form.laborCost);
    setForm({ ...form, parts: updatedParts, partsCost, totalCost });
  };

  const updateLaborCost = (value: number) => {
    const { partsCost, totalCost } = recalcTotals(form.parts, value);
    setForm({ ...form, laborCost: value, partsCost, totalCost });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateServiceOrder(editingId, form);
    } else {
      addServiceOrder(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
  };

  const handleEdit = (order: ServiceOrder) => {
    setForm({
      clientId: order.clientId,
      motorcycleId: order.motorcycleId,
      receptionId: order.receptionId || "",
      date: order.date,
      requiredService: order.requiredService,
      performedService: order.performedService,
      parts: order.parts,
      laborCost: order.laborCost,
      partsCost: order.partsCost,
      totalCost: order.totalCost,
      warranty: order.warranty,
      status: order.status,
      notes: order.notes,
    });
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar esta orden de servicio?")) {
      deleteServiceOrder(id);
    }
  };

  const handleGeneratePDF = async (order: ServiceOrder) => {
    const client = clients.find(c => c.id === order.clientId);
    const moto = motorcycles.find(m => m.id === order.motorcycleId);
    if (client && moto) {
      await generateServiceOrderPDF(order, client, moto);
    }
  };

  const handleAddServiceType = () => {
    if (newServiceType.trim()) {
      addServiceType(newServiceType.trim());
      setNewServiceType("");
      setShowAddServiceType(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔧 Órdenes de Servicio</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(getEmptyForm()); }}>
          + Nueva Orden
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <input
              className="search-input"
              placeholder="Buscar por cliente, dominio o servicio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36 }}
            />
          </div>
          <select className="form-select" style={{ width: "auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en proceso">En proceso</option>
            <option value="completado">Completado</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            No hay órdenes registradas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(order => {
              const client = clients.find(c => c.id === order.clientId);
              const moto = motorcycles.find(m => m.id === order.motorcycleId);
              return (
                <div key={order.id} style={{
                  padding: "12px 16px", borderRadius: 12,
                  background: "#1e293b", border: "1px solid #334155",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{client?.fullName || "—"}</div>
                    <div style={{ color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>
                      {moto ? `${moto.brand} ${moto.model}` : "—"}{moto?.plate ? ` · ${moto.plate}` : ""} · {order.performedService}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span className={`badge ${statusColors[order.status] || "badge-gray"}`}>
                      {order.status}
                    </span>
                    <span style={{ fontWeight: 800, color: "#22c55e", fontSize: 13 }}>
                      ${order.totalCost.toLocaleString("es-AR")}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                      {new Date(order.date + "T00:00:00").toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setViewingOrder(order)}>👁️</button>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(order)}>✏️</button>
                    <button className="btn-success" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleGeneratePDF(order)}>📄</button>
                    <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(order.id)}>🗑️</button>
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Editar Orden" : "Nueva Orden de Servicio"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Client & Moto */}
              <div className="section-title">Datos del Cliente</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select className="form-select" value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value, motorcycleId: "", receptionId: "" })} required>
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Moto *</label>
                  <select className="form-select" value={form.motorcycleId}
                    onChange={e => setForm({ ...form, motorcycleId: e.target.value, receptionId: "" })} required disabled={!form.clientId}>
                    <option value="">Seleccionar moto...</option>
                    {clientMotorcycles.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model} — {m.plate}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Recepción asociada</label>
                  <select className="form-select" value={form.receptionId}
                    onChange={e => setForm({ ...form, receptionId: e.target.value })} disabled={!form.motorcycleId}>
                    <option value="">Sin recepción asociada</option>
                    {clientReceptions.map(r => (
                      <option key={r.id} value={r.id}>
                        {new Date(r.date + "T00:00:00").toLocaleDateString("es-AR")} — {r.km.toLocaleString("es-AR")} km
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Services */}
              <div className="section-title">Servicios</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Servicio requerido *</label>
                  <input className="form-input" value={form.requiredService}
                    onChange={e => setForm({ ...form, requiredService: e.target.value })} required
                    placeholder="¿Qué solicitó el cliente?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Servicio realizado *</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select className="form-select" value={form.performedService}
                      onChange={e => setForm({ ...form, performedService: e.target.value })} required>
                      <option value="">Seleccionar servicio...</option>
                      {serviceTypes.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
                    </select>
                    <button type="button" className="btn-secondary" style={{ whiteSpace: "nowrap", padding: "8px 10px" }}
                      onClick={() => setShowAddServiceType(!showAddServiceType)}>
                      +
                    </button>
                  </div>
                  {showAddServiceType && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <input className="form-input" placeholder="Nuevo tipo de servicio..."
                        value={newServiceType} onChange={e => setNewServiceType(e.target.value)} />
                      <button type="button" className="btn-primary" style={{ whiteSpace: "nowrap" }} onClick={handleAddServiceType}>
                        Agregar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Parts */}
              <div className="section-title">Repuestos Utilizados</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Repuesto</label>
                  <select className="form-select" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                    <option value="">Seleccionar repuesto...</option>
                    {parts.map(p => <option key={p.id} value={p.id}>{p.description} — ${p.salePrice.toLocaleString("es-AR")}</option>)}
                  </select>
                </div>
                <div style={{ width: 80 }}>
                  <label className="form-label">Cantidad</label>
                  <input type="number" className="form-input" value={partQty} onChange={e => setPartQty(parseInt(e.target.value) || 1)} min={1} />
                </div>
                <button type="button" className="btn-primary" onClick={addPartToOrder}>+ Agregar</button>
              </div>

              {form.parts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Cant.</th>
                          <th>Precio unit.</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.parts.map(p => (
                          <tr key={p.partId}>
                            <td>{p.description}</td>
                            <td>{p.quantity}</td>
                            <td>${p.unitPrice.toLocaleString("es-AR")}</td>
                            <td style={{ fontWeight: 600 }}>${(p.quantity * p.unitPrice).toLocaleString("es-AR")}</td>
                            <td>
                              <button type="button" className="btn-danger" style={{ padding: "2px 6px", fontSize: 11 }}
                                onClick={() => removePartFromOrder(p.partId)}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Costs */}
              <div className="section-title">Costos</div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Mano de obra ($)</label>
                  <input type="number" className="form-input" value={form.laborCost}
                    onChange={e => updateLaborCost(parseFloat(e.target.value) || 0)} min={0} step={0.01} />
                </div>
                <div className="form-group">
                  <label className="form-label">Repuestos ($)</label>
                  <input type="number" className="form-input" value={form.partsCost} readOnly
                    style={{ background: "#1e2a4a", color: "#64748b" }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Total ($)</label>
                  <input type="number" className="form-input" value={form.totalCost} readOnly
                    style={{ background: "#e0f4fb", fontWeight: 700, color: "#2596be" }} />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Garantía</label>
                  <input className="form-input" value={form.warranty}
                    onChange={e => setForm({ ...form, warranty: e.target.value })}
                    placeholder="Ej: 3 meses o 3000 km" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as ServiceOrder["status"] })}>
                    <option value="pendiente">Pendiente</option>
                    <option value="en proceso">En proceso</option>
                    <option value="completado">Completado</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el servicio..." />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Crear orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingOrder && (() => {
        const client = clients.find(c => c.id === viewingOrder.clientId);
        const moto = motorcycles.find(m => m.id === viewingOrder.motorcycleId);
        return (
          <div className="modal-overlay" onClick={() => setViewingOrder(null)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">🔧 Orden #{viewingOrder.id.slice(0, 8).toUpperCase()}</h2>
                <button onClick={() => setViewingOrder(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="section-title">Cliente y Vehículo</div>
                  <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>👤 <strong>{client?.fullName}</strong> — {client?.phone}</div>
                    <div>🏍️ <strong>{moto?.brand} {moto?.model}</strong> ({moto?.year}) — {moto?.plate}</div>
                    <div>📅 {new Date(viewingOrder.date + "T00:00:00").toLocaleDateString("es-AR")}</div>
                  </div>
                </div>
                <div>
                  <div className="section-title">Servicio</div>
                  <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>📋 Requerido: <strong>{viewingOrder.requiredService}</strong></div>
                    <div>🔧 Realizado: <strong>{viewingOrder.performedService}</strong></div>
                    <div>Estado: <span className={`badge ${statusColors[viewingOrder.status]}`}>{viewingOrder.status}</span></div>
                    {viewingOrder.warranty && <div>🛡️ Garantía: <strong>{viewingOrder.warranty}</strong></div>}
                  </div>
                </div>
              </div>

              {viewingOrder.parts.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="section-title">Repuestos</div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr>
                      </thead>
                      <tbody>
                        {viewingOrder.parts.map((p, i) => (
                          <tr key={i}>
                            <td>{p.description}</td>
                            <td>{p.quantity}</td>
                            <td>${p.unitPrice.toLocaleString("es-AR")}</td>
                            <td style={{ fontWeight: 600 }}>${(p.quantity * p.unitPrice).toLocaleString("es-AR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Mano de obra: ${viewingOrder.laborCost.toLocaleString("es-AR")}</div>
                  <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Repuestos: ${viewingOrder.partsCost.toLocaleString("es-AR")}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>Total: ${viewingOrder.totalCost.toLocaleString("es-AR")}</div>
                </div>
              </div>

              {viewingOrder.notes && (
                <div style={{ padding: "12px 16px", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", fontSize: 13, marginBottom: 16, color: "#94a3b8", fontWeight: 500 }}>
                  📝 {viewingOrder.notes}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn-success" onClick={() => handleGeneratePDF(viewingOrder)}>📄 Generar PDF</button>
                <button className="btn-secondary" onClick={() => setViewingOrder(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
