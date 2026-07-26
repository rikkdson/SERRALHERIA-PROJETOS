/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FreeDrawingLine,
  StructuralPanel,
  Point2D,
  PanelBounds,
  PanelSummary,
  PanelTestResult,
} from '../types';

// State variables for active panel selection and cache
let activePanelsCache: StructuralPanel[] = [];
let activeHighlightedPanelId: string | null = null;
let activeSelectedPanelId: string | null = null;

// Event listeners for panel updates
export const PANELS_UPDATED_EVENT = 'serralheria_panels_updated_event';

function emitPanelsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PANELS_UPDATED_EVENT));
  }
}

/**
 * Snaps two points if within tolerance (mm)
 */
function snapPoint(p: Point2D, vertices: Point2D[], tolerance = 3.0): Point2D {
  for (const v of vertices) {
    if (Math.hypot(p.x - v.x, p.y - v.y) <= tolerance) {
      return v;
    }
  }
  vertices.push(p);
  return p;
}

/**
 * Calculates line-line intersection point if any
 */
function findLineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-6) return null; // Parallel or collinear

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  // Strict interior intersection tolerance (avoid exact endpoint hits)
  const eps = 1e-4;
  if (ua >= eps && ua <= 1 - eps && ub >= eps && ub <= 1 - eps) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  return null;
}

interface EdgeSegment {
  u: Point2D;
  v: Point2D;
  lineId: string;
}

/**
 * FASE 1: DETECÇÃO AUTOMÁTICA DE PAINÉIS
 * Reconstructs planar graph from drawing lines and extracts minimal closed faces (panels)
 */
