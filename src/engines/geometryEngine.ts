/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreeDrawingLine, LengthUnit } from '../types';
import { 
  convertToMm, 
  convertFromMm, 
  formatLength, 
  calculateRectangleDiagonal, 
  checkSquareness 
} from '../utils/geometricEngine';

// Re-export existing utilities for complete geometry centralization
export { 
  convertToMm, 
  convertFromMm, 
  formatLength, 
  calculateRectangleDiagonal, 
  checkSquareness 
};

/**
 * Geometric Node representation (point in 2D space)
 */
export interface GeometryNode {
  id: string;
  x: number;
  y: number;
}

/**
 * Geometric Segment representation (line between two nodes)
 */
export interface GeometrySegment {
  id: string;
  start: GeometryNode;
  end: GeometryNode;
  lengthMm: number;
  angleDeg: number;
  profile?: string;
}

/**
 * Structure Bounding Box interface
 */
export interface StructureBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Computes bounding box and dimensions for a set of drawing lines
 */
export function getStructureBounds(lines: FreeDrawingLine[]): StructureBounds {
  if (!lines || lines.length === 0) {
    return { minX: 0, maxX: 1200, minY: 0, maxY: 2000, width: 1200, height: 2000 };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  lines.forEach(l => {
    minX = Math.min(minX, l.x1, l.x2);
    maxX = Math.max(maxX, l.x1, l.x2);
    minY = Math.min(minY, l.y1, l.y2);
    maxY = Math.max(maxY, l.y1, l.y2);
  });
  const width = Math.max(200, maxX - minX);
  const height = Math.max(200, maxY - minY);
  return { minX, maxX, minY, maxY, width, height };
}

/**
 * Extracts profile thickness in mm from profile name (e.g. "Metalon 30x30" -> 30)
 */
export function getProfileThickness(profName?: string): number {
  if (!profName) return 20;
  const lower = profName.toLowerCase();
  const match = lower.match(/(\d+)\s*x\s*(\d+)/);
  if (match) {
    return Math.max(parseFloat(match[1]), parseFloat(match[2])) || 20;
  }
  if (lower.includes('15x15')) return 15;
  if (lower.includes('20x20')) return 20;
  if (lower.includes('30x30') || lower.includes('30x20')) return 30;
  if (lower.includes('40x40') || lower.includes('40x20')) return 40;
  if (lower.includes('50x50') || lower.includes('50x30')) return 50;
  if (lower.includes('60x40')) return 60;
  if (lower.includes('80x40')) return 80;
  return 20;
}

/**
 * Calculates euclidean distance / length in mm between two coordinates
 */
export function calculateSegmentLength(x1: number, y1: number, x2: number, y2: number): number {
  return Math.round(Math.hypot(x2 - x1, y2 - y1));
}

/**
 * Calculates segment angle in degrees (0..360 or -180..180)
 */
export function calculateAngleDeg(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
}

/**
 * Calculates shortest distance from a point (px, py) to a segment (x1,y1)-(x2,y2) in mm
 */
export function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx: number, yy: number;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  return Math.hypot(px - xx, py - yy);
}

/**
 * Determines whether two 2D points are within a specified distance tolerance
 */
export function arePointsClose(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  toleranceMm: number = 5
): boolean {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y) <= toleranceMm;
}

/**
 * Computes guide reference line for Trena Guiada tool based on reference edge and offset distance
 */
export function computeGuideLine(
  refType: 'topo' | 'base' | 'esquerda' | 'direita' | 'centro',
  distStr: string,
  lines: FreeDrawingLine[]
): { x1: number; y1: number; x2: number; y2: number; type: 'horizontal' | 'vertical' } | null {
  try {
    const dist = parseFloat(distStr) || 0;
    const { minX, maxX, minY, maxY } = getStructureBounds(lines);

    let gX1 = 0, gY1 = 0, gX2 = 0, gY2 = 0;
    let type: 'horizontal' | 'vertical' = 'horizontal';

    if (refType === 'topo') {
      const guideY = minY + dist;
      gX1 = minX - 100;
      gY1 = guideY;
      gX2 = maxX + 100;
      gY2 = guideY;
      type = 'horizontal';
    } else if (refType === 'base') {
      const guideY = maxY - dist;
      gX1 = minX - 100;
      gY1 = guideY;
      gX2 = maxX + 100;
      gY2 = guideY;
      type = 'horizontal';
    } else if (refType === 'esquerda') {
      const guideX = minX + dist;
      gX1 = guideX;
      gY1 = minY - 100;
      gX2 = guideX;
      gY2 = maxY + 100;
      type = 'vertical';
    } else if (refType === 'direita') {
      const guideX = maxX - dist;
      gX1 = guideX;
      gY1 = minY - 100;
      gX2 = guideX;
      gY2 = maxY + 100;
      type = 'vertical';
    } else if (refType === 'centro') {
      const midY = Math.round((minY + maxY) / 2);
      const guideY = midY + dist;
      gX1 = minX - 100;
      gY1 = guideY;
      gX2 = maxX + 100;
      gY2 = guideY;
      type = 'horizontal';
    }

    return { x1: gX1, y1: gY1, x2: gX2, y2: gY2, type };
  } catch (err) {
    console.error("Erro ao calcular guia da trena:", err);
    return null;
  }
}
