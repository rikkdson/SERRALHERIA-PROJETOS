/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  FreeDrawingLine, 
  PieceConfig, 
  MetalProject, 
  StructuralPanel, 
  ParametricConstraint, 
  ParametricConstraintType, 
  StructuralFunction,
  PieceType 
} from '../types';
import { getStructureBounds, calculateSegmentLength, calculateAngleDeg } from './geometryEngine';
import { generatePanelFillPreview } from './panelFillEngine';

/**
 * Infer structural function and default constraints for a piece/line if not already set.
 */
export function inferPieceRelationships(line: FreeDrawingLine, bounds?: { width: number; height: number }): {
  structuralFunction: StructuralFunction;
  constraints: ParametricConstraint[];
  dependencies: string[];
} {
  const existingFunc = line.structuralFunction || (line as any).funcaoEstrutural;
  const existingConstraints = line.constraints || (line as any).restricoes;
  const existingDeps = line.dependencies || (line as any).dependencias || [];

  if (existingFunc && existingConstraints && existingConstraints.length > 0) {
    return {
      structuralFunction: existingFunc as StructuralFunction,
      constraints: existingConstraints,
      dependencies: existingDeps
    };
  }

  const nameLower = (line.name || '').toLowerCase();
  const typeLower = (line.type || '').toLowerCase();
  const dx = Math.abs(line.x2 - line.x1);
  const dy = Math.abs(line.y2 - line.y1);
  const isHorizontal = dy < 10;
  const isVertical = dx < 10;

  let func: StructuralFunction = 'perfil_livre';
  const constraints: ParametricConstraint[] = [];
  const dependencies: string[] = ['quadro_principal'];

  if (nameLower.includes('quadro') || nameLower.includes('coluna lateral') || nameLower.includes('viga superior') || typeLower.includes('quadro') || typeLower.includes('folha')) {
    func = nameLower.includes('folha') ? 'quadro_folha' : 'quadro_principal';
    constraints.push({ type: 'vinculado_quadro', description: 'Fixado nas dimensões limite do quadro' });
    constraints.push({ type: 'coincidente', targetId: 'quadro_principal', description: 'Coincidente com vértice principal' });
  } else if (nameLower.includes('porta social') || nameLower.includes('folha social') || nameLower.includes('batente')) {
    func = 'porta_social';
    constraints.push({ type: 'vinculado_folha', description: 'Ancorado à folha do portão' });
    constraints.push({ type: 'alinhado_base', description: 'Mantém alinhamento com a base' });
  } else if (nameLower.includes('travessa') || (isHorizontal && !nameLower.includes('diagonal'))) {
    func = 'travessa_horizontal';
    constraints.push({ type: 'paralelo', targetId: 'quadro_horizontal', description: 'Paralelo às travessas do quadro' });
    constraints.push({ type: 'vinculado_quadro', description: 'Acompanha a largura total do quadro' });
    constraints.push({ type: 'equidistante', description: 'Distribuição proporcional na altura' });
  } else if (nameLower.includes('montante') || nameLower.includes('divisao') || (isVertical && !nameLower.includes('diagonal'))) {
    func = 'montante_vertical';
    constraints.push({ type: 'perpendicular', targetId: 'quadro_horizontal', description: 'Perpendicular às travessas' });
    constraints.push({ type: 'vinculado_quadro', description: 'Acompanha a altura total do quadro' });
    constraints.push({ type: 'equidistante', description: 'Distribuição proporcional na largura' });
  } else if (nameLower.includes('diagonal') || nameLower.includes('contravento') || (!isHorizontal && !isVertical)) {
    func = 'diagonal';
    constraints.push({ type: 'coincidente', targetId: 'quadro_vertices', description: 'Ancorado nos vértices do quadro' });
    constraints.push({ type: 'vinculado_quadro', description: 'Recalcula comprimento e ângulo ao redimensionar' });
  } else if (nameLower.includes('reforco') || nameLower.includes('gusset') || nameLower.includes('mao de força')) {
    func = 'reforco';
    constraints.push({ type: 'coincidente', targetId: 'canto_quadro', description: 'Vinculado às cantoneiras' });
  } else if (line.isPanelFillBar || line.panelId) {
    func = 'preenchimento';
    constraints.push({ type: 'vinculado_quadro', description: 'Ajuste dinâmico por painel' });
    constraints.push({ type: 'paralelo', description: 'Paralelo ao padrão do painel' });
  }

  return {
    structuralFunction: func,
    constraints,
    dependencies
  };
}

/**
 * Solves and recalculates the entire parametric structure when width or height changes.
 */
