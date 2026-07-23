/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  PriceCenterData, 
  Supplier, 
  ProfilePriceItem, 
  ConsumablePriceItem, 
  HardwarePriceItem, 
  OtherMaterialPriceItem 
} from '../types';

export const PRICE_CENTER_STORAGE_KEY = 'serralheria_price_center_v1';
export const PRICE_CENTER_UPDATED_EVENT = 'serralheria_price_center_updated';

// Initial Seed Suppliers
export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-casa-do-ferro',
    name: 'Casa do Ferro',
    phone: '(11) 3456-7890',
    email: 'vendas@casadoferro.com.br',
    address: 'Av. Industrial, 1200 - Distrito Industrial',
    notes: 'Desconto de 5% para pagamento à vista no PIX'
  },
  {
    id: 'sup-metal-center',
    name: 'Metal Center',
    phone: '(11) 3322-1100',
    email: 'comercial@metalcenter.com.br',
    address: 'Rua das Indústrias, 450 - Centro',
    notes: 'Entrega grátis para pedidos acima de R$ 1.500,00'
  },
  {
    id: 'sup-comercial-aco',
    name: 'Comercial do Aço',
    phone: '(11) 4004-9090',
    email: 'atendimento@comercialaco.com.br',
    address: 'Rodovia Anhanguera Km 22',
    notes: 'Especialista em tubos galvanizados e chapas'
  },
  {
    id: 'sup-deposito-central',
    name: 'Depósito Central',
    phone: '(11) 2233-4455',
    email: 'orcamentos@depositocentral.com.br',
    address: 'Rua do Comércio, 890 - Bairro das Nações',
    notes: 'Tabela promocional de consumíveis e tintas'
  }
];

