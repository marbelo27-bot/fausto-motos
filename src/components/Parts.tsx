"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Part, Category } from "@/lib/types";

interface PartFormData {
  description: string;
  category: string;
  costPrice: string;
  salePrice: string;
  stock: string;
}

interface CategoryFormData {
  name: string;
  code: string;
}

const emptyForm: PartFormData = {
  description: "",
  category: "",
  costPrice: "",
  salePrice: "",
  stock: "",
};

const emptyCategoryForm: CategoryFormData = {
  name: "",
  code: "",
};

export default function Parts() {
  const { parts, addPart, updatePart, deletePart, categories, addCategory, updateCategory, deleteCategory } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<PartFormData>(emptyForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Set default category on first load
  const defaultCategory = categories.length > 0 ? categories[0].id : "";

  const filtered = parts.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(search.toLowerCase()) || 
                         p.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Group parts by category
  const partsByCategory = filtered.reduce((acc, part) => {
    const cat = categories.find(c => c.id === part.category);
    const catName = cat?.name || "Sin categoría";
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(part);
    return acc;
  }, {} as Record<string, Part[]>);

  const sortedCategories = Object.keys(partsByCategory).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) {
      alert("Por favor seleccione una categoría");
      return;
    }
    const parsed = {
      description: form.description,
      category: form.category,
      costPrice: parseFloat(form.costPrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      stock: parseInt(form.stock) || 0,
    };
    if (editingId) {
      updatePart(editingId, parsed);
    } else {
      addPart(parsed);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (part: Part) => {
    setForm({
      description: part.description,
      category: part.category || defaultCategory,
      costPrice: String(part.costPrice),
      salePrice: String(part.salePrice),
      stock: String(part.stock),
    });
    setEditingId(part.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar este repuesto?")) {
      deletePart(id);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.code.trim()) {
      alert("Complete todos los campos");
      return;
    }
    if (editingCategoryId) {
      updateCategory(editingCategoryId, {
        name: categoryForm.name,
        code: categoryForm.code.toUpperCase(),
      });
    } else {
      addCategory({
        name: categoryForm.name,
        code: categoryForm.code.toUpperCase(),
      });
    }
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryForm({
      name: cat.name,
      code: cat.code,
    });
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (id: string) => {
    const partsInCategory = parts.filter(p => p.category === id).length;
    if (partsInCategory > 0) {
      alert(`No se puede eliminar: hay ${partsInCategory} repuestos en esta categoría`);
      return;
    }
    if (confirm("¿Eliminar esta categoría?")) {
      deleteCategory(id);
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={() => { setShowCategoryForm(true); setEditingCategoryId(null); setCategoryForm(emptyCategoryForm); }}>
            📂 Categorías
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm({...emptyForm, category: defaultCategory}); }}>
            + Nuevo Repuesto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#60a5fa" }}>{parts.length}</div>
          <div className="stat-label">Repuestos en catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#4ade80" }}>
            ${parts.reduce((sum, p) => sum + p.salePrice * p.stock, 0).toLocaleString("es-AR")}
          </div>
          <div className="stat-label">Valor stock (venta)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#fbbf24" }}>
            {parts.filter(p => p.stock === 0).length}
          </div>
          <div className="stat-label">Sin stock</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 200 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
            <input
              className="search-input"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 36 }}
            />
          </div>
          <select
            className="form-input"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 200, cursor: "pointer" }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List - Grouped by Category */}
      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", padding: "32px 0" }}>
            No hay repuestos registrados
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {sortedCategories.map(category => (
              <div key={category}>
                <div style={{ 
                  padding: "8px 12px", 
                  background: "rgba(59, 130, 246, 0.15)", 
                  borderRadius: 8, 
                  marginBottom: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#60a5fa"
                }}>
                  📦 {category} ({partsByCategory[category].length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {partsByCategory[category].map(part => (
                    <div key={part.id} style={{
                      padding: "12px 16px", borderRadius: 12,
                      background: "#1e293b", border: "1px solid #334155",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ 
                            background: "#3b82f6", 
                            color: "#fff", 
                            padding: "2px 8px", 
                            borderRadius: 4, 
                            fontSize: 11, 
                            fontWeight: 700,
                            fontFamily: "monospace"
                          }}>
                            {part.code}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{part.description}</span>
                        </div>
                        <div style={{ color: "#94a3b8", fontWeight: 500, fontSize: 12 }}>
                          Costo: ${part.costPrice.toLocaleString("es-AR")}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <span style={{ fontWeight: 800, color: "#22c55e", fontSize: 13 }}>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parts Form Modal */}
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
              <div className="form-group">
                <label className="form-label">Categoría *</label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Seleccionar categoría...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Costo de compra ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio de venta ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="form-input"
                    value={form.salePrice}
                    onChange={e => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {parseFloat(form.costPrice) > 0 && parseFloat(form.salePrice) > 0 && (
                <div style={{ padding: "10px 12px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#cbd5e1" }}>
                  💡 Margen de ganancia: <strong style={{ color: "#60a5fa" }}>
                    {Math.round(((parseFloat(form.salePrice) - parseFloat(form.costPrice)) / parseFloat(form.costPrice)) * 100)}%
                  </strong>
                  {" "}(${(parseFloat(form.salePrice) - parseFloat(form.costPrice)).toLocaleString("es-AR")} por unidad)
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

      {/* Categories Form Modal */}
      {showCategoryForm && (
        <div className="modal-overlay" onClick={() => setShowCategoryForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCategoryId ? "Editar Categoría" : "Gestionar Categorías"}</h2>
              <button onClick={() => setShowCategoryForm(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            
            {/* Add/Edit Category Form */}
            <form onSubmit={handleCategorySubmit} style={{ marginBottom: 20 }}>
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    value={categoryForm.name}
                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Ej: Aceites y líquidos"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Código (1-4 letras)</label>
                  <input
                    className="form-input"
                    value={categoryForm.code}
                    onChange={e => setCategoryForm({ ...categoryForm, code: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase() })}
                    placeholder="Ej: LUB"
                    maxLength={4}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                {editingCategoryId ? "Guardar Categoría" : "Agregar Categoría"}
              </button>
            </form>

            {/* Categories List */}
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#94a3b8" }}>Código</th>
                    <th style={{ textAlign: "left", padding: "8px 4px", color: "#94a3b8" }}>Nombre</th>
                    <th style={{ textAlign: "right", padding: "8px 4px", color: "#94a3b8" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => {
                    const partCount = parts.filter(p => p.category === cat.id).length;
                    return (
                      <tr key={cat.id} style={{ borderBottom: "1px solid #1e293b" }}>
                        <td style={{ padding: "8px 4px" }}>
                          <span style={{ 
                            background: "#3b82f6", 
                            color: "#fff", 
                            padding: "2px 6px", 
                            borderRadius: 4, 
                            fontSize: 11, 
                            fontWeight: 700,
                            fontFamily: "monospace"
                          }}>
                            {cat.code}
                          </span>
                        </td>
                        <td style={{ padding: "8px 4px", color: "#e2e8f0" }}>
                          {cat.name}
                          <span style={{ color: "#64748b", fontSize: 11, marginLeft: 8 }}>
                            ({partCount} rep.)
                          </span>
                        </td>
                        <td style={{ padding: "8px 4px", textAlign: "right" }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "2px 6px", fontSize: 10, marginRight: 4 }}
                            onClick={() => handleEditCategory(cat)}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-danger" 
                            style={{ padding: "2px 6px", fontSize: 10 }}
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={partCount > 0}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
