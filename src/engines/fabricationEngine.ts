/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FreeDrawingLine } from '../types';

/**
 * Fabrication Interruption Mode
 */
export type FabricationInterruptionMode = 'interromper' | 'continuo';

/**
 * Structural Piece Category
 */
export type StructuralCategory =
  | 'quadro'
  | 'coluna'
  | 'travessa'
  | 'diagonal'
  | 'preenchimento'
  | 'reforco'
  | 'livre';

/**
 * Represents a piece in the fabrication model
 */
export interface FabricationPiece {
  id: string;
  originalLineId: string;
  profile: string;
  color?: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  lengthMm: number;
  angleDeg: number;
  category: StructuralCategory;
  fabricationMode: FabricationInterruptionMode;
  priority: number;
  cutAngles: { startAngleDeg: number; endAngleDeg: number };
}

/**
 * Represents an intersection node in the fabrication model
 */
export interface FabricationIntersection {
  id: string;
  point: { x: number; y: number };
  primaryPieceId: string;
  secondaryPieceId: string;
  tA: number; // Parametric position 0..1 on primary piece
  tB: number; // Parametric position 0..1 on secondary piece
  intersectionType: 'cross' | 't_junction' | 'corner';
}

/**
 * Represents a rule decision for a specific intersection
 */
export interface FabricationRuleDecision {
  intersectionId: string;
  pieceAId: string;
  pieceBId: string;
  interruptedPieceId: string | null;
  splitParam: number;
  reason: string;
}

/**
 * Main Fabrication Model state container
 */
export interface FabricationModel {
  pieces: FabricationPiece[];
  intersections: FabricationIntersection[];
  ruleDecisions: FabricationRuleDecision[];
  mode: FabricationInterruptionMode;
  isValid: boolean;
  notes: string[];
}

/**
 * Helper to determine category, priority and mode deterministically
 */
export function determinePieceCategoryAndPriority(
  line: FreeDrawingLine,
  defaultMode: FabricationInterruptionMode = 'interromper'
): { category: StructuralCategory; priority: number; mode: FabricationInterruptionMode } {
  const idLower = (line.id || '').toLowerCase();
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;
  const angle = line.angleDeg ?? Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
  const normAngle = ((angle % 360) + 360) % 360;

  let category: StructuralCategory = 'livre';
  let basePriority = 30;

  if (idLower.includes('frame') || idLower.includes('quadro')) {
    category = 'quadro';
    basePriority = 100;
  } else if (idLower.includes('coluna') || idLower.includes('montante') || normAngle === 90 || normAngle === 270) {
    category = 'coluna';
    basePriority = 80;
  } else if (idLower.includes('travessa') || normAngle === 0 || normAngle === 180) {
    category = 'travessa';
    basePriority = 60;
  } else if (idLower.includes('autofill') || idLower.includes('preenchimento')) {
    category = 'preenchimento';
    basePriority = 20;
  } else if (idLower.includes('diagonal') || (normAngle !== 0 && normAngle !== 90 && normAngle !== 180 && normAngle !== 270)) {
    category = 'diagonal';
    basePriority = 40;
  } else if (idLower.includes('reforco') || idLower.includes('gusset')) {
    category = 'reforco';
    basePriority = 10;
  }

  const mode: FabricationInterruptionMode = (line as any).fabricationMode || defaultMode;

  // Deterministic tie-breaker independent of draw order (based on length and spatial coordinate)
  const len = line.lengthMm || Math.round(Math.hypot(line.x2 - line.x1, line.y2 - line.y1));
  const minCoord = Math.min(line.x1, line.x2) + Math.min(line.y1, line.y2) * 0.0001;
  const tieBreaker = (len / 100000) + (minCoord / 10000000);

  let finalPriority = basePriority + tieBreaker;
  if (mode === 'continuo') {
    finalPriority += 1000;
  }

  return { category, priority: finalPriority, mode };
}

/**
 * Merge contiguous collinear segments sharing profile/type to establish base structural intention
 */
