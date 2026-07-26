/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreeDrawingLine } from '../types';
import { getProfileThickness } from './geometryEngine';

/**
 * Interface representing a 2D line intersection point
 */
export interface IntersectionPoint {
  x: number;
  y: number;
  t: number; // Parameter t along line A (0..1)
  u: number; // Parameter u along line B (0..1)
}

/**
 * Calculates intersection point between two line segments (if any)
 */
export function calculateLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  ox1: number, oy1: number, ox2: number, oy2: number
): IntersectionPoint | null {
  const denom = (x1 - x2) * (oy1 - oy2) - (y1 - y2) * (ox1 - ox2);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - ox1) * (oy1 - oy2) - (y1 - oy1) * (ox1 - ox2)) / denom;
  const u = ((x1 - ox1) * (y1 - y2) - (y1 - oy1) * (x1 - x2)) / denom;

  if (t > 0.01 && t < 0.99 && u >= -0.05 && u <= 1.05) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
      t,
      u
    };
  }

  return null;
}

/**
 * Split line at intersection points with existing obstacle lines (ET-009D.3 - Correção 02 & 03 & 05 & 06)
 */
export function splitLineByObstacles(
  rawLine: { x1: number; y1: number; x2: number; y2: number; profile: string; color?: string; angleDeg?: number },
  obstacles: FreeDrawingLine[],
  prefix: string
): FreeDrawingLine[] {
  const x1 = rawLine.x1, y1 = rawLine.y1, x2 = rawLine.x2, y2 = rawLine.y2;
  const dx = x2 - x1, dy = y2 - y1;
  const lenTotal = Math.hypot(dx, dy);
  if (lenTotal < 15) return [];

  const ts: number[] = [];

  obstacles.forEach(obs => {
    const inter = calculateLineIntersection(
      x1, y1, x2, y2,
      obs.x1, obs.y1, obs.x2, obs.y2
    );
    if (inter) {
      ts.push(inter.t);
    }
  });

  if (ts.length === 0) {
    const angle = rawLine.angleDeg ?? Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    return [{
      id: `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x1: Math.round(x1),
      y1: Math.round(y1),
      x2: Math.round(x2),
      y2: Math.round(y2),
      lengthMm: Math.round(lenTotal),
      angleDeg: angle,
      profile: rawLine.profile,
      color: rawLine.color || '#10b981'
    }];
  }

  ts.sort((a, b) => a - b);
  const uniqueTs: number[] = [];
  ts.forEach(t => {
    if (uniqueTs.length === 0 || t - uniqueTs[uniqueTs.length - 1] > 0.01) {
      uniqueTs.push(t);
    }
  });

  const points = [
    { x: x1, y: y1 },
    ...uniqueTs.map(t => ({ x: x1 + t * dx, y: y1 + t * dy })),
    { x: x2, y: y2 }
  ];

  const segments: FreeDrawingLine[] = [];
  const baseAngle = rawLine.angleDeg ?? Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

  for (let i = 0; i < points.length - 1; i++) {
    const pA = points[i];
    const pB = points[i + 1];
    const segLen = Math.round(Math.hypot(pB.x - pA.x, pB.y - pA.y));
    if (segLen >= 15) {
      segments.push({
        id: `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x1: Math.round(pA.x),
        y1: Math.round(pA.y),
        x2: Math.round(pB.x),
        y2: Math.round(pB.y),
        lengthMm: segLen,
        angleDeg: baseAngle,
        profile: rawLine.profile,
        color: rawLine.color || '#10b981'
      });
    }
  }

  return segments;
}

/**
 * Preenchimento Inteligente Automático Calculation Function (ET-009D.1 / ET-009D.3)
 */
