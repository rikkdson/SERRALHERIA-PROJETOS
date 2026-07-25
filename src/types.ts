/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MeasurementUnit = 'mm' | 'cm' | 'm';

export type PieceType = 
  | 'quadro_interno'
  | 'divisao_vertical'
  | 'divisao_horizontal'
  | 'travessa'
  | 'coluna'
  | 'diagonal'
  | 'reforco'
  | 'folha_porta'
  | 'folha_portao'
  | 'folha_janela'
  | 'perfil_personalizado';

export interface PieceConfig {
  id: string;
  name: string;
  type: PieceType;
  profile: string;
  length: number;       // Internally stored in millimeters
  width: number;        // Internally stored in millimeters
  height: number;       // Internally stored in millimeters
  thickness: number;    // Internally stored in millimeters
  posX: number;         // Internally stored in millimeters
  posY: number;         // Internally stored in millimeters
  orientation: 'horizontal' | 'vertical';
  angle: number;        // in degrees
  observations: string;

  // Specific for Diagonal:
  diagonalStart?: string; 
  diagonalEnd?: string;   
  diagonalDirection?: '/' | '\\';
  diagonalAngle?: number;
  diagonalLength?: number;

  // Specific for Leaves (Folhas):
  leafQuantity?: number;
  leafType?: 'esquerda' | 'direita' | 'dupla' | 'deslizante' | 'basculante';

  // Smart Fill grouping property
  fillGroupId?: string;

  // Architectural properties for ET-003A.1 in Portuguese
  perfil?: string;
  comprimento?: number;
  orientacao?: 'horizontal' | 'vertical';
  'orientação'?: 'horizontal' | 'vertical';
  grupo?: string;
  ordem?: number;
}

export interface FrameConfig {
  width: number;        // Internally stored in millimeters
  height: number;       // Internally stored in millimeters
  displayUnit: MeasurementUnit; // Unit chosen by the user for input and display
  displayWidth: number; // Original width entered by the user
  displayHeight: number; // Original height entered by the user
  profile: string;      // Profile type (e.g., "Metalon 30x30 mm")
}

export interface BudgetConfig {
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Labor
  laborType: 'fixed' | 'hourly'; // 'fixed' or 'hourly'
  laborFixedCost: number;       // R$
  estimatedHours: number;       // hours
  costPerHour: number;          // R$/h

  // Expenses & Consumables
  consumablesCost: number;      // R$
  paintingCost: number;         // R$
  freightCost: number;          // R$
  otherCosts: number;           // R$

  // Profit Margin
  profitMarginPercent: number;  // % (e.g. 20)

  // Proposal & Notes
  validityDays?: number;        // proposal validity in days
  paymentTerms?: string;        // payment conditions
  notes?: string;               // notes for the quote

  updatedAt?: string;
}

export interface MetalProject {
  id: string;
  name: string;
  status: 'planejamento' | 'em_producao' | 'concluido';
  createdAt: string;
  updatedAt: string;
  frame?: FrameConfig;
  pieces?: PieceConfig[]; // Updated from any[]
  
  // Prepared fields for future expansions:
  diagonals?: any[];
  divisions?: any[];
  leaves?: any[]; // "folhas"
  calculations?: Record<string, any>;
  cutList?: any[];
  budgetConfig?: BudgetConfig;
  freeDrawing?: FreeDrawingData;
}

export const PIECE_TYPE_LABELS: Record<PieceType, string> = {
  quadro_interno: 'Quadro Interno',
  divisao_vertical: 'Divisão Vertical',
  divisao_horizontal: 'Divisão Horizontal',
  travessa: 'Travessa',
  coluna: 'Coluna',
  diagonal: 'Diagonal',
  reforco: 'Reforço',
  folha_porta: 'Folha de Porta',
  folha_portao: 'Folha de Portão',
  folha_janela: 'Folha de Janela',
  perfil_personalizado: 'Perfil Personalizado'
};

