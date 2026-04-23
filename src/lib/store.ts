"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  Client,
  Motorcycle,
  Reception,
  ServiceOrder,
  Part,
  Payment,
  ServiceType,
  Quote,
  Turno,
  Category,
} from "./types";
import { createServiceCalendarEvent, updateServiceCalendarEvent, deleteServiceCalendarEvent } from "./googleCalendar";

interface AppState {
  clients: Client[];
  motorcycles: Motorcycle[];
  receptions: Reception[];
  serviceOrders: ServiceOrder[];
  parts: Part[];
  categories: Category[];
  payments: Payment[];
  serviceTypes: ServiceType[];
  quotes: Quote[];
  turnos: Turno[];

  // Clients
  addClient: (data: Omit<Client, "id" | "createdAt">) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Motorcycles
  addMotorcycle: (data: Omit<Motorcycle, "id">) => Motorcycle;
  updateMotorcycle: (id: string, data: Partial<Motorcycle>) => void;
  deleteMotorcycle: (id: string) => void;

  // Receptions
  addReception: (data: Omit<Reception, "id">) => Reception;
  updateReception: (id: string, data: Partial<Reception>) => void;
  deleteReception: (id: string) => void;

  // Service Orders
  addServiceOrder: (data: Omit<ServiceOrder, "id">) => ServiceOrder;
  updateServiceOrder: (id: string, data: Partial<ServiceOrder>) => void;
  deleteServiceOrder: (id: string) => void;

  // Parts
  addPart: (data: Omit<Part, "id" | "code">) => Part;
  updatePart: (id: string, data: Partial<Part>) => void;
  deletePart: (id: string) => void;

  // Categories
  addCategory: (data: Omit<Category, "id">) => Category;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Payments
  addPayment: (data: Omit<Payment, "id">) => Payment;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  // Service Types
  addServiceType: (name: string) => ServiceType;
  deleteServiceType: (id: string) => void;

  // Quotes
  addQuote: (data: Omit<Quote, "id">) => Quote;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  // Turnos
  addTurno: (data: Omit<Turno, "id">) => Turno;
  updateTurno: (id: string, data: Partial<Turno>) => void;
  deleteTurno: (id: string) => void;

