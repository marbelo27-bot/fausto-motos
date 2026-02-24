"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Part } from "@/lib/types";

interface PartFormData {
  description: string;
  costPrice: number;
  salePrice: number;
  stock: number;
}

const emptyForm: PartFormData = {
  description: "",
  costPrice: 0,
  salePrice: 0,
  stock: 0,
};

export default function Parts() {
  const { parts, addPart, updatePart, deletePart } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartFormData>(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = parts.filter(p =>
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePart(editingId, form);
    } else {
      addPart(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (part: Part) => {
    setForm({
      description: part.description,
      costPrice: part.costPrice,
      salePrice: part.salePrice,
      stock: part.stock,
    });
    setEditingId(part.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este repuesto?")) {
      deletePart(id);
    }
  };

  const margin = (part: Part) => {
    if (part.costPrice === 0) return 0;
    return Math.round(((part.salePrice - part.costPrice) / part.costPrice) * 100);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Repuestos</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
          + Nuevo Repuesto
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#2596be" }}>{parts.length}</div>
          <div className="stat-label">Repuestos en catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#16a34a" }}>
            ${parts.reduce((sum, p) => sum + p.salePrice * p.stock, 0).toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Valor stock (venta)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#d97706" }}>
            {parts.filter(p => p.stock === 0).length}
          </div>
          <div className="stat-label">Sin stock</div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Buscar repuesto..."
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
            No hay repuestos registrados
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(part => (
              <div key={part.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: "#1e2a4a", border: "1px solid #2d3f6b",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{part.description}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>
                    Costo: ${part.costPrice.toLocaleString("es-AR")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, color: "#2596be", fontSize: 13 }}>
                    ${part.salePrice.toLocaleString("es-AR")}
                  </span>
                  <span className={`badge ${margin(part) >= 30 ? "badge-green" : margin(part) >= 10 ? "badge-yellow" : "badge-red"}`}>
                    {margin(part)}%
                  </span>
                  <span className={`badge ${part.stock > 5 ? "badge-green" : part.stock > 0 ? "badge-yellow" : "badge-red"}`}>
                    Stock: {part.stock}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(part)}>✏️</button>
                  <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(part.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? "Editar Repuesto" : "Nuevo Repuesto"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  placeholder="Ej: Filtro de aceite Honda CG 150"
                />
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Costo de compra ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio de venta ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.salePrice}
                    onChange={e => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              {form.costPrice > 0 && form.salePrice > 0 && (
                <div style={{ padding: "10px 12px", background: "#f0f9ff", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                  💡 Margen de ganancia: <strong style={{ color: "#2596be" }}>
                    {Math.round(((form.salePrice - form.costPrice) / form.costPrice) * 100)}%
                  </strong>
                  {" "}(${(form.salePrice - form.costPrice).toLocaleString("es-AR")} por unidad)
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Agregar repuesto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
