"use client";
import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { generateReceptionPDF } from "@/lib/pdfGenerator";
import type { Reception as ReceptionType, ReceptionImage } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface ReceptionFormData {
  clientId: string;
  motorcycleId: string;
  date: string;
  km: number;
  fuelPercent: number;
  tiresPercent: number;
  transmissionPercent: number;
  bodyCondition: "muy buena" | "buena" | "regular" | "mala";
  missing: string;
  accessories: string;
  helmet: boolean;
  documentation: boolean;
  images: ReceptionImage[];
  notes: string;
}

const getEmptyForm = (): ReceptionFormData => {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return {
    clientId: "",
    motorcycleId: "",
    date: today,
    km: 0,
    fuelPercent: 50,
    tiresPercent: 75,
    transmissionPercent: 75,
    bodyCondition: "buena",
    missing: "",
    accessories: "",
    helmet: false,
    documentation: false,
    images: [],
    notes: "",
  };
};

function PercentBar({ value, label }: { value: number; label: string }) {
  const color = value >= 75 ? "#16a34a" : value >= 50 ? "#2596be" : value >= 25 ? "#d97706" : "#dc2626";
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function Reception() {
  const { clients, motorcycles, receptions, addReception, updateReception, deleteReception } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReceptionFormData>(getEmptyForm());
  const [search, setSearch] = useState("");
  const [viewingReception, setViewingReception] = useState<ReceptionType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientMotorcycles = form.clientId
    ? motorcycles.filter(m => m.clientId === form.clientId)
    : [];

  const filtered = receptions.filter(r => {
    const client = clients.find(c => c.id === r.clientId);
    const moto = motorcycles.find(m => m.id === r.motorcycleId);
    return (
      client?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      moto?.plate.toLowerCase().includes(search.toLowerCase()) ||
      moto?.brand.toLowerCase().includes(search.toLowerCase())
    );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateReception(editingId, form);
    } else {
      addReception(form);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptyForm());
  };

  const handleEdit = (r: ReceptionType) => {
    setForm({
      clientId: r.clientId,
      motorcycleId: r.motorcycleId,
      date: r.date,
      km: r.km,
      fuelPercent: r.fuelPercent,
      tiresPercent: r.tiresPercent,
      transmissionPercent: r.transmissionPercent,
      bodyCondition: r.bodyCondition,
      missing: r.missing,
      accessories: r.accessories,
      helmet: r.helmet,
      documentation: r.documentation,
      images: r.images,
      notes: r.notes,
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar esta recepción?")) {
      deleteReception(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newImg: ReceptionImage = { id: uuidv4(), dataUrl, caption: file.name };
        setForm(prev => ({ ...prev, images: [...prev.images, newImg] }));
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (imgId: string) => {
    setForm(prev => ({ ...prev, images: prev.images.filter(i => i.id !== imgId) }));
  };

  const handleGeneratePDF = async (reception: ReceptionType) => {
    const client = clients.find(c => c.id === reception.clientId);
    const moto = motorcycles.find(m => m.id === reception.motorcycleId);
    if (client && moto) {
      await generateReceptionPDF(reception, client, moto);
    }
  };

  const fuelLabel = (v: number) => v >= 75 ? "Lleno" : v >= 50 ? "3/4" : v >= 25 ? "1/2" : "Vacío";
  const condLabel = (v: number) => v >= 75 ? "Excelente" : v >= 50 ? "Buena" : v >= 25 ? "Regular" : "Mala";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Recepción</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(getEmptyForm()); }}>
          + Nueva Recepción
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por cliente, dominio o marca..."
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
            No hay recepciones registradas
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(r => {
              const client = clients.find(c => c.id === r.clientId);
              const moto = motorcycles.find(m => m.id === r.motorcycleId);
              return (
                <div key={r.id} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "#1e2a4a", border: "1px solid #2d3f6b",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13, color: "#fff" }}>{client?.fullName || "—"}</div>
                    <div style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
                      {moto ? `${moto.brand} ${moto.model}` : "—"}{moto?.plate ? ` · ${moto.plate}` : ""} · {r.km.toLocaleString("es-AR")} km
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span className={`badge ${r.fuelPercent >= 50 ? "badge-green" : r.fuelPercent >= 25 ? "badge-yellow" : "badge-red"}`}>
                      ⛽ {r.fuelPercent}%
                    </span>
                    <span className={`badge ${r.bodyCondition === "muy buena" || r.bodyCondition === "buena" ? "badge-green" : r.bodyCondition === "regular" ? "badge-yellow" : "badge-red"}`}>
                      {r.bodyCondition}
                    </span>
                    {r.images.length > 0 && <span className="badge badge-blue">📷 {r.images.length}</span>}
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: "bold" }}>
                      {new Date(r.date + "T00:00:00").toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => setViewingReception(r)}>👁️</button>
                    <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleEdit(r)}>✏️</button>
                    <button className="btn-success" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleGeneratePDF(r)}>📄</button>
                    <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => handleDelete(r.id)}>🗑️</button>
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
              <h2 className="modal-title">{editingId ? "Editar Recepción" : "Nueva Recepción"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Client & Moto */}
              <div className="section-title">Datos del Vehículo</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <select
                    className="form-select"
                    value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value, motorcycleId: "" })}
                    required
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Moto *</label>
                  <select
                    className="form-select"
                    value={form.motorcycleId}
                    onChange={e => setForm({ ...form, motorcycleId: e.target.value })}
                    required
                    disabled={!form.clientId}
                  >
                    <option value="">Seleccionar moto...</option>
                    {clientMotorcycles.map(m => (
                      <option key={m.id} value={m.id}>{m.brand} {m.model} — {m.plate}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Kilómetros *</label>
                  <input type="number" className="form-input" value={form.km} onChange={e => setForm({ ...form, km: parseInt(e.target.value) || 0 })} required min={0} />
                </div>
              </div>

              {/* Condition sliders */}
              <div className="section-title" style={{ marginTop: 8 }}>Estado del Vehículo</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Combustible: {form.fuelPercent}% — {fuelLabel(form.fuelPercent)}</label>
                  <input type="range" className="range-slider" min={0} max={100} step={25}
                    value={form.fuelPercent} onChange={e => setForm({ ...form, fuelPercent: parseInt(e.target.value) })} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                    <span>Vacío</span><span>1/4</span><span>1/2</span><span>3/4</span><span>Lleno</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Cubiertas: {form.tiresPercent}% — {condLabel(form.tiresPercent)}</label>
                  <input type="range" className="range-slider" min={25} max={100} step={25}
                    value={form.tiresPercent} onChange={e => setForm({ ...form, tiresPercent: parseInt(e.target.value) })} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                    <span>Mala</span><span>Regular</span><span>Buena</span><span>Excelente</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Transmisión: {form.transmissionPercent}% — {condLabel(form.transmissionPercent)}</label>
                  <input type="range" className="range-slider" min={25} max={100} step={25}
                    value={form.transmissionPercent} onChange={e => setForm({ ...form, transmissionPercent: parseInt(e.target.value) })} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                    <span>Mala</span><span>Regular</span><span>Buena</span><span>Excelente</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Carrocería</label>
                  <select className="form-select" value={form.bodyCondition}
                    onChange={e => setForm({ ...form, bodyCondition: e.target.value as ReceptionFormData["bodyCondition"] })}>
                    <option value="muy buena">Muy buena</option>
                    <option value="buena">Buena</option>
                    <option value="regular">Regular</option>
                    <option value="mala">Mala</option>
                  </select>
                </div>
              </div>

              {/* Extras */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Faltantes</label>
                  <input className="form-input" value={form.missing} onChange={e => setForm({ ...form, missing: e.target.value })} placeholder="Ej: espejo izquierdo, tapa..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Accesorios</label>
                  <input className="form-input" value={form.accessories} onChange={e => setForm({ ...form, accessories: e.target.value })} placeholder="Ej: baúl, alarma..." />
                </div>
              </div>

              <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={form.helmet} onChange={e => setForm({ ...form, helmet: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#2596be" }} />
                  🪖 Casco
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                  <input type="checkbox" checked={form.documentation} onChange={e => setForm({ ...form, documentation: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#2596be" }} />
                  📄 Documentación
                </label>
              </div>

              {/* Images */}
              <div className="section-title">Registro Fotográfico</div>
              <div style={{ marginBottom: 16 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  📷 Agregar fotos
                </button>
                {form.images.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {form.images.map(img => (
                      <div key={img.id} style={{ position: "relative", width: 100, height: 80 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.dataUrl} alt={img.caption} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #2d3f6b" }} />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            background: "#dc2626", color: "white", border: "none",
                            borderRadius: "50%", width: 20, height: 20, cursor: "pointer",
                            fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionales sobre el estado del vehículo..." />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Guardar cambios" : "Registrar recepción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingReception && (() => {
        const client = clients.find(c => c.id === viewingReception.clientId);
        const moto = motorcycles.find(m => m.id === viewingReception.motorcycleId);
        return (
          <div className="modal-overlay" onClick={() => setViewingReception(null)}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">📋 Recepción — {new Date(viewingReception.date + "T00:00:00").toLocaleDateString("es-AR")}</h2>
                <button onClick={() => setViewingReception(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="section-title">Cliente y Vehículo</div>
                  <div style={{ fontSize: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>👤 <strong>{client?.fullName}</strong> — {client?.phone}</div>
                    <div>🏍️ <strong>{moto?.brand} {moto?.model}</strong> ({moto?.year}) — {moto?.plate}</div>
                    <div>📏 <strong>{viewingReception.km.toLocaleString("es-AR")} km</strong></div>
                  </div>
                </div>
                <div>
                  <div className="section-title">Estado</div>
                  <PercentBar value={viewingReception.fuelPercent} label={`Combustible (${fuelLabel(viewingReception.fuelPercent)})`} />
                  <PercentBar value={viewingReception.tiresPercent} label={`Cubiertas (${condLabel(viewingReception.tiresPercent)})`} />
                  <PercentBar value={viewingReception.transmissionPercent} label={`Transmisión (${condLabel(viewingReception.transmissionPercent)})`} />
                  <div style={{ fontSize: 13, marginTop: 6 }}>Carrocería: <strong>{viewingReception.bodyCondition}</strong></div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div>
                  {viewingReception.missing && <div style={{ fontSize: 13 }}>⚠️ <strong>Faltantes:</strong> {viewingReception.missing}</div>}
                  {viewingReception.accessories && <div style={{ fontSize: 13 }}>🔩 <strong>Accesorios:</strong> {viewingReception.accessories}</div>}
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <div>{viewingReception.helmet ? "✅" : "❌"} Casco</div>
                  <div>{viewingReception.documentation ? "✅" : "❌"} Documentación</div>
                </div>
              </div>

              {viewingReception.notes && (
                <div style={{ marginBottom: 16, padding: "10px 12px", background: "#1e2a4a", borderRadius: 8, fontSize: 13, color: "#fff", fontWeight: "bold" }}>
                  📝 {viewingReception.notes}
                </div>
              )}

              {viewingReception.images.length > 0 && (
                <div>
                  <div className="section-title">Fotos ({viewingReception.images.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {viewingReception.images.map(img => (
                      <div key={img.id} style={{ width: 120, height: 90 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.dataUrl} alt={img.caption} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6, border: "1px solid #2d3f6b" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn-success" onClick={() => handleGeneratePDF(viewingReception)}>
                  📄 Generar PDF
                </button>
                <button className="btn-secondary" onClick={() => setViewingReception(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
