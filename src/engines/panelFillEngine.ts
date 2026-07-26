/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FreeDrawingLine,
  StructuralPanel,
  Point2D,
  PanelGuideBar,
  PanelFillConfig,
  PanelFillPattern,
  PanelFillPreviewBar,
  PanelTestResult,
} from '../types';

/**
 * Checks if a point lies strictly inside a polygon (Ray-casting)
 */
function isPointInPolygon(pt: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Line-segment to line segment intersection
 */
function getLineSegmentIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D | null {
  const d = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(d) < 1e-6) return null; // Parallel

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / d;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / d;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  return null;
}

// ======================================================
// FASE 2 & 3: DETECÇÃO DE BARRA GUIA
// ======================================================

export function detectGuideBar(
  panel: StructuralPanel,
  p1: Point2D,
  p2: Point2D
): PanelGuideBar {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthMm = Math.round(Math.hypot(dx, dy));

  let rad = Math.atan2(dy, dx);
  let angleDeg = Math.round((rad * 180) / Math.PI);
  if (angleDeg < 0) angleDeg += 360;

  let directionType: 'diagonal_up' | 'diagonal_down' | 'vertical' | 'horizontal' = 'diagonal_up';

  const normalizedAngle = angleDeg % 180;
  if (Math.abs(normalizedAngle - 90) <= 15) {
    directionType = 'vertical';
  } else if (normalizedAngle <= 15 || normalizedAngle >= 165) {
    directionType = 'horizontal';
  } else if (normalizedAngle > 15 && normalizedAngle < 90) {
    directionType = 'diagonal_down'; // In screen coords Y down
  } else {
    directionType = 'diagonal_up';
  }

  return {
    id: `guide_bar_${Date.now()}`,
    p1,
    p2,
    lengthMm,
    angleDeg,
    directionType,
  };
}

// ======================================================
// FASE 4 & 5: PRÉ-VISUALIZAÇÃO DE BARRAS DE PREENCHIMENTO
// ======================================================

let lastUsedFillConfigMemory: Partial<PanelFillConfig> | null = null;

export function getLastUsedFillConfig(): Partial<PanelFillConfig> | null {
  return lastUsedFillConfigMemory;
}

export function setLastUsedFillConfig(config: Partial<PanelFillConfig>) {
  lastUsedFillConfigMemory = { ...config };
}