export function mergeCollinearSegments(lines: FreeDrawingLine[]): FreeDrawingLine[] {
  if (!lines || lines.length <= 1) return lines || [];

  const current = lines.map(l => ({ ...l }));
  let mergedAny = true;

  while (mergedAny) {
    mergedAny = false;
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i];
        const b = current[j];

        if (a.profile !== b.profile) continue;

        const dxA = a.x2 - a.x1, dyA = a.y2 - a.y1;
        const dxB = b.x2 - b.x1, dyB = b.y2 - b.y1;
        const lenA = Math.hypot(dxA, dyA);
        const lenB = Math.hypot(dxB, dyB);

        if (lenA < 5 || lenB < 5) continue;

        // Check if directions are parallel
        const cross = (dxA * dyB - dyA * dxB) / (lenA * lenB);
        if (Math.abs(cross) > 0.02) continue;

        // Check endpoint touch
        const touches = (
          (Math.abs(a.x2 - b.x1) < 5 && Math.abs(a.y2 - b.y1) < 5) ||
          (Math.abs(a.x1 - b.x2) < 5 && Math.abs(a.y1 - b.y2) < 5) ||
          (Math.abs(a.x2 - b.x2) < 5 && Math.abs(a.y2 - b.y2) < 5) ||
          (Math.abs(a.x1 - b.x1) < 5 && Math.abs(a.y1 - b.y1) < 5)
        );

        if (touches) {
          const points = [
            { x: a.x1, y: a.y1 },
            { x: a.x2, y: a.y2 },
            { x: b.x1, y: b.y1 },
            { x: b.x2, y: b.y2 }
          ];

          let maxDist = -1;
          let pStart = points[0], pEnd = points[1];

          for (let p1 = 0; p1 < points.length; p1++) {
            for (let p2 = p1 + 1; p2 < points.length; p2++) {
              const d = Math.hypot(points[p2].x - points[p1].x, points[p2].y - points[p1].y);
              if (d > maxDist) {
                maxDist = d;
                pStart = points[p1];
                pEnd = points[p2];
              }
            }
          }

          if (Math.abs(maxDist - (lenA + lenB)) < 10) {
            const mergedLine: FreeDrawingLine = {
              id: a.id.includes('base_') ? a.id : `base_${a.id.split('_')[0]}`,
              x1: pStart.x,
              y1: pStart.y,
              x2: pEnd.x,
              y2: pEnd.y,
              lengthMm: Math.round(maxDist),
              angleDeg: a.angleDeg,
              profile: a.profile,
              color: a.color
            };

            current.splice(j, 1);
            current[i] = mergedLine;
            mergedAny = true;
            break;
          }
        }
      }
      if (mergedAny) break;
    }
  }

  return current;
}

/**
 * 1. FASE 1: Builds structural fabrication model from drawing lines
 */
export function buildFabricationModel(
  lines: FreeDrawingLine[],
  mode: FabricationInterruptionMode = 'interromper'
): FabricationModel {
  const baseLines = mergeCollinearSegments(lines);

  const pieces: FabricationPiece[] = baseLines.map((l) => {
    const { category, priority, mode: pieceMode } = determinePieceCategoryAndPriority(l, mode);
    const len = l.lengthMm || Math.round(Math.hypot(l.x2 - l.x1, l.y2 - l.y1));
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const angle = l.angleDeg ?? Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

    return {
      id: l.id,
      originalLineId: l.id,
      profile: l.profile || 'Metalon 30x30',
      color: l.color,
      startPoint: { x: l.x1, y: l.y1 },
      endPoint: { x: l.x2, y: l.y2 },
      lengthMm: len,
      angleDeg: angle,
      category,
      fabricationMode: pieceMode,
      priority,
      cutAngles: { startAngleDeg: 90, endAngleDeg: 90 }
    };
  });

  return {
    pieces,
    intersections: [],
    ruleDecisions: [],
    mode,
    isValid: true,
    notes: ['Modelo estrutural de fabricação criado com sucesso.']
  };
}

/**
 * 2. FASE 2: Calculates all global physical intersections between pieces
 */