// Initial Seed Profiles (11 required profiles)
export const DEFAULT_PROFILE_PRICES: ProfilePriceItem[] = [
  {
    id: 'prof-15x15-preto',
    name: 'Metalon 15x15',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 51.00,
    costPerMeter: 8.50,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 51.00,
      'sup-metal-center': 49.50,
      'sup-comercial-aco': 52.00,
      'sup-deposito-central': 50.00
    },
    stockQuantity: 12,
    minStockQuantity: 4
  },
  {
    id: 'prof-20x20-preto',
    name: 'Metalon 20x20',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 69.00,
    costPerMeter: 11.50,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 69.00,
      'sup-metal-center': 66.00,
      'sup-comercial-aco': 71.00,
      'sup-deposito-central': 68.00
    },
    stockQuantity: 20,
    minStockQuantity: 5
  },
  {
    id: 'prof-20x20-galv',
    name: 'Metalon 20x20',
    materialFinish: 'Galvanizado',
    defaultBarLengthMm: 6000,
    costPerBar: 84.00,
    costPerMeter: 14.00,
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    priceBySupplier: {
      'sup-casa-do-ferro': 86.00,
      'sup-metal-center': 85.00,
      'sup-comercial-aco': 80.00,
      'sup-deposito-central': 84.00
    },
    stockQuantity: 15,
    minStockQuantity: 3
  },
  {
    id: 'prof-30x20-preto',
    name: 'Metalon 30x20',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 82.80,
    costPerMeter: 13.80,
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    priceBySupplier: {
      'sup-casa-do-ferro': 84.00,
      'sup-metal-center': 81.00,
      'sup-comercial-aco': 85.00,
      'sup-deposito-central': 82.80
    },
    stockQuantity: 10,
    minStockQuantity: 3
  },
  {
    id: 'prof-30x30-preto',
    name: 'Metalon 30x30',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 108.00,
    costPerMeter: 18.00,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 108.00,
      'sup-metal-center': 102.00,
      'sup-comercial-aco': 110.00,
      'sup-deposito-central': 105.00
    },
    stockQuantity: 18,
    minStockQuantity: 6
  },
  {
    id: 'prof-40x20-preto',
    name: 'Metalon 40x20',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 99.00,
    costPerMeter: 16.50,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 99.00,
      'sup-metal-center': 96.00,
      'sup-comercial-aco': 101.00,
      'sup-deposito-central': 98.00
    },
    stockQuantity: 8,
    minStockQuantity: 2
  },
  {
    id: 'prof-40x40-preto',
    name: 'Metalon 40x40',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 147.00,
    costPerMeter: 24.50,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 147.00,
      'sup-metal-center': 140.00,
      'sup-comercial-aco': 150.00,
      'sup-deposito-central': 144.00
    },
    stockQuantity: 14,
    minStockQuantity: 4
  },
  {
    id: 'prof-50x30-preto',
    name: 'Metalon 50x30',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 150.00,
    costPerMeter: 25.00,
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    priceBySupplier: {
      'sup-casa-do-ferro': 153.00,
      'sup-metal-center': 146.00,
      'sup-comercial-aco': 155.00,
      'sup-deposito-central': 150.00
    },
    stockQuantity: 9,
    minStockQuantity: 3
  },
  {
    id: 'prof-50x50-preto',
    name: 'Metalon 50x50',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 228.00,
    costPerMeter: 38.00,
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    priceBySupplier: {
      'sup-casa-do-ferro': 232.00,
      'sup-metal-center': 225.00,
      'sup-comercial-aco': 220.00,
      'sup-deposito-central': 228.00
    },
    stockQuantity: 6,
    minStockQuantity: 2
  },
  {
    id: 'prof-60x40-preto',
    name: 'Metalon 60x40',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 237.00,
    costPerMeter: 39.50,
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    priceBySupplier: {
      'sup-casa-do-ferro': 240.00,
      'sup-metal-center': 235.00,
      'sup-comercial-aco': 230.00,
      'sup-deposito-central': 237.00
    },
    stockQuantity: 5,
    minStockQuantity: 2
  },
  {
    id: 'prof-80x40-preto',
    name: 'Metalon 80x40',
    materialFinish: 'Preto',
    defaultBarLengthMm: 6000,
    costPerBar: 288.00,
    costPerMeter: 48.00,
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    priceBySupplier: {
      'sup-casa-do-ferro': 288.00,
      'sup-metal-center': 280.00,
      'sup-comercial-aco': 295.00,
      'sup-deposito-central': 285.00
    },
    stockQuantity: 4,
    minStockQuantity: 1
  }
];

// Initial Seed Consumables
export const DEFAULT_CONSUMABLES: ConsumablePriceItem[] = [
  {
    id: 'cons-1',
    name: 'Disco de Corte',
    price: 6.50,
    unit: 'unid',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'Disco 4.5" para aço inox/carbono Norton/AR302'
  },
  {
    id: 'cons-2',
    name: 'Disco Flap',
    price: 12.00,
    unit: 'unid',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Grão 60/80 desbaste e acabamento'
  },
  {
    id: 'cons-3',
    name: 'Arame MIG',
    price: 180.00,
    unit: 'rolo',
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    notes: 'Rolo 15kg ER70S-6 0.8mm'
  },
  {
    id: 'cons-4',
    name: 'Eletrodo',
    price: 45.00,
    unit: 'caixa',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'E6013 2.5mm caixa com 5kg'
  },
  {
    id: 'cons-5',
    name: 'Primer',
    price: 38.00,
    unit: 'lata',
    supplierId: 'sup-deposito-central',
    supplierName: 'Depósito Central',
    notes: 'Galão 3.6L zarcão sintético anticorrosivo'
  },
  {
    id: 'cons-6',
    name: 'Tinta',
    price: 65.00,
    unit: 'lata',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Esmalte sintético preto fosco 3.6L'
  },
  {
    id: 'cons-7',
    name: 'Thinner',
    price: 22.00,
    unit: 'lata',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'Thinner de diluição e limpeza 900ml'
  },
  {
    id: 'cons-8',
    name: 'Gás',
    price: 210.00,
    unit: 'recarga',
    supplierId: 'sup-deposito-central',
    supplierName: 'Depósito Central',
    notes: 'Recarga mistura C25 (Argônio/CO2) cilindro 10m³'
  },
  {
    id: 'cons-9',
    name: 'Lixas',
    price: 4.50,
    unit: 'unid',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Lixa ferro grão 80/120 para acabamento'
  },
  {
    id: 'cons-10',
    name: 'Brocas',
    price: 18.00,
    unit: 'unid',
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    notes: 'Broca aço rápido HSS 6mm/8mm Irwin'
  }
];

