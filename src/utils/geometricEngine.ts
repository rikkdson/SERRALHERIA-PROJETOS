/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LengthUnit } from '../types';

/**
 * Converts value from a source unit to millimeters.
 */
export function convertToMm(value: number, unit: LengthUnit): number {
  if (isNaN(value) || value < 0) return 0;
  switch (unit) {
    case 'm':
      return value * 1000;
    case 'cm':
      return value * 10;
    case 'mm':
    default:
      return value;
  }
}

/**
 * Converts value from millimeters to target unit.
 */
export function convertFromMm(valueMm: number, unit: LengthUnit): number {
  if (isNaN(valueMm) || valueMm < 0) return 0;
  switch (unit) {
    case 'm':
      return valueMm / 1000;
    case 'cm':
      return valueMm / 10;
    case 'mm':
    default:
      return valueMm;
  }
}

/**
 * Formats a length value with decimal precision appropriate for the unit.
 */
export function formatLength(valueInUnit: number, unit: LengthUnit): string {
  if (isNaN(valueInUnit) || valueInUnit < 0) return `0 ${unit}`;
  
  if (unit === 'm') {
    return `${valueInUnit.toFixed(3).replace('.', ',')} m`;
  } else if (unit === 'cm') {
    return `${valueInUnit.toFixed(1).replace('.', ',')} cm`;
  } else {
    return `${Math.round(valueInUnit)} mm`;
  }
}

/**
 * Tool 1: Calculates Diagonal of a Rectangle given width and height.
 */
export function calculateRectangleDiagonal(
  width: number, 
  height: number, 
  unit: LengthUnit
): {
  diagonal: number;
  formattedDiagonal: string;
  theoreticalMessage: string;
} {
  const wMm = convertToMm(width, unit);
  const hMm = convertToMm(height, unit);

  if (wMm <= 0 || hMm <= 0) {
    return {
      diagonal: 0,
      formattedDiagonal: `0 ${unit}`,
      theoreticalMessage: 'Informe largura e altura válidas para calcular a diagonal.'
    };
  }

  const diagMm = Math.sqrt(wMm * wMm + hMm * hMm);
  const diagUnit = convertFromMm(diagMm, unit);
  const formatted = formatLength(diagUnit, unit);

  return {
    diagonal: diagUnit,
    formattedDiagonal: formatted,
    theoreticalMessage: `✓ Estrutura perfeita em esquadro: As duas diagonais da estrutura devem medir exatamente ${formatted}.`
  };
}

/**
 * Tool 2: Verifies Square (Conferência de Esquadro).
 */
export function checkSquareness(
  width: number,
  height: number,
  diag1: number,
  diag2: number,
  unit: LengthUnit
): {
  isSquare: boolean;
  theoreticalDiagonal: string;
  measuredDiff: number;
  formattedDiff: string;
  statusLabel: string;
  statusColor: 'green' | 'red' | 'neutral';
  adviceMessage: string;
} {
  const wMm = convertToMm(width, unit);
  const hMm = convertToMm(height, unit);
  const d1Mm = convertToMm(diag1, unit);
  const d2Mm = convertToMm(diag2, unit);

  if (wMm <= 0 || hMm <= 0) {
    return {
      isSquare: false,
      theoreticalDiagonal: `0 ${unit}`,
      measuredDiff: 0,
      formattedDiff: `0 ${unit}`,
      statusLabel: 'Aguardando medidas',
      statusColor: 'neutral',
      adviceMessage: 'Informe a largura e altura do quadro para calcular o esquadro teórico.'
    };
  }

  const theoreticalMm = Math.sqrt(wMm * wMm + hMm * hMm);
  const theoreticalFormatted = formatLength(convertFromMm(theoreticalMm, unit), unit);

  if (d1Mm <= 0 || d2Mm <= 0) {
    return {
      isSquare: false,
      theoreticalDiagonal: theoreticalFormatted,
      measuredDiff: 0,
      formattedDiff: `0 ${unit}`,
      statusLabel: 'Aguardando medição manual das 2 diagonais',
      statusColor: 'neutral',
      adviceMessage: `Para estar em esquadro, as diagonais medidas D1 e D2 devem ser iguais a ${theoreticalFormatted}.`
    };
  }

  const diffMm = Math.abs(d1Mm - d2Mm);
  const diffInUnit = convertFromMm(diffMm, unit);
  const formattedDiff = formatLength(diffInUnit, unit);

  // Consider in square if difference is <= 1.5mm
  const isSquare = diffMm <= 1.5;

  let advice = '';
  if (isSquare) {
    advice = `✓ Perfeito! As diagonais possuem diferença insignificante (${formattedDiff}). A estrutura está devidamente alinhada a 90°.`;
  } else {
    const longerDiag = d1Mm > d2Mm ? 'D1' : 'D2';
    const adjustAmountMm = diffMm / 2;
    const adjustFormatted = formatLength(convertFromMm(adjustAmountMm, unit), unit);
    advice = `⚠️ Estrutura fora de esquadro por ${formattedDiff}. Dica de oficina: Para alinhar, pressione ou feche o canto da diagonal maior (${longerDiag}) em aproximadamente ${adjustFormatted}.`;
  }

  return {
    isSquare,
    theoreticalDiagonal: theoreticalFormatted,
    measuredDiff: diffInUnit,
    formattedDiff,
    statusLabel: isSquare ? '🟢 Estrutura em esquadro' : '🔴 Estrutura fora de esquadro',
    statusColor: isSquare ? 'green' : 'red',
    adviceMessage: advice
  };
}

/**
 * Tool 3: Missing Side Calculation (Medida Faltante).
 */
export function calculateMissingSide(
  mode: 'altura' | 'largura', // 'altura' = find height from width & diagonal; 'largura' = find width from height & diagonal
  knownValue: number, // known width or height
  diagonal: number,
  unit: LengthUnit
): {
  resultValue: number;
  formattedResult: string;
  isValid: boolean;
  errorMessage?: string;
} {
  const knownMm = convertToMm(knownValue, unit);
  const diagMm = convertToMm(diagonal, unit);

  if (knownMm <= 0 || diagMm <= 0) {
    return {
      resultValue: 0,
      formattedResult: `0 ${unit}`,
      isValid: false,
      errorMessage: 'Informe a medida conhecida e a diagonal para calcular.'
    };
  }

  if (diagMm <= knownMm) {
    return {
      resultValue: 0,
      formattedResult: `0 ${unit}`,
      isValid: false,
      errorMessage: '⚠️ A diagonal deve ser maior do que o lado conhecido!'
    };
  }

  const missingMm = Math.sqrt(diagMm * diagMm - knownMm * knownMm);
  const missingInUnit = convertFromMm(missingMm, unit);
  const formatted = formatLength(missingInUnit, unit);

  return {
    resultValue: missingInUnit,
    formattedResult: formatted,
    isValid: true
  };
}

/**
 * Tool 4: Live Unit Converter (mm <-> cm <-> m).
 */
export function convertAllUnits(value: number, sourceUnit: LengthUnit): {
  mm: number;
  cm: number;
  m: number;
  formattedMm: string;
  formattedCm: string;
  formattedM: string;
} {
  const mm = convertToMm(value, sourceUnit);
  const cm = mm / 10;
  const m = mm / 1000;

  return {
    mm,
    cm,
    m,
    formattedMm: `${Math.round(mm)} mm`,
    formattedCm: `${cm.toFixed(1).replace('.', ',')} cm`,
    formattedM: `${m.toFixed(3).replace('.', ',')} m`
  };
}
