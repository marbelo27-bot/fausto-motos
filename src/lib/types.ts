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

export interface Part {
  id: string;
  description: string;
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
  date: string;
  requiredService: string;
  performedService: string;
  parts: ServiceOrderPart[];
  laborCost: number;
  partsCost: number;
  totalCost: number;
  warranty: string;
  status: 'pendiente' | 'en proceso' | 'completado' | 'entregado';
  notes: string;
}

export interface Payment {
  id: string;
  clientId: string;
  serviceOrderId?: string;
  date: string;
  type: 'anticipo' | 'pago total' | 'pago saldo';
  method: 'efectivo' | 'transferencia' | 'tarjeta débito' | 'tarjeta crédito' | 'mercado pago' | 'otro';
  amount: number;
  notes: string;
}

export interface ServiceType {
  id: string;
  name: string;
}