export function calculateIntersections(model: FabricationModel): FabricationModel {
  const pieces = model.pieces;
  const intersections: FabricationIntersection[] = [];

  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const pA = pieces[i];
      const pB = pieces[j];

      const x1 = pA.startPoint.x, y1 = pA.startPoint.y, x2 = pA.endPoint.x, y2 = pA.endPoint.y;
      const ox1 = pB.startPoint.x, oy1 = pB.startPoint.y, ox2 = pB.endPoint.x, oy2 = pB.endPoint.y;

      const denom = (x1 - x2) * (oy1 - oy2) - (y1 - y2) * (ox1 - ox2);
      if (Math.abs(denom) < 0.0001) continue;

      const t = ((x1 - ox1) * (oy1 - oy2) - (y1 - oy1) * (ox1 - ox2)) / denom;
      const u = ((x1 - ox1) * (y1 - y2) - (y1 - oy1) * (x1 - x2)) / denom;

      if (t >= -0.01 && t <= 1.01 && u >= -0.01 && u <= 1.01) {
        const ix = x1 + t * (x2 - x1);
        const iy = y1 + t * (y2 - y1);

        const isAtAEndpoint = (t <= 0.01 || t >= 0.99);
        const isAtBEndpoint = (u <= 0.01 || u >= 0.99);

        let intersectionType: 'cross' | 't_junction' | 'corner' = 'cross';
        if (isAtAEndpoint && isAtBEndpoint) {
          intersectionType = 'corner';
        } else if (isAtAEndpoint || isAtBEndpoint) {
          intersectionType = 't_junction';
        } else {
          intersectionType = 'cross';
        }

        intersections.push({
          id: `inter_${pA.id}_${pB.id}_${Math.round(ix)}_${Math.round(iy)}`,
          primaryPieceId: pA.id,
          secondaryPieceId: pB.id,
          point: { x: Math.round(ix), y: Math.round(iy) },
          tA: t,
          tB: u,
          intersectionType
        });
      }
    }
  }

  return {
    ...model,
    intersections,
    notes: [...model.notes, `Detecção global concluiu ${intersections.length} interseções.`]
  };
}

/**
 * 3. FASE 3: Applies centralized fabrication rules
 */
export function applyFabricationRules(model: FabricationModel): FabricationModel {
  const piecesMap = new Map<string, FabricationPiece>();
  model.pieces.forEach(p => piecesMap.set(p.id, p));

  const ruleDecisions: FabricationRuleDecision[] = [];

  for (const inter of model.intersections) {
    const pA = piecesMap.get(inter.primaryPieceId);
    const pB = piecesMap.get(inter.secondaryPieceId);

    if (!pA || !pB) continue;

    if (inter.intersectionType === 'corner') {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: null,
        splitParam: 0,
        reason: 'Corner connection: endpoints touch'
      });
      continue;
    }

    if (inter.intersectionType === 't_junction') {
      const isAtAEndpoint = inter.tA <= 0.01 || inter.tA >= 0.99;

      const stemPiece = isAtAEndpoint ? pA : pB;
      const crossbarPiece = isAtAEndpoint ? pB : pA;
      const crossbarParam = isAtAEndpoint ? inter.tB : inter.tA;

      if (crossbarPiece.fabricationMode === 'continuo' && stemPiece.fabricationMode === 'interromper') {
        ruleDecisions.push({
          intersectionId: inter.id,
          pieceAId: pA.id,
          pieceBId: pB.id,
          interruptedPieceId: null,
          splitParam: 0,
          reason: 'T-junction: Crossbar is continuous'
        });
      } else if (stemPiece.fabricationMode === 'continuo' && crossbarPiece.fabricationMode === 'interromper') {
        ruleDecisions.push({
          intersectionId: inter.id,
          pieceAId: pA.id,
          pieceBId: pB.id,
          interruptedPieceId: crossbarPiece.id,
          splitParam: crossbarParam,
          reason: 'T-junction: Stem is continuous, crossbar interrupted'
        });
      } else {
        if (stemPiece.priority > crossbarPiece.priority) {
          ruleDecisions.push({
            intersectionId: inter.id,
            pieceAId: pA.id,
            pieceBId: pB.id,
            interruptedPieceId: crossbarPiece.id,
            splitParam: crossbarParam,
            reason: `T-junction: Stem (${stemPiece.category}) priority > Crossbar (${crossbarPiece.category})`
          });
        } else {
          ruleDecisions.push({
            intersectionId: inter.id,
            pieceAId: pA.id,
            pieceBId: pB.id,
            interruptedPieceId: null,
            splitParam: 0,
            reason: `T-junction: Crossbar (${crossbarPiece.category}) priority >= Stem (${stemPiece.category})`
          });
        }
      }
      continue;
    }

    // Cross Intersection
    if (pA.fabricationMode === 'continuo' && pB.fabricationMode === 'continuo') {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: null,
        splitParam: 0,
        reason: 'Cross: Both pieces are continuous'
      });
      continue;
    }

    if (pA.fabricationMode === 'continuo' && pB.fabricationMode === 'interromper') {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: pB.id,
        splitParam: inter.tB,
        reason: 'Cross: Piece A is continuous, Piece B is interrupted'
      });
      continue;
    }

    if (pB.fabricationMode === 'continuo' && pA.fabricationMode === 'interromper') {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: pA.id,
        splitParam: inter.tA,
        reason: 'Cross: Piece B is continuous, Piece A is interrupted'
      });
      continue;
    }

    // Both in 'interromper' mode: compare priority
    if (pA.priority > pB.priority) {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: pB.id,
        splitParam: inter.tB,
        reason: `Cross: Piece A (${pA.category}) priority > Piece B (${pB.category})`
      });
    } else {
      ruleDecisions.push({
        intersectionId: inter.id,
        pieceAId: pA.id,
        pieceBId: pB.id,
        interruptedPieceId: pA.id,
        splitParam: inter.tA,
        reason: `Cross: Piece B (${pB.category}) priority >= Piece A (${pA.category})`
      });
    }
  }

  return {
    ...model,
    ruleDecisions,
    notes: [...model.notes, `Motor de regras aplicou ${ruleDecisions.length} decisões.`]
  };
}