export function generatePanelFillPreview(
  panel: StructuralPanel,
  config: PanelFillConfig,
  existingLines?: FreeDrawingLine[]
): PanelFillPreviewBar[] {
  if (!panel || !panel.vertices || panel.vertices.length < 3) {
    return [];
  }

  const { pattern, profileName, spacingMm, isInverted, alignWithNeighbor } = config;

  // Save last used configuration for quick click reduction
  setLastUsedFillConfig({
    pattern,
    profileName,
    spacingMm,
    isInverted,
    alignWithNeighbor,
  });

  // Collect structural lines that act as physical obstacles
  const obstacleLines = (existingLines || []).filter(
    (line) => !line.isPanelFillBar || line.panelId !== panel.id
  );

  // Determine angles to generate
  let angles: number[] = [];

  if (config.guideBar) {
    const baseAngle = config.guideBar.angleDeg;
    if (pattern === 'cross') {
      angles = [baseAngle, (baseAngle + 90) % 360];
    } else {
      angles = [baseAngle];
    }
  } else {
    switch (pattern) {
      case 'vertical':
        angles = [90];
        break;
      case 'horizontal':
        angles = [0];
        break;
      case 'cross':
        angles = [45, 135];
        break;
      case 'diagonal':
      default:
        angles = [45];
        break;
    }
  }

  if (isInverted) {
    angles = angles.map((a) => (a + 180) % 360);
  }

  const previewBars: PanelFillPreviewBar[] = [];
  const polygon = panel.vertices;

  angles.forEach((angleDeg, angleIdx) => {
    const rad = (angleDeg * Math.PI) / 180;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);

    // Normal vector perpendicular to line direction
    const normX = -dirY;
    const normY = dirX;

    // Project all panel vertices onto normal vector
    const projections = polygon.map((v) => v.x * normX + v.y * normY);
    const minProj = Math.min(...projections);
    const maxProj = Math.max(...projections);
    const totalSpan = maxProj - minProj;

    const safeSpacing = Math.max(spacingMm || 100, 10);

    // Uniform distribution calculation across total polygon extent
    let startProj: number;
    if (alignWithNeighbor) {
      // Phase alignment offset
      let phase = (panel.centroid.x * normX + panel.centroid.y * normY) % safeSpacing;
      if (phase < 0) phase += safeSpacing;
      startProj = Math.ceil((minProj - phase) / safeSpacing) * safeSpacing + phase;
      if (startProj <= minProj) startProj += safeSpacing;
    } else {
      const numBars = Math.floor(totalSpan / safeSpacing);
      if (numBars >= 1) {
        const remainder = totalSpan - numBars * safeSpacing;
        const initialMargin = remainder / 2;
        startProj = minProj + (initialMargin > 2 ? initialMargin : safeSpacing);
      } else {
        // Narrow panel -> central bar
        startProj = minProj + totalSpan / 2;
      }
    }

    let barCounter = 0;

    for (let proj = startProj; proj < maxProj - 1; proj += safeSpacing) {
      // Point on normal line
      const refX = proj * normX;
      const refY = proj * normY;

      // Infinite ray endpoints
      const farLen = 100000;
      const rayStart: Point2D = { x: refX - dirX * farLen, y: refY - dirY * farLen };
      const rayEnd: Point2D = { x: refX + dirX * farLen, y: refY + dirY * farLen };

      // 1. Find all ray intersections with outer polygon boundary
      const polygonIxs: { pt: Point2D; t: number }[] = [];

      for (let i = 0; i < polygon.length; i++) {
        const pA = polygon[i];
        const pB = polygon[(i + 1) % polygon.length];

        const ix = getLineSegmentIntersection(rayStart, rayEnd, pA, pB);
        if (ix) {
          const t = (ix.x - refX) * dirX + (ix.y - refY) * dirY;
          polygonIxs.push({ pt: ix, t });
        }
      }

      // Sort by parameter t along ray
      polygonIxs.sort((a, b) => a.t - b.t);

      // Deduplicate close intersection points
      const uniqueIxs: { pt: Point2D; t: number }[] = [];
      for (const item of polygonIxs) {
        if (
          uniqueIxs.length === 0 ||
          Math.hypot(item.pt.x - uniqueIxs[uniqueIxs.length - 1].pt.x, item.pt.y - uniqueIxs[uniqueIxs.length - 1].pt.y) > 0.5
        ) {
          uniqueIxs.push(item);
        }
      }

      // 2. Identify segments strictly inside polygon
      for (let k = 0; k < uniqueIxs.length - 1; k++) {
        const itemA = uniqueIxs[k];
        const itemB = uniqueIxs[k + 1];

        const midPt: Point2D = {
          x: (itemA.pt.x + itemB.pt.x) / 2,
          y: (itemA.pt.y + itemB.pt.y) / 2,
        };

        if (!isPointInPolygon(midPt, polygon)) {
          continue; // Segment is outside or across hole
        }

        const segStart = itemA.pt;
        const segEnd = itemB.pt;
        const baseLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y);

        if (baseLen < 10) continue;

        // 3. OBSTACLE CLIPPING (CORREÇÃO 2): Split ray at structural obstacles (transoms, muntins, etc.)
        const obsCutT: number[] = [0, 1]; // Parametric coordinates from 0 to 1 along (segStart, segEnd)

        for (const obs of obstacleLines) {
          const obsP1 = { x: obs.x1, y: obs.y1 };
          const obsP2 = { x: obs.x2, y: obs.y2 };

          const ixObs = getLineSegmentIntersection(segStart, segEnd, obsP1, obsP2);
          if (ixObs) {
            const distIx = Math.hypot(ixObs.x - segStart.x, ixObs.y - segStart.y);
            const s = distIx / baseLen;
            if (s > 0.001 && s < 0.999) {
              obsCutT.push(s);
            }
          }
        }

        obsCutT.sort((a, b) => a - b);

        // Deduplicate parametric cuts
        const uniqueCuts: number[] = [];
        for (const sVal of obsCutT) {
          if (uniqueCuts.length === 0 || Math.abs(sVal - uniqueCuts[uniqueCuts.length - 1]) > 0.001) {
            uniqueCuts.push(sVal);
          }
        }

        // Generate clipped sub-segments that end cleanly at obstacles
        for (let m = 0; m < uniqueCuts.length - 1; m++) {
          const s1 = uniqueCuts[m];
          const s2 = uniqueCuts[m + 1];

          const p1: Point2D = {
            x: segStart.x + s1 * (segEnd.x - segStart.x),
            y: segStart.y + s1 * (segEnd.y - segStart.y),
          };
          const p2: Point2D = {
            x: segStart.x + s2 * (segEnd.x - segStart.x),
            y: segStart.y + s2 * (segEnd.y - segStart.y),
          };

          const len = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y));
          const subMid: Point2D = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

          if (len >= 15 && isPointInPolygon(subMid, polygon)) {
            barCounter++;
            previewBars.push({
              id: `preview_fill_${panel.id}_${angleIdx}_${barCounter}`,
              x1: Math.round(p1.x),
              y1: Math.round(p1.y),
              x2: Math.round(p2.x),
              y2: Math.round(p2.y),
              lengthMm: len,
              angleDeg,
              profileName,
            });
          }
        }
      }
    }
  });

  return previewBars;
}