// Initial Seed Hardware
export const DEFAULT_HARDWARE: HardwarePriceItem[] = [
  {
    id: 'hard-1',
    name: 'Dobradiças',
    price: 12.50,
    unit: 'par',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'Dobradiça reforçada com pino e anel para portão 3"'
  },
  {
    id: 'hard-2',
    name: 'Fechaduras',
    price: 68.00,
    unit: 'unid',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Fechadura Stamm para perfil metalon 30mm/40mm'
  },
  {
    id: 'hard-3',
    name: 'Rodízios',
    price: 35.00,
    unit: 'unid',
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    notes: 'Roda V de aço blindada 3" com rolamento duplo'
  },
  {
    id: 'hard-4',
    name: 'Guias',
    price: 25.00,
    unit: 'unid',
    supplierId: 'sup-deposito-central',
    supplierName: 'Depósito Central',
    notes: 'Guia superior de nylon ajustável com suporte'
  },
  {
    id: 'hard-5',
    name: 'Trilhos',
    price: 55.00,
    unit: 'barra',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'Trilho V de cantoneira 6 metros para portão de correr'
  },
  {
    id: 'hard-6',
    name: 'Parafusos',
    price: 0.35,
    unit: 'unid',
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    notes: 'Parafuso autobrocante 1/4 x 3/4 ponta broca'
  },
  {
    id: 'hard-7',
    name: 'Chumbadores',
    price: 8.50,
    unit: 'unid',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Chumbador de expansão CBA 3/8 x 3"'
  },
  {
    id: 'hard-8',
    name: 'Rebites',
    price: 0.15,
    unit: 'unid',
    supplierId: 'sup-casa-do-ferro',
    supplierName: 'Casa do Ferro',
    notes: 'Rebite de alumínio repuxo 4.8 x 16mm'
  }
];

// Initial Seed Other Materials
export const DEFAULT_OTHER_MATERIALS: OtherMaterialPriceItem[] = [
  {
    id: 'oth-1',
    name: 'Chapa de Aço Galvanizada #18',
    price: 210.00,
    unit: 'chapa',
    supplierId: 'sup-comercial-aco',
    supplierName: 'Comercial do Aço',
    notes: 'Chapa 2000x1000mm e=1.2mm para portão cego'
  },
  {
    id: 'oth-2',
    name: 'Policarbonato Alveolar 6mm',
    price: 320.00,
    unit: 'chapa',
    supplierId: 'sup-deposito-central',
    supplierName: 'Depósito Central',
    notes: 'Chapa 2100x6000mm fumê/cristal com proteção UV'
  },
  {
    id: 'oth-3',
    name: 'Tela Moeda Inox',
    price: 85.00,
    unit: 'm²',
    supplierId: 'sup-metal-center',
    supplierName: 'Metal Center',
    notes: 'Tela perfurada aço inox para ventilação e churrasqueiras'
  }
];

export const INITIAL_PRICE_CENTER_DATA: PriceCenterData = {
  activeSupplierId: 'all', // 'all' = Padrão / Tabela Base
  suppliers: DEFAULT_SUPPLIERS,
  profiles: DEFAULT_PROFILE_PRICES,
  consumables: DEFAULT_CONSUMABLES,
  hardware: DEFAULT_HARDWARE,
  otherMaterials: DEFAULT_OTHER_MATERIALS,
  updatedAt: new Date().toISOString()
};