/**
 * 4. FASE 4: Generates final physical pieces for manufacturing
 */
export function generateFinalPieces(model: FabricationModel): FreeDrawingLine[] {
  const splitsMap = new Map<string, number[]>();

  for (const dec of model.ruleDecisions) {
    if (dec.interruptedPieceId && dec.splitParam > 0.01 && dec.splitParam < 0.99) {
      if (!splitsMap.has(dec.interruptedPieceId)) {
        splitsMap.set(dec.interruptedPieceId, []);
      }
      splitsMap.get(dec.interruptedPieceId)!.push(dec.splitParam);
    }
  }

  const finalLines: FreeDrawingLine[] = [];

  for (const p of model.pieces) {
    const rawSplits = splitsMap.get(p.id) || [];

    if (rawSplits.length === 0) {
      finalLines.push({
        id: p.id,
        x1: p.startPoint.x,
        y1: p.startPoint.y,
        x2: p.endPoint.x,
        y2: p.endPoint.y,
        lengthMm: p.lengthMm,
        angleDeg: p.angleDeg,
        profile: p.profile,
        color: p.color || '#10b981'
      });
      continue;
    }

    rawSplits.sort((a, b) => a - b);
    const sortedSplits: number[] = [];
    for (const t of rawSplits) {
      if (sortedSplits.length === 0 || t - sortedSplits[sortedSplits.length - 1] > 0.005) {
        sortedSplits.push(t);
      }
    }

    const points = [
      { x: p.startPoint.x, y: p.startPoint.y },
      ...sortedSplits.map(t => ({
        x: Math.round(p.startPoint.x + t * (p.endPoint.x - p.startPoint.x)),
        y: Math.round(p.startPoint.y + t * (p.endPoint.y - p.startPoint.y))
      })),
      { x: p.endPoint.x, y: p.endPoint.y }
    ];

    for (let k = 0; k < points.length - 1; k++) {
      const ptA = points[k];
      const ptB = points[k + 1];
      const segLen = Math.round(Math.hypot(ptB.x - ptA.x, ptB.y - ptA.y));

      if (segLen >= 10) {
        finalLines.push({
          id: `${p.originalLineId}_seg_${k}_${Math.random().toString(36).substring(2, 6)}`,
          x1: ptA.x,
          y1: ptA.y,
          x2: ptB.x,
          y2: ptB.y,
          lengthMm: segLen,
          angleDeg: p.angleDeg,
          profile: p.profile,
          color: p.color || '#10b981'
        });
      }
    }
  }

  return finalLines;
}

/**
 * FASE 8: Internal Consistency Validation (ET-011.3)
 * Validates output for duplicate segments, zero-lengths, microsegments (< 10mm), duplicate IDs, and NaN coordinates.
 */