export function detectPanelsFromLines(lines: FreeDrawingLine[]): StructuralPanel[] {
  if (!lines || lines.length < 3) {
    return [];
  }

  // 1. Gather all line segments
  const rawSegments: EdgeSegment[] = lines.map((l) => ({
    u: { x: Math.round(l.x1), y: Math.round(l.y1) },
    v: { x: Math.round(l.x2), y: Math.round(l.y2) },
    lineId: l.id,
  }));

  // 2. Find all interior intersection points between segments
  const splitPointsMap = new Map<number, Point2D[]>();

  for (let i = 0; i < rawSegments.length; i++) {
    for (let j = i + 1; j < rawSegments.length; j++) {
      const segA = rawSegments[i];
      const segB = rawSegments[j];

      const ix = findLineIntersection(segA.u, segA.v, segB.u, segB.v);
      if (ix) {
        if (!splitPointsMap.has(i)) splitPointsMap.set(i, []);
        if (!splitPointsMap.has(j)) splitPointsMap.set(j, []);

        splitPointsMap.get(i)!.push(ix);
        splitPointsMap.get(j)!.push(ix);
      }
    }
  }

  // 3. Split raw segments at intersection points into elementary sub-segments
  const elementarySegments: EdgeSegment[] = [];
  const globalVertices: Point2D[] = [];

  rawSegments.forEach((seg, idx) => {
    const splits = splitPointsMap.get(idx) || [];
    // Combine start, splits, and end sorted along segment direction
    const pointsOnSeg = [seg.u, ...splits, seg.v];

    const isHorizontal = Math.abs(seg.v.y - seg.u.y) < Math.abs(seg.v.x - seg.u.x);
    pointsOnSeg.sort((a, b) => (isHorizontal ? a.x - b.x : a.y - b.y));

    // Deduplicate close points along segment
    const uniquePoints: Point2D[] = [];
    for (const pt of pointsOnSeg) {
      const snapped = snapPoint(pt, globalVertices, 4.0);
      if (uniquePoints.length === 0) {
        uniquePoints.push(snapped);
      } else {
        const last = uniquePoints[uniquePoints.length - 1];
        if (Math.hypot(snapped.x - last.x, snapped.y - last.y) > 2.0) {
          uniquePoints.push(snapped);
        }
      }
    }

    for (let k = 0; k < uniquePoints.length - 1; k++) {
      const pA = uniquePoints[k];
      const pB = uniquePoints[k + 1];
      if (Math.hypot(pB.x - pA.x, pB.y - pA.y) > 2.0) {
        elementarySegments.push({ u: pA, v: pB, lineId: seg.lineId });
      }
    }
  });

  // 4. Build planar graph adjacency
  interface DirectedHalfEdge {
    from: Point2D;
    to: Point2D;
    angle: number;
    lineId: string;
  }

  const adjacency = new Map<Point2D, DirectedHalfEdge[]>();

  const addHalfEdge = (from: Point2D, to: Point2D, lineId: string) => {
    if (!adjacency.has(from)) adjacency.set(from, []);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;

    adjacency.get(from)!.push({ from, to, angle, lineId });
  };

  elementarySegments.forEach((seg) => {
    addHalfEdge(seg.u, seg.v, seg.lineId);
    addHalfEdge(seg.v, seg.u, seg.lineId);
  });

  // Sort outgoing half-edges at each vertex counter-clockwise (by angle)
  adjacency.forEach((edges) => {
    edges.sort((a, b) => a.angle - b.angle);
  });

  // 5. Trace minimal closed faces (polygons)
  const visited = new Set<string>();
  const makeHalfEdgeKey = (from: Point2D, to: Point2D) => `${from.x},${from.y}->${to.x},${to.y}`;

  const detectedPanels: StructuralPanel[] = [];

  adjacency.forEach((outgoingEdges, startVertex) => {
    outgoingEdges.forEach((initialHalfEdge) => {
      const initKey = makeHalfEdgeKey(initialHalfEdge.from, initialHalfEdge.to);
      if (visited.has(initKey)) return;

      // Trace cycle
      const cycleVertices: Point2D[] = [initialHalfEdge.from];
      const cycleLineIds = new Set<string>([initialHalfEdge.lineId]);

      let currentEdge = initialHalfEdge;
      let loopGuard = 0;
      let closed = false;

      while (loopGuard < 200) {
        loopGuard++;
        visited.add(makeHalfEdgeKey(currentEdge.from, currentEdge.to));

        const nextVertex = currentEdge.to;
        cycleVertices.push(nextVertex);

        if (nextVertex === startVertex) {
          closed = true;
          break;
        }

        // Find outgoing edge from nextVertex that turns most counter-clockwise (to the left)
        const nextOutgoing = adjacency.get(nextVertex);
        if (!nextOutgoing || nextOutgoing.length === 0) break;

        // Inbound direction from nextVertex back towards currentEdge.from
        const dxIn = currentEdge.from.x - nextVertex.x;
        const dyIn = currentEdge.from.y - nextVertex.y;
        let angleIn = Math.atan2(dyIn, dxIn);
        if (angleIn < 0) angleIn += 2 * Math.PI;

        // Find edge with angle closest to angleIn in counter-clockwise direction
        let bestEdge: DirectedHalfEdge | null = null;
        let minDiff = Infinity;

        for (const outEdge of nextOutgoing) {
          let diff = outEdge.angle - angleIn;
          if (diff <= 0) diff += 2 * Math.PI;
          if (diff < minDiff) {
            minDiff = diff;
            bestEdge = outEdge;
          }
        }

        if (!bestEdge) break;

        currentEdge = bestEdge;
        cycleLineIds.add(currentEdge.lineId);
      }

      if (closed && cycleVertices.length >= 4) {
        // Pop duplicate last vertex
        const polygon = cycleVertices.slice(0, cycleVertices.length - 1);

        // Calculate signed area via Shoelace Formula
        let signedArea = 0;
        let perimeter = 0;
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;

        let cxSum = 0,
          cySum = 0;

        for (let i = 0; i < polygon.length; i++) {
          const p1 = polygon[i];
          const p2 = polygon[(i + 1) % polygon.length];

          const cross = p1.x * p2.y - p2.x * p1.y;
          signedArea += cross;

          cxSum += (p1.x + p2.x) * cross;
          cySum += (p1.y + p2.y) * cross;

          const edgeLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          perimeter += edgeLen;

          minX = Math.min(minX, p1.x);
          maxX = Math.max(maxX, p1.x);
          minY = Math.min(minY, p1.y);
          maxY = Math.max(maxY, p1.y);
        }

        signedArea = signedArea / 2;

        // Interior faces have positive signed area in counter-clockwise order
        // Filter out tiny slivers (< 1000 mm², e.g., < 3.16cm x 3.16cm)
        if (signedArea > 500) {
          const areaMm2 = Math.round(signedArea);
          const areaM2 = parseFloat((areaMm2 / 1000000).toFixed(4));

          // Centroid calculation
          let centroidX = cxSum / (6 * signedArea);
          let centroidY = cySum / (6 * signedArea);

          if (isNaN(centroidX) || isNaN(centroidY)) {
            // Fallback average
            centroidX = (minX + maxX) / 2;
            centroidY = (minY + maxY) / 2;
          }

          const widthMm = Math.round(maxX - minX);
          const heightMm = Math.round(maxY - minY);

          detectedPanels.push({
            id: `panel_temp_${detectedPanels.length + 1}`,
            indexNumber: detectedPanels.length + 1,
            name: `Painel P${detectedPanels.length + 1}`,
            contourBarIds: Array.from(cycleLineIds),
            vertices: polygon,
            widthMm,
            heightMm,
            areaMm2,
            areaM2,
            perimeterMm: Math.round(perimeter),
            centroid: { x: Math.round(centroidX), y: Math.round(centroidY) },
            bounds: {
              minX: Math.round(minX),
              minY: Math.round(minY),
              maxX: Math.round(maxX),
              maxY: Math.round(maxY),
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  });

  // Sort panels spatially (Top-to-Bottom, Left-to-Right) for intuitive indexing (P1, P2, P3...)
  detectedPanels.sort((a, b) => {
    if (Math.abs(a.centroid.y - b.centroid.y) > 20) {
      return a.centroid.y - b.centroid.y;
    }
    return a.centroid.x - b.centroid.x;
  });

  // Re-index cleanly
  const now = new Date().toISOString();
  return detectedPanels.map((p, idx) => ({
    ...p,
    id: `panel_${idx + 1}_${p.centroid.x}_${p.centroid.y}`,
    indexNumber: idx + 1,
    name: `Painel P${idx + 1}`,
    updatedAt: now,
  }));
}

// ======================================================
// FASE 2: GERENCIADOR DE PAINÉIS (PanelManager)
// ======================================================

export class PanelManager {
  /**
   * Recalculates and updates panel cache automatically when drawing lines change
   */
  public static updatePanels(lines: FreeDrawingLine[]): StructuralPanel[] {
    const newPanels = detectPanelsFromLines(lines);

    // Preserve selection if still valid
    if (activeSelectedPanelId) {
      const exists = newPanels.some((p) => p.id === activeSelectedPanelId);
      if (!exists) activeSelectedPanelId = null;
    }

    if (activeHighlightedPanelId) {
      const exists = newPanels.some((p) => p.id === activeHighlightedPanelId);
      if (!exists) activeHighlightedPanelId = null;
    }

    activePanelsCache = newPanels;
    emitPanelsUpdated();
    return newPanels;
  }

  /**
   * Gets cached panels or calculates if empty
   */
  public static getPanels(): StructuralPanel[] {
    return activePanelsCache;
  }

  /**
   * Gets panel by ID
   */
  public static getPanelById(id: string): StructuralPanel | null {
    return activePanelsCache.find((p) => p.id === id) || null;
  }

  /**
   * Gets bounding box of panel by ID
   */
  public static getPanelBounds(id: string): PanelBounds | null {
    const p = this.getPanelById(id);
    return p ? p.bounds : null;
  }

  /**
   * Highlights panel (hover)
   */
  public static highlightPanel(id: string | null): void {
    activeHighlightedPanelId = id;
    emitPanelsUpdated();
  }

  /**
   * Gets currently highlighted panel ID
   */
  public static getHighlightedPanelId(): string | null {
    return activeHighlightedPanelId;
  }

  /**
   * Selects panel (click/tap)
   */
  public static selectPanel(id: string | null): void {
    activeSelectedPanelId = id;
    emitPanelsUpdated();
  }

  /**
   * Gets currently selected panel ID
   */
  public static getSelectedPanelId(): string | null {
    return activeSelectedPanelId;
  }

  /**
   * Returns panel summary metrics
   */
  public static getPanelSummary(): PanelSummary {
    const totalCount = activePanelsCache.length;
    let totalAreaM2 = 0;
    let minAreaM2 = totalCount > 0 ? Infinity : 0;
    let maxAreaM2 = 0;
    let activeCount = 0;

    activePanelsCache.forEach((p) => {
      totalAreaM2 += p.areaM2;
      if (p.areaM2 < minAreaM2) minAreaM2 = p.areaM2;
      if (p.areaM2 > maxAreaM2) maxAreaM2 = p.areaM2;
      if (p.isActive) activeCount++;
    });

    return {
      totalCount,
      totalAreaM2: parseFloat(totalAreaM2.toFixed(3)),
      minAreaM2: totalCount > 0 ? parseFloat(minAreaM2.toFixed(3)) : 0,
      maxAreaM2: parseFloat(maxAreaM2.toFixed(3)),
      activeCount,
    };
  }
}

// ======================================================
// FASE 5: API PÚBLICA EXPORTADA
// ======================================================

export const getPanels = (): StructuralPanel[] => PanelManager.getPanels();
export const getPanelById = (id: string): StructuralPanel | null => PanelManager.getPanelById(id);
export const getPanelBounds = (id: string): PanelBounds | null => PanelManager.getPanelBounds(id);
export const highlightPanel = (id: string | null): void => PanelManager.highlightPanel(id);
export const selectPanel = (id: string | null): void => PanelManager.selectPanel(id);
export const getPanelSummary = (): PanelSummary => PanelManager.getPanelSummary();

// ======================================================
// FASE 7: SUÍTE DE TESTES E VALIDAÇÃO ET-021.3
// ======================================================

export function runPanelEngineValidationTests(): PanelTestResult[] {
  const results: PanelTestResult[] = [];

  // TESTE 1: Quadro retangular simples (4 barras) -> Exatamente 1 Painel
  try {
    const singleFrameLines: FreeDrawingLine[] = [
      { id: 'l1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'l2', x1: 1000, y1: 0, x2: 1000, y2: 2000, lengthMm: 2000, angleDeg: 90 },
      { id: 'l3', x1: 1000, y1: 2000, x2: 0, y2: 2000, lengthMm: 1000, angleDeg: 180 },
      { id: 'l4', x1: 0, y1: 2000, x2: 0, y2: 0, lengthMm: 2000, angleDeg: -90 },
    ];

    const panels = detectPanelsFromLines(singleFrameLines);

    if (panels.length === 1 && panels[0].widthMm === 1000 && panels[0].heightMm === 2000) {
      results.push({
        testId: 'TEST-PANEL-001',
        name: 'Detecção em Quadro Retangular Simples (4 Barras)',
        passed: true,
        message: 'Detectou exatamente 1 painel de 1000x2000 mm (2.0 m²).',
      });
    } else {
      results.push({
        testId: 'TEST-PANEL-001',
        name: 'Detecção em Quadro Retangular Simples (4 Barras)',
        passed: false,
        message: `Esperado 1 painel, retornou ${panels.length}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-PANEL-001',
      name: 'Detecção em Quadro Retangular Simples (4 Barras)',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 2: Quadro retangular com montante central (5 barras) -> Exatamente 2 Painéis
  try {
    const splitFrameLines: FreeDrawingLine[] = [
      { id: 'l1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'l2', x1: 1000, y1: 0, x2: 1000, y2: 2000, lengthMm: 2000, angleDeg: 90 },
      { id: 'l3', x1: 1000, y1: 2000, x2: 0, y2: 2000, lengthMm: 1000, angleDeg: 180 },
      { id: 'l4', x1: 0, y1: 2000, x2: 0, y2: 0, lengthMm: 2000, angleDeg: -90 },
      { id: 'l5', x1: 500, y1: 0, x2: 500, y2: 2000, lengthMm: 2000, angleDeg: 90 }, // Montante central
    ];

    const panels = detectPanelsFromLines(splitFrameLines);

    if (panels.length === 2 && panels[0].widthMm === 500 && panels[1].widthMm === 500) {
      results.push({
        testId: 'TEST-PANEL-002',
        name: 'Divisão por Montante Central (5 Barras)',
        passed: true,
        message: 'Detectou 2 sub-painéis idênticos de 500x2000 mm.',
      });
    } else {
      results.push({
        testId: 'TEST-PANEL-002',
        name: 'Divisão por Montante Central (5 Barras)',
        passed: false,
        message: `Esperado 2 painéis, retornou ${panels.length}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-PANEL-002',
      name: 'Divisão por Montante Central (5 Barras)',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 3: Barras abertas sem ciclo fechado -> 0 Painéis
  try {
    const openLines: FreeDrawingLine[] = [
      { id: 'l1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'l2', x1: 1000, y1: 0, x2: 1000, y2: 2000, lengthMm: 2000, angleDeg: 90 },
    ];

    const panels = detectPanelsFromLines(openLines);

    if (panels.length === 0) {
      results.push({
        testId: 'TEST-PANEL-003',
        name: 'Tratamento de Estruturas Abertas (Sem Ciclo)',
        passed: true,
        message: 'Identificou corretamente 0 painéis para linhas desconectadas.',
      });
    } else {
      results.push({
        testId: 'TEST-PANEL-003',
        name: 'Tratamento de Estruturas Abertas (Sem Ciclo)',
        passed: false,
        message: `Estrutura aberta retornou ${panels.length} painéis indevidamente.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-PANEL-003',
      name: 'Tratamento de Estruturas Abertas (Sem Ciclo)',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 4: Atualização Dinâmica via PanelManager
  try {
    const initialLines: FreeDrawingLine[] = [
      { id: 'l1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'l2', x1: 1000, y1: 0, x2: 1000, y2: 2000, lengthMm: 2000, angleDeg: 90 },
      { id: 'l3', x1: 1000, y1: 2000, x2: 0, y2: 2000, lengthMm: 1000, angleDeg: 180 },
      { id: 'l4', x1: 0, y1: 2000, x2: 0, y2: 0, lengthMm: 2000, angleDeg: -90 },
    ];

    PanelManager.updatePanels(initialLines);
    const initialCount = PanelManager.getPanels().length;

    // Remove 1 bar -> Structure becomes open
    PanelManager.updatePanels(initialLines.slice(0, 3));
    const afterCount = PanelManager.getPanels().length;

    if (initialCount === 1 && afterCount === 0) {
      results.push({
        testId: 'TEST-PANEL-004',
        name: 'Atualização e Remoção Automática via PanelManager',
        passed: true,
        message: 'Gerenciador atualizou e removeu painel inexistente automaticamente ao apagar barra.',
      });
    } else {
      results.push({
        testId: 'TEST-PANEL-004',
        name: 'Atualização e Remoção Automática via PanelManager',
        passed: false,
        message: `Falha na re-calculagem: Inicial ${initialCount}, Após ${afterCount}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-PANEL-004',
      name: 'Atualização e Remoção Automática via PanelManager',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 5: API Pública de Seleção e Bounds
  try {
    const testLines: FreeDrawingLine[] = [
      { id: 'l1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'l2', x1: 1000, y1: 0, x2: 1000, y2: 1000, lengthMm: 1000, angleDeg: 90 },
      { id: 'l3', x1: 1000, y1: 1000, x2: 0, y2: 1000, lengthMm: 1000, angleDeg: 180 },
      { id: 'l4', x1: 0, y1: 1000, x2: 0, y2: 0, lengthMm: 1000, angleDeg: -90 },
    ];

    const updatedPanels = PanelManager.updatePanels(testLines);
    const targetId = updatedPanels[0].id;

    selectPanel(targetId);
    highlightPanel(targetId);

    const retrievedPanel = getPanelById(targetId);
    const retrievedBounds = getPanelBounds(targetId);
    const summary = getPanelSummary();

    if (
      retrievedPanel &&
      retrievedBounds &&
      retrievedPanel.widthMm === 1000 &&
      retrievedBounds.maxX === 1000 &&
      summary.totalCount === 1 &&
      summary.totalAreaM2 === 1.0
    ) {
      results.push({
        testId: 'TEST-PANEL-005',
        name: 'Integridade da API Pública (getPanels, selectPanel, getPanelBounds)',
        passed: true,
        message: 'API respondeu com precisão e métricas consolidadas.',
      });
    } else {
      results.push({
        testId: 'TEST-PANEL-005',
        name: 'Integridade da API Pública (getPanels, selectPanel, getPanelBounds)',
        passed: false,
        message: 'Falha nos retornos das funções da API Pública.',
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-PANEL-005',
      name: 'Integridade da API Pública (getPanels, selectPanel, getPanelBounds)',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  return results;
}
