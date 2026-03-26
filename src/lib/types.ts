export interface Client {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  address: string;
  notes: string;
}

export interface Motorcycle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
}

export interface ReceptionImage {
  id: string;
  dataUrl: string;
  caption: string;
}

export interface Reception {
  id: string;
  clientId: string;
  motorcycleId: string;
  date: string;
  km: number;
  fuelPercent: number;
  tiresPercent: number;
  transmissionPercent: number;
  bodyCondition: 'muy buena' | 'buena' | 'regular' | 'mala';
  missing: string;
  accessories: string;
  helmet: boolean;
  documentation: boolean;
  images: ReceptionImage[];
  notes: string;
}

export interface Category {
  id: string;
  name: string;
  code: string; // First letter for part codes, e.g., "A", "C"
}

export interface Part {
  id: string;
  code: string; // Auto-generated: e.g., "A-0001", "C-0002"
  description: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
}

export interface ServiceOrderPart {
  partId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceOrder {
  id: string;
  clientId: string;
  motorcycleId: string;
  receptionId?: string;
  quoteId?: string;
  date: string;
  requiredService: string;
  performedServices: string[];
  parts: ServiceOrderPart[];
  laborCost: number;
  partsCost: number;
  totalCost: number;
  warranty: string;
  status: 'pendiente' | 'en proceso' | 'completado' | 'entregado';
  notes: string;
  manualParts: string;
}

export interface Payment {
  id: string;
  clientId: string;
  serviceOrderId?: string;
  date: string;
  type: 'anticipo' | 'pago total' | 'pago saldo' | 'cuotas';
  method: 'efectivo' | 'transferencia' | 'tarjeta débito' | 'tarjeta crédito' | 'mercado pago' | 'otro';
  amount: number;
  installmentFrequency?: 'semanal' | 'quincenal' | 'mensual';
  installmentCount?: number;
  notes: string;
}

export interface ServiceType {
  id: string;
  name: string;
}

export interface QuoteItem {
  id: string;
  type: "labor" | "part";
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  clientId: string;
  motorcycleId: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  laborTotal: number;
  partsTotal: number;
  total: number;
  notes: string;
  status: "borrador" | "enviada" | "aceptada" | "rechazada";
  convertedToOrderId?: string;
}

export interface Turno {
  id: string;
  clientId: string;
  motorcycleId: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  status: 'programado' | 'confirmado' | 'completado' | 'cancelado';
  createdAt?: string;
}
