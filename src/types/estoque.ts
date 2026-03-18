export type ProductCategory = 
  | 'Injetáveis' 
  | 'Descartáveis' 
  | 'Medicamentos' 
  | 'Materiais Dentários' 
  | 'Equipamentos' 
  | 'Limpeza' 
  | 'Outros';

export type ProductStatus = 'Normal' | 'Crítico' | 'Zerado';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  minimumStock: number;
  expirationDate?: string;
  unitCost: number;
  provider?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'Entrada' | 'Saída' | 'Ajuste';

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  date: string;
  reason: string;
  responsible: string;
  linkedTo?: string; // e.g., Patient ID or Procedure ID
}

export interface PurchaseOrder {
  id: string;
  productId: string;
  provider: string;
  quantity: number;
  expectedDate: string;
  status: 'Pendente' | 'Aprovado' | 'Entregue';
  createdAt: string;
}

export interface ProcedureConsumptionRule {
  id: string;
  procedureName: string;
  productId: string;
  quantity: number;
  isActive: boolean;
}