// ======================================================
// FASE 6: APLICAÇÃO DE PREENCHIMENTO DEFINITIVO
// ======================================================

export function applyPanelFill(
  existingLines: FreeDrawingLine[],
  panel: StructuralPanel,
  config: PanelFillConfig,
  previewBars?: PanelFillPreviewBar[]
): { updatedLines: FreeDrawingLine[]; newBarIds: string[] } {
  // 1. Remove any previous fill bars for this panel
  const cleanedLines = existingLines.filter((line) => line.panelId !== panel.id);

  // 2. Generate fill bars if preview not provided (passing existingLines for obstacle detection)
  const barsToApply = previewBars || generatePanelFillPreview(panel, config, existingLines);

  // 3. Convert to FreeDrawingLine objects
  const newBarIds: string[] = [];
  const createdLines: FreeDrawingLine[] = barsToApply.map((bar, idx) => {
    const lineId = `fill_bar_${panel.id}_${Date.now()}_${idx + 1}`;
    newBarIds.push(lineId);
    return {
      id: lineId,
      x1: bar.x1,
      y1: bar.y1,
      x2: bar.x2,
      y2: bar.y2,
      lengthMm: bar.lengthMm,
      angleDeg: bar.angleDeg,
      profile: bar.profileName,
      panelId: panel.id,
      isPanelFillBar: true,
      color: '#f59e0b', // Amber theme for panel fill bars
    };
  });

  // 4. Update panel fill configuration
  panel.fillConfig = {
    ...config,
    filledBarIds: newBarIds,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedLines: [...cleanedLines, ...createdLines],
    newBarIds,
  };
}

// ======================================================
// FASE 7: EDIÇÃO E REMOÇÃO DE PREENCHIMENTO
// ======================================================

export function removePanelFill(
  existingLines: FreeDrawingLine[],
  panel: StructuralPanel
): FreeDrawingLine[] {
  panel.fillConfig = undefined;
  return existingLines.filter((line) => line.panelId !== panel.id);
}

// ======================================================
// FASE 8: SUÍTE DE TESTES E VALIDAÇÃO ET-021.4
// ======================================================