/**
 * Gets full PriceCenter state from localStorage, seeding if empty.
 */
export function getPriceCenterData(): PriceCenterData {
  try {
    const raw = localStorage.getItem(PRICE_CENTER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRICE_CENTER_STORAGE_KEY, JSON.stringify(INITIAL_PRICE_CENTER_DATA));
      return INITIAL_PRICE_CENTER_DATA;
    }
    const parsed: PriceCenterData = JSON.parse(raw);

    // Validate required collections
    if (!parsed.profiles || !Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      parsed.profiles = DEFAULT_PROFILE_PRICES;
    }
    if (!parsed.suppliers || !Array.isArray(parsed.suppliers)) {
      parsed.suppliers = DEFAULT_SUPPLIERS;
    }
    if (!parsed.consumables || !Array.isArray(parsed.consumables)) {
      parsed.consumables = DEFAULT_CONSUMABLES;
    }
    if (!parsed.hardware || !Array.isArray(parsed.hardware)) {
      parsed.hardware = DEFAULT_HARDWARE;
    }
    if (!parsed.otherMaterials || !Array.isArray(parsed.otherMaterials)) {
      parsed.otherMaterials = DEFAULT_OTHER_MATERIALS;
    }
    if (!parsed.activeSupplierId) {
      parsed.activeSupplierId = 'all';
    }

    return parsed;
  } catch (err) {
    console.error('Error reading price center data from storage:', err);
    return INITIAL_PRICE_CENTER_DATA;
  }
}

/**
 * Saves full PriceCenter state to localStorage and broadcasts update event.
 */
export function savePriceCenterData(data: PriceCenterData): void {
  try {
    const updated = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PRICE_CENTER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(PRICE_CENTER_UPDATED_EVENT, { detail: updated }));
  } catch (err) {
    console.error('Error saving price center data to storage:', err);
  }
}

/**
 * Gets effective profile price considering active supplier selection.
 */
export function getEffectiveProfileBarCost(profile: ProfilePriceItem, activeSupplierId: string): number {
  if (activeSupplierId && activeSupplierId !== 'all' && profile.priceBySupplier && profile.priceBySupplier[activeSupplierId]) {
    return profile.priceBySupplier[activeSupplierId];
  }
  return profile.costPerBar;
}

/**
 * Sets active supplier table and triggers automatic price updates.
 */
export function setActiveSupplier(supplierId: string): PriceCenterData {
  const current = getPriceCenterData();
  current.activeSupplierId = supplierId;

  // Update profile costPerBar if a specific supplier is selected
  if (supplierId && supplierId !== 'all') {
    current.profiles = current.profiles.map(p => {
      const supCost = p.priceBySupplier?.[supplierId];
      if (supCost && supCost > 0) {
        const barLen = p.defaultBarLengthMm || 6000;
        const perMeter = parseFloat((supCost / (barLen / 1000)).toFixed(2));
        return {
          ...p,
          costPerBar: supCost,
          costPerMeter: perMeter
        };
      }
      return p;
    });
  }

  savePriceCenterData(current);
  return current;
}

/**
 * Updates a single profile price item.
 */
export function updateProfilePrice(id: string, newCostPerBar: number, newFinish?: 'Preto' | 'Galvanizado'): PriceCenterData {
  const current = getPriceCenterData();
  const index = current.profiles.findIndex(p => p.id === id);
  if (index !== -1) {
    const target = current.profiles[index];
    const barLen = target.defaultBarLengthMm || 6000;
    const newMeterCost = parseFloat((newCostPerBar / (barLen / 1000)).toFixed(2));

    const updatedItem: ProfilePriceItem = {
      ...target,
      costPerBar: newCostPerBar,
      costPerMeter: newMeterCost,
      materialFinish: newFinish || target.materialFinish,
      priceBySupplier: {
        ...(target.priceBySupplier || {}),
        ...(current.activeSupplierId !== 'all' ? { [current.activeSupplierId]: newCostPerBar } : {})
      },
      priceHistory: [
        ...(target.priceHistory || []),
        {
          id: `hist-${Date.now()}`,
          date: new Date().toISOString(),
          costPerBar: newCostPerBar,
          supplierId: current.activeSupplierId
        }
      ]
    };

    current.profiles[index] = updatedItem;
    savePriceCenterData(current);
  }
  return current;
}

