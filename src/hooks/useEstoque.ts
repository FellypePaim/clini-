import { create } from 'zustand'
import type { Product, Movement, PurchaseOrder, ProcedureConsumptionRule, ProductCategory } from '../types/estoque'

interface EstoqueState {
  products: Product[];
  movements: Movement[];
  purchaseOrders: PurchaseOrder[];
  consumptionRules: ProcedureConsumptionRule[];
  
  getProducts: () => Product[];
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  registerEntry: (productId: string, quantity: number, reason: string, responsible: string, cost?: number) => void;
  registerExit: (productId: string, quantity: number, reason: string, responsible: string, linkedTo?: string) => void;
  getMovimentacoes: () => Movement[];
  getAlerts: () => Product[];
  generatePurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'status' | 'createdAt'>) => void;
  toggleConsumptionRule: (ruleId: string) => void;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: 'INJ-001', name: 'Toxina Botulínica 100UI', category: 'Injetáveis', unit: 'Frasco', currentStock: 2, minimumStock: 5, expirationDate: '2026-10-15', unitCost: 850, provider: 'Botox Corp', location: 'Geladeira 1', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
  { id: '2', code: 'INJ-002', name: 'Ácido Hialurônico 1ml', category: 'Injetáveis', unit: 'Seringa', currentStock: 0, minimumStock: 10, expirationDate: '2027-02-20', unitCost: 400, provider: 'Restylane BR', location: 'Geladeira 1', createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-03-05T00:00:00Z' },
  { id: '3', code: 'DESC-001', name: 'Luvas Descartáveis P', category: 'Descartáveis', unit: 'Caixa 100un', currentStock: 15, minimumStock: 20, unitCost: 45, provider: 'Médico Supplies', location: 'Almoxarifado B', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: '4', code: 'DESC-002', name: 'Luvas Descartáveis M', category: 'Descartáveis', unit: 'Caixa 100un', currentStock: 8, minimumStock: 30, unitCost: 45, provider: 'Médico Supplies', location: 'Almoxarifado B', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: '5', code: 'INJ-003', name: 'Agulhas 30G', category: 'Descartáveis', unit: 'Caixa 100un', currentStock: 50, minimumStock: 10, unitCost: 120, provider: 'Agulhas Cia', location: 'Sala 2', createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z' },
  { id: '6', code: 'MED-001', name: 'Anestésico Lidocaína', category: 'Medicamentos', unit: 'Tubo 30g', currentStock: 12, minimumStock: 5, expirationDate: '2026-08-30', unitCost: 40, provider: 'FarmaDental', location: 'Gaveta A', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-03-02T00:00:00Z' },
  { id: '7', code: 'DESC-003', name: 'Fio de Sutura Nylon', category: 'Descartáveis', unit: 'Caixa 24un', currentStock: 3, minimumStock: 10, expirationDate: '2028-05-15', unitCost: 80, provider: 'Suturas BR', location: 'Almoxarifado A', createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-03-12T00:00:00Z' },
  { id: '8', code: 'DESC-004', name: 'Seringa 1ml BD', category: 'Descartáveis', unit: 'Caixa 100un', currentStock: 5, minimumStock: 15, unitCost: 65, provider: 'MedMateriais', location: 'Gaveta C', createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z' },
  { id: '9', code: 'MAT-001', name: 'Resina Composta A2', category: 'Materiais Dentários', unit: 'Seringa 4g', currentStock: 0, minimumStock: 5, expirationDate: '2025-12-01', unitCost: 90, provider: 'Dental Cremer', location: 'Gaveta D', createdAt: '2025-10-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  { id: '10', code: 'LIMP-001', name: 'Álcool 70%', category: 'Limpeza', unit: 'Litro', currentStock: 4, minimumStock: 10, unitCost: 15, provider: 'CleanMix', location: 'Área de Limpeza', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  // Adding more mock products directly below
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `mock-${i + 11}`,
    code: `PROD-${String(i + 11).padStart(3, '0')}`,
    name: `Produto Variado ${i + 11}`,
    category: ['Descartáveis', 'Materiais Dentários', 'Equipamentos', 'Outros'][Math.floor(Math.random() * 4)] as ProductCategory,
    unit: 'Unidade',
    currentStock: Math.floor(Math.random() * 100) + 10,
    minimumStock: 5,
    unitCost: Math.floor(Math.random() * 200) + 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
];

const INITIAL_MOVEMENTS: Movement[] = [
  ...Array.from({ length: 50 }).map((_, i) => {
    const isSaida = Math.random() > 0.4;
    return {
      id: `mov-${i}`,
      productId: INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)].id,
      productName: INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)].name,
      type: isSaida ? 'Saída' : (Math.random() > 0.8 ? 'Ajuste' : 'Entrada') as const,
      quantity: Math.floor(Math.random() * 5) + 1,
      date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      reason: isSaida ? 'Consumo em Procedimento' : 'Reposição de Estoque',
      responsible: ['Dra. Ana', 'Recepcionista Maria', 'Dr. Carlos'][Math.floor(Math.random() * 3)],
      linkedTo: isSaida ? `PRONT-${Math.floor(Math.random() * 1000)}` : undefined,
    }
  })
];

const INITIAL_RULES: ProcedureConsumptionRule[] = [
  { id: 'r1', procedureName: 'Aplicação de Botox', productId: '1', quantity: 1, isActive: true },
  { id: 'r2', procedureName: 'Preenchimento Labial', productId: '2', quantity: 1, isActive: true },
  { id: 'r3', procedureName: 'Cirurgia Oral', productId: '7', quantity: 2, isActive: false },
];

export const useEstoque = create<EstoqueState>((set, get) => ({
  products: INITIAL_PRODUCTS,
  movements: INITIAL_MOVEMENTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  purchaseOrders: [],
  consumptionRules: INITIAL_RULES,

  getProducts: () => get().products.map(p => ({
    ...p,
    status: p.currentStock === 0 ? 'Zerado' : (p.currentStock < p.minimumStock ? 'Crítico' : 'Normal')
  })),

  createProduct: (product) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    set((state) => ({ products: [newProduct, ...state.products] }));
  },

  updateProduct: (id, data) => {
    set((state) => ({
      products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
    }));
  },

  registerEntry: (productId, quantity, reason, responsible, cost) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const newMovement: Movement = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName: product.name,
      type: 'Entrada',
      quantity,
      date: new Date().toISOString(),
      reason,
      responsible
    };

    set((state) => ({
      products: state.products.map(p => 
        p.id === productId 
          ? { ...p, currentStock: p.currentStock + quantity, unitCost: cost ?? p.unitCost, updatedAt: new Date().toISOString() } 
          : p
      ),
      movements: [newMovement, ...state.movements]
    }));
  },

  registerExit: (productId, quantity, reason, responsible, linkedTo) => {
    const product = get().products.find(p => p.id === productId);
    if (!product) return;

    const newMovement: Movement = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName: product.name,
      type: 'Saída',
      quantity,
      date: new Date().toISOString(),
      reason,
      responsible,
      linkedTo
    };

    set((state) => ({
      products: state.products.map(p => 
        p.id === productId 
          ? { ...p, currentStock: Math.max(0, p.currentStock - quantity), updatedAt: new Date().toISOString() } 
          : p
      ),
      movements: [newMovement, ...state.movements]
    }));
  },

  getMovimentacoes: () => get().movements,

  getAlerts: () => get().products.filter(p => p.currentStock < p.minimumStock),

  generatePurchaseOrder: (orderData) => {
    const newOrder: PurchaseOrder = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'Pendente',
      createdAt: new Date().toISOString()
    };
    set((state) => ({ purchaseOrders: [newOrder, ...state.purchaseOrders] }));
  },

  toggleConsumptionRule: (ruleId) => {
    set((state) => ({
      consumptionRules: state.consumptionRules.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r)
    }));
  }
}));

// Stub for automation hook
export const useEstoqueAutomation = () => {
  const { registerExit, consumptionRules } = useEstoque();

  const processProcedure = (procedureName: string, responsible: string, patientId: string) => {
    const rulesToApply = consumptionRules.filter(r => r.isActive && r.procedureName === procedureName);
    
    rulesToApply.forEach(rule => {
      registerExit(
        rule.productId, 
        rule.quantity, 
        `Baixa Automática - ${procedureName}`, 
        responsible, 
        `PAC-${patientId}`
      );
    });
  };

  return { processProcedure };
};
