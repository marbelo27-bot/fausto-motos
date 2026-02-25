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

function getEmptyItem(): QuoteItem {
  return {
    id: uuidv4(),
    type: "labor",
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
  const { clients, motorcycles, quotes, addQuote, updateQuote, deleteQuote } = useStore();

  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(getEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<QuoteItem>(getEmptyItem());
  const [search, setSearch] = useState("");

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

  function handleAddItem() {
    if (!newItem.description.trim()) return;
    const items = [...form.items, { ...newItem, id: uuidv4() }];
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
    setNewItem(getEmptyItem());
  }

  function handleRemoveItem(id: string) {
    const items = form.items.filter((i) => i.id !== id);
    const totals = recalcTotals(items);
    setForm({ ...form, items, ...totals });
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
      <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setView("list")}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
          >
            ← Volver
          </button>
          <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, margin: 0 }}>
            Cotización #{selectedQuote.id.slice(0, 8).toUpperCase()}
          </h2>
          <span style={{
            background: STATUS_COLORS[selectedQuote.status] + "33",
            color: STATUS_COLORS[selectedQuote.status],
            border: `1px solid ${STATUS_COLORS[selectedQuote.status]}`,
            borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700,
          }}>
            {STATUS_LABELS[selectedQuote.status]}
          </span>
        </div>

        {/* Client + Moto */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px 18px" }}>
            <div style={sectionTitle}>Datos del Cliente</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{client?.fullName ?? "—"}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>📞 {client?.phone ?? "—"}</div>
            {client?.address && <div style={{ color: "#94a3b8", fontSize: 13 }}>📍 {client.address}</div>}
          </div>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px 18px" }}>
            <div style={sectionTitle}>Datos de la Moto</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{moto ? `${moto.brand} ${moto.model}` : "—"}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
              {moto?.year} · Dom: {moto?.plate}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px", flex: 1 }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Fecha</span>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
              {new Date(selectedQuote.date + "T00:00:00").toLocaleDateString("es-AR")}
            </div>
          </div>
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px", flex: 1 }}>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>Válida hasta</span>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
              {new Date(selectedQuote.validUntil + "T00:00:00").toLocaleDateString("es-AR")}
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={sectionTitle}>Detalle de Trabajos y Repuestos</div>
          {selectedQuote.items.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: 13 }}>Sin ítems</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "6px 8px", fontWeight: 700 }}>Tipo</th>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "6px 8px", fontWeight: 700 }}>Descripción</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "6px 8px", fontWeight: 700 }}>Cant.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "6px 8px", fontWeight: 700 }}>P. Unit.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "6px 8px", fontWeight: 700 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedQuote.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "7px 8px", color: item.type === "labor" ? "#3b82f6" : "#f59e0b" }}>
                      {item.type === "labor" ? "🔧 Mano de obra" : "⚙️ Repuesto"}
                    </td>
                    <td style={{ padding: "7px 8px", color: "#fff" }}>{item.description}</td>
                    <td style={{ padding: "7px 8px", color: "#94a3b8", textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ padding: "7px 8px", color: "#94a3b8", textAlign: "right" }}>
                      ${item.unitPrice.toLocaleString("es-AR")}
                    </td>
                    <td style={{ padding: "7px 8px", color: "#22c55e", fontWeight: 700, textAlign: "right" }}>
                      ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Mano de obra: <span style={{ color: "#3b82f6", fontWeight: 700 }}>${selectedQuote.laborTotal.toLocaleString("es-AR")}</span>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>
              Repuestos: <span style={{ color: "#f59e0b", fontWeight: 700 }}>${selectedQuote.partsTotal.toLocaleString("es-AR")}</span>
            </div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, borderTop: "1px solid #334155", paddingTop: 8, marginTop: 4 }}>
              TOTAL: <span style={{ color: "#CAF404" }}>${selectedQuote.total.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {selectedQuote.notes && (
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
            <div style={sectionTitle}>Observaciones</div>
            <div style={{ color: "#94a3b8", fontSize: 13, whiteSpace: "pre-wrap" }}>{selectedQuote.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => handlePDF(selectedQuote)}
            style={{ background: "#CAF404", color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >
            📄 Descargar PDF
          </button>
          <button
            onClick={() => handleEdit(selectedQuote)}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#fff", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
          >
            ✏️ Editar
          </button>
          <select
            value={selectedQuote.status}
            onChange={(e) => updateQuote(selectedQuote.id, { status: e.target.value as Quote["status"] })}
            style={{ ...inputStyle, width: "auto", padding: "10px 14px" }}
          >
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
          </select>
          <button
            onClick={() => handleDelete(selectedQuote.id)}
            style={{ background: "#ef444422", border: "1px solid #ef4444", color: "#ef4444", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14, marginLeft: "auto" }}
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  if (view === "form") {
    return (
      <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>
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

        {/* Items */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px", marginBottom: 16 }}>
          <div style={sectionTitle}>Trabajos y Repuestos</div>

          {/* Existing items */}
          {form.items.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "5px 6px" }}>Tipo</th>
                  <th style={{ color: "#CAF404", textAlign: "left", padding: "5px 6px" }}>Descripción</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Cant.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>P. Unit.</th>
                  <th style={{ color: "#CAF404", textAlign: "right", padding: "5px 6px" }}>Subtotal</th>
                  <th style={{ padding: "5px 6px" }}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #0f172a" }}>
                    <td style={{ padding: "6px", color: item.type === "labor" ? "#3b82f6" : "#f59e0b", fontSize: 12 }}>
                      {item.type === "labor" ? "🔧 M.O." : "⚙️ Rep."}
                    </td>
                    <td style={{ padding: "6px", color: "#fff" }}>{item.description}</td>
                    <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ padding: "6px", color: "#94a3b8", textAlign: "right" }}>${item.unitPrice.toLocaleString("es-AR")}</td>
                    <td style={{ padding: "6px", color: "#22c55e", fontWeight: 700, textAlign: "right" }}>
                      ${(item.quantity * item.unitPrice).toLocaleString("es-AR")}
                    </td>
                    <td style={{ padding: "6px", textAlign: "center" }}>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 14 }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add new item row */}
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 70px 110px auto", gap: 8, alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select
                style={inputStyle}
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as QuoteItem["type"] })}
              >
                <option value="labor">Mano de obra</option>
                <option value="part">Repuesto</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <input
                style={inputStyle}
                placeholder="Ej: Cambio de aceite, Filtro de aire..."
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(); }}
              />
            </div>
            <div>
              <label style={labelStyle}>Cant.</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Precio unit. ($)</label>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, visibility: "hidden" }}>.</label>
              <button
                onClick={handleAddItem}
                style={{ background: "#CAF404", color: "#000", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Totals summary */}
          {form.items.length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid #334155", paddingTop: 12, display: "flex", justifyContent: "flex-end", gap: 24 }}>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>
                M.O.: <strong style={{ color: "#3b82f6" }}>${form.laborTotal.toLocaleString("es-AR")}</strong>
              </span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>
                Repuestos: <strong style={{ color: "#f59e0b" }}>${form.partsTotal.toLocaleString("es-AR")}</strong>
              </span>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>
                TOTAL: <strong style={{ color: "#CAF404" }}>${form.total.toLocaleString("es-AR")}</strong>
              </span>
            </div>
          )}
        </div>

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
    <div style={{ padding: "24px 28px", maxWidth: 860, margin: "0 auto" }}>
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
                    <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16 }}>
                      ${q.total.toLocaleString("es-AR")}
                    </div>
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
