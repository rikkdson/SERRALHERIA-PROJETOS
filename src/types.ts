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

export type ProfileCategory =
  | 'Metalon'
  | 'Tubo Redondo'
  | 'Tubo Quadrado'
  | 'Tubo Retangular'
  | 'Cantoneira'
  | 'Barra Chata'
  | 'Perfil U'
  | 'Perfil U Enrijecido'
  | 'Perfil C'
  | 'Perfil Z'
  | 'Perfil I'
  | 'Perfil H'
  | 'Perfil T'
  | 'Vergalhão'
  | 'Barra Maciça Redonda'
  | 'Barra Maciça Quadrada'
  | 'Chapa Lisa'
  | 'Chapa Xadrez'
  | 'Outros';

export type MaterialUnit = 'barra' | 'm' | 'kg' | 'm2' | 'chapa';

export interface CompatibleProcesses {
  weldingMig?: boolean;
  weldingTig?: boolean;
  weldingStick?: boolean;     // Eletrodo Revestido
  bolting?: boolean;          // Parafusamento
  riveting?: boolean;         // Rebitagem
  plasmaCutting?: boolean;
  laserCutting?: boolean;
  oxyfuelCutting?: boolean;   // Corte Oxicorte
  sawing?: boolean;           // Serra
  shearing?: boolean;         // Guilhotina
  bending?: boolean;          // Dobradeira
}

export interface MaterialProfile {
  id: string;
  name: string;             // Nome ex: "Metalon 15x15", "Tubo Redondo 2\""
  category: ProfileCategory; // Categoria do perfil
  widthMm: number;          // Largura em mm ex: 15, 30
  heightMm: number;         // Altura em mm ex: 15, 30
  wallThicknessMm: number;  // Espessura da parede / chapa em mm ex: 1.2, 1.5, 2.0
  weightKgPerMeter: number; // Peso por metro (kg/m) ou por m²
  costPerMeter: number;     // Valor por metro (R$)
  costPerBar: number;       // Valor por barra / unidade (R$)
  defaultBarLengthMm: number; // Comprimento comercial padrão em mm (ex: 6000)
  unit?: MaterialUnit;      // Unidade de venda
  supplier?: string;        // Fornecedor / Fabricante
  manufacturer?: string;    // Fabricante oficial
  notes?: string;           // Observações
  isDefault?: boolean;      // Perfil padrão (protegido contra exclusão)
  isArchived?: boolean;     // Perfil arquivado
  createdAt?: string;
  updatedAt?: string;

  // FASE 1: Propriedades Técnicas (ET-020.2)
  mechanicalStrength?: string;      // Ex: "ASTM A36 (Tensão Escoamento 250 MPa)", "SAE 1010/1020"
  densityGcm3?: number;             // Densidade em g/cm³ (ex: 7.85)
  specificWeightKgm3?: number;      // Peso específico em kg/m³ (ex: 7850)
  commercialThicknesses?: string[]; // Espessuras comerciais disponíveis (ex: ["1.2 mm (#18)", "1.5 mm (#16)"])
  availableFinishes?: string[];     // Acabamentos (ex: ["Bruto / Preto", "Galvanizado", "Pintado / Primer"])
  isGalvanized?: boolean;           // Galvanizado (Sim/Não)
  isStainless?: boolean;            // Inox (Sim/Não)
  isAluminum?: boolean;             // Alumínio (Sim/Não)
  minBendRadiusMm?: number;         // Raio mínimo de dobra em mm
  technicalNotes?: string;          // Observações técnicas adicionais

  // FASE 2: Processos Compatíveis (ET-020.2)
  compatibleProcesses?: CompatibleProcesses;

  // FASE 3: Informações Comerciais (ET-020.2)
  internalCode?: string;             // Código interno de estoque ex: "MAT-MET-3030-15"
  mainSupplier?: string;             // Fornecedor principal
  alternativeSuppliers?: string[];   // Fornecedores alternativos
  leadTimeDays?: number;             // Prazo médio de entrega (dias)
  purchaseUnit?: MaterialUnit | string; // Unidade de compra
  commercialNotes?: string;          // Observações comerciais
}