export interface MaterialProfile {
  id: string;
  name: string;             // Nome ex: "Metalon 15x15", "Metalon 30x30"
  widthMm: number;          // Largura em mm ex: 15, 30
  heightMm: number;         // Altura em mm ex: 15, 30
  wallThicknessMm: number;  // Espessura da parede em mm ex: 1.2, 1.5, 2.0
  weightKgPerMeter: number; // Peso por metro (kg)
  costPerMeter: number;     // Valor por metro (R$)
  costPerBar: number;       // Valor por barra (R$)
  defaultBarLengthMm: number; // Comprimento comercial padrão em mm (ex: 6000)
  supplier?: string;        // Fornecedor (opcional)
  notes?: string;           // Observações (opcional)
  isDefault?: boolean;      // Perfil padrão (protegido contra exclusão)
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_MATERIAL_PROFILES: MaterialProfile[] = [
  {
    id: 'mat-15x15',
    name: 'Metalon 15x15',
    widthMm: 15,
    heightMm: 15,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.52,
    costPerMeter: 8.50,
    costPerBar: 51.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau / Tubos Ibirá',
    notes: 'Perfil quadrado leve para acabamento e quadros pequenos',
    isDefault: true
  },
  {
    id: 'mat-20x20',
    name: 'Metalon 20x20',
    widthMm: 20,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.70,
    costPerMeter: 11.50,
    costPerBar: 69.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau',
    notes: 'Perfil quadrado standard para grades e caixilhos',
    isDefault: true
  },
  {
    id: 'mat-30x20',
    name: 'Metalon 30x20',
    widthMm: 30,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.88,
    costPerMeter: 13.80,
    costPerBar: 82.80,
    defaultBarLengthMm: 6000,
    supplier: 'AçoCearense / Vallourec',
    notes: 'Perfil retangular para travessas e fechamentos',
    isDefault: true
  },
  {
    id: 'mat-30x30',
    name: 'Metalon 30x30',
    widthMm: 30,
    heightMm: 30,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.30,
    costPerMeter: 18.00,
    costPerBar: 108.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau',
    notes: 'Perfil quadrado para portões leves e caixilhos',
    isDefault: true
  },
  {
    id: 'mat-40x20',
    name: 'Metalon 40x20',
    widthMm: 40,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 1.05,
    costPerMeter: 16.50,
    costPerBar: 99.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau',
    notes: 'Perfil retangular para réguas e montantes',
    isDefault: true
  },
  {
    id: 'mat-40x40',
    name: 'Metalon 40x40',
    widthMm: 40,
    heightMm: 40,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.76,
    costPerMeter: 24.50,
    costPerBar: 147.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau',
    notes: 'Perfil quadrado estrutural para portões e caixilhos reforçados',
    isDefault: true
  },
  {
    id: 'mat-50x30',
    name: 'Metalon 50x30',
    widthMm: 50,
    heightMm: 30,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.76,
    costPerMeter: 25.00,
    costPerBar: 150.00,
    defaultBarLengthMm: 6000,
    supplier: 'Gerdau / ArcelorMittal',
    notes: 'Perfil retangular para quadros de portão social e basculantes',
    isDefault: true
  },
  {
    id: 'mat-50x50',
    name: 'Metalon 50x50',
    widthMm: 50,
    heightMm: 50,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 2.95,
    costPerMeter: 38.00,
    costPerBar: 228.00,
    defaultBarLengthMm: 6000,
    supplier: 'ArcelorMittal',
    notes: 'Perfil quadrado pesado para colunas e travessas verticais',
    isDefault: true
  },
  {
    id: 'mat-60x40',
    name: 'Metalon 60x40',
    widthMm: 60,
    heightMm: 40,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 2.95,
    costPerMeter: 39.50,
    costPerBar: 237.00,
    defaultBarLengthMm: 6000,
    supplier: 'ArcelorMittal',
    notes: 'Perfil retangular robusto para vigas e colunas principais',
    isDefault: true
  },
  {
    id: 'mat-80x40',
    name: 'Metalon 80x40',
    widthMm: 80,
    heightMm: 40,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 3.58,
    costPerMeter: 48.00,
    costPerBar: 288.00,
    defaultBarLengthMm: 6000,
    supplier: 'ArcelorMittal',
    notes: 'Perfil pesado para estrutura industrial e grandes portões',
    isDefault: true
  }
];

export const PRESET_PROFILES = DEFAULT_MATERIAL_PROFILES.map(p => `${p.name} mm`);

// ==========================================
// ET-006A: CENTRAL INTELIGENTE DE PREÇOS TYPES
// ==========================================

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface PriceHistoryEntry {
  id: string;
  date: string;
  costPerBar?: number;
  price?: number;
  supplierId?: string;
  note?: string;
}

export interface ProfilePriceItem {
  id: string;
  name: string;             // Ex: "Metalon 15x15", "Metalon 20x20", etc.
  materialFinish: 'Preto' | 'Galvanizado'; // Material (Preto ou Galvanizado)
  defaultBarLengthMm: number; // Comprimento comercial em mm (ex: 6000)
  costPerBar: number;       // Valor da barra (R$)
  costPerMeter: number;     // Valor por metro (R$) - calculado automaticamente
  supplierId?: string;      // ID do fornecedor principal
  supplierName?: string;    // Nome do fornecedor principal
  priceBySupplier?: Record<string, number>; // Tabela de preços por fornecedor (supplierId -> costPerBar)
  priceHistory?: PriceHistoryEntry[]; // Preparação futura: Histórico de preços
  stockQuantity?: number;   // Preparação futura: Estoque
  minStockQuantity?: number; // Preparação futura: Estoque mínimo
}

export interface ConsumablePriceItem {
  id: string;
  name: string;             // Disco de Corte, Disco Flap, Arame MIG, etc.
  price: number;            // Valor em R$
  unit?: string;            // Unidade (un, cx, lata, kg, rolo, etc.)
  supplierId?: string;
  supplierName?: string;
  notes?: string;           // Observações
  priceBySupplier?: Record<string, number>;
  priceHistory?: PriceHistoryEntry[];
  stockQuantity?: number;
  minStockQuantity?: number;
}

export interface HardwarePriceItem {
  id: string;
  name: string;             // Dobradiças, Fechaduras, Rodízios, Guias, Trilhos, etc.
  price: number;            // Valor em R$
  unit?: string;            // Unidade (par, un, m, cento)
  supplierId?: string;
  supplierName?: string;
  notes?: string;
  priceBySupplier?: Record<string, number>;
  priceHistory?: PriceHistoryEntry[];
  stockQuantity?: number;
  minStockQuantity?: number;
}

export interface OtherMaterialPriceItem {
  id: string;
  name: string;             // Chapas, Policarbonato, Vidro, etc.
  price: number;            // Valor em R$
  unit?: string;            // m², chapa, kg, etc.
  supplierId?: string;      
  supplierName?: string;
  notes?: string;
  priceBySupplier?: Record<string, number>;
  priceHistory?: PriceHistoryEntry[];
  stockQuantity?: number;
  minStockQuantity?: number;
}

export interface PriceCenterData {
  activeSupplierId: string;  // 'default' | 'sup-casa-do-ferro' | 'sup-metal-center' | etc.
  suppliers: Supplier[];
  profiles: ProfilePriceItem[];
  consumables: ConsumablePriceItem[];
  hardware: HardwarePriceItem[];
  otherMaterials: OtherMaterialPriceItem[];
  updatedAt?: string;
}

// ==========================================
// ET-008A: MOTOR GEOMÉTRICO INTELIGENTE TYPES
// ==========================================

export type LengthUnit = 'mm' | 'cm' | 'm';

export interface GeometricCalculationResult {
  title: string;
  value: number; // in mm by default internally
  unit: LengthUnit;
  formatted: string;
  isSquare?: boolean;
  squareDiffMm?: number;
  message?: string;
}

// Future Expansion Architecture Stubs
export type GeometryFeatureCategory = 
  | 'base_retangulo'      // Base Geometry (Diagonals, Square check, Missing side, Converter)
  | 'angulos_esquadria'   // Preparação futura: Ângulos & Cortes em meia esquadria (45°, 22.5°, etc.)
  | 'triangulos_telhados' // Preparação futura: Triângulos, Trapézios e Inclinação de Telhados
  | 'escadas_estruturas'; // Preparação futura: Escadas (Piso x Espelho x Rampa)

export interface FutureGeometryModuleStub {
  id: GeometryFeatureCategory;
  title: string;
  description: string;
  isReady: boolean;
  plannedFeatures: string[];
}

// ==========================================
// ET-008B: DESENHO INTELIGENTE LIVRE (BASE) TYPES
// ==========================================

export interface FreeDrawingLine {
  id: string;
  x1: number; // world coordinate in mm
  y1: number; // world coordinate in mm
  x2: number; // world coordinate in mm
  y2: number; // world coordinate in mm
  lengthMm: number;
  angleDeg: number;
  profile?: string; // metallic profile name assigned from materials store
  color?: string;
  isCustomAngle?: boolean;
}

export interface FreeDrawingData {
  lines: FreeDrawingLine[];
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
  };
  gridSizeMm?: number;
  snapToGrid?: boolean;
  snapToEndpoints?: boolean;
  fabricationMode?: 'interromper' | 'continuo';
  updatedAt?: string;
}


