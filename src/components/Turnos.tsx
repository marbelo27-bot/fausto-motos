"use client";

import { useState } from "react";
import { useStore } from "../lib/store";
import type { Turno } from "../lib/types";
import { generateTurnoPDF } from "../lib/pdfGenerator";

function getEmptyForm(): Omit<Turno, "id" | "createdAt"> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  return {
    clientId: "",
    motorcycleId: "",
    date: dateStr,
    time: "09:00",
    service: "",
    notes: "",
    status: "programado",
  };
}

export default function Turnos() {
  const { clients, motorcycles, turnos, addTurno, updateTurno, deleteTurno, addClient } = useStore();
  const [turnosList, setTurnosList] = useState<Turno[]>(turnos);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ fullName: "", phone: "", address: "", notes: "" });
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);

  // Sync with store
  useState(() => {
    setTurnosList(turnos);
  });

  const clientsSorted = [...clients].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const turnosSorted = [...turnosList].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.fullName || "—";
  const getMotoName = (id: string) => {
    const moto = motorcycles.find((m) => m.id === id);
    return moto ? `${moto.brand} ${moto.model} (${moto.plate})` : "—";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.motorcycleId) {
      alert("Por favor seleccioná un cliente y una moto");
      return;
    }
    if (editingId) {
      updateTurno(editingId, formData);
    } else {
      addTurno(formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData(getEmptyForm());
  };

  const handleEdit = (turno: Turno) => {
    setFormData({
      clientId: turno.clientId,
      motorcycleId: turno.motorcycleId,
      date: turno.date,
      time: turno.time,
      service: turno.service,
      notes: turno.notes,
      status: turno.status,
    });
    setEditingId(turno.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este turno?")) {
      deleteTurno(id);
    }
  };

  const handleNewClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.fullName || !newClientData.phone) {
      alert("Por favor completá nombre y teléfono");
      return;
    }
    const client = addClient(newClientData);
    setFormData((prev) => ({ ...prev, clientId: client.id }));
    setShowNewClient(false);
    setNewClientData({ fullName: "", phone: "", address: "", notes: "" });
  };

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, clientId, motorcycleId: "" }));
  };

  const handlePrintPDF = (turno: Turno) => {
    const client = clients.find((c) => c.id === turno.clientId);
    const moto = motorcycles.find((m) => m.id === turno.motorcycleId);
    if (client && moto) {
      generateTurnoPDF(turno, client, moto);
    }
  };

  const getStatusColor = (status: Turno["status"]) => {
    switch (status) {
      case "programado": return "badge-info";
      case "confirmado": return "badge-success";
      case "completado": return "badge-primary";
      case "cancelado": return "badge-danger";
      default: return "";
    }
  };

  const getStatusLabel = (status: Turno["status"]) => {
    switch (status) {
      case "programado": return "Programado";
      case "confirmado": return "Confirmado";
      case "completado": return "Completado";
      case "cancelado": return "Cancelado";
      default: return status;
    }
  };

  // Filter motorcycles by selected client
  const clientMotos = formData.clientId
    ? motorcycles.filter((m) => m.clientId === formData.clientId)
    : [];

  // Use store's turnos directly for display
  const displayTurnos = [...turnos].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📅 Turnos</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setFormData(getEmptyForm()); }}>
          ➕ Nuevo Turno
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">{editingId ? "Editar Turno" : "Nuevo Turno"}</h2>
            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cliente</label>
                  <div className="flex gap-2">
                    <select
                      className="form-select"
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientsSorted.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullName}</option>
                      ))}
                    </select>
                    <button type="button" className="btn-secondary" onClick={() => setShowNewClient(true)}>
                      ➕
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Moto</label>
                  <select
                    className="form-select"
                    value={formData.motorcycleId}
                    onChange={(e) => setFormData({ ...formData, motorcycleId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar moto...</option>
                    {clientMotos.map((m) => (
                      <option key={m.id} value={m.id}>{m.brand} {m.model} ({m.plate})</option>
                    ))}
                  </select>
                </div>
              </div>

              {showNewClient && (
                <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "#60a5fa" }}>Nuevo Cliente</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newClientData.fullName}
                        onChange={(e) => setNewClientData({ ...newClientData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Dirección</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newClientData.address}
                        onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Notas</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newClientData.notes}
                        onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button type="submit" className="btn-primary" onClick={handleNewClientSubmit}>
                      Guardar Cliente
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowNewClient(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Servicio</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  placeholder="Ej: Cambio de aceite, service, revisión..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Turno["status"] })}
                >
                  <option value="programado">Programado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary">
                  {editingId ? "Actualizar" : "Crear"} Turno
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTurno && (
        <div className="modal-overlay" onClick={() => setSelectedTurno(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Detalle del Turno</h2>
            <div className="detail-card">
              <div className="detail-row">
                <span className="detail-label">Cliente:</span>
                <span className="detail-value">{getClientName(selectedTurno.clientId)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Moto:</span>
                <span className="detail-value">{getMotoName(selectedTurno.motorcycleId)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">
                  {new Date(selectedTurno.date + "T00:00:00").toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Hora:</span>
                <span className="detail-value">{selectedTurno.time}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Servicio:</span>
                <span className="detail-value">{selectedTurno.service}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Estado:</span>
                <span className={`badge ${getStatusColor(selectedTurno.status)}`}>
                  {getStatusLabel(selectedTurno.status)}
                </span>
              </div>
              {selectedTurno.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notas:</span>
                  <span className="detail-value">{selectedTurno.notes}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary" onClick={() => handlePrintPDF(selectedTurno)}>
                🖨️ Imprimir PDF
              </button>
              <button className="btn-secondary" onClick={() => setSelectedTurno(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cards-grid">
        {displayTurnos.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", gridColumn: "1/-1" }}>
            No hay turnos programados
          </p>
        ) : (
          displayTurnos.map((turno) => (
            <div
              key={turno.id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedTurno(turno)}
            >
              <div className="card-header">
                <span className="card-title">
                  {new Date(turno.date + "T00:00:00").toLocaleDateString("es-AR")} a las {turno.time}
                </span>
                <span className={`badge ${getStatusColor(turno.status)}`}>
                  {getStatusLabel(turno.status)}
                </span>
              </div>
              <div className="card-body">
                <p className="card-text" style={{ color: "#60a5fa", fontWeight: 600 }}>
                  👤 {getClientName(turno.clientId)}
                </p>
                <p className="card-text" style={{ color: "#94a3b8" }}>
                  🏍️ {getMotoName(turno.motorcycleId)}
                </p>
                <p className="card-text" style={{ color: "#e2e8f0", marginTop: "0.5rem" }}>
                  🔧 {turno.service}
                </p>
              </div>
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-icon" onClick={() => handleEdit(turno)} title="Editar">
                  ✏️
                </button>
                <button className="btn-icon" onClick={() => handleDelete(turno.id)} title="Eliminar">
                  🗑️
                </button>
                <button className="btn-icon" onClick={() => handlePrintPDF(turno)} title="Imprimir PDF">
                  🖨️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