export function runPanelFillEngineValidationTests(): PanelTestResult[] {
  const results: PanelTestResult[] = [];

  // Mock Panel: Quadro 1000x2000 mm
  const mockPanel: StructuralPanel = {
    id: 'panel_test_100',
    indexNumber: 1,
    name: 'Painel P1 Teste',
    contourBarIds: ['b1', 'b2', 'b3', 'b4'],
    vertices: [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 2000 },
      { x: 0, y: 2000 },
    ],
    widthMm: 1000,
    heightMm: 2000,
    areaMm2: 2000000,
    areaM2: 2.0,
    perimeterMm: 6000,
    centroid: { x: 500, y: 1000 },
    bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 2000 },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TESTE 1: Detecção de Barra Guia
  try {
    const guide = detectGuideBar(mockPanel, { x: 0, y: 0 }, { x: 1000, y: 2000 });
    if (guide.lengthMm > 2000 && guide.directionType === 'diagonal_down') {
      results.push({
        testId: 'TEST-FILL-001',
        name: 'Detecção de Barra Guia Diagonal',
        passed: true,
        message: `Detectou guia diagonal de ${guide.lengthMm}mm com ângulo ${guide.angleDeg}°.`,
      });
    } else {
      results.push({
        testId: 'TEST-FILL-001',
        name: 'Detecção de Barra Guia Diagonal',
        passed: false,
        message: `Falha na detecção da guia: len=${guide.lengthMm}, dir=${guide.directionType}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-FILL-001',
      name: 'Detecção de Barra Guia Diagonal',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 2: Pré-visualização Vertical
  try {
    const configVertical: PanelFillConfig = {
      panelId: mockPanel.id,
      pattern: 'vertical',
      profileName: 'Metalon 20x20x1.50',
      spacingMm: 200,
      angleDeg: 90,
      isInverted: false,
      alignWithNeighbor: false,
    };

    const previews = generatePanelFillPreview(mockPanel, configVertical);
    if (previews.length >= 4 && previews.every((b) => b.lengthMm === 2000)) {
      results.push({
        testId: 'TEST-FILL-002',
        name: 'Pré-Visualização de Preenchimento Vertical (Espaço-Luz 200mm)',
        passed: true,
        message: `Gerou ${previews.length} barras verticais perfeitas de 2000mm.`,
      });
    } else {
      results.push({
        testId: 'TEST-FILL-002',
        name: 'Pré-Visualização de Preenchimento Vertical (Espaço-Luz 200mm)',
        passed: false,
        message: `Inesperado: gerou ${previews.length} barras.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-FILL-002',
      name: 'Pré-Visualização de Preenchimento Vertical (Espaço-Luz 200mm)',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 3: Aplicação de Preenchimento e Limites do Painel
  try {
    const configHorizontal: PanelFillConfig = {
      panelId: mockPanel.id,
      pattern: 'horizontal',
      profileName: 'Metalon 30x20x1.50',
      spacingMm: 500,
      angleDeg: 0,
      isInverted: false,
      alignWithNeighbor: false,
    };

    const baseLines: FreeDrawingLine[] = [
      { id: 'b1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
    ];

    const { updatedLines, newBarIds } = applyPanelFill(baseLines, mockPanel, configHorizontal);

    const fillBars = updatedLines.filter((l) => l.panelId === mockPanel.id);
    const exceedsBounds = fillBars.some(
      (b) =>
        Math.min(b.x1, b.x2) < mockPanel.bounds.minX ||
        Math.max(b.x1, b.x2) > mockPanel.bounds.maxX ||
        Math.min(b.y1, b.y2) < mockPanel.bounds.minY ||
        Math.max(b.y1, b.y2) > mockPanel.bounds.maxY
    );

    if (fillBars.length === newBarIds.length && !exceedsBounds && fillBars.length >= 3) {
      results.push({
        testId: 'TEST-FILL-003',
        name: 'Aplicação Definitiva e Respeito Aos Limites do Painel',
        passed: true,
        message: `Aplicou ${fillBars.length} barras sem nenhuma violação do perímetro.`,
      });
    } else {
      results.push({
        testId: 'TEST-FILL-003',
        name: 'Aplicação Definitiva e Respeito Aos Limites do Painel',
        passed: false,
        message: `Falha: total=${fillBars.length}, ultrapassou=${exceedsBounds}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-FILL-003',
      name: 'Aplicação Definitiva e Respeito Aos Limites do Painel',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 4: Edição e Remoção de Preenchimento
  try {
    const baseLines: FreeDrawingLine[] = [
      { id: 'b1', x1: 0, y1: 0, x2: 1000, y2: 0, lengthMm: 1000, angleDeg: 0 },
      { id: 'fill1', x1: 0, y1: 100, x2: 1000, y2: 100, lengthMm: 1000, angleDeg: 0, panelId: mockPanel.id, isPanelFillBar: true },
    ];

    const afterRemove = removePanelFill(baseLines, mockPanel);
    const hasFillLeft = afterRemove.some((l) => l.panelId === mockPanel.id);

    if (!hasFillLeft && afterRemove.length === 1) {
      results.push({
        testId: 'TEST-FILL-004',
        name: 'Remoção e Limpeza Completa de Preenchimento',
        passed: true,
        message: 'Removeu todas as barras vinculadas ao painel e restaurou linhas base.',
      });
    } else {
      results.push({
        testId: 'TEST-FILL-004',
        name: 'Remoção e Limpeza Completa de Preenchimento',
        passed: false,
        message: `Remoção falhou, sobram ${afterRemove.length} linhas.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-FILL-004',
      name: 'Remoção e Limpeza Completa de Preenchimento',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  // TESTE 5: Obstáculos Estruturais Intermediários (Travessas/Montantes)
  try {
    const obstacleLine: FreeDrawingLine = {
      id: 'transom_1',
      x1: 500,
      y1: 0,
      x2: 500,
      y2: 2000,
      lengthMm: 2000,
      angleDeg: 90,
    };

    const configHoriz: PanelFillConfig = {
      panelId: mockPanel.id,
      pattern: 'horizontal',
      profileName: 'Metalon 20x20x1.50',
      spacingMm: 500,
      angleDeg: 0,
      isInverted: false,
      alignWithNeighbor: false,
    };

    const previewWithObs = generatePanelFillPreview(mockPanel, configHoriz, [obstacleLine]);
    const crossesObstacle = previewWithObs.some((b) => Math.min(b.x1, b.x2) < 500 && Math.max(b.x1, b.x2) > 500);

    if (!crossesObstacle && previewWithObs.length >= 6) {
      results.push({
        testId: 'TEST-FILL-005',
        name: 'Bloqueio e Seccionamento em Obstáculos Estruturais',
        passed: true,
        message: `Barras seccionadas corretamente no montante intermediário (x=500mm). Nenhuma barra atravessou o obstáculo.`,
      });
    } else {
      results.push({
        testId: 'TEST-FILL-005',
        name: 'Bloqueio e Seccionamento em Obstáculos Estruturais',
        passed: false,
        message: `Falha: ${previewWithObs.length} barras geradas, atravessou=${crossesObstacle}.`,
      });
    }
  } catch (e: any) {
    results.push({
      testId: 'TEST-FILL-005',
      name: 'Bloqueio e Seccionamento em Obstáculos Estruturais',
      passed: false,
      message: `Exceção: ${e.message}`,
    });
  }

  return results;
}
