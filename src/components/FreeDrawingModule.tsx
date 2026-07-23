/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Spline, 
  Hand, 
  Eraser, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Save, 
  Box, 
  Layers, 
  Sparkles, 
  Compass, 
  Check, 
  Plus, 
  RotateCcw, 
  Info,
  Grid,
  CheckCircle2,
  Copy,
  DoorOpen,
  X,
  Wrench
} from 'lucide-react';
import { MetalProject, FreeDrawingLine, FreeDrawingData, MaterialProfile } from '../types';
import { getMaterialProfiles } from '../utils/materialsStore';

interface FreeDrawingModuleProps {
  project: MetalProject | null;
  onUpdateProject?: (updatedProject: MetalProject) => void;
}

export type DrawingTool = 
  | 'select' 
  | 'line' 
  | 'rectangle' 
  | 'square' 
  | 'polyline' 
  | 'pan' 
  | 'eraser';

export const FreeDrawingModule: React.FC<FreeDrawingModuleProps> = ({
  project,
  onUpdateProject
}) => {
  // Available material profiles
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([]);
  const [defaultProfile, setDefaultProfile] = useState<string>('Metalon 30x30');

  useEffect(() => {
    const profs = getMaterialProfiles();
    setMaterialProfiles(profs);
    if (profs.length > 0 && !defaultProfile) {
      setDefaultProfile(profs[0].name);
    }
  }, []);

  // Active Tool - Defaults to 'select' per UX requirements
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState<boolean>(false);

  // Drawing State
  const [lines, setLines] = useState<FreeDrawingLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = useState<FreeDrawingLine[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.35); // Scale factor (1mm = zoom px)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 300, y: 250 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Grid & Snap toggles
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSizeMm, setGridSizeMm] = useState<number>(50);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);

  // Active Drawing Interactions
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentCursor, setCurrentCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number } | null>(null);
  const [polylinePoints, setPolylinePoints] = useState<{ x: number; y: number }[]>([]);

  // Dragging Endpoints or Lines
  const [dragState, setDragState] = useState<{
    lineId: string;
    endpoint: 'p1' | 'p2' | 'whole';
    startMouseMm: { x: number; y: number };
    initialLine: FreeDrawingLine;
  } | null>(null);

  // Inspector Edit Inputs for Selected Line
  const [editLengthInput, setEditLengthInput] = useState<string>('');
  const [editAngleInput, setEditAngleInput] = useState<string>('');
  const [editProfileInput, setEditProfileInput] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastDrawingHash = useRef<string>('');

  // Auto-center and fit drawing to screen
  const handleCenterView = useCallback((linesToFit?: FreeDrawingLine[]) => {
    const targetLines = linesToFit || lines;
    if (!targetLines || targetLines.length === 0) {
      setZoom(0.35);
      setPan({ x: 300, y: 250 });
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    targetLines.forEach(l => {
      minX = Math.min(minX, l.x1, l.x2);
      maxX = Math.max(maxX, l.x1, l.x2);
      minY = Math.min(minY, l.y1, l.y2);
      maxY = Math.max(maxY, l.y1, l.y2);
    });

    const width = (maxX - minX) || 500;
    const height = (maxY - minY) || 500;

    let rectWidth = 800;
    let rectHeight = 600;

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      if (rect.width > 50) rectWidth = rect.width;
      if (rect.height > 50) rectHeight = rect.height;
    }

    // Padded target size (leaving ~25% margin around geometry for comfortable view)
    const marginRatio = 1.25;
    const scaleX = rectWidth / (width * marginRatio);
    const scaleY = rectHeight / (height * marginRatio);
    const newZoom = Math.max(0.05, Math.min(2.5, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = rectWidth / 2 - centerX * newZoom;
    const newPanY = rectHeight / 2 - centerY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [lines]);

  // Load project's drawing on mount or project change
  useEffect(() => {
    let loadedLines: FreeDrawingLine[] = [];

    if (project?.freeDrawing?.lines && project.freeDrawing.lines.length > 0) {
      loadedLines = project.freeDrawing.lines;
    } else if (project?.id) {
      // Try local storage backup
      const localBackup = localStorage.getItem(`serralheria_freedraw_${project.id}`);
      if (localBackup) {
        try {
          const parsed: FreeDrawingData = JSON.parse(localBackup);
          if (parsed.lines && parsed.lines.length > 0) {
            loadedLines = parsed.lines;
          }
        } catch (e) {
          console.error('Error parsing local draw backup', e);
        }
      }
    }

    if (loadedLines.length === 0 && project?.id) {
      // Default sample frame if completely empty
      loadedLines = [
        { id: '1', x1: 0, y1: 0, x2: 1200, y2: 0, lengthMm: 1200, angleDeg: 0, profile: 'Metalon 30x30' },
        { id: '2', x1: 1200, y1: 0, x2: 1200, y2: 2000, lengthMm: 2000, angleDeg: 90, profile: 'Metalon 30x30' },
        { id: '3', x1: 1200, y1: 2000, x2: 0, y2: 2000, lengthMm: 1200, angleDeg: 180, profile: 'Metalon 30x30' },
        { id: '4', x1: 0, y1: 2000, x2: 0, y2: 0, lengthMm: 2000, angleDeg: 270, profile: 'Metalon 30x30' }
      ];
    }

    if (loadedLines.length > 0) {
      setLines(loadedLines);
      setHistory([loadedLines]);
      setHistoryIndex(0);

      const currentHash = `${project?.id || ''}_${project?.freeDrawing?.updatedAt || ''}_${loadedLines.length}_${JSON.stringify(loadedLines[0] || {})}`;
      if (currentHash !== lastDrawingHash.current) {
        lastDrawingHash.current = currentHash;
        
        // Auto-center and fit to screen when a structure is generated or project loaded
        requestAnimationFrame(() => {
          setTimeout(() => {
            handleCenterView(loadedLines);
          }, 60);
        });
      }
    }
  }, [project?.id, project?.freeDrawing?.updatedAt, project?.freeDrawing?.lines, handleCenterView]);

  // Save changes helper
  const commitLinesState = useCallback((newLines: FreeDrawingLine[]) => {
    setLines(newLines);

    // Push to undo history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Save to project / localStorage
    const drawData: FreeDrawingData = {
      lines: newLines,
      viewport: { zoom, panX: pan.x, panY: pan.y },
      updatedAt: new Date().toISOString()
    };

    if (project && onUpdateProject) {
      onUpdateProject({
        ...project,
        freeDrawing: drawData
      });
    }

    if (project?.id) {
      localStorage.setItem(`serralheria_freedraw_${project.id}`, JSON.stringify(drawData));
    }
  }, [history, historyIndex, zoom, pan, project, onUpdateProject]);

  // Helper to compute bounds of current structure
  const getStructureBounds = (currentLines: FreeDrawingLine[]) => {
    if (!currentLines || currentLines.length === 0) {
      return { minX: 0, maxX: 1200, minY: 0, maxY: 2000, width: 1200, height: 2000 };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    currentLines.forEach(l => {
      minX = Math.min(minX, l.x1, l.x2);
      maxX = Math.max(maxX, l.x1, l.x2);
      minY = Math.min(minY, l.y1, l.y2);
      maxY = Math.max(maxY, l.y1, l.y2);
    });
    const width = Math.max(200, maxX - minX);
    const height = Math.max(200, maxY - minY);
    return { minX, maxX, minY, maxY, width, height };
  };

  // Workshop piece assembler (➕ Adicionar Peça)
  const handleAddPiece = (pieceType: 'travessa' | 'montante' | 'diagonal' | 'porta' | 'janela' | 'coluna' | 'reforco' | 'barra_livre') => {
    setIsAddPieceModalOpen(false);

    if (pieceType === 'barra_livre') {
      setActiveTool('line');
      setDrawingStart(null);
      return;
    }

    const { minX, maxX, minY, maxY, width, height } = getStructureBounds(lines);
    const now = Date.now();
    let newLinesToAdd: FreeDrawingLine[] = [];

    if (pieceType === 'travessa') {
      // Horizontal crossbar at center height
      const midY = Math.round((minY + maxY) / 2);
      newLinesToAdd.push({
        id: `travessa-${now}`,
        x1: minX,
        y1: midY,
        x2: maxX,
        y2: midY,
        lengthMm: width,
        angleDeg: 0,
        profile: defaultProfile
      });
    } else if (pieceType === 'montante') {
      // Vertical upright at center width
      const midX = Math.round((minX + maxX) / 2);
      newLinesToAdd.push({
        id: `montante-${now}`,
        x1: midX,
        y1: minY,
        x2: midX,
        y2: maxY,
        lengthMm: height,
        angleDeg: 90,
        profile: defaultProfile
      });
    } else if (pieceType === 'diagonal') {
      // Corner to corner brace
      const len = Math.round(Math.sqrt(width * width + height * height));
      const angle = Math.round(Math.atan2(height, width) * (180 / Math.PI));
      newLinesToAdd.push({
        id: `diagonal-${now}`,
        x1: minX,
        y1: minY,
        x2: maxX,
        y2: maxY,
        lengthMm: len,
        angleDeg: angle,
        profile: defaultProfile
      });
    } else if (pieceType === 'coluna') {
      // Vertical column
      const colHeight = height > 500 ? height : 2000;
      newLinesToAdd.push({
        id: `coluna-${now}`,
        x1: minX,
        y1: minY,
        x2: minX,
        y2: minY + colHeight,
        lengthMm: colHeight,
        angleDeg: 90,
        profile: defaultProfile
      });
    } else if (pieceType === 'reforco') {
      // 45° Corner brace
      const size = 300;
      const len = Math.round(size * Math.SQRT2);
      newLinesToAdd.push({
        id: `reforco-${now}`,
        x1: minX + size,
        y1: minY,
        x2: minX,
        y2: minY + size,
        lengthMm: len,
        angleDeg: 135,
        profile: defaultProfile
      });
    } else if (pieceType === 'porta') {
      // Social door sub-frame (800mm x 2000mm)
      const doorW = 800;
      const doorH = 2000;
      const startX = Math.round((minX + maxX) / 2 - doorW / 2);
      const startY = maxY - doorH > minY ? maxY - doorH : minY;

      const p1 = { x: startX, y: startY };
      const p2 = { x: startX + doorW, y: startY };
      const p3 = { x: startX + doorW, y: startY + doorH };
      const p4 = { x: startX, y: startY + doorH };

      newLinesToAdd = [
        { id: `porta-top-${now}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, lengthMm: doorW, angleDeg: 0, profile: defaultProfile },
        { id: `porta-right-${now}`, x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, lengthMm: doorH, angleDeg: 90, profile: defaultProfile },
        { id: `porta-left-${now}`, x1: p4.x, y1: p4.y, x2: p1.x, y2: p1.y, lengthMm: doorH, angleDeg: 90, profile: defaultProfile }
      ];
    } else if (pieceType === 'janela') {
      // Window sub-frame (1000mm x 1000mm)
      const winW = 1000;
      const winH = 1000;
      const startX = Math.round((minX + maxX) / 2 - winW / 2);
      const startY = Math.round((minY + maxY) / 2 - winH / 2);

      const p1 = { x: startX, y: startY };
      const p2 = { x: startX + winW, y: startY };
      const p3 = { x: startX + winW, y: startY + winH };
      const p4 = { x: startX, y: startY + winH };
      const midX = startX + winW / 2;

      newLinesToAdd = [
        { id: `janela-top-${now}`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, lengthMm: winW, angleDeg: 0, profile: defaultProfile },
        { id: `janela-right-${now}`, x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, lengthMm: winH, angleDeg: 90, profile: defaultProfile },
        { id: `janela-bottom-${now}`, x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y, lengthMm: winW, angleDeg: 180, profile: defaultProfile },
        { id: `janela-left-${now}`, x1: p4.x, y1: p4.y, x2: p1.x, y2: p1.y, lengthMm: winH, angleDeg: 270, profile: defaultProfile },
        { id: `janela-mid-${now}`, x1: midX, y1: startY, x2: midX, y2: startY + winH, lengthMm: winH, angleDeg: 90, profile: defaultProfile }
      ];
    }

    if (newLinesToAdd.length > 0) {
      const updated = [...lines, ...newLinesToAdd];
      commitLinesState(updated);
      setSelectedLineId(newLinesToAdd[0].id);
      setActiveTool('select');
      requestAnimationFrame(() => {
        setTimeout(() => handleCenterView(updated), 50);
      });
    }
  };

  // Undo & Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setLines(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setLines(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Convert screen coordinates to world mm coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = screenX - rect.left;
    const clientY = screenY - rect.top;

    const worldX = (clientX - pan.x) / zoom;
    const worldY = (clientY - pan.y) / zoom;

    return { x: worldX, y: worldY };
  }, [zoom, pan]);

  // Find nearest endpoint for Smart Snap
  const findSnapPoint = useCallback((worldPos: { x: number; y: number }) => {
    if (!snapToEndpoints) return { snapped: worldPos, isSnap: false };

    const snapRadiusWorld = 20 / zoom; // 20px threshold in world units
    let closestDist = snapRadiusWorld;
    let snapPos: { x: number; y: number } | null = null;

    // Collect all existing endpoints
    for (const l of lines) {
      const d1 = Math.hypot(l.x1 - worldPos.x, l.y1 - worldPos.y);
      if (d1 < closestDist) {
        closestDist = d1;
        snapPos = { x: l.x1, y: l.y1 };
      }

      const d2 = Math.hypot(l.x2 - worldPos.x, l.y2 - worldPos.y);
      if (d2 < closestDist) {
        closestDist = d2;
        snapPos = { x: l.x2, y: l.y2 };
      }
    }

    // Polyline points snap
    for (const p of polylinePoints) {
      const dp = Math.hypot(p.x - worldPos.x, p.y - worldPos.y);
      if (dp < closestDist) {
        closestDist = dp;
        snapPos = { x: p.x, y: p.y };
      }
    }

    if (snapPos) {
      return { snapped: snapPos, isSnap: true };
    }

    // Grid snap if enabled
    if (snapToGrid) {
      const gx = Math.round(worldPos.x / gridSizeMm) * gridSizeMm;
      const gy = Math.round(worldPos.y / gridSizeMm) * gridSizeMm;
      if (Math.hypot(gx - worldPos.x, gy - worldPos.y) < snapRadiusWorld) {
        return { snapped: { x: gx, y: gy }, isSnap: true };
      }
    }

    return { snapped: worldPos, isSnap: false };
  }, [lines, polylinePoints, snapToEndpoints, snapToGrid, gridSizeMm, zoom]);

  // Helper to calculate distance & angle
  const calculateLineProps = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthMm = Math.round(Math.hypot(dx, dy));
    let angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (angleDeg < 0) angleDeg += 360;
    return { lengthMm, angleDeg };
  };

  // Sync selected line inputs
  const selectedLine = useMemo(() => {
    return lines.find(l => l.id === selectedLineId) || null;
  }, [lines, selectedLineId]);

  useEffect(() => {
    if (selectedLine) {
      setEditLengthInput(selectedLine.lengthMm.toString());
      setEditAngleInput(selectedLine.angleDeg.toString());
      setEditProfileInput(selectedLine.profile || defaultProfile);
    }
  }, [selectedLineId, selectedLine, defaultProfile]);

  // Apply edits from Inspector panel
  const handleApplyLineEdits = () => {
    if (!selectedLine) return;
    const newLen = parseFloat(editLengthInput) || selectedLine.lengthMm;
    const newAngle = parseFloat(editAngleInput) || selectedLine.angleDeg;
    const newProf = editProfileInput || selectedLine.profile;

    const angleRad = (newAngle * Math.PI) / 180;
    const newX2 = selectedLine.x1 + newLen * Math.cos(angleRad);
    const newY2 = selectedLine.y1 + newLen * Math.sin(angleRad);

    const updatedLines = lines.map(l => {
      if (l.id === selectedLine.id) {
        return {
          ...l,
          x2: newX2,
          y2: newY2,
          lengthMm: Math.round(newLen),
          angleDeg: Math.round(newAngle),
          profile: newProf
        };
      }
      return l;
    });

    commitLinesState(updatedLines);
  };

  // Start Pan Helper
  const startPan = useCallback((clientX: number, clientY: number) => {
    setIsPanning(true);
    setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
  }, [pan]);

  // Window-level move & release listeners to prevent pan sticking
  useEffect(() => {
    if (!isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setPan({
          x: e.touches[0].clientX - panStart.x,
          y: e.touches[0].clientY - panStart.y
        });
      }
    };

    const handleWindowMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowMouseUp);
    };
  }, [isPanning, panStart]);

  // Zoom In / Out helpers centered on viewport center
  const handleZoomIn = () => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newZoom = Math.min(5.0, zoom * 1.25);
      const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
      const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(prev => Math.min(5.0, prev * 1.25));
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newZoom = Math.max(0.05, zoom * 0.8);
      const newPanX = centerX - (centerX - pan.x) * (newZoom / zoom);
      const newPanY = centerY - (centerY - pan.y) * (newZoom / zoom);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(prev => Math.max(0.05, prev * 0.8));
    }
  };

  // Canvas Mouse Event Handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'pan' || e.button === 1 || e.buttons === 4) {
      startPan(e.clientX, e.clientY);
      return;
    }

    const { x: rawX, y: rawY } = screenToWorld(e.clientX, e.clientY);
    const { snapped } = findSnapPoint({ x: rawX, y: rawY });

    if (activeTool === 'line') {
      if (!drawingStart) {
        setDrawingStart(snapped);
      } else {
        // Complete line
        const { lengthMm, angleDeg } = calculateLineProps(drawingStart.x, drawingStart.y, snapped.x, snapped.y);
        if (lengthMm > 5) {
          const newLine: FreeDrawingLine = {
            id: Date.now().toString(),
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: snapped.x,
            y2: snapped.y,
            lengthMm,
            angleDeg,
            profile: defaultProfile
          };
          commitLinesState([...lines, newLine]);
          setSelectedLineId(newLine.id);
        }
        setDrawingStart(null);
        setActiveTool('select');
      }
    } else if (activeTool === 'rectangle' || activeTool === 'square') {
      if (!drawingStart) {
        setDrawingStart(snapped);
      } else {
        const dx = snapped.x - drawingStart.x;
        let dy = snapped.y - drawingStart.y;
        if (activeTool === 'square') {
          const side = Math.max(Math.abs(dx), Math.abs(dy));
          dy = (dy >= 0 ? 1 : -1) * side;
        }

        const p1 = { x: drawingStart.x, y: drawingStart.y };
        const p2 = { x: drawingStart.x + (activeTool === 'square' ? (dx >= 0 ? Math.abs(dy) : -Math.abs(dy)) : dx), y: drawingStart.y };
        const p3 = { x: p2.x, y: drawingStart.y + dy };
        const p4 = { x: drawingStart.x, y: p3.y };

        const newShapeLines: FreeDrawingLine[] = [
          { id: `${Date.now()}-1`, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, ...calculateLineProps(p1.x, p1.y, p2.x, p2.y), profile: defaultProfile },
          { id: `${Date.now()}-2`, x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, ...calculateLineProps(p2.x, p2.y, p3.x, p3.y), profile: defaultProfile },
          { id: `${Date.now()}-3`, x1: p3.x, y1: p3.y, x2: p4.x, y2: p4.y, ...calculateLineProps(p3.x, p3.y, p4.x, p4.y), profile: defaultProfile },
          { id: `${Date.now()}-4`, x1: p4.x, y1: p4.y, x2: p1.x, y2: p1.y, ...calculateLineProps(p4.x, p4.y, p1.x, p1.y), profile: defaultProfile }
        ].filter(l => l.lengthMm > 5);

        if (newShapeLines.length > 0) {
          commitLinesState([...lines, ...newShapeLines]);
        }
        setDrawingStart(null);
        setActiveTool('select');
      }
    } else if (activeTool === 'polyline') {
      const newPts = [...polylinePoints, snapped];
      setPolylinePoints(newPts);
      if (newPts.length >= 2) {
        const lastP1 = newPts[newPts.length - 2];
        const lastP2 = newPts[newPts.length - 1];
        const { lengthMm, angleDeg } = calculateLineProps(lastP1.x, lastP1.y, lastP2.x, lastP2.y);
        if (lengthMm > 5) {
          const newLine: FreeDrawingLine = {
            id: Date.now().toString(),
            x1: lastP1.x,
            y1: lastP1.y,
            x2: lastP2.x,
            y2: lastP2.y,
            lengthMm,
            angleDeg,
            profile: defaultProfile
          };
          commitLinesState([...lines, newLine]);
        }
      }
    } else if (activeTool === 'select') {
      // Unselect if clicked empty space
      setSelectedLineId(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (activeTool === 'pan') {
        startPan(touch.clientX, touch.clientY);
        return;
      }
      const { x: rawX, y: rawY } = screenToWorld(touch.clientX, touch.clientY);
      const { snapped } = findSnapPoint({ x: rawX, y: rawY });
      setCurrentCursor(snapped);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const { x: rawX, y: rawY } = screenToWorld(e.clientX, e.clientY);
    const { snapped, isSnap } = findSnapPoint({ x: rawX, y: rawY });

    setCurrentCursor(snapped);
    setSnapIndicator(isSnap ? snapped : null);

    // Endpoint or Line dragging in Select mode
    if (dragState) {
      const deltaX = snapped.x - dragState.startMouseMm.x;
      const deltaY = snapped.y - dragState.startMouseMm.y;

      let updatedX1 = dragState.initialLine.x1;
      let updatedY1 = dragState.initialLine.y1;
      let updatedX2 = dragState.initialLine.x2;
      let updatedY2 = dragState.initialLine.y2;

      if (dragState.endpoint === 'p1') {
        updatedX1 = snapped.x;
        updatedY1 = snapped.y;
      } else if (dragState.endpoint === 'p2') {
        updatedX2 = snapped.x;
        updatedY2 = snapped.y;
      } else if (dragState.endpoint === 'whole') {
        updatedX1 += deltaX;
        updatedY1 += deltaY;
        updatedX2 += deltaX;
        updatedY2 += deltaY;
      }

      const { lengthMm, angleDeg } = calculateLineProps(updatedX1, updatedY1, updatedX2, updatedY2);

      setLines(prev => prev.map(l => {
        if (l.id === dragState.lineId) {
          return {
            ...l,
            x1: updatedX1,
            y1: updatedY1,
            x2: updatedX2,
            y2: updatedY2,
            lengthMm,
            angleDeg
          };
        }
        return l;
      }));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (dragState) {
      commitLinesState(lines);
      setDragState(null);
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.05, Math.min(5.0, zoom * zoomFactor));

    // Zoom centered at cursor
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const newPanX = clientX - (clientX - pan.x) * (newZoom / zoom);
      const newPanY = clientY - (clientY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Line Click in Select / Eraser mode
  const handleLineClick = (e: React.MouseEvent, line: FreeDrawingLine) => {
    if (activeTool === 'pan') {
      // Allow pan to trigger smoothly on canvas when pan tool is active
      return;
    }
    e.stopPropagation();
    if (activeTool === 'eraser') {
      const filtered = lines.filter(l => l.id !== line.id);
      commitLinesState(filtered);
      if (selectedLineId === line.id) setSelectedLineId(null);
    } else if (activeTool === 'select') {
      setSelectedLineId(line.id);
    }
  };

  // Handle Endpoint Drag Start
  const handleEndpointMouseDown = (e: React.MouseEvent, line: FreeDrawingLine, endpoint: 'p1' | 'p2') => {
    if (activeTool === 'pan') {
      return;
    }
    e.stopPropagation();
    if (activeTool === 'select') {
      setSelectedLineId(line.id);
      const { x: rawX, y: rawY } = screenToWorld(e.clientX, e.clientY);
      setDragState({
        lineId: line.id,
        endpoint,
        startMouseMm: { x: rawX, y: rawY },
        initialLine: { ...line }
      });
    }
  };

  // Delete selected line
  const handleDeleteSelected = () => {
    if (!selectedLineId) return;
    const filtered = lines.filter(l => l.id !== selectedLineId);
    commitLinesState(filtered);
    setSelectedLineId(null);
  };

  // Clear All
  const handleClearAll = () => {
    if (confirm('Tem certeza que deseja apagar todo o desenho livre?')) {
      commitLinesState([]);
      setSelectedLineId(null);
      setPolylinePoints([]);
      setDrawingStart(null);
    }
  };

  // Assign profile to all lines
  const handleAssignProfileToAll = (profileName: string) => {
    const updated = lines.map(l => ({ ...l, profile: profileName }));
    commitLinesState(updated);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>ET-009A.1 • Editor de Estruturas</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2.5">
            <span>🛠️ Editor de Estruturas</span>
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Monte e organize estruturas metálicas com encaixe preciso de travessas, montantes, esquadrias e reforços.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-adicionar-peca-header"
            onClick={() => setIsAddPieceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer border border-emerald-300/50"
            title="Adicionar novas peças à estrutura"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>➕ Adicionar Peça</span>
          </button>

          <button
            type="button"
            id="btn-center-view-banner"
            onClick={() => handleCenterView()}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer border border-amber-300/50"
            title="Centralizar e ajustar todo o desenho à tela"
          >
            <Maximize2 className="w-4 h-4 text-slate-950" />
            <span>🎯 Centralizar Desenho</span>
          </button>

          <button
            type="button"
            id="btn-undo-draw"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 transition cursor-pointer"
            title="Desfazer (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="btn-redo-draw"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 transition cursor-pointer"
            title="Refazer (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="btn-clear-draw"
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Tela</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT TOOLBAR & INSPECTOR (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Tool Palette Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            {/* Primary Add Piece Button */}
            <button
              type="button"
              id="btn-adicionar-peca-sidebar"
              onClick={() => setIsAddPieceModalOpen(true)}
              className="w-full mb-3.5 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-700"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>➕ Adicionar Peça</span>
            </button>

            <h3 className="text-xs font-bold uppercase font-mono text-slate-500 tracking-wider mb-3">
              Ferramentas do Editor
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="tool-select"
                onClick={() => { setActiveTool('select'); setDrawingStart(null); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'select'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MousePointer className="w-4 h-4" />
                <span>Selecionar / Mover</span>
              </button>

              <button
                type="button"
                id="tool-line"
                onClick={() => { setActiveTool('line'); setDrawingStart(null); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'line'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Pencil className="w-4 h-4" />
                <span>Desenhar Barra</span>
              </button>

              <button
                type="button"
                id="tool-rectangle"
                onClick={() => { setActiveTool('rectangle'); setDrawingStart(null); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'rectangle'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Square className="w-4 h-4" />
                <span>Retângulo</span>
              </button>

              <button
                type="button"
                id="tool-square"
                onClick={() => { setActiveTool('square'); setDrawingStart(null); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'square'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Square className="w-4 h-4 stroke-[3]" />
                <span>Quadrado</span>
              </button>

              <button
                type="button"
                id="tool-polyline"
                onClick={() => { setActiveTool('polyline'); setDrawingStart(null); setPolylinePoints([]); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'polyline'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Spline className="w-4 h-4" />
                <span>Polilinha</span>
              </button>

              <button
                type="button"
                id="tool-pan"
                onClick={() => { setActiveTool('pan'); setDrawingStart(null); }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  activeTool === 'pan'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>Mover Tela</span>
              </button>

              <button
                type="button"
                id="tool-eraser"
                onClick={() => { setActiveTool('eraser'); setDrawingStart(null); }}
                className={`col-span-2 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                  activeTool === 'eraser'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span>Apagar (Clique na linha)</span>
              </button>
            </div>

            {/* Default Metallic Profile Switcher */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold font-mono text-slate-700 mb-1">
                Perfil Padrão para Novas Linhas:
              </label>
              <select
                value={defaultProfile}
                onChange={(e) => setDefaultProfile(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {materialProfiles.map(p => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.widthMm}x{p.heightMm}mm)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAssignProfileToAll(defaultProfile)}
                className="w-full mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-mono font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Aplicar perfil "{defaultProfile}" a TODAS as linhas</span>
              </button>
            </div>
          </div>

          {/* Line Inspector Card (Shown when a line is selected) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="text-xs font-bold uppercase font-mono text-slate-700 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Propriedades da Linha</span>
              </h3>
              {selectedLine && (
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  ID: {selectedLine.id.slice(-4)}
                </span>
              )}
            </div>

            {selectedLine ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-bold font-mono text-slate-600 mb-1">
                    Comprimento (mm)
                  </label>
                  <input
                    type="number"
                    value={editLengthInput}
                    onChange={(e) => setEditLengthInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold font-mono text-slate-600 mb-1">
                    Ângulo (graus 0° a 360°)
                  </label>
                  <input
                    type="number"
                    value={editAngleInput}
                    onChange={(e) => setEditAngleInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold font-mono text-slate-600 mb-1">
                    Perfil Metálico
                  </label>
                  <select
                    value={editProfileInput}
                    onChange={(e) => setEditProfileInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {materialProfiles.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.widthMm}x{p.heightMm}mm)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyLineEdits}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aplicar Alterações</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                    title="Excluir Linha Selecionada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                <MousePointer className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span>Clique em qualquer linha na área de desenho para editar suas propriedades, comprimento, ângulo e perfil metálico.</span>
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-slate-400 font-bold uppercase">Resumo da Estrutura</span>
              <span className="text-amber-400 font-bold">{lines.length} elemento(s)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300 py-1">
              <span>Metragem Linear Total:</span>
              <span className="font-bold text-white">
                {(lines.reduce((acc, l) => acc + l.lengthMm, 0) / 1000).toFixed(2)} m
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT CANVAS AREA (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl relative overflow-hidden flex flex-col">
          
          {/* Canvas Floating Top Controls */}
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-2 rounded-xl mb-3 flex items-center justify-between flex-wrap gap-2 z-10 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-zoom-in"
                onClick={handleZoomIn}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition cursor-pointer"
                title="Aumentar Zoom (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <span className="text-amber-400 font-bold w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                type="button"
                id="btn-zoom-out"
                onClick={handleZoomOut}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition cursor-pointer"
                title="Diminuir Zoom (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="btn-center-draw-toolbar"
                onClick={() => handleCenterView()}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Centralizar todo o desenho na tela com zoom ideal"
              >
                <Maximize2 className="w-4 h-4 text-slate-950" />
                <span>🎯 Centralizar Desenho</span>
              </button>
            </div>

            {/* Snap & Grid Toggles */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={snapToEndpoints}
                  onChange={(e) => setSnapToEndpoints(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>🎯 Snap Inteligente</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>Grid ({gridSizeMm}mm)</span>
              </label>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative w-full h-[520px] sm:h-[600px] bg-slate-950 rounded-xl overflow-hidden">
            <svg
              ref={svgRef}
              className={`w-full h-full select-none touch-none ${
                activeTool === 'pan' 
                  ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') 
                  : 'cursor-crosshair'
              }`}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* Background Grid Pattern */}
              <defs>
                <pattern
                  id="canvasGrid"
                  width={gridSizeMm * zoom}
                  height={gridSizeMm * zoom}
                  patternUnits="userSpaceOnUse"
                  x={pan.x % (gridSizeMm * zoom)}
                  y={pan.y % (gridSizeMm * zoom)}
                >
                  <path
                    d={`M ${gridSizeMm * zoom} 0 L 0 0 0 ${gridSizeMm * zoom}`}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              <rect width="100%" height="100%" fill="url(#canvasGrid)" />

              {/* Main Transformed Group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Origin Marker (0,0) */}
                <circle cx="0" cy="0" r={6 / zoom} fill="#f59e0b" opacity="0.6" />
                <text x="10" y="-10" fill="#f59e0b" fontSize={12 / zoom} fontFamily="monospace" fontWeight="bold">
                  (0,0)
                </text>

                {/* Render All Saved Lines */}
                {lines.map((line) => {
                  const isSelected = line.id === selectedLineId;
                  const dx = line.x2 - line.x1;
                  const dy = line.y2 - line.y1;
                  const midX = (line.x1 + line.x2) / 2;
                  const midY = (line.y1 + line.y2) / 2;

                  return (
                    <g key={line.id} className="group">
                      {/* Interactive Wide Line for easy clicking */}
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="transparent"
                        strokeWidth={20 / zoom}
                        onClick={(e) => handleLineClick(e, line)}
                        className="cursor-pointer"
                      />

                      {/* Main Visible Metallic Line */}
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                        strokeWidth={(isSelected ? 5 : 3.5) / zoom}
                        strokeLinecap="round"
                      />

                      {/* Line Endpoints */}
                      <circle
                        cx={line.x1}
                        cy={line.y1}
                        r={5 / zoom}
                        fill={isSelected ? '#f59e0b' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={1.5 / zoom}
                        onMouseDown={(e) => handleEndpointMouseDown(e, line, 'p1')}
                        className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      />

                      <circle
                        cx={line.x2}
                        cy={line.y2}
                        r={5 / zoom}
                        fill={isSelected ? '#f59e0b' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={1.5 / zoom}
                        onMouseDown={(e) => handleEndpointMouseDown(e, line, 'p2')}
                        className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      />

                      {/* Measurement Text Label */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-35 / zoom}
                          y={-12 / zoom}
                          width={70 / zoom}
                          height={16 / zoom}
                          fill="#0f172a"
                          rx={3 / zoom}
                          stroke={isSelected ? '#f59e0b' : '#334155'}
                          strokeWidth={1 / zoom}
                        />
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isSelected ? '#fbbf24' : '#e2e8f0'}
                          fontSize={9 / zoom}
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {line.lengthMm}mm, {line.angleDeg}°
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Active Drawing Line Feedback */}
                {drawingStart && (
                  <g>
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={currentCursor.x}
                      y2={currentCursor.y}
                      stroke="#f59e0b"
                      strokeWidth={2.5 / zoom}
                      strokeDasharray="4 4"
                    />
                    <circle cx={drawingStart.x} cy={drawingStart.y} r={6 / zoom} fill="#f59e0b" />
                    <circle cx={currentCursor.x} cy={currentCursor.y} r={6 / zoom} fill="#38bdf8" />
                  </g>
                )}

                {/* Polyline Connected Preview Points */}
                {polylinePoints.length > 0 && (
                  <g>
                    {polylinePoints.map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r={5 / zoom} fill="#a855f7" />
                    ))}
                  </g>
                )}

                {/* Smart Snap Visual Indicator (Bright Blue Halo Dot) */}
                {snapIndicator && (
                  <g className="animate-pulse">
                    <circle
                      cx={snapIndicator.x}
                      cy={snapIndicator.y}
                      r={10 / zoom}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={3 / zoom}
                    />
                    <circle
                      cx={snapIndicator.x}
                      cy={snapIndicator.y}
                      r={4 / zoom}
                      fill="#0284c7"
                    />
                  </g>
                )}

              </g>
            </svg>

            {/* Floating Instructions Overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Dica de Oficina:</span>
              <span>
                {activeTool === 'line' && 'Clique na tela para iniciar e clique no destino para finalizar a linha.'}
                {activeTool === 'rectangle' && 'Clique no primeiro canto e clique no canto oposto para desenhar o retângulo.'}
                {activeTool === 'polyline' && 'Clique sequencialmente para criar linhas conectadas.'}
                {activeTool === 'select' && 'Clique em uma linha para editar suas medidas e perfil metálico.'}
                {activeTool === 'eraser' && 'Clique sobre qualquer linha para removê-la.'}
                {activeTool === 'pan' && 'Arraste com o mouse para navegar pelo desenho.'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ARCHITECTURE PREPARATION FOR FUTURE ET EXPANSIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white mt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm font-mono text-white">
              🔮 Preparação de Arquitetura para Próximas Fases
            </h3>
          </div>
          <span className="bg-slate-800 text-amber-400 border border-slate-700 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
            ET-008B Fundação
          </span>
        </div>

        <p className="text-slate-300 text-xs font-sans leading-relaxed">
          Esta base do Editor de Estruturas armazena todos os vetores, ângulos e perfis metálicos atribuídos. O sistema gera automaticamente a **Lista de Corte**, integração com o **Motor Geométrico**, **Visualização 3D**, **Plano de Corte Otimizado** e **Orçamento Instantâneo** a partir desta montagem.
        </p>
      </div>

      {/* MODAL: ADICIONAR PEÇA À ESTRUTURA */}
      {isAddPieceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold font-display flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <span>Adicionar Peça à Estrutura</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Selecione o elemento metálico para adicionar à montagem
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPieceModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Grid of Workshop Options */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50">
              
              {/* Option 1: Travessa */}
              <button
                type="button"
                id="btn-add-travessa"
                onClick={() => handleAddPiece('travessa')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Travessa</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Barra horizontal de travamento ou sustentação.
                  </p>
                </div>
              </button>

              {/* Option 2: Montante */}
              <button
                type="button"
                id="btn-add-montante"
                onClick={() => handleAddPiece('montante')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Montante</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Barra vertical de apoio, divisão ou reforço.
                  </p>
                </div>
              </button>

              {/* Option 3: Diagonal */}
              <button
                type="button"
                id="btn-add-diagonal"
                onClick={() => handleAddPiece('diagonal')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-sky-100 text-sky-800 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition">
                  <Spline className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Diagonal</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mão-de-força / barra em X para travamento de esquadro.
                  </p>
                </div>
              </button>

              {/* Option 4: Porta Social */}
              <button
                type="button"
                id="btn-add-porta"
                onClick={() => handleAddPiece('porta')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Porta Social</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Sub-quadro para passagem de porta (800x2000mm).
                  </p>
                </div>
              </button>

              {/* Option 5: Janela */}
              <button
                type="button"
                id="btn-add-janela"
                onClick={() => handleAddPiece('janela')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-purple-100 text-purple-800 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Janela</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Caixilho de janela com divisão central (1000x1000mm).
                  </p>
                </div>
              </button>

              {/* Option 6: Coluna */}
              <button
                type="button"
                id="btn-add-coluna"
                onClick={() => handleAddPiece('coluna')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-amber-100 text-amber-900 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Coluna</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pilar vertical estrutural para sustentação.
                  </p>
                </div>
              </button>

              {/* Option 7: Reforço */}
              <button
                type="button"
                id="btn-add-reforco"
                onClick={() => handleAddPiece('reforco')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-rose-100 text-rose-800 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>➕ Reforço</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mão francesa de canto em ângulo de 45°.
                  </p>
                </div>
              </button>

              {/* Option 8: Barra Livre */}
              <button
                type="button"
                id="btn-add-barra-livre"
                onClick={() => handleAddPiece('barra_livre')}
                className="bg-amber-500 hover:bg-amber-400 border border-amber-600 rounded-xl p-4 text-left transition duration-150 flex items-start space-x-3.5 shadow-md cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-slate-950 text-amber-400 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                    <span>➕ Desenhar Barra Livre</span>
                  </h4>
                  <p className="text-xs text-slate-900 mt-1 font-medium">
                    Ativa a ferramenta para desenhar uma barra manualmente com 2 cliques.
                  </p>
                </div>
              </button>

            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Linguagem de Oficina Serralheira
              </span>
              <button
                type="button"
                onClick={() => setIsAddPieceModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