export function calculateAutoFillLines(
  allLines: FreeDrawingLine[],
  selectedIds: string[],
  direction: 'vertical' | 'horizontal' | 'diagonal_asc' | 'diagonal_desc' | 'cross_x',
  profileName: string,
  spacingMm: number,
  distribution: 'center' | 'start' | 'end',
  spacingType: 'luz_livre' | 'centro_a_centro',
  mode: 'interromper' | 'continuo'
): FreeDrawingLine[] {
  // 1. Determine bounding box of selected frame or all lines
  const targetLines = selectedIds.length > 0
    ? allLines.filter(l => selectedIds.includes(l.id))
    : allLines;

  let minX = 0, minY = 0, maxX = 1000, maxY = 2000;
  if (targetLines.length > 0) {
    minX = Math.min(...targetLines.flatMap(l => [l.x1, l.x2]));
    maxX = Math.max(...targetLines.flatMap(l => [l.x1, l.x2]));
    minY = Math.min(...targetLines.flatMap(l => [l.y1, l.y2]));
    maxY = Math.max(...targetLines.flatMap(l => [l.y1, l.y2]));
  }

  const W = Math.max(100, maxX - minX);
  const H = Math.max(100, maxY - minY);

  // Profile thickness
  const pSize = getProfileThickness(profileName);
  const pFrame = pSize; // Frame inner border offset

  const obstacles = allLines.filter(l => {
    if (selectedIds.length > 0 && selectedIds.includes(l.id)) return false;
    return true;
  });

  const result: FreeDrawingLine[] = [];

  if (direction === 'vertical') {
    const availableW = W - 2 * pFrame;
    if (availableW <= pSize) return [];

    let pitch = 140; // Pitch center-to-center
    if (spacingType === 'luz_livre') {
      const clearGap = Math.max(10, spacingMm);
      pitch = clearGap + pSize;
    } else {
      pitch = Math.max(pSize + 5, spacingMm);
    }

    const numBars = Math.max(1, Math.floor((availableW - (pitch - pSize)) / pitch));
    const totalSpan = (numBars - 1) * pitch;

    let startX = minX + pFrame + (pitch - pSize / 2);
    if (distribution === 'center') {
      startX = minX + pFrame + (availableW - totalSpan) / 2;
    } else if (distribution === 'end') {
      startX = maxX - pFrame - totalSpan - (availableW - totalSpan) / 2;
    }

    const xPositions: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const posX = Math.round(startX + i * pitch);
      if (posX > minX + pFrame && posX < maxX - pFrame) {
        xPositions.push(posX);
      }
    }

    xPositions.forEach(posX => {
      const rawLine = {
        x1: posX,
        y1: minY + pFrame,
        x2: posX,
        y2: maxY - pFrame,
        profile: profileName,
        angleDeg: 90
      };

      if (mode === 'interromper') {
        const segs = splitLineByObstacles(rawLine, obstacles, 'autofill_v');
        result.push(...segs);
      } else {
        const len = Math.round(maxY - minY - 2 * pFrame);
        result.push({
          id: `autofill_v_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          x1: posX,
          y1: minY + pFrame,
          x2: posX,
          y2: maxY - pFrame,
          lengthMm: len,
          angleDeg: 90,
          profile: profileName,
          color: '#10b981'
        });
      }
    });

  } else if (direction === 'horizontal') {
    const availableH = H - 2 * pFrame;
    if (availableH <= pSize) return [];

    let pitch = 140;
    if (spacingType === 'luz_livre') {
      const clearGap = Math.max(10, spacingMm);
      pitch = clearGap + pSize;
    } else {
      pitch = Math.max(pSize + 5, spacingMm);
    }

    const numBars = Math.max(1, Math.floor((availableH - (pitch - pSize)) / pitch));
    const totalSpan = (numBars - 1) * pitch;

    let startY = minY + pFrame + (pitch - pSize / 2);
    if (distribution === 'center') {
      startY = minY + pFrame + (availableH - totalSpan) / 2;
    } else if (distribution === 'end') {
      startY = maxY - pFrame - totalSpan - (availableH - totalSpan) / 2;
    }

    const yPositions: number[] = [];
    for (let i = 0; i < numBars; i++) {
      const posY = Math.round(startY + i * pitch);
      if (posY > minY + pFrame && posY < maxY - pFrame) {
        yPositions.push(posY);
      }
    }

    yPositions.forEach(posY => {
      const rawLine = {
        x1: minX + pFrame,
        y1: posY,
        x2: maxX - pFrame,
        y2: posY,
        profile: profileName,
        angleDeg: 0
      };

      if (mode === 'interromper') {
        const segs = splitLineByObstacles(rawLine, obstacles, 'autofill_h');
        result.push(...segs);
      } else {
        const len = Math.round(maxX - minX - 2 * pFrame);
        result.push({
          id: `autofill_h_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          x1: minX + pFrame,
          y1: posY,
          x2: maxX - pFrame,
          y2: posY,
          lengthMm: len,
          angleDeg: 0,
          profile: profileName,
          color: '#10b981'
        });
      }
    });

  } else {
    // Diagonals (diagonal_asc, diagonal_desc, cross_x)
    const isAsc = direction === 'diagonal_asc' || direction === 'cross_x';
    const isDesc = direction === 'diagonal_desc' || direction === 'cross_x';

    const generateDiagonalSeries = (asc: boolean) => {
      let pitch = 140;
      if (spacingType === 'luz_livre') {
        pitch = Math.max(10, spacingMm) + pSize;
      } else {
        pitch = Math.max(pSize + 5, spacingMm);
      }
      const step = pitch * Math.SQRT2;
      const count = Math.max(1, Math.floor((W + H) / step));

      for (let i = 1; i <= count; i++) {
        const offset = i * step;
        let x1 = minX + pFrame;
        let y1 = asc ? (minY + pFrame + offset) : (maxY - pFrame - offset);
        let x2 = minX + pFrame + offset;
        let y2 = asc ? (minY + pFrame) : (maxY - pFrame);

        if (x1 > maxX - pFrame || y2 > maxY - pFrame || y2 < minY + pFrame) continue;

        const cx1 = Math.min(Math.max(x1, minX + pFrame), maxX - pFrame);
        const cy1 = Math.min(Math.max(y1, minY + pFrame), maxY - pFrame);
        const cx2 = Math.min(Math.max(x2, minX + pFrame), maxX - pFrame);
        const cy2 = Math.min(Math.max(y2, minY + pFrame), maxY - pFrame);

        const len = Math.round(Math.hypot(cx2 - cx1, cy2 - cy1));
        if (len >= 30) {
          const angle = Math.round(Math.atan2(cy2 - cy1, cx2 - cx1) * (180 / Math.PI));
          const rawDiag = {
            x1: Math.round(cx1),
            y1: Math.round(cy1),
            x2: Math.round(cx2),
            y2: Math.round(cy2),
            profile: profileName,
            angleDeg: angle
          };

          if (mode === 'interromper') {
            const segs = splitLineByObstacles(rawDiag, obstacles, 'autofill_d');
            result.push(...segs);
          } else {
            result.push({
              id: `autofill_d_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              ...rawDiag,
              lengthMm: len,
              color: '#10b981'
            });
          }
        }
      }
    };

    if (isAsc) generateDiagonalSeries(true);
    if (isDesc) generateDiagonalSeries(false);
  }

  return result;
}