  // Backup
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const defaultServiceTypes: ServiceType[] = [
  { id: uuidv4(), name: "Servis" },
  { id: uuidv4(), name: "Servis mantenimiento" },
  { id: uuidv4(), name: "Servis preventivo" },
  { id: uuidv4(), name: "Cambio de aceite" },
  { id: uuidv4(), name: "Cambio de filtro de aire" },
  { id: uuidv4(), name: "Cambio de bujía" },
  { id: uuidv4(), name: "Cambio de cadena y piñones" },
  { id: uuidv4(), name: "Cambio de frenos" },
  { id: uuidv4(), name: "Cambio de cubiertas" },
  { id: uuidv4(), name: "Revisión eléctrica" },
  { id: uuidv4(), name: "Revisión de carburador" },
  { id: uuidv4(), name: "Revisión de inyección" },
  { id: uuidv4(), name: "Reparación de motor" },
  { id: uuidv4(), name: "Reparación de caja de cambios" },
  { id: uuidv4(), name: "Reparación de suspensión" },
  { id: uuidv4(), name: "Diagnóstico general" },
  { id: uuidv4(), name: "Preparación para VTV" },
];

const defaultCategories: Category[] = [
  { id: uuidv4(), name: "Carrocería", code: "C" },
  { id: uuidv4(), name: "Asiento / Tapizado", code: "A" },
  { id: uuidv4(), name: "Portaequipaje / Maletas", code: "P" },
  { id: uuidv4(), name: "Protector de motor / Sliders", code: "S" },
  { id: uuidv4(), name: "Discos de embrague", code: "D" },
  { id: uuidv4(), name: "Kit de pistón", code: "K" },
  { id: uuidv4(), name: "Juntas de motor", code: "J" },
  { id: uuidv4(), name: "Válvulas", code: "V" },
  { id: uuidv4(), name: "Cigüeñal y bielas", code: "B" },
  { id: uuidv4(), name: "Árbol de levas", code: "L" },
  { id: uuidv4(), name: "Bomba de aceite", code: "O" },
  { id: uuidv4(), name: "Bomba de agua", code: "W" },
  { id: uuidv4(), name: "Filtros de aceite", code: "FA" },
  { id: uuidv4(), name: "Filtros de aire", code: "F" },
  { id: uuidv4(), name: "Filtros de combustible", code: "FC" },
  { id: uuidv4(), name: "Pastillas y discos de freno", code: "Freno" },
  { id: uuidv4(), name: "Bujías", code: "Buj" },
  { id: uuidv4(), name: "Kit de arrastre", code: "R" },
  { id: uuidv4(), name: "Neumáticos / Llantas", code: "N" },
  { id: uuidv4(), name: "Aceites y líquidos", code: "Lub" },
  { id: uuidv4(), name: "Batería", code: "Bat" },
  { id: uuidv4(), name: "Bombillas y faros", code: "Ilum" },
  { id: uuidv4(), name: "Cables", code: "Cab" },
  { id: uuidv4(), name: "Retenes de horquilla", code: "RH" },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: [],
      motorcycles: [],
      receptions: [],
      serviceOrders: [],
      parts: [],
      payments: [],
      serviceTypes: defaultServiceTypes,
      categories: defaultCategories,
      quotes: [],
      turnos: [],

      addClient: (data) => {
        const client: Client = {
          ...data,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [...s.clients, client] }));
        return client;
      },
      updateClient: (id, data) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteClient: (id) =>
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      addMotorcycle: (data) => {
        const moto: Motorcycle = { ...data, id: uuidv4() };
        set((s) => ({ motorcycles: [...s.motorcycles, moto] }));
        return moto;
      },
      updateMotorcycle: (id, data) =>
        set((s) => ({
          motorcycles: s.motorcycles.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        })),
      deleteMotorcycle: (id) =>
        set((s) => ({
          motorcycles: s.motorcycles.filter((m) => m.id !== id),
        })),

      addReception: (data) => {
        const reception: Reception = { ...data, id: uuidv4() };
        set((s) => ({ receptions: [...s.receptions, reception] }));
        return reception;
      },
      updateReception: (id, data) =>
        set((s) => ({
          receptions: s.receptions.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        })),
      deleteReception: (id) =>
        set((s) => ({
          receptions: s.receptions.filter((r) => r.id !== id),
        })),

      addServiceOrder: (data) => {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existing = get().serviceOrders;
        const seq = String(existing.length + 1).padStart(3, "0");
        const id = `${yyyymm}-${seq}`;
        const order: ServiceOrder = { ...data, id };
        set((s) => ({ serviceOrders: [...s.serviceOrders, order] }));
        
        // Try to create Google Calendar event (non-blocking)
        const client = get().clients.find(c => c.id === order.clientId);
        const motorcycle = get().motorcycles.find(m => m.id === order.motorcycleId);
        if (client && motorcycle) {
          // For new orders, we don't have a "next service date" yet, so we'll skip calendar creation
          // This would be implemented when we have a next service calculation feature
          // createServiceCalendarEvent(order, client, motorcycle, nextServiceDate);
        }
        
        return order;
      },
      updateServiceOrder: (id, data) =>
        set((s) => {
          const updatedServiceOrders = s.serviceOrders.map((o) =>
            o.id === id ? { ...o, ...data } : o
          );
          
          // Find the order to get client and motorcycle info
          const order = updatedServiceOrders.find(o => o.id === id);
          if (order) {
            const client = s.clients.find(c => c.id === order.clientId);
            const motorcycle = s.motorcycles.find(m => m.id === order.motorcycleId);
            
            // Try to update Google Calendar event if we have the calendar event ID stored
            // For now, we'll just log that we would update it
            // In a full implementation, we'd store the event ID with the order
            if (client && motorcycle) {
              console.log(`Would update Google Calendar event for order ${id}`);
              // updateServiceCalendarEvent(eventId, order, client, motorcycle, nextServiceDate);
            }
          }
          
          return { serviceOrders: updatedServiceOrders };
        }),
      deleteServiceOrder: (id) =>
        set((s) => ({
          serviceOrders: s.serviceOrders.filter((o) => o.id !== id),
        })),

      addPart: (data) => {
        const category = get().categories.find(c => c.id === data.category);
        const categoryCode = category?.code || "X";
        const existingInCategory = get().parts.filter(p => {
          const cat = get().categories.find(c => c.id === p.category);
          return cat?.code === categoryCode;
        });
        const seq = String(existingInCategory.length + 1).padStart(4, "0");
        const code = `${categoryCode}-${seq}`;
        const part: Part = { ...data, id: uuidv4(), code };
        set((s) => ({ parts: [...s.parts, part] }));
        return part;
      },
      updatePart: (id, data) =>
        set((s) => ({
          parts: s.parts.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePart: (id) =>
        set((s) => ({ parts: s.parts.filter((p) => p.id !== id) })),

      addCategory: (data) => {
        const category: Category = { ...data, id: uuidv4() };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, data) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addPayment: (data) => {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existing = get().payments;
        const seq = String(existing.length + 1).padStart(3, "0");
        const id = `${yyyymm}-${seq}`;
        const payment: Payment = { ...data, id };
        set((s) => ({ payments: [...s.payments, payment] }));
        return payment;
      },
      updatePayment: (id, data) =>
        set((s) => ({
          payments: s.payments.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),
      deletePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

      addServiceType: (name) => {
        const st: ServiceType = { id: uuidv4(), name };
        set((s) => ({ serviceTypes: [...s.serviceTypes, st] }));
        return st;
      },
      deleteServiceType: (id) =>
        set((s) => ({
          serviceTypes: s.serviceTypes.filter((st) => st.id !== id),
        })),

      addQuote: (data) => {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existing = get().quotes;
        const seq = String(existing.length + 1).padStart(3, "0");
        const id = `C${yyyymm}-${seq}`;
        const quote: Quote = { ...data, id };
        set((s) => ({ quotes: [...s.quotes, quote] }));
        return quote;
      },
      updateQuote: (id, data) =>
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...data } : q)),
        })),
      deleteQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),

      addTurno: (data) => {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const existing = get().turnos;
        const seq = String(existing.length + 1).padStart(3, "0");
        const id = `T${yyyymm}-${seq}`;
        const turno: Turno = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ turnos: [...s.turnos, turno] }));
        return turno;
      },
      updateTurno: (id, data) =>
        set((s) => ({
          turnos: s.turnos.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      deleteTurno: (id) =>
        set((s) => ({ turnos: s.turnos.filter((t) => t.id !== id) })),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          clients: state.clients,
          motorcycles: state.motorcycles,
          receptions: state.receptions,
          serviceOrders: state.serviceOrders,
          parts: state.parts,
          payments: state.payments,
          serviceTypes: state.serviceTypes,
          categories: state.categories,
          quotes: state.quotes,
          turnos: state.turnos,
        }, null, 2);
      },

      importData: (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          if (data.clients) set({ clients: data.clients });
          if (data.motorcycles) set({ motorcycles: data.motorcycles });
          if (data.receptions) set({ receptions: data.receptions });
          if (data.serviceOrders) set({ serviceOrders: data.serviceOrders });
          if (data.parts) set({ parts: data.parts });
          if (data.payments) set({ payments: data.payments });
          if (data.serviceTypes) set({ serviceTypes: data.serviceTypes });
          if (data.categories) set({ categories: data.categories });
          if (data.quotes) set({ quotes: data.quotes });
          if (data.turnos) set({ turnos: data.turnos });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "moto-workshop-storage",
    }
  )
);
