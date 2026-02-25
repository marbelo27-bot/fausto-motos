"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Quote, QuoteItem } from "@/lib/types";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import { v4 as uuidv4 } from "uuid";

const STATUS_COLORS: Record<Quote["status"], string> = {
  borrador: "#64748b",
  enviada: "#3b82f6",
  aceptada: "#22c55e",
  rechazada: "#ef4444",
};

const STATUS_LABELS: Record<Quote["status"], string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

function getLocalDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getValidUntil() {
  const now = new Date();
  now.setDate(now.getDate() + 15);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getEmptyForm() {
  return {
    clientId: "",
    motorcycleId: "",
    date: getLocalDate(),
    validUntil: getValidUntil(),
    items: [] as QuoteItem[],
    laborTotal: 0,
    partsTotal: 0,
    total: 0,
    notes: "",
    status: "borrador" as Quote["status"],
  };
}

function getEmptyLaborItem(): QuoteItem {
  return {
    id: uuidv4(),
    type: "labor",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function getEmptyPartItem(): QuoteItem {
  return {
    id: uuidv4(),
    type: "part",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: "14px 18px",
  marginBottom: 10,
  cursor: "pointer",
  transition: "border-color 0.15s",
};

const inputStyle: React.CSSProperties = {
  background: "#222",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#fff",
  padding: "8px 12px",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 4,
  display: "block",
};

const sectionTitle: React.CSSProperties = {
  color: "#CAF404",
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: 1,
};

export default function Quotes() {
  const { clients, motorcycles, quotes, addQuote, updateQuote, deleteQuote, addServiceOrder } = useStore();

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(getEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLaborItem, setNewLaborItem] = useState<QuoteItem>(getEmptyLaborItem());
  const [newPartItem, setNewPartItem] = useState<QuoteItem>(getEmptyPartItem());
  const [search, setSearch] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<QuoteItem | null>(null);

  const selectedQuote = quotes.find((q) => q.id === selectedId) ?? null;
  const clientMotorcycles = motorcycles.filter((m) => m.clientId === form.clientId);

  // Recalculate totals from items
  function recalcTotals(items: QuoteItem[]) {
    const laborTotal = items
      .filter((i) => i.type === "labor")
      .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const partsTotal = items
      .filter((i) => i.type === "part")
      .reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return { laborTotal, partsTotal, total: laborTotal + partsTotal };
  }

  function handleAddLaborItem() {
    if (!newLaborItem.description.trim()) return;
    const items = [...form.items, { ...newLaborItem, id: uuidv4() }];
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
    setNewLaborItem(getEmptyLaborItem());
  }

  function handleAddPartItem() {
    if (!newPartItem.description.trim()) return;
    const items = [...form.items, { ...newPartItem, id: uuidv4() }];
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
    setNewPartItem(getEmptyPartItem());
  }

  function handleRemoveItem(id: string) {
    const items = form.items.filter((i) => i.id !== id);
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
  }

  function handleStartEditItem(item: QuoteItem) {
    setEditingItemId(item.id);
    setEditingItemData({ ...item });
  }

  function handleSaveEditItem() {
    if (!editingItemData) return;
    const items = form.items.map((i) => i.id === editingItemData.id ? { ...editingItemData } : i);
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
    setEditingItemId(null);
    setEditingItemData(null);
  }

  function handleCancelEditItem() {
    setEditingItemId(null);
    setEditingItemData(null);
  }

  function handleSubmit() {
    if (!form.clientId || !form.motorcycleId) return;
    if (editingId) {
      updateQuote(editingId, form);
    } else {
      addQuote(form);
    }
    setForm(getEmptyForm());
    setEditingId(null);
    setView("list");
  }

  function handleEdit(q: Quote) {
    setForm({
      clientId: q.clientId,
      motorcycleId: q.motorcycleId,
      date: q.date,
      validUntil: q.validUntil,
      items: q.items,
      laborTotal: q.laborTotal,
      partsTotal: q.partsTotal,
      total: q.total,
      notes: q.notes,
      status: q.status,
    });
    setEditingId(q.id);
    setView("form");
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar esta cotización?")) {
      deleteQuote(id);
      if (selectedId === id) {
        setSelectedId(null);
        setView("list");
      }
    }
  }

  async function handlePDF(q: Quote) {
    const client = clients.find((c) => c.id === q.clientId);
    const moto = motorcycles.find((m) => m.id === q.motorcycleId);
    if (!client || !moto) return;
    await generateQuotePDF(q, client, moto);
  }

  function handleConvertToOrder(q: Quote) {
    const today = new Date().toLocaleDateString("sv-SE");
    const partItems = q.items.filter((i) => i.type === "part");
    const newOrder = addServiceOrder({
      clientId: q.clientId,
      motorcycleId: q.motorcycleId,
      receptionId: "",
      quoteId: q.id,
      date: today,
      requiredService: "Orden generada desde cotización #" + q.id.slice(0, 8),
      performedServices: ["Orden generada desde cotización #" + q.id.slice(0, 8)],
      parts: partItems.map((i) => ({
        partId: "",
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      laborCost: q.laborTotal,
      partsCost: q.partsTotal,
      totalCost: q.total,
      status: "pendiente",
      warranty: "",
      notes: q.notes,
    });
    updateQuote(q.id, { convertedToOrderId: newOrder.id });
    alert("Orden de servicio creada exitosamente");
  }

  const filtered = quotes.filter((q) => {
    const client = clients.find((c) => c.id === q.clientId);
    const moto = motorcycles.find((m) => m.id === q.motorcycleId);
    const text = `${client?.fullName ?? ""} ${moto?.brand ?? ""} ${moto?.model ?? ""} ${moto?.plate ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === "detail" && selectedQuote) {
    const client = clients.find((c) => c.id === selectedQuote.clientId);
    const moto = motorcycles.find((m) => m.id === selectedQuote.motorcycleId);
    return (
      <div className="modal-overlay" onClick={() => setView("list")}>
        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              📝 Cotización #{selectedQuote.id.slice(0, 8).toUpperCase()}
              <span style={{
                marginLeft: 12,
                background: STATUS_COLORS[selectedQuote.status] + "33",
                color: STATUS_COLORS[selectedQuote.status],
                border: `1px solid ${STATUS_COLORS[selectedQuote.status]}`,
                borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700,
                verticalAlign: "middle",
              }}>
                {STATUS_LABELS[selectedQuote.status]}
              </span>
            </h2>
            <button onClick={() => setView("list")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
          </div>

          {/* Client + Moto + Dates */}
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div>
              <div className="section-title">Cliente y Vehículo</div>
              <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>👤 <strong>{client?.fullName ?? "—"}</strong>{client?.phone ? ` — ${client.phone}` : ""}</div>
                <div>🏍️ <strong>{moto ? `${moto.brand} ${moto.model}` : "—"}</strong>{moto ? ` (${moto.year}) — ${moto.plate}` : ""}</div>
                {client?.address && <div>📍 {client.address}</div>}
              </div>
            </div>
            <div>
              <div className="section-title">Fechas</div>
              <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <div>📅 Fecha: <strong>{new Date(selectedQuote.date + "T00:00:00").toLocaleDateString("es-AR")}</strong></div>
                <div>⏳ Válida hasta: <strong>{new Date(selectedQuote.validUntil + "T00:00:00").toLocaleDateString("es-AR")}</strong></div>
              </div>
            </div>
          </div>

          {/* Items — Mano de obra */}
          <div className="section-title">🔧 Mano de Obra</div>
          {selectedQuote.items.filter((i) => i.type === "labor").length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Sin trabajos registrados</p>
          ) : (
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {selectedQuote.items.filter((i) => i.type === "labor").map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toLocaleString("es-AR")}</td>
                      <td style={{ fontWeight: 600 }}>${(item.quantity * item.unitPrice).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Items — Repuestos */}
          <div className="section-title">⚙️ Repuestos</div>
          {selectedQuote.items.filter((i) => i.type === "part").length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>Sin repuestos registrados</p>
          ) : (
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {selectedQuote.items.filter((i) => i.type === "part").map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unitPrice.toLocaleString("es-AR")}</td>
                      <td style={{ fontWeight: 600 }}>${(item.quantity * item.unitPrice).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Mano de obra: ${selectedQuote.laborTotal.toLocaleString("es-AR")}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Repuestos: ${selectedQuote.partsTotal.toLocaleString("es-AR")}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>Total: ${selectedQuote.total.toLocaleString("es-AR")}</div>
            </div>
          </div>

          {/* Notes */}
          {selectedQuote.notes && (
            <div style={{ padding: "12px 16px", background: "#1e293b", borderRadius: 12, border: "1px solid #334155", fontSize: 13, marginBottom: 16, color: "#94a3b8", fontWeight: 500 }}>
              📝 {selectedQuote.notes}
            </div>
          )}

          {/* Converted badge */}
          {selectedQuote.convertedToOrderId && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#14532d", border: "1px solid #22c55e",
              borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700,
              color: "#22c55e", marginBottom: 12,
            }}>
              ✅ Convertida a Orden #{selectedQuote.convertedToOrderId}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <select
              value={selectedQuote.status}
              onChange={(e) => updateQuote(selectedQuote.id, { status: e.target.value as Quote["status"] })}
              style={{ ...inputStyle, width: "auto", padding: "8px 14px" }}
            >
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
            </select>
            {selectedQuote.status === "aceptada" && !selectedQuote.convertedToOrderId && (
              <button
                onClick={() => handleConvertToOrder(selectedQuote)}
                style={{ background: "#22c55e", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}
              >
                🔧 Convertir a Orden de Servicio
              </button>
            )}
            <button className="btn-secondary" onClick={() => handleEdit(selectedQuote)}>✏️ Editar</button>
            <button className="btn-success" onClick={() => handlePDF(selectedQuote)}>📄 Generar PDF</button>
            <button className="btn-danger" onClick={() => handleDelete(selectedQuote.id)}>🗑️ Eliminar</button>
            <button className="btn-secondary" onClick={() => setView("list")}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => { setView("list"); setEditingId(null); setForm(getEmptyForm()); }}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
          >
            ← Volver
          </button>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, margin: 0 }}>
            {editingId ? "Editar Cotización" : "Nueva Cotización"}
          </h2>
        </div>

        {/* Client + Moto */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px", marginBottom: 16 }}>
          <div style={sectionTitle}>Datos del Cliente y Moto</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Cliente *</label>
              <select
                style={inputStyle}
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value, motorcycleId: "" })}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Moto *</label>
              <select
                style={inputStyle}
                value={form.motorcycleId}
                onChange={(e) => setForm({ ...form, motorcycleId: e.target.value })}
                disabled={!form.clientId}
              >
                <option value="">Seleccionar moto...</option>
                {clientMotorcycles.map((m) => (
                  <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.year}) - {m.plate}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fecha</label>
              <input type="date" style={inputStyle} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Válida hasta</label>
              <input type="date" style={inputStyle} value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Labor Items */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px", marginBottom: 16 }}>
          <div style={sectionTitle}>🔧 Mano de Obra (Trabajo)</div>

          {form.items.filter(i => i.type === "labor").length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "5px 6px" }}>Descripción</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Cant.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>P. Unit.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Subtotal</th>
                  <th style={{ padding: "5px 6px" }}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.filter(i => i.type === "labor").map((item) => (
                  editingItemId === item.id && editingItemData ? (
                    <tr key={item.id} style={{ borderBottom: "1px solid #0f172a", background: "#0f172a" }}>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13 }}
                          value={editingItemData.description}
                          onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="text" inputMode="numeric"
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={editingItemData.quantity}
                          onChange={(e) => setEditingItemData({ ...editingItemData, quantity: Number(e.target.value) || 1 })}
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="text" inputMode="decimal"
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={editingItemData.unitPrice}
                          onChange={(e) => setEditingItemData({ ...editingItemData, unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td style={{ padding: "4px 6px", color: "#3b82f6", fontWeight: 700, textAlign: "right" }}>
                        ${(editingItemData.quantity * editingItemData.unitPrice).toLocaleString("es-AR")}
                      </td>
                      <td style={{ padding: "4px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <button onClick={handleSaveEditItem} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 14, marginRight: 4 }} title="Guardar">✔</button>
                        <button onClick={handleCancelEditItem} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }} title="Cancelar">✕</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }} onClick={() => handleStartEditItem(item)}>
                      <td style={{ padding: "6px", color: "#fff" }}>{item.description}</td>
                      <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>${item.unitPrice.toLocaleString("es-AR")}</td>
                      <td style={{ padding: "6px", color: "#3b82f6", fontWeight: 700, textAlign: "right" }}>
                        ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
                      </td>
                      <td style={{ padding: "6px", textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 130px auto", gap: 8, alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>Descripción del trabajo</label>
              <input
                style={inputStyle}
                placeholder="Ej: Cambio de aceite, Afinación..."
                value={newLaborItem.description}
                onChange={(e) => setNewLaborItem({ ...newLaborItem, description: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddLaborItem(); }}
              />
            </div>
            <div>
              <label style={labelStyle}>Cant.</label>
              <input
                type="text"
                inputMode="numeric"
                style={inputStyle}
                value={newLaborItem.quantity === 0 ? "" : newLaborItem.quantity}
                onChange={(e) => setNewLaborItem({ ...newLaborItem, quantity: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label style={labelStyle}>Precio unit. ($)</label>
              <input
                type="text"
                inputMode="decimal"
                style={inputStyle}
                placeholder="0"
                value={newLaborItem.unitPrice === 0 ? "" : newLaborItem.unitPrice}
                onChange={(e) => setNewLaborItem({ ...newLaborItem, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, visibility: "hidden" }}>.</label>
              <button
                onClick={handleAddLaborItem}
                style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}
              >
                + Agregar
              </button>
            </div>
          </div>

          {form.laborTotal > 0 && (
            <div style={{ marginTop: 10, textAlign: "right", fontSize: 13, color: "#94a3b8" }}>
              Subtotal M.O.: <strong style={{ color: "#3b82f6" }}>${form.laborTotal.toLocaleString("es-AR")}</strong>
            </div>
          )}
        </div>

        {/* Parts Items */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px", marginBottom: 16 }}>
          <div style={sectionTitle}>⚙️ Repuestos</div>

          {form.items.filter(i => i.type === "part").length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "5px 6px" }}>Descripción</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Cant.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>P. Unit.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Subtotal</th>
                  <th style={{ padding: "5px 6px" }}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.filter(i => i.type === "part").map((item) => (
                  editingItemId === item.id && editingItemData ? (
                    <tr key={item.id} style={{ borderBottom: "1px solid #0f172a", background: "#0f172a" }}>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13 }}
                          value={editingItemData.description}
                          onChange={(e) => setEditingItemData({ ...editingItemData, description: e.target.value })}
                          autoFocus
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="text" inputMode="numeric"
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={editingItemData.quantity}
                          onChange={(e) => setEditingItemData({ ...editingItemData, quantity: Number(e.target.value) || 1 })}
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="text" inputMode="decimal"
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, textAlign: "right" }}
                          value={editingItemData.unitPrice}
                          onChange={(e) => setEditingItemData({ ...editingItemData, unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td style={{ padding: "4px 6px", color: "#f59e0b", fontWeight: 700, textAlign: "right" }}>
                        ${(editingItemData.quantity * editingItemData.unitPrice).toLocaleString("es-AR")}
                      </td>
                      <td style={{ padding: "4px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <button onClick={handleSaveEditItem} style={{ background: "none", border: "none", color: "#22c55e", cursor: "pointer", fontSize: 14, marginRight: 4 }} title="Guardar">✔</button>
                        <button onClick={handleCancelEditItem} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }} title="Cancelar">✕</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id} style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }} onClick={() => handleStartEditItem(item)}>
                      <td style={{ padding: "6px", color: "#fff" }}>{item.description}</td>
                      <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>${item.unitPrice.toLocaleString("es-AR")}</td>
                      <td style={{ padding: "6px", color: "#f59e0b", fontWeight: 700, textAlign: "right" }}>
                        ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
                      </td>
                      <td style={{ padding: "6px", textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}>✕</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 130px auto", gap: 8, alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>Descripción del repuesto</label>
              <input
                style={inputStyle}
                placeholder="Ej: Filtro de aceite, Pastillas de freno..."
                value={newPartItem.description}
                onChange={(e) => setNewPartItem({ ...newPartItem, description: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPartItem(); }}
              />
            </div>
            <div>
              <label style={labelStyle}>Cant.</label>
              <input
                type="text"
                inputMode="numeric"
                style={inputStyle}
                value={newPartItem.quantity === 0 ? "" : newPartItem.quantity}
                onChange={(e) => setNewPartItem({ ...newPartItem, quantity: Number(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label style={labelStyle}>Precio unit. ($)</label>
              <input
                type="text"
                inputMode="decimal"
                style={inputStyle}
                placeholder="0"
                value={newPartItem.unitPrice === 0 ? "" : newPartItem.unitPrice}
                onChange={(e) => setNewPartItem({ ...newPartItem, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, visibility: "hidden" }}>.</label>
              <button
                onClick={handleAddPartItem}
                style={{ background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}
              >
                + Agregar
              </button>
            </div>
          </div>

          {form.partsTotal > 0 && (
            <div style={{ marginTop: 10, textAlign: "right", fontSize: 13, color: "#94a3b8" }}>
              Subtotal Repuestos: <strong style={{ color: "#f59e0b" }}>${form.partsTotal.toLocaleString("es-AR")}</strong>
            </div>
          )}
        </div>

        {/* Grand Total */}
        {form.items.length > 0 && (
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>
              M.O.: <strong style={{ color: "#3b82f6" }}>${form.laborTotal.toLocaleString("es-AR")}</strong>
            </span>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>
              Repuestos: <strong style={{ color: "#f59e0b" }}>${form.partsTotal.toLocaleString("es-AR")}</strong>
            </span>
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
              TOTAL: <strong style={{ color: "#CAF404" }}>${form.total.toLocaleString("es-AR")}</strong>
            </span>
          </div>
        )}

        {/* Notes + Status */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 14 }}>
            <div>
              <label style={labelStyle}>Observaciones</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                placeholder="Notas adicionales, condiciones, garantía..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Quote["status"] })}
              >
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aceptada">Aceptada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={!form.clientId || !form.motorcycleId}
            style={{
              background: form.clientId && form.motorcycleId ? "#CAF404" : "#334155",
              color: form.clientId && form.motorcycleId ? "#000" : "#64748b",
              border: "none", borderRadius: 8, padding: "12px 28px",
              fontWeight: 700, cursor: form.clientId && form.motorcycleId ? "pointer" : "not-allowed",
              fontSize: 15,
            }}
          >
            {editingId ? "💾 Guardar cambios" : "✅ Crear cotización"}
          </button>
          <button
            onClick={() => { setView("list"); setEditingId(null); setForm(getEmptyForm()); }}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "12px 20px", cursor: "pointer", fontSize: 14 }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 22, margin: 0 }}>📝 Cotizaciones</h2>
        <button
          onClick={() => { setForm(getEmptyForm()); setEditingId(null); setView("form"); }}
          style={{ background: "#CAF404", color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          + Nueva Cotización
        </button>
      </div>

      <input
        style={{ ...inputStyle, marginBottom: 16 }}
        placeholder="🔍 Buscar por cliente, moto, patente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div style={{ color: "#64748b", textAlign: "center", marginTop: 60, fontSize: 15 }}>
          {quotes.length === 0 ? "No hay cotizaciones. Creá la primera." : "Sin resultados para la búsqueda."}
        </div>
      ) : (
        filtered
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((q) => {
            const client = clients.find((c) => c.id === q.clientId);
            const moto = motorcycles.find((m) => m.id === q.motorcycleId);
            return (
              <div
                key={q.id}
                style={cardStyle}
                onClick={() => { setSelectedId(q.id); setView("detail"); }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                      {client?.fullName ?? "Cliente desconocido"}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 3 }}>
                      {moto ? `${moto.brand} ${moto.model} (${moto.year}) · ${moto.plate}` : "Moto no encontrada"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                      {new Date(q.date + "T00:00:00").toLocaleDateString("es-AR")} · {q.items.length} ítem{q.items.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{
                      background: STATUS_COLORS[q.status] + "33",
                      color: STATUS_COLORS[q.status],
                      border: `1px solid ${STATUS_COLORS[q.status]}`,
                      borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                    }}>
                      {STATUS_LABELS[q.status]}
                    </span>
                    {q.convertedToOrderId && (
                      <span style={{
                        background: "#14532d", color: "#22c55e",
                        border: "1px solid #22c55e",
                        borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                      }}>
                        ✅ Orden creada
                      </span>
                    )}
                    <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16 }}>
                      ${q.total.toLocaleString("es-AR")}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(q); }}
                      style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePDF(q); }}
                      style={{ background: "#1e293b", border: "1px solid #334155", color: "#CAF404", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                    >
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}
