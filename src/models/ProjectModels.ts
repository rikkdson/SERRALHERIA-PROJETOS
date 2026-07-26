/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PieceType, MeasurementUnit } from '../types';

export interface DiagonalConfig {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  direction: '/' | '\\';
  angleDeg: number;
  lengthMm: number;
  profile: string;
}

export interface DivisionConfig {
  id: string;
  name: string;
  type: 'vertical' | 'horizontal';
  positionMm: number;
  profile: string;
  lengthMm: number;
}

export interface LeafConfig {
  id: string;
  name: string;
  type: 'esquerda' | 'direita' | 'dupla' | 'deslizante' | 'basculante';
  quantity: number;
  widthMm: number;
  heightMm: number;
  profile: string;
}

export interface ProjectCalculations {
  totalWeightKg?: number;
  totalBars6m?: number;
  totalLinearMeters?: number;
  totalMaterialCost?: number;
  estimatedLaborCost?: number;
  grandTotalCost?: number;
  updatedAt?: string;
}

export interface CutListItem {
  id: string;
  pieceName: string;
  pieceType: PieceType;
  profile: string;
  lengthMm: number;
  quantity: number;
  angleStartDeg: number;
  angleEndDeg: number;
  notes?: string;
}