export function solveParametricStructure(
  lines: FreeDrawingLine[],
  newWidth: number,
  newHeight: number,
  panels: StructuralPanel[] = []
): {
  lines: FreeDrawingLine[];
  pieces: PieceConfig[];
  panels: StructuralPanel[];
} {
  if (!lines || lines.length === 0) {
    return { lines: [], pieces: [], panels: [] };
  }

  const oldBounds = getStructureBounds(lines);
  const oldW = Math.max(10, oldBounds.width);
  const oldH = Math.max(10, oldBounds.height);
  const oldMinX = oldBounds.minX;
  const oldMinY = oldBounds.minY;

  const scaleX = newWidth / oldW;
  const scaleY = newHeight / oldH;

  const updatedLines: FreeDrawingLine[] = lines.map((line, idx) => {
    const relInfo = inferPieceRelationships(line, { width: newWidth, height: newHeight });
    const func = line.structuralFunction || relInfo.structuralFunction;
    const constraints = line.constraints && line.constraints.length > 0 ? line.constraints : relInfo.constraints;
    const parentId = line.parentId || 'quadro_principal';

    // Calculate relative ratios in old bounding box
    const rx1 = (line.x1 - oldMinX) / oldW;
    const ry1 = (line.y1 - oldMinY) / oldH;
    const rx2 = (line.x2 - oldMinX) / oldW;
    const ry2 = (line.y2 - oldMinY) / oldH;

    let nx1 = line.x1;
    let ny1 = line.y1;
    let nx2 = line.x2;
    let ny2 = line.y2;

    const nameLower = (line.name || '').toLowerCase();
    const isHorizontal = Math.abs(line.y1 - line.y2) < 10;
    const isVertical = Math.abs(line.x1 - line.x2) < 10;

    // Check specific constraint handlers
    const isBoundToFrame = constraints.some(c => c.type === 'vinculado_quadro');
    const isBoundToLeaf = constraints.some(c => c.type === 'vinculado_folha');

    if (func === 'quadro_principal' || nameLower.includes('quadro superior') || nameLower.includes('quadro inferior') || nameLower.includes('quadro esquerdo') || nameLower.includes('quadro direito')) {
      // Main Frame perimeter
      if (Math.abs(line.y1 - oldMinY) < 15 && Math.abs(line.y2 - oldMinY) < 15) {
        // Top horizontal beam
        nx1 = oldMinX;
        ny1 = oldMinY;
        nx2 = oldMinX + newWidth;
        ny2 = oldMinY;
      } else if (Math.abs(line.y1 - (oldMinY + oldH)) < 15 && Math.abs(line.y2 - (oldMinY + oldH)) < 15) {
        // Bottom horizontal beam
        nx1 = oldMinX;
        ny1 = oldMinY + newHeight;
        nx2 = oldMinX + newWidth;
        ny2 = oldMinY + newHeight;
      } else if (Math.abs(line.x1 - oldMinX) < 15 && Math.abs(line.x2 - oldMinX) < 15) {
        // Left vertical post
        nx1 = oldMinX;
        ny1 = oldMinY;
        nx2 = oldMinX;
        ny2 = oldMinY + newHeight;
      } else if (Math.abs(line.x1 - (oldMinX + oldW)) < 15 && Math.abs(line.x2 - (oldMinX + oldW)) < 15) {
        // Right vertical post
        nx1 = oldMinX + newWidth;
        ny1 = oldMinY;
        nx2 = oldMinX + newWidth;
        ny2 = oldMinY + newHeight;
      } else {
        // General scaling for other quadro pieces
        nx1 = Math.round(oldMinX + rx1 * newWidth);
        ny1 = Math.round(oldMinY + ry1 * newHeight);
        nx2 = Math.round(oldMinX + rx2 * newWidth);
        ny2 = Math.round(oldMinY + ry2 * newHeight);
      }
    } else if (func === 'travessa_horizontal' || (isHorizontal && isBoundToFrame)) {
      // Horizontal transoms span the new width
      nx1 = oldMinX;
      nx2 = oldMinX + newWidth;
      ny1 = Math.round(oldMinY + ry1 * newHeight);
      ny2 = ny1;
    } else if (func === 'montante_vertical' || (isVertical && isBoundToFrame)) {
      // Vertical mullions reposition proportionally across new width & span full new height
      nx1 = Math.round(oldMinX + rx1 * newWidth);
      nx2 = nx1;
      ny1 = oldMinY;
      ny2 = oldMinY + newHeight;
    } else if (func === 'diagonal') {
      // Diagonals recalculate start and end points at frame corners/ratios
      nx1 = Math.round(oldMinX + rx1 * newWidth);
      ny1 = Math.round(oldMinY + ry1 * newHeight);
      nx2 = Math.round(oldMinX + rx2 * newWidth);
      ny2 = Math.round(oldMinY + ry2 * newHeight);
    } else if (func === 'porta_social' || isBoundToLeaf) {
      // Wicket gate maintains relative anchor ratio and scales
      nx1 = Math.round(oldMinX + rx1 * newWidth);
      ny1 = Math.round(oldMinY + ry1 * newHeight);
      nx2 = Math.round(oldMinX + rx2 * newWidth);
      ny2 = Math.round(oldMinY + ry2 * newHeight);
    } else {
      // General parametric scaling
      nx1 = Math.round(oldMinX + rx1 * newWidth);
      ny1 = Math.round(oldMinY + ry1 * newHeight);
      nx2 = Math.round(oldMinX + rx2 * newWidth);
      ny2 = Math.round(oldMinY + ry2 * newHeight);
    }

    const newLen = calculateSegmentLength(nx1, ny1, nx2, ny2);
    const newAngle = calculateAngleDeg(nx1, ny1, nx2, ny2);

    return {
      ...line,
      parentId,
      structuralFunction: func,
      funcaoEstrutural: func,
      constraints,
      restricoes: constraints,
      dependencies: relInfo.dependencies,
      dependencias: relInfo.dependencies,
      x1: nx1,
      y1: ny1,
      x2: nx2,
      y2: ny2,
      lengthMm: newLen,
      angleDeg: newAngle
    } as FreeDrawingLine;
  });

  // Recalculate Structural Panels if any exist
  const updatedPanels: StructuralPanel[] = panels.map((panel) => {
    // Recalculate panel boundary polygon from new lines
    const panelX1 = Math.round(oldMinX + ((panel.bounds.minX - oldMinX) / oldW) * newWidth);
    const panelY1 = Math.round(oldMinY + ((panel.bounds.minY - oldMinY) / oldH) * newHeight);
    const panelX2 = Math.round(oldMinX + ((panel.bounds.maxX - oldMinX) / oldW) * newWidth);
    const panelY2 = Math.round(oldMinY + ((panel.bounds.maxY - oldMinY) / oldH) * newHeight);

    const newPanelW = Math.max(50, panelX2 - panelX1);
    const newPanelH = Math.max(50, panelY2 - panelY1);

    const updatedPolygon = [
      { x: panelX1, y: panelY1 },
      { x: panelX2, y: panelY1 },
      { x: panelX2, y: panelY2 },
      { x: panelX1, y: panelY2 }
    ];

    const updatedPanel: StructuralPanel = {
      ...panel,
      widthMm: newPanelW,
      heightMm: newPanelH,
      bounds: {
        minX: panelX1,
        minY: panelY1,
        maxX: panelX2,
        maxY: panelY2
      },
      vertices: updatedPolygon
    };

    // Regenerate panel fill bars if configured
    if (updatedPanel.fillConfig) {
      generatePanelFillPreview(updatedPanel, updatedPanel.fillConfig, updatedLines);
    }

    return updatedPanel;
  });

  // Map to PieceConfig list for BOM / Cut List / ObjectManager
  const pieces: PieceConfig[] = updatedLines.map((line, idx) => {
    const isHoriz = Math.abs(line.y1 - line.y2) < 5;
    const pType: PieceType = (line.type as PieceType) || (isHoriz ? 'travessa' : 'divisao_vertical');
    const func = line.structuralFunction || 'perfil_livre';

    return {
      id: line.id || `pc-${idx}-${Date.now()}`,
      name: line.name || `Peça ${idx + 1} (${line.profile || 'Metalon'})`,
      type: pType,
      profile: line.profile || 'Metalon 30x30 mm',
      length: line.lengthMm,
      width: 30,
      height: 30,
      thickness: 1.2,
      posX: Math.min(line.x1, line.x2),
      posY: Math.min(line.y1, line.y2),
      orientation: isHoriz ? 'horizontal' : 'vertical',
      angle: line.angleDeg,
      observations: line.observations || '',
      parentId: line.parentId || 'quadro_principal',
      structuralFunction: func,
      funcaoEstrutural: func,
      dependencies: line.dependencies || ['quadro_principal'],
      dependencias: line.dependencies || ['quadro_principal'],
      constraints: line.constraints || [],
      restricoes: line.constraints || []
    };
  });

  return {
    lines: updatedLines,
    pieces,
    panels: updatedPanels
  };
}