/**
 * Quick batch price updates for profiles.
 */
export function batchUpdateProfilePrices(updates: Record<string, number>): PriceCenterData {
  const current = getPriceCenterData();
  current.profiles = current.profiles.map(p => {
    if (updates[p.id] !== undefined) {
      const newCost = updates[p.id];
      const barLen = p.defaultBarLengthMm || 6000;
      const newMeterCost = parseFloat((newCost / (barLen / 1000)).toFixed(2));
      return {
        ...p,
        costPerBar: newCost,
        costPerMeter: newMeterCost,
        priceBySupplier: {
          ...(p.priceBySupplier || {}),
          ...(current.activeSupplierId !== 'all' ? { [current.activeSupplierId]: newCost } : {})
        }
      };
    }
    return p;
  });
  savePriceCenterData(current);
  return current;
}

/**
 * Adds a new profile price item.
 */
export function addProfilePriceItem(item: Omit<ProfilePriceItem, 'id' | 'costPerMeter'>): PriceCenterData {
  const current = getPriceCenterData();
  const barLen = item.defaultBarLengthMm || 6000;
  const costPerMeter = parseFloat((item.costPerBar / (barLen / 1000)).toFixed(2));

  const newItem: ProfilePriceItem = {
    ...item,
    id: `prof-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    costPerMeter
  };

  current.profiles.unshift(newItem);
  savePriceCenterData(current);
  return current;
}

/**
 * Adds or updates consumable price item.
 */
export function saveConsumableItem(item: Partial<ConsumablePriceItem> & { name: string; price: number }): PriceCenterData {
  const current = getPriceCenterData();
  if (item.id) {
    const idx = current.consumables.findIndex(c => c.id === item.id);
    if (idx !== -1) {
      current.consumables[idx] = { ...current.consumables[idx], ...item };
    }
  } else {
    const newItem: ConsumablePriceItem = {
      id: `cons-custom-${Date.now()}`,
      name: item.name,
      price: item.price,
      unit: item.unit || 'unid',
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      notes: item.notes
    };
    current.consumables.unshift(newItem);
  }
  savePriceCenterData(current);
  return current;
}

/**
 * Adds or updates hardware price item.
 */
export function saveHardwareItem(item: Partial<HardwarePriceItem> & { name: string; price: number }): PriceCenterData {
  const current = getPriceCenterData();
  if (item.id) {
    const idx = current.hardware.findIndex(h => h.id === item.id);
    if (idx !== -1) {
      current.hardware[idx] = { ...current.hardware[idx], ...item };
    }
  } else {
    const newItem: HardwarePriceItem = {
      id: `hard-custom-${Date.now()}`,
      name: item.name,
      price: item.price,
      unit: item.unit || 'unid',
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      notes: item.notes
    };
    current.hardware.unshift(newItem);
  }
  savePriceCenterData(current);
  return current;
}

/**
 * Adds or updates supplier.
 */
export function saveSupplier(supplier: Partial<Supplier> & { name: string }): PriceCenterData {
  const current = getPriceCenterData();
  if (supplier.id) {
    const idx = current.suppliers.findIndex(s => s.id === supplier.id);
    if (idx !== -1) {
      current.suppliers[idx] = { ...current.suppliers[idx], ...supplier };
    }
  } else {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      notes: supplier.notes
    };
    current.suppliers.push(newSup);
  }
  savePriceCenterData(current);
  return current;
}
