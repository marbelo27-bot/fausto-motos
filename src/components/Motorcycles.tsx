"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getBrandNames, getModelsByBrand, years } from "@/lib/motorcycleData";
import type { Motorcycle } from "@/lib/types";

interface MotoFormData {
  clientId: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
}

const emptyForm: MotoFormData = {
  clientId: "",
  brand: "",
  model: "",
  plate: "",
  year: new Date().getFullYear(),
};

export default function Motorcycles() {
  const { clients, motorcycles, addMotorcycle, updateMotorcycle, deleteMotorcycle } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MotoFormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customModel, setCustomModel] = useState("");

  const brands = getBrandNames();
  const models = form.brand ? getModelsByBrand(form.brand) : [];

  const filtered = motorcycles.filter(m => {
    const client = clients.find(c => c.id === m.clientId);
    return (
      m.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.model.toLowerCase().includes(search.toLowerCase()) ||
      m.plate.toLowerCase().includes(search.toLowerCase()) ||
      client?.fullName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBrand = form.brand === "__custom__" ? customBrand : form.brand;
    const finalModel = form.model === "__custom__" ? customModel : form.model;
    const data = { ...form, brand: finalBrand, model: finalModel };
    if (editingId) {
      updateMotorcycle(editingId, data);
    } else {
      addMotorcycle(data);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCustomBrand("");
    setCustomModel("");
  };

  const handleEdit = (moto: Motorcycle) => {
    const brandInList = brands.includes(moto.brand);
    const modelInList = brandInList ? getModelsByBrand(moto.brand).includes(moto.model) : false;
    setForm({
      clientId: moto.clientId,
      brand: brandInList ? moto.brand : "__custom__",
      model: modelInList ? moto.model : "__custom__",
      plate: moto.plate,
      year: moto.year,
    });
    if (!brandInList) setCustomBrand(moto.brand);
    if (!modelInList) setCustomModel(moto.model);
    setEditingId(moto.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar esta moto?")) {
      deleteMotorcycle(id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏍️ Motos</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}>
          + Nueva Moto
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por marca, modelo, dominio o cliente..."
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
            No hay motos registradas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(moto => {
              const client = clients.find(c => c.id === moto.clientId);
              return (
                <div key={moto.id} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "#1e2a4a", border: "1px solid #2d3f6b",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{moto.brand} {moto.model}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      👤 {client?.fullName || "—"}{client?.phone ? ` · ${client.phone}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span className="badge badge-blue" style={{ fontSize: 12, padding: "3px 10px" }}>{moto.plate}</span>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{moto.year}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(moto)}>✏️</button>
                    <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(moto.id)}>🗑️</button>
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
              <h2 className="modal-title">{editingId ? "Editar Moto" : "Nueva Moto"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Propietario *</label>
                <select
                  className="form-select"
                  value={form.clientId}
                  onChange={e => setForm({ ...form, clientId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Marca *</label>
                  <select
                    className="form-select"
                    value={form.brand}
                    onChange={e => {
                      setForm({ ...form, brand: e.target.value, model: "" });
                      setCustomBrand("");
                    }}
                    required
                  >
                    <option value="">Seleccionar marca...</option>
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="__custom__">Otra marca...</option>
                  </select>
                  {form.brand === "__custom__" && (
                    <input
                      className="form-input"
                      style={{ marginTop: 6 }}
                      placeholder="Escribir marca..."
                      value={customBrand}
                      onChange={e => setCustomBrand(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Modelo *</label>
                  <select
                    className="form-select"
                    value={form.model}
                    onChange={e => {
                      setForm({ ...form, model: e.target.value });
                      setCustomModel("");
                    }}
                    required
                    disabled={!form.brand}
                  >
                    <option value="">Seleccionar modelo...</option>
                    {models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="__custom__">Otro modelo...</option>
                  </select>
                  {form.model === "__custom__" && (
                    <input
                      className="form-input"
                      style={{ marginTop: 6 }}
                      placeholder="Escribir modelo..."
                      value={customModel}
                      onChange={e => setCustomModel(e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dominio (Patente) *</label>
                  <input
                    className="form-input"
                    value={form.plate}
                    onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                    required
                    placeholder="Ej: ABC123 o AB123CD"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Año *</label>
                  <select
                    className="form-select"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                    required
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Registrar moto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