export function validateFabricationOutput(lines: FreeDrawingLine[]): { validLines: FreeDrawingLine[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!lines || lines.length === 0) return { validLines: [], warnings };

  const seenIds = new Set<string>();
  const seenGeo = new Set<string>();
  const validLines: FreeDrawingLine[] = [];

  for (const line of lines) {
    // 1. Invalid coordinates / NaN
    if (isNaN(line.x1) || isNaN(line.y1) || isNaN(line.x2) || isNaN(line.y2)) {
      warnings.push(`[ET-011.3] Removida peça com coordenadas inválidas (NaN): ${line.id}`);
      continue;
    }

    // 2. Zero length or < 1mm
    const len = line.lengthMm ?? Math.round(Math.hypot(line.x2 - line.x1, line.y2 - line.y1));
    if (len < 1) {
      warnings.push(`[ET-011.3] Removida peça com comprimento nulo (${len}mm): ${line.id}`);
      continue;
    }

    // 3. Microsegment (< 10mm)
    if (len < 10) {
      warnings.push(`[ET-011.3] Removido microsegmento menor que 10mm (${len}mm): ${line.id}`);
      continue;
    }

    // 4. Duplicate IDs
    let uniqueId = line.id;
    if (seenIds.has(uniqueId)) {
      warnings.push(`[ET-011.3] Resolvido ID duplicado: ${uniqueId}`);
      uniqueId = `${uniqueId}_dup_${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(uniqueId);

    // 5. Duplicate geometry (same start & end points)
    const pA = `${Math.round(line.x1)},${Math.round(line.y1)}`;
    const pB = `${Math.round(line.x2)},${Math.round(line.y2)}`;
    const geoKey = pA < pB ? `${pA}-${pB}` : `${pB}-${pA}`;

    if (seenGeo.has(geoKey)) {
      warnings.push(`[ET-011.3] Removido segmento duplicado sobreposto: ${geoKey}`);
      continue;
    }
    seenGeo.add(geoKey);

    validLines.push({
      ...line,
      id: uniqueId,
      lengthMm: len
    });
  }

  if (warnings.length > 0 && typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    warnings.forEach(w => console.warn(w));
  }

  return { validLines, warnings };
}

/**
 * Main Master Universal Fabrication Engine Execution Entrypoint
 */
export function processFabricationModel(
  lines: FreeDrawingLine[],
  mode: FabricationInterruptionMode = 'interromper'
): FreeDrawingLine[] {
  if (!lines || lines.length <= 1) return lines || [];

  const m1 = buildFabricationModel(lines, mode);
  const m2 = calculateIntersections(m1);
  const m3 = applyFabricationRules(m2);
  const generatedLines = generateFinalPieces(m3);

  const { validLines } = validateFabricationOutput(generatedLines);
  return validLines;
}

export interface HomologationTestReport {
  id: string;
  name: string;
  description: string;
  status: '✅ Aprovado' | '⚠ Alerta' | '❌ Reprovado';
  expectedPieces: number;
  actualPieces: number;
  orderIndependent: boolean;
  zeroLengthCount: number;
  microsegmentCount: number;
  duplicateIdCount: number;
  notes: string;
}

export interface HomologationSuiteResult {
  totalTests: number;
  passCount: number;
  warningCount: number;
  failCount: number;
  reliabilityIndex: number;
  classification: 'Experimental' | 'Estável' | 'Homologado' | 'Certificado';
  reports: HomologationTestReport[];
}

/**
 * SUÍTE OFICIAL DE HOMOLOGAÇÃO ESTRUTURAL DO NÚCLEO (ET-012.1)
 * Testes TESTE-001 a TESTE-010 com validação de ordem, interseção, integridade e renderização.
 */
export function runHomologationSuite(): HomologationSuiteResult {
  const reports: HomologationTestReport[] = [];
  const defaultProf = 'Metalon 30x30';

  // Helper frame builder (1200 x 2000)
  const getBaseFrame = (): FreeDrawingLine[] => [
    { id: 'frame_top', x1: 0, y1: 0, x2: 1200, y2: 0, lengthMm: 1200, angleDeg: 0, profile: defaultProf },
    { id: 'frame_bottom', x1: 0, y1: 2000, x2: 1200, y2: 2000, lengthMm: 1200, angleDeg: 0, profile: defaultProf },
    { id: 'frame_left', x1: 0, y1: 0, x2: 0, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'frame_right', x1: 1200, y1: 0, x2: 1200, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf }
  ];

  const evaluateTest = (
    id: string,
    name: string,
    description: string,
    inputLines: FreeDrawingLine[],
    expectedPiecesCount: number
  ): HomologationTestReport => {
    // Direct order
    const directRes = processFabricationModel(inputLines, 'interromper');
    // Inverted order (Reverse)
    const reversedInput = [...inputLines].reverse();
    const reverseRes = processFabricationModel(reversedInput, 'interromper');

    // Check order independence
    const orderIndependent = directRes.length === reverseRes.length;

    // Check anomalies
    const zeroLengthCount = directRes.filter(l => (l.lengthMm || 0) < 1).length;
    const microsegmentCount = directRes.filter(l => (l.lengthMm || 0) >= 1 && (l.lengthMm || 0) < 10).length;
    
    const ids = directRes.map(l => l.id);
    const uniqueIds = new Set(ids);
    const duplicateIdCount = ids.length - uniqueIds.size;

    const isMatch = directRes.length === expectedPiecesCount && orderIndependent && zeroLengthCount === 0 && duplicateIdCount === 0;

    let status: '✅ Aprovado' | '⚠ Alerta' | '❌ Reprovado' = '✅ Aprovado';
    let notes = 'Todas as verificações de integridade estrutural e ordem foram concluídas com sucesso.';

    if (!isMatch) {
      if (Math.abs(directRes.length - expectedPiecesCount) <= 1 && orderIndependent) {
        status = '⚠ Alerta';
        notes = `Contagem de peças (${directRes.length}) ligeiramente diferente do esperado (${expectedPiecesCount}), mas ordem preservada.`;
      } else {
        status = '❌ Reprovado';
        notes = `Inconsistência na contagem ou independência de ordem falhou.`;
      }
    }

    return {
      id,
      name,
      description,
      status,
      expectedPieces: expectedPiecesCount,
      actualPieces: directRes.length,
      orderIndependent,
      zeroLengthCount,
      microsegmentCount,
      duplicateIdCount,
      notes
    };
  };

  // TESTE-001: Quadro simples
  reports.push(evaluateTest(
    'TESTE-001',
    'Quadro Simples',
    'Estrutura periférica básica com 4 barras de contorno',
    getBaseFrame(),
    4
  ));

  // TESTE-002: Quadro + travessa
  const t2 = [
    ...getBaseFrame(),
    { id: 'travessa_1', x1: 0, y1: 1000, x2: 1200, y2: 1000, lengthMm: 1200, angleDeg: 0, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-002',
    'Quadro + Travessa',
    'Quadro periférico com 1 travessa horizontal central',
    t2,
    5
  ));

  // TESTE-003: Quadro + coluna
  const t3 = [
    ...getBaseFrame(),
    { id: 'coluna_1', x1: 600, y1: 0, x2: 600, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-003',
    'Quadro + Coluna',
    'Quadro periférico com 1 coluna vertical central',
    t3,
    5
  ));

  // TESTE-004: Quadro + travessa + coluna
  const t4 = [
    ...getBaseFrame(),
    { id: 'coluna_1', x1: 600, y1: 0, x2: 600, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'travessa_1', x1: 0, y1: 1000, x2: 1200, y2: 1000, lengthMm: 1200, angleDeg: 0, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-004',
    'Quadro + Travessa + Coluna',
    'Interseção central em cruz (coluna contínua priorizada sobre travessa)',
    t4,
    7
  ));

  // TESTE-005: Quadro + diagonal
  const t5 = [
    ...getBaseFrame(),
    { id: 'diagonal_1', x1: 0, y1: 0, x2: 1200, y2: 2000, lengthMm: 2332, angleDeg: 59, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-005',
    'Quadro + Diagonal',
    'Quadro periférico com 1 diagonal de travamento estático',
    t5,
    5
  ));

  // TESTE-006: Quadro + duas diagonais
  const t6 = [
    ...getBaseFrame(),
    { id: 'diagonal_1', x1: 0, y1: 0, x2: 1200, y2: 2000, lengthMm: 2332, angleDeg: 59, profile: defaultProf },
    { id: 'diagonal_2', x1: 1200, y1: 0, x2: 0, y2: 2000, lengthMm: 2332, angleDeg: 121, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-006',
    'Quadro + Duas Diagonais',
    'Diagonais cruzadas em X com desmembramento determinístico no centro',
    t6,
    7
  ));

  // TESTE-007: Quadro + reforços
  const t7 = [
    ...getBaseFrame(),
    { id: 'reforco_TL', x1: 300, y1: 0, x2: 0, y2: 300, lengthMm: 424, angleDeg: 135, profile: defaultProf },
    { id: 'reforco_TR', x1: 900, y1: 0, x2: 1200, y2: 300, lengthMm: 424, angleDeg: 45, profile: defaultProf },
    { id: 'reforco_BR', x1: 900, y1: 2000, x2: 1200, y2: 1700, lengthMm: 424, angleDeg: 315, profile: defaultProf },
    { id: 'reforco_BL', x1: 300, y1: 2000, x2: 0, y2: 1700, lengthMm: 424, angleDeg: 225, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-007',
    'Quadro + Reforços',
    'Quadro com 4 gussets de canto em ligações de mão-de-força',
    t7,
    8
  ));

  // TESTE-008: Quadro + preenchimento vertical
  const t8 = [
    ...getBaseFrame(),
    { id: 'autofill_v1', x1: 300, y1: 0, x2: 300, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'autofill_v2', x1: 600, y1: 0, x2: 600, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'autofill_v3', x1: 900, y1: 0, x2: 900, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-008',
    'Quadro + Preenchimento Vertical',
    'Preenchimento de gradil com 3 montantes paralelos',
    t8,
    7
  ));

  // TESTE-009: Quadro + preenchimento horizontal
  const t9 = [
    ...getBaseFrame(),
    { id: 'autofill_h1', x1: 0, y1: 500, x2: 1200, y2: 500, lengthMm: 1200, angleDeg: 0, profile: defaultProf },
    { id: 'autofill_h2', x1: 0, y1: 1000, x2: 1200, y2: 1000, lengthMm: 1200, angleDeg: 0, profile: defaultProf },
    { id: 'autofill_h3', x1: 0, y1: 1500, x2: 1200, y2: 1500, lengthMm: 1200, angleDeg: 0, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-009',
    'Quadro + Preenchimento Horizontal',
    'Preenchimento de gradil com 3 travessas paralelas',
    t9,
    7
  ));

  // TESTE-010: Quadro + preenchimento misto
  const t10 = [
    ...getBaseFrame(),
    { id: 'coluna_v1', x1: 400, y1: 0, x2: 400, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'coluna_v2', x1: 800, y1: 0, x2: 800, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: defaultProf },
    { id: 'travessa_h1', x1: 0, y1: 666, x2: 1200, y2: 666, lengthMm: 1200, angleDeg: 0, profile: defaultProf },
    { id: 'travessa_h2', x1: 0, y1: 1333, x2: 1200, y2: 1333, lengthMm: 1200, angleDeg: 0, profile: defaultProf }
  ];
  reports.push(evaluateTest(
    'TESTE-010',
    'Quadro + Preenchimento Misto',
    'Grade bidirecional de 2 montantes e 2 travessas (4 interseções internas em cruz)',
    t10,
    12
  ));

  const totalTests = reports.length;
  const passCount = reports.filter(r => r.status === '✅ Aprovado').length;
  const warningCount = reports.filter(r => r.status === '⚠ Alerta').length;
  const failCount = reports.filter(r => r.status === '❌ Reprovado').length;

  const reliabilityIndex = Math.round((passCount / totalTests) * 100);

  let classification: 'Experimental' | 'Estável' | 'Homologado' | 'Certificado' = 'Certificado';
  if (reliabilityIndex < 60) classification = 'Experimental';
  else if (reliabilityIndex < 85) classification = 'Estável';
  else if (reliabilityIndex < 100) classification = 'Homologado';
  else classification = 'Certificado';

  return {
    totalTests,
    passCount,
    warningCount,
    failCount,
    reliabilityIndex,
    classification,
    reports
  };
}

/**
 * Legacy test validation function
 */
export function runFabricationEngineValidationTests(): { success: boolean; results: string[] } {
  const suite = runHomologationSuite();
  return {
    success: suite.reliabilityIndex === 100,
    results: suite.reports.map(r => `${r.status} ${r.id}: ${r.name} (${r.actualPieces}/${r.expectedPieces} peças) - ${r.notes}`)
  };
}

