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
} from "./types";

interface AppState {
  clients: Client[];
  motorcycles: Motorcycle[];
  receptions: Reception[];
  serviceOrders: ServiceOrder[];
  parts: Part[];
  payments: Payment[];
  serviceTypes: ServiceType[];
  quotes: Quote[];

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
  addPart: (data: Omit<Part, "id">) => Part;
  updatePart: (id: string, data: Partial<Part>) => void;
  deletePart: (id: string) => void;

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
      quotes: [],

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
        return order;
      },
      updateServiceOrder: (id, data) =>
        set((s) => ({
          serviceOrders: s.serviceOrders.map((o) =>
            o.id === id ? { ...o, ...data } : o
          ),
        })),
      deleteServiceOrder: (id) =>
        set((s) => ({
          serviceOrders: s.serviceOrders.filter((o) => o.id !== id),
        })),

      addPart: (data) => {
        const part: Part = { ...data, id: uuidv4() };
        set((s) => ({ parts: [...s.parts, part] }));
        return part;
      },
      updatePart: (id, data) =>
        set((s) => ({
          parts: s.parts.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deletePart: (id) =>
        set((s) => ({ parts: s.parts.filter((p) => p.id !== id) })),

      addPayment: (data) => {
        const payment: Payment = { ...data, id: uuidv4() };
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
        const quote: Quote = { ...data, id: uuidv4() };
        set((s) => ({ quotes: [...s.quotes, quote] }));
        return quote;
      },
      updateQuote: (id, data) =>
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, ...data } : q)),
        })),
      deleteQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
    }),
    {
      name: "moto-workshop-storage",
    }
  )
);