export const DEFAULT_MATERIAL_PROFILES: MaterialProfile[] = [
  // 1. METALON
  {
    id: 'mat-15x15',
    name: 'Metalon 15x15',
    category: 'Metalon',
    widthMm: 15,
    heightMm: 15,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.52,
    costPerMeter: 8.50,
    costPerBar: 51.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau / Tubos Ibirá',
    manufacturer: 'Gerdau',
    notes: 'Perfil quadrado leve para acabamento e quadros pequenos',
    isDefault: true
  },
  {
    id: 'mat-20x20',
    name: 'Metalon 20x20',
    category: 'Metalon',
    widthMm: 20,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.70,
    costPerMeter: 11.50,
    costPerBar: 69.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil quadrado standard para grades e caixilhos',
    isDefault: true
  },
  {
    id: 'mat-30x20',
    name: 'Metalon 30x20',
    category: 'Metalon',
    widthMm: 30,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.88,
    costPerMeter: 13.80,
    costPerBar: 82.80,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'AçoCearense / Vallourec',
    manufacturer: 'AçoCearense',
    notes: 'Perfil retangular para travessas e fechamentos',
    isDefault: true
  },
  {
    id: 'mat-30x30',
    name: 'Metalon 30x30',
    category: 'Metalon',
    widthMm: 30,
    heightMm: 30,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.30,
    costPerMeter: 18.00,
    costPerBar: 108.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil quadrado para portões leves e caixilhos',
    isDefault: true
  },
  {
    id: 'mat-40x20',
    name: 'Metalon 40x20',
    category: 'Metalon',
    widthMm: 40,
    heightMm: 20,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 1.05,
    costPerMeter: 16.50,
    costPerBar: 99.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil retangular para réguas e montantes',
    isDefault: true
  },
  {
    id: 'mat-40x40',
    name: 'Metalon 40x40',
    category: 'Metalon',
    widthMm: 40,
    heightMm: 40,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.76,
    costPerMeter: 24.50,
    costPerBar: 147.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil quadrado estrutural para portões e caixilhos reforçados',
    isDefault: true
  },
  {
    id: 'mat-50x30',
    name: 'Metalon 50x30',
    category: 'Metalon',
    widthMm: 50,
    heightMm: 30,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.76,
    costPerMeter: 25.00,
    costPerBar: 150.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau / ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Perfil retangular para quadros de portão social e basculantes',
    isDefault: true
  },
  {
    id: 'mat-50x50',
    name: 'Metalon 50x50',
    category: 'Metalon',
    widthMm: 50,
    heightMm: 50,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 2.95,
    costPerMeter: 38.00,
    costPerBar: 228.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Perfil quadrado pesado para colunas e travessas verticais',
    isDefault: true
  },
  {
    id: 'mat-60x40',
    name: 'Metalon 60x40',
    category: 'Metalon',
    widthMm: 60,
    heightMm: 40,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 2.95,
    costPerMeter: 39.50,
    costPerBar: 237.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Perfil retangular robusto para vigas e colunas principais',
    isDefault: true
  },
  {
    id: 'mat-80x40',
    name: 'Metalon 80x40',
    category: 'Metalon',
    widthMm: 80,
    heightMm: 40,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 3.58,
    costPerMeter: 48.00,
    costPerBar: 288.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Perfil pesado para estrutura industrial e grandes portões',
    isDefault: true
  },

  // 2. TUBO REDONDO
  {
    id: 'mat-tubo-red-1pol',
    name: 'Tubo Redondo 1" (25.4mm) x 1.2mm',
    category: 'Tubo Redondo',
    widthMm: 25.4,
    heightMm: 25.4,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 0.72,
    costPerMeter: 12.00,
    costPerBar: 72.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Tubo industrial redondo para corrimãos e grades',
    isDefault: true
  },
  {
    id: 'mat-tubo-red-2pol',
    name: 'Tubo Redondo 2" (50.8mm) x 1.5mm',
    category: 'Tubo Redondo',
    widthMm: 50.8,
    heightMm: 50.8,
    wallThicknessMm: 1.5,
    weightKgPerMeter: 1.83,
    costPerMeter: 28.00,
    costPerBar: 168.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Vallourec',
    manufacturer: 'Vallourec',
    notes: 'Tubo circular reforçado para pilares e guarda-corpos',
    isDefault: true
  },

  // 3. TUBO QUADRADO
  {
    id: 'mat-tubo-quad-100x100',
    name: 'Tubo Quadrado 100x100 x 3.0mm',
    category: 'Tubo Quadrado',
    widthMm: 100,
    heightMm: 100,
    wallThicknessMm: 3.0,
    weightKgPerMeter: 8.96,
    costPerMeter: 92.00,
    costPerBar: 552.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Coluna estrutural quadrada para galpões e mezaninos',
    isDefault: true
  },

  // 4. TUBO RETANGULAR
  {
    id: 'mat-tubo-ret-100x50',
    name: 'Tubo Retangular 100x50 x 3.0mm',
    category: 'Tubo Retangular',
    widthMm: 100,
    heightMm: 50,
    wallThicknessMm: 3.0,
    weightKgPerMeter: 6.60,
    costPerMeter: 68.00,
    costPerBar: 408.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Viga retangular estrutural pesada',
    isDefault: true
  },

  // 5. CANTONEIRA
  {
    id: 'mat-cantoneira-1pol',
    name: 'Cantoneira 1" x 1/8" (25.4x3.17mm)',
    category: 'Cantoneira',
    widthMm: 25.4,
    heightMm: 25.4,
    wallThicknessMm: 3.17,
    weightKgPerMeter: 1.19,
    costPerMeter: 15.00,
    costPerBar: 90.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Laminado em L para reforço de cantos e quadros',
    isDefault: true
  },
  {
    id: 'mat-cantoneira-1.5pol',
    name: 'Cantoneira 1.1/2" x 3/16" (38.1x4.75mm)',
    category: 'Cantoneira',
    widthMm: 38.1,
    heightMm: 38.1,
    wallThicknessMm: 4.75,
    weightKgPerMeter: 2.62,
    costPerMeter: 31.00,
    costPerBar: 186.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Cantoneira laminada estrutural para suportes e treliças',
    isDefault: true
  },

  // 6. BARRA CHATA
  {
    id: 'mat-barra-chata-3/4x1/8',
    name: 'Barra Chata 3/4" x 1/8" (19x3.17mm)',
    category: 'Barra Chata',
    widthMm: 19.0,
    heightMm: 3.17,
    wallThicknessMm: 3.17,
    weightKgPerMeter: 0.47,
    costPerMeter: 7.50,
    costPerBar: 45.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Barra laminada para travamentos e ornamentos',
    isDefault: true
  },
  {
    id: 'mat-barra-chata-1x3/16',
    name: 'Barra Chata 1" x 3/16" (25.4x4.75mm)',
    category: 'Barra Chata',
    widthMm: 25.4,
    heightMm: 4.75,
    wallThicknessMm: 4.75,
    weightKgPerMeter: 0.95,
    costPerMeter: 13.00,
    costPerBar: 78.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Barra chata laminada para portões e suportes',
    isDefault: true
  },

  // 7. PERFIL U
  {
    id: 'mat-perfil-u-3pol',
    name: 'Perfil U Simples 3" (75x40 x 3.0mm)',
    category: 'Perfil U',
    widthMm: 75,
    heightMm: 40,
    wallThicknessMm: 3.0,
    weightKgPerMeter: 3.42,
    costPerMeter: 42.00,
    costPerBar: 252.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil dobrado em U simples para terças e vigas',
    isDefault: true
  },

  // 8. PERFIL U ENRIJECIDO
  {
    id: 'mat-perfil-ue-100x50',
    name: 'Perfil U Enrijecido 100x50x17 x 2.0mm',
    category: 'Perfil U Enrijecido',
    widthMm: 100,
    heightMm: 50,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 3.40,
    costPerMeter: 45.00,
    costPerBar: 270.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'AçoCearense',
    manufacturer: 'AçoCearense',
    notes: 'Perfil C/U com aba enrijecida para estruturas metálicas leve/médias',
    isDefault: true
  },

  // 9. PERFIL C
  {
    id: 'mat-perfil-c-100x50',
    name: 'Perfil C 100x50 x 2.0mm',
    category: 'Perfil C',
    widthMm: 100,
    heightMm: 50,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 3.10,
    costPerMeter: 40.00,
    costPerBar: 240.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'ArcelorMittal',
    manufacturer: 'ArcelorMittal',
    notes: 'Perfil estrutural formado a frio',
    isDefault: true
  },

  // 10. PERFIL Z
  {
    id: 'mat-perfil-z-100x50',
    name: 'Perfil Z 100x50 x 2.0mm',
    category: 'Perfil Z',
    widthMm: 100,
    heightMm: 50,
    wallThicknessMm: 2.0,
    weightKgPerMeter: 3.10,
    costPerMeter: 41.00,
    costPerBar: 246.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Tuper',
    manufacturer: 'Tuper',
    notes: 'Perfil Z para terças de cobertura com transpasse',
    isDefault: true
  },

  // 11. PERFIL I
  {
    id: 'mat-perfil-i-w150',
    name: 'Perfil I W 150x13.0 (150x100mm)',
    category: 'Perfil I',
    widthMm: 100,
    heightMm: 150,
    wallThicknessMm: 4.9,
    weightKgPerMeter: 13.0,
    costPerMeter: 145.00,
    costPerBar: 1740.00,
    defaultBarLengthMm: 12000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil I laminado W para vigas estruturais de grande vão',
    isDefault: true
  },

  // 12. PERFIL H
  {
    id: 'mat-perfil-h-w150',
    name: 'Perfil H W 150x22.5 (150x150mm)',
    category: 'Perfil H',
    widthMm: 150,
    heightMm: 150,
    wallThicknessMm: 6.6,
    weightKgPerMeter: 22.5,
    costPerMeter: 240.00,
    costPerBar: 2880.00,
    defaultBarLengthMm: 12000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil H laminado W para pilares pesados',
    isDefault: true
  },

  // 13. PERFIL T
  {
    id: 'mat-perfil-t-1pol',
    name: 'Perfil T 1" x 1/8" (25.4x25.4 x 3.17mm)',
    category: 'Perfil T',
    widthMm: 25.4,
    heightMm: 25.4,
    wallThicknessMm: 3.17,
    weightKgPerMeter: 1.19,
    costPerMeter: 16.00,
    costPerBar: 96.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Perfil T laminado para caixilharia de galpão e esquadrias',
    isDefault: true
  },

  // 14. VERGALHÃO
  {
    id: 'mat-vergalhao-3/8',
    name: 'Vergalhão CA-50 3/8" (9.5mm)',
    category: 'Vergalhão',
    widthMm: 9.5,
    heightMm: 9.5,
    wallThicknessMm: 9.5,
    weightKgPerMeter: 0.56,
    costPerMeter: 6.50,
    costPerBar: 78.00,
    defaultBarLengthMm: 12000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Aço nervurado CA-50 para armações de concreto e tirantes',
    isDefault: true
  },

  // 15. BARRA MACIÇA REDONDA
  {
    id: 'mat-macica-red-1/2',
    name: 'Barra Maciça Redonda 1/2" (12.7mm)',
    category: 'Barra Maciça Redonda',
    widthMm: 12.7,
    heightMm: 12.7,
    wallThicknessMm: 12.7,
    weightKgPerMeter: 0.99,
    costPerMeter: 12.50,
    costPerBar: 75.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Barra redonda maciça para grades de proteção e eixos',
    isDefault: true
  },

  // 16. BARRA MACIÇA QUADRADA
  {
    id: 'mat-macica-quad-1/2',
    name: 'Barra Maciça Quadrada 1/2" (12.7mm)',
    category: 'Barra Maciça Quadrada',
    widthMm: 12.7,
    heightMm: 12.7,
    wallThicknessMm: 12.7,
    weightKgPerMeter: 1.27,
    costPerMeter: 15.50,
    costPerBar: 93.00,
    defaultBarLengthMm: 6000,
    unit: 'barra',
    supplier: 'Gerdau',
    manufacturer: 'Gerdau',
    notes: 'Barra quadrada maciça para portões clássicos e grades reforçadas',
    isDefault: true
  },

  // 17. CHAPA LISA
  {
    id: 'mat-chapa-lisa-18',
    name: 'Chapa Lisa FF #18 (1.20mm) 2000x1000mm',
    category: 'Chapa Lisa',
    widthMm: 1000,
    heightMm: 2000,
    wallThicknessMm: 1.2,
    weightKgPerMeter: 9.42, // kg/m²
    costPerMeter: 85.00,
    costPerBar: 170.00, // Preço por chapa
    defaultBarLengthMm: 2000,
    unit: 'chapa',
    supplier: 'CSN',
    manufacturer: 'CSN',
    notes: 'Chapa de aço fina a frio para fechamento de portões',
    isDefault: true
  },

  // 18. CHAPA XADREZ
  {
    id: 'mat-chapa-xadrez-1/8',
    name: 'Chapa Xadrez Antiderrapante #1/8" (3.17mm) 2000x1000mm',
    category: 'Chapa Xadrez',
    widthMm: 1000,
    heightMm: 2000,
    wallThicknessMm: 3.17,
    weightKgPerMeter: 26.5, // kg/m²
    costPerMeter: 220.00,
    costPerBar: 440.00,
    defaultBarLengthMm: 2000,
    unit: 'chapa',
    supplier: 'Usiminas',
    manufacturer: 'Usiminas',
    notes: 'Chapa antiderrapante para degraus e rampas de acesso',
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

// ==========================================
// ET-021.1: BIBLIOTECA INTELIGENTE DE LIGAÇÕES TYPES
// ==========================================

export type StructuralConnectionType =
  | 'canto_90'
  | 'meia_esquadria_45'
  | 'topo_topo'
  | 'ligacao_t'
  | 'ligacao_cruz'
  | 'tubo_continuo_interrompido'
  | 'emenda_interna'
  | 'emenda_luva'
  | 'sobreposicao'
  | 'reforco_canto'
  | 'reforco_central'
  | 'ligacao_soldada'
  | 'ligacao_aparafusada';

export type ConnectionCategory = 'soldada' | 'aparafusada' | 'mista' | 'encaixe';

export interface WeldSpecs {
  weldType: 'solda_mig_mag' | 'solda_mma_eletrodo' | 'solda_tig' | 'solda_ponteado';
  gapMm: number;               // Fresta para penetração da solda (ex: 1.5mm)
  bevelAngleDegrees?: number;  // Bisel de preparação (ex: 30°)
  passCount?: number;          // Número de passes
}

export interface BoltSpecs {
  boltDiameter: string;        // ex: "M8", "M10", "3/8\""
  boltType: 'sextavado' | 'allen' | 'frances' | 'chumbador';
  holeCount: number;           // Furos por união
  plateThicknessMm: number;    // Espessura da chapa de ligação (ex: 3mm)
}

export interface ReinforcementSpecs {
  reinforcementType: 'mao_de_forca' | 'cantoneira_reforco' | 'chapa_gusset' | 'luva_interna';
  thicknessMm: number;
  lengthMm: number;
}

export interface StructuralConnection {
  id: string;
  name: string;
  type: StructuralConnectionType;
  category: ConnectionCategory;
  description: string;
  isStandard: boolean;          // Protegida contra exclusão se true
  isArchived: boolean;         // Indicador de arquivamento
  compatibleProfiles: string[];// ex: ["Metalon Quadrado", "Tubos Redondos", "Cantoneiras", "Todos"]
  deductionMm: number;         // Desconto de fabricação / folga (em mm)
  allowCutAngleOffset: boolean;// Permite compensação angular
  weldSpecs?: WeldSpecs;
  boltSpecs?: BoltSpecs;
  reinforcementSpecs?: ReinforcementSpecs;
  notes: string;
  createdAt: string;
  updatedAt: string;
}



