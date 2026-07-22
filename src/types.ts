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

export const PRESET_PROFILES = [
  "Metalon 20x20 mm",
  "Metalon 30x30 mm",
  "Metalon 40x40 mm",
  "Metalon 50x30 mm",
  "Metalon 50x50 mm",
  "Metalon 60x40 mm"
];
