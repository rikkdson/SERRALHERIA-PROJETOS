/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  MousePointer, 
  Pencil, 
  Hand, 
  Eraser, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Box, 
  Layers, 
  Sparkles, 
  Compass, 
  Check, 
  Plus, 
  Minus,
  Info,
  Grid,
  CheckCircle2,
  DoorOpen,
  X,
  Wrench,
  Ruler,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  MapPin,
  Target,
  Spline,
  Copy,
  Scissors,
  Move,
  Square,
  AlertTriangle
} from 'lucide-react';
import { MetalProject, FreeDrawingLine, FreeDrawingData, MaterialProfile } from '../types';
import { getMaterialProfiles } from '../utils/materialsStore';

interface FreeDrawingModuleProps {
  project: MetalProject | null;
  onUpdateProject?: (updatedProject: MetalProject) => void;
  onNavigateBack?: () => void;
  onCompleteDrawing?: () => void;
}

export type DrawingTool = 
  | 'select' 
  | 'area_select'
  | 'line' 
  | 'rectangle' 
  | 'square' 
  | 'polyline' 
  | 'pan' 
  | 'eraser';

export const FreeDrawingModule: React.FC<FreeDrawingModuleProps> = ({
  project,
  onUpdateProject,
  onNavigateBack,
  onCompleteDrawing
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

  // Onboarding / "Como usar" modal for first-time users ("Seu Zé")
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const helpSeen = localStorage.getItem('mestre_serralheiro_help_seen');
    if (!helpSeen) {
      setIsHelpModalOpen(true);
    }
  }, []);

  const handleDismissHelp = () => {
    localStorage.setItem('mestre_serralheiro_help_seen', 'true');
    setIsHelpModalOpen(false);
  };

  // Toast Feedback Message State (Requirement 10)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Modals for Selected Bar Quick Actions (Requirement 2 & 3)
  const [isEditLengthModalOpen, setIsEditLengthModalOpen] = useState<boolean>(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);

  // Nova Trena Guiada Green Guide Line Reference State (Requirements 4, 5, 6, 7)

  // Confirmation modal for "Voltar"
  const [isBackModalOpen, setIsBackModalOpen] = useState<boolean>(false);

  // Delete confirmation modal state (Rule: Never delete directly without confirmation - Requirement 3)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Smart Piece Creation Configuration Modal States (ET-009B.1)
  const [activeAddPieceType, setActiveAddPieceType] = useState<'travessa' | 'montante' | 'diagonal' | 'porta' | 'janela' | 'reforco' | null>(null);

  // Horizontal Bar Config
  const [horizRef, setHorizRef] = useState<'topo' | 'centro' | 'base'>('centro');
  const [horizDist, setHorizDist] = useState<string>('400');

  // Vertical Bar Config
  const [vertRef, setVertRef] = useState<'esquerda' | 'centro' | 'direita'>('centro');
  const [vertDist, setVertDist] = useState<string>('600');

  // Diagonal Config
  const [diagType, setDiagType] = useState<'BL_TR' | 'TL_BR'>('BL_TR'); // ◢ vs ◣
  const [diagFull, setDiagFull] = useState<boolean>(true);
  const [diagStartOffset, setDiagStartOffset] = useState<string>('0');
  const [diagEndOffset, setDiagEndOffset] = useState<string>('0');

  // Door Config
  const [doorWidth, setDoorWidth] = useState<string>('800');
  const [doorHeight, setDoorHeight] = useState<string>('2000');
  const [doorPos, setDoorPos] = useState<'esquerda' | 'centro' | 'direita'>('centro');
  const [doorOpenDir, setDoorOpenDir] = useState<'esquerda' | 'direita'>('esquerda');

  // Window Config
  const [winWidth, setWinWidth] = useState<string>('1000');
  const [winHeight, setWinHeight] = useState<string>('1000');
  const [winDivs, setWinDivs] = useState<string>('1');

  // Active Tool - Mandatory default is 'select' per ET-009A UX requirement
  const [activeTool, setActiveTool] = useState<DrawingTool>('select');
  const [isAddPieceModalOpen, setIsAddPieceModalOpen] = useState<boolean>(false);

  // Drawing State
  const [lines, setLines] = useState<FreeDrawingLine[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);

  // Selection box state for Area Selection (ET-009C.1)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [clipboardPieces, setClipboardPieces] = useState<FreeDrawingLine[]>([]);

  // Group Action Modals (ET-009C.1)
  const [isGroupMoveModalOpen, setIsGroupMoveModalOpen] = useState<boolean>(false);
  const [groupMoveDist, setGroupMoveDist] = useState<string>('100');
  const [isGroupProfileModalOpen, setIsGroupProfileModalOpen] = useState<boolean>(false);
  const [groupProfileInput, setGroupProfileInput] = useState<string>('');
  const [isGroupDeleteModalOpen, setIsGroupDeleteModalOpen] = useState<boolean>(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<FreeDrawingLine[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.35); // Scale factor (1mm = zoom px)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 300, y: 250 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Helper to estimate piece specs (weight & category)
  const estimatePieceSpecs = useCallback((profileName: string, lengthMm: number) => {
    const prof = materialProfiles.find(p => p.name === profileName);
    const weightPerMeter = prof ? prof.weightPerMeterKg : 2.5;
    const weightKg = ((lengthMm / 1000) * weightPerMeter).toFixed(2);
    return {
      weightKg,
      profileObj: prof,
    };
  }, [materialProfiles]);

  // Grid & Snap toggles
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSizeMm, setGridSizeMm] = useState<number>(50);
  const [snapToEndpoints, setSnapToEndpoints] = useState<boolean>(true);

  // Active Drawing Interactions
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [currentCursor, setCurrentCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapIndicator, setSnapIndicator] = useState<{ x: number; y: number } | null>(null);
  const [polylinePoints, setPolylinePoints] = useState<{ x: number; y: number }[]>([]);

  // Ferramenta "Marcar Distância / Trena" States (ET-009C.1C)
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState<boolean>(false);
  const [distanceStep, setDistanceStep] = useState<'choose_ref' | 'input_dist' | 'choose_piece'>('choose_ref');
  const [trenaRefPoint, setTrenaRefPoint] = useState<'topo' | 'base' | 'esquerda' | 'direita' | 'centro'>('topo');
  const [distanceMmValue, setDistanceMmValue] = useState<string>('400');
  const [guideLineRef, setGuideLineRef] = useState<{ x1: number; y1: number; x2: number; y2: number; type: 'horizontal' | 'vertical' } | null>(null);
  const [distanceMarker, setDistanceMarker] = useState<{ x: number; y: number } | null>(null);
  const [areaCorner1, setAreaCorner1] = useState<{ x: number; y: number } | null>(null);

  // Modo Seleção Inteligente para Celular States (ET-009C.1D)
  const [isSelectionMenuOpen, setIsSelectionMenuOpen] = useState<boolean>(false);
  const [selectionSubMode, setSelectionSubMode] = useState<'menu' | 'two_points' | 'drag' | null>(null);

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

  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  panRef.current = pan;
  zoomRef.current = zoom;

  const animFrameRef = useRef<number | null>(null);

  // Smooth animation helper (~300ms cubic ease-out)
  const animateViewport = useCallback((targetZoom: number, targetPan: { x: number; y: number }, duration = 300) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const startTime = performance.now();
    const startZoom = zoomRef.current;
    const startPan = { ...panRef.current };

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentZoom = startZoom + (targetZoom - startZoom) * ease;
      const currentPanX = startPan.x + (targetPan.x - startPan.x) * ease;
      const currentPanY = startPan.y + (targetPan.y - startPan.y) * ease;

      setZoom(currentZoom);
      setPan({ x: currentPanX, y: currentPanY });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Auto-center and fit drawing to screen with smooth animation
  const handleCenterView = useCallback((linesToFit?: FreeDrawingLine[], animate = true) => {
    const targetLines = linesToFit || lines;
    if (!targetLines || targetLines.length === 0) {
      if (animate) {
        animateViewport(0.35, { x: 300, y: 250 }, 300);
      } else {
        setZoom(0.35);
        setPan({ x: 300, y: 250 });
      }
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    targetLines.forEach(line => {
      minX = Math.min(minX, line.x1, line.x2);
      maxX = Math.max(maxX, line.x1, line.x2);
      minY = Math.min(minY, line.y1, line.y2);
      maxY = Math.max(maxY, line.y1, line.y2);
    });

    const widthMm = maxX - minX || 800;
    const heightMm = maxY - minY || 800;

    const canvasWidth = svgRef.current?.clientWidth || 800;
    const canvasHeight = svgRef.current?.clientHeight || 600;

    const zoomX = (canvasWidth * 0.75) / widthMm;
    const zoomY = (canvasHeight * 0.75) / heightMm;
    const computedZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.1), 2.5);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const panX = canvasWidth / 2 - midX * computedZoom;
    const panY = canvasHeight / 2 - midY * computedZoom;

    if (animate) {
      animateViewport(computedZoom, { x: panX, y: panY }, 300);
    } else {
      setZoom(computedZoom);
      setPan({ x: panX, y: panY });
    }
  }, [lines, animateViewport]);

  // Touch gesture state ref for Google Maps style mobile navigation
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    isPanning: boolean;
    longPressTimer: NodeJS.Timeout | null;
    pinchStartDist: number;
    pinchStartZoom: number;
    pinchStartMid: { x: number; y: number };
    pinchStartPan: { x: number; y: number };
  }>({
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    isPanning: false,
    longPressTimer: null,
    pinchStartDist: 0,
    pinchStartZoom: 1,
    pinchStartMid: { x: 0, y: 0 },
    pinchStartPan: { x: 0, y: 0 }
  });

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    if (activeTool === 'area_select') {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const coords = getPointerMmCoordinates(touch.clientX, touch.clientY);
        handleCanvasPointerDown(coords, touch.clientX, touch.clientY);
      }
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStateRef.current.startX = touch.clientX;
      touchStateRef.current.startY = touch.clientY;
      touchStateRef.current.startPanX = pan.x;
      touchStateRef.current.startPanY = pan.y;
      touchStateRef.current.isPanning = false;

      // Start long-press timer (~500ms) for line selection / options
      const clientX = touch.clientX;
      const clientY = touch.clientY;
      touchStateRef.current.longPressTimer = setTimeout(() => {
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        const xMm = (mouseX - pan.x) / zoom;
        const yMm = (mouseY - pan.y) / zoom;

        const hitLine = lines.find((line) => {
          const A = xMm - line.x1;
          const B = yMm - line.y1;
          const C = line.x2 - line.x1;
          const D = line.y2 - line.y1;
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          if (lenSq !== 0) param = dot / lenSq;
          let xx, yy;
          if (param < 0) { xx = line.x1; yy = line.y1; }
          else if (param > 1) { xx = line.x2; yy = line.y2; }
          else { xx = line.x1 + param * C; yy = line.y1 + param * D; }
          const distMm = Math.hypot(xMm - xx, yMm - yy);
          return distMm < (25 / zoom);
        });

        if (hitLine) {
          setSelectedLineId(hitLine.id);
        }
      }, 500);

    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchStateRef.current.pinchStartDist = dist;
      touchStateRef.current.pinchStartZoom = zoom;
      touchStateRef.current.pinchStartMid = { x: midX, y: midY };
      touchStateRef.current.pinchStartPan = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (activeTool === 'area_select') {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const coords = getPointerMmCoordinates(touch.clientX, touch.clientY);
        handleCanvasPointerMove(coords, touch.clientX, touch.clientY);
      }
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStateRef.current.startX;
      const dy = touch.clientY - touchStateRef.current.startY;

      if (Math.hypot(dx, dy) > 8) {
        if (touchStateRef.current.longPressTimer) {
          clearTimeout(touchStateRef.current.longPressTimer);
          touchStateRef.current.longPressTimer = null;
        }
        touchStateRef.current.isPanning = true;

        // Move drawing naturally with 1 finger (Google Maps behavior)
        setPan({
          x: touchStateRef.current.startPanX + dx,
          y: touchStateRef.current.startPanY + dy
        });
      }
    } else if (e.touches.length === 2) {
      if (touchStateRef.current.longPressTimer) {
        clearTimeout(touchStateRef.current.longPressTimer);
        touchStateRef.current.longPressTimer = null;
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      if (touchStateRef.current.pinchStartDist > 0) {
        const scale = dist / touchStateRef.current.pinchStartDist;
        const newZoom = Math.min(Math.max(touchStateRef.current.pinchStartZoom * scale, 0.05), 3.0);

        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const midCanvasX = midX - rect.left;
          const midCanvasY = midY - rect.top;

          const startZoom = touchStateRef.current.pinchStartZoom;
          const startPanX = touchStateRef.current.pinchStartPan.x;
          const startPanY = touchStateRef.current.pinchStartPan.y;

          const newPanX = midCanvasX - (midCanvasX - startPanX) * (newZoom / startZoom);
          const newPanY = midCanvasY - (midCanvasY - startPanY) * (newZoom / startZoom);

          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }

    if (activeTool === 'area_select') {
      handleCanvasMouseUp();
      return;
    }

    if (!touchStateRef.current.isPanning && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        const xMm = (mouseX - pan.x) / zoom;
        const yMm = (mouseY - pan.y) / zoom;

        const hitLine = lines.find((line) => {
          const A = xMm - line.x1;
          const B = yMm - line.y1;
          const C = line.x2 - line.x1;
          const D = line.y2 - line.y1;
          const dot = A * C + B * D;
          const lenSq = C * C + D * D;
          let param = -1;
          if (lenSq !== 0) param = dot / lenSq;
          let xx, yy;
          if (param < 0) { xx = line.x1; yy = line.y1; }
          else if (param > 1) { xx = line.x2; yy = line.y2; }
          else { xx = line.x1 + param * C; yy = line.y1 + param * D; }
          const distMm = Math.hypot(xMm - xx, yMm - yy);
          return distMm < (30 / zoom);
        });

        if (hitLine) {
          setSelectedLineId(hitLine.id);
        } else {
          if (activeTool === 'select') {
            setSelectedLineId(null);
          }
        }
      }
    }

    touchStateRef.current.isPanning = false;
  };

  // Load state from project on mount or project switch
  useEffect(() => {
    if (project?.freeDrawing?.lines) {
      const loadedLines = project.freeDrawing.lines;
      const hash = JSON.stringify(loadedLines);

      if (hash !== lastDrawingHash.current) {
        lastDrawingHash.current = hash;
        setLines(loadedLines);
        setHistory([loadedLines]);
        setHistoryIndex(0);

        if (project.freeDrawing.viewport) {
          setZoom(project.freeDrawing.viewport.zoom || 0.35);
          setPan({ 
            x: project.freeDrawing.viewport.panX ?? 300, 
            y: project.freeDrawing.viewport.panY ?? 250 
          });
        } else {
          requestAnimationFrame(() => {
            setTimeout(() => {
              handleCenterView(loadedLines);
            }, 60);
          });
        }
      }
    } else if (project?.frame) {
      // Build standard base outer frame if no drawing exists yet
      const w = project.frame.width || 1200;
      const h = project.frame.height || 2000;
      const prof = project.frame.profile || defaultProfile;

      const baseFrameLines: FreeDrawingLine[] = [
        { id: `frame-top-${Date.now()}`, x1: 0, y1: 0, x2: w, y2: 0, lengthMm: w, angleDeg: 0, profile: prof },
        { id: `frame-right-${Date.now()}`, x1: w, y1: 0, x2: w, y2: h, lengthMm: h, angleDeg: 90, profile: prof },
        { id: `frame-bottom-${Date.now()}`, x1: w, y1: h, x2: 0, y2: h, lengthMm: w, angleDeg: 180, profile: prof },
        { id: `frame-left-${Date.now()}`, x1: 0, y1: h, x2: 0, y2: 0, lengthMm: h, angleDeg: 270, profile: prof },
      ];

      setLines(baseFrameLines);
      setHistory([baseFrameLines]);
      setHistoryIndex(0);
      lastDrawingHash.current = JSON.stringify(baseFrameLines);

      requestAnimationFrame(() => {
        setTimeout(() => {
          handleCenterView(baseFrameLines);
        }, 60);
      });
    }
  }, [project?.id, project?.freeDrawing?.updatedAt, project?.freeDrawing?.lines, handleCenterView, project?.frame, defaultProfile]);

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

  // Smart Piece Assembler Trigger (ET-009B.1)
  const handleAddPiece = (pieceType: 'travessa' | 'montante' | 'diagonal' | 'porta' | 'janela' | 'coluna' | 'reforco' | 'barra_livre') => {
    setIsAddPieceModalOpen(false);

    if (pieceType === 'barra_livre') {
      setActiveTool('line');
      setDrawingStart(null);
      return;
    }

    if (pieceType === 'travessa') {
      setActiveAddPieceType('travessa');
      return;
    }

    if (pieceType === 'montante') {
      setActiveAddPieceType('montante');
      return;
    }

    if (pieceType === 'diagonal') {
      setActiveAddPieceType('diagonal');
      return;
    }

    if (pieceType === 'porta') {
      setActiveAddPieceType('porta');
      return;
    }

    if (pieceType === 'janela') {
      setActiveAddPieceType('janela');
      return;
    }

    if (pieceType === 'reforco') {
      const { minX, minY } = getStructureBounds(lines);
      const size = 300;
      const len = Math.round(size * Math.SQRT2);
      const now = Date.now();
      const newLine: FreeDrawingLine = {
        id: `reforco-${now}`,
        x1: minX + size,
        y1: minY,
        x2: minX,
        y2: minY + size,
        lengthMm: len,
        angleDeg: 135,
        profile: defaultProfile
      };
      const updated = [...lines, newLine];
      commitLinesState(updated);
      setSelectedLineId(newLine.id);
      setTimeout(() => handleCenterView(updated, true), 50);
      return;
    }
  };

  // 1. ADICIONAR BARRA HORIZONTAL (ET-009B.1)
  const handleConfirmAddHorizontalBar = () => {
    const { minX, maxX, minY, maxY, width } = getStructureBounds(lines);
    const dist = parseFloat(horizDist) || 0;
    let targetY = Math.round((minY + maxY) / 2);

    if (horizRef === 'topo') {
      targetY = minY + dist;
    } else if (horizRef === 'base') {
      targetY = maxY - dist;
    } else if (horizRef === 'centro') {
      targetY = Math.round((minY + maxY) / 2) + dist;
    }

    const now = Date.now();
    const newLine: FreeDrawingLine = {
      id: `travessa-${now}`,
      x1: minX,
      y1: targetY,
      x2: maxX,
      y2: targetY,
      lengthMm: width,
      angleDeg: 0,
      profile: defaultProfile
    };

    const updated = [...lines, newLine];
    commitLinesState(updated);
    setSelectedLineId(newLine.id);
    setActiveAddPieceType(null);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  // 2. ADICIONAR BARRA VERTICAL (ET-009B.1)
  const handleConfirmAddVerticalBar = () => {
    const { minX, maxX, minY, maxY, height } = getStructureBounds(lines);
    const dist = parseFloat(vertDist) || 0;
    let targetX = Math.round((minX + maxX) / 2);

    if (vertRef === 'esquerda') {
      targetX = minX + dist;
    } else if (vertRef === 'direita') {
      targetX = maxX - dist;
    } else if (vertRef === 'centro') {
      targetX = Math.round((minX + maxX) / 2) + dist;
    }

    const now = Date.now();
    const newLine: FreeDrawingLine = {
      id: `montante-${now}`,
      x1: targetX,
      y1: minY,
      x2: targetX,
      y2: maxY,
      lengthMm: height,
      angleDeg: 90,
      profile: defaultProfile
    };

    const updated = [...lines, newLine];
    commitLinesState(updated);
    setSelectedLineId(newLine.id);
    setActiveAddPieceType(null);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  // 3. ADICIONAR DIAGONAL (ET-009B.1)
  const handleConfirmAddDiagonal = () => {
    const { minX, maxX, minY, maxY } = getStructureBounds(lines);
    const startOffset = diagFull ? 0 : (parseFloat(diagStartOffset) || 0);
    const endOffset = diagFull ? 0 : (parseFloat(diagEndOffset) || 0);

    let x1 = minX, y1 = maxY, x2 = maxX, y2 = minY;

    if (diagType === 'BL_TR') {
      // ◢ (Bottom-left to Top-right)
      x1 = minX + startOffset;
      y1 = maxY;
      x2 = maxX - endOffset;
      y2 = minY;
    } else {
      // ◣ (Top-left to Bottom-right)
      x1 = minX + startOffset;
      y1 = minY;
      x2 = maxX - endOffset;
      y2 = maxY;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.round(Math.hypot(dx, dy));
    const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

    const now = Date.now();
    const newLine: FreeDrawingLine = {
      id: `diagonal-${now}`,
      x1,
      y1,
      x2,
      y2,
      lengthMm: len,
      angleDeg: angle,
      profile: defaultProfile
    };

    const updated = [...lines, newLine];
    commitLinesState(updated);
    setSelectedLineId(newLine.id);
    setActiveAddPieceType(null);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  // 4. COLOCAR PORTA (ET-009B.1)
  const handleConfirmAddDoor = () => {
    const { minX, maxX, minY, maxY } = getStructureBounds(lines);
    const w = parseFloat(doorWidth) || 800;
    const h = parseFloat(doorHeight) || 2000;

    let startX = Math.round((minX + maxX) / 2 - w / 2);
    if (doorPos === 'esquerda') {
      startX = minX;
    } else if (doorPos === 'direita') {
      startX = maxX - w;
    }

    const startY = Math.max(minY, maxY - h);
    const now = Date.now();

    const doorLines: FreeDrawingLine[] = [
      { id: `porta-top-${now}`, x1: startX, y1: startY, x2: startX + w, y2: startY, lengthMm: w, angleDeg: 0, profile: defaultProfile },
      { id: `porta-left-${now}`, x1: startX, y1: startY, x2: startX, y2: startY + h, lengthMm: h, angleDeg: 90, profile: defaultProfile },
      { id: `porta-right-${now}`, x1: startX + w, y1: startY, x2: startX + w, y2: startY + h, lengthMm: h, angleDeg: 90, profile: defaultProfile },
    ];

    const updated = [...lines, ...doorLines];
    commitLinesState(updated);
    setSelectedLineId(doorLines[0].id);
    setActiveAddPieceType(null);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  // 5. COLOCAR JANELA (ET-009B.1)
  const handleConfirmAddWindow = () => {
    const { minX, maxX, minY, maxY } = getStructureBounds(lines);
    const w = parseFloat(winWidth) || 1000;
    const h = parseFloat(winHeight) || 1000;
    const divs = Math.max(1, parseInt(winDivs) || 1);

    const startX = Math.round((minX + maxX) / 2 - w / 2);
    const startY = Math.round((minY + maxY) / 2 - h / 2);
    const now = Date.now();

    const winLines: FreeDrawingLine[] = [
      { id: `janela-top-${now}`, x1: startX, y1: startY, x2: startX + w, y2: startY, lengthMm: w, angleDeg: 0, profile: defaultProfile },
      { id: `janela-right-${now}`, x1: startX + w, y1: startY, x2: startX + w, y2: startY + h, lengthMm: h, angleDeg: 90, profile: defaultProfile },
      { id: `janela-bottom-${now}`, x1: startX + w, y1: startY + h, x2: startX, y2: startY + h, lengthMm: w, angleDeg: 180, profile: defaultProfile },
      { id: `janela-left-${now}`, x1: startX, y1: startY + h, x2: startX, y2: startY, lengthMm: h, angleDeg: 270, profile: defaultProfile },
    ];

    if (divs > 1) {
      const spacing = w / divs;
      for (let i = 1; i < divs; i++) {
        const divX = Math.round(startX + i * spacing);
        winLines.push({
          id: `janela-div-${i}-${now}`,
          x1: divX,
          y1: startY,
          x2: divX,
          y2: startY + h,
          lengthMm: h,
          angleDeg: 90,
          profile: defaultProfile
        });
      }
    }

    const updated = [...lines, ...winLines];
    commitLinesState(updated);
    setSelectedLineId(winLines[0].id);
    setActiveAddPieceType(null);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  // Compute guide line for Trena (ET-009C.1C)
  const computeGuideLine = useCallback((refType: 'topo' | 'base' | 'esquerda' | 'direita' | 'centro', distMmStr: string, currentLines: FreeDrawingLine[]) => {
    try {
      const dist = Math.max(0, parseFloat(distMmStr) || 400);
      const { minX, maxX, minY, maxY } = getStructureBounds(currentLines);

      let gX1 = minX, gY1 = minY, gX2 = maxX, gY2 = maxY;
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
  }, []);

  // Trigger Trena Tool (ET-009C.1C)
  const handleStartDistanceTool = () => {
    try {
      setTrenaRefPoint('topo');
      setDistanceMmValue('400');
      setDistanceStep('choose_ref');
      setIsDistanceModalOpen(true);
      const guide = computeGuideLine('topo', '400', lines);
      setGuideLineRef(guide);
      showToast("Trena Guiada iniciada.");
    } catch (err) {
      console.error("Erro ao iniciar Trena:", err);
      showToast("Não foi possível iniciar a Trena. Tente novamente.");
    }
  };

  // Select Reference in Step 1 (ET-009C.1C)
  const handleSelectTrenaRef = (refType: 'topo' | 'base' | 'esquerda' | 'direita' | 'centro') => {
    try {
      setTrenaRefPoint(refType);
      const guide = computeGuideLine(refType, distanceMmValue, lines);
      setGuideLineRef(guide);
      setDistanceStep('input_dist');
    } catch (err) {
      console.error("Erro ao selecionar referência da trena:", err);
    }
  };

  // Update distance input in Step 2 (ET-009C.1C)
  const handleDistanceInputChange = (val: string) => {
    setDistanceMmValue(val);
    const guide = computeGuideLine(trenaRefPoint, val, lines);
    setGuideLineRef(guide);
  };

  // Install Piece at Trena Guide Line (Step 5: ET-009C.1C)
  const handleAddPieceAtTrenaMarker = (pieceType: 'travessa' | 'montante' | 'diagonal' | 'reforco' | 'porta' | 'janela') => {
    try {
      if (!guideLineRef) return;

      const { minX, maxX, minY, maxY } = getStructureBounds(lines);
      const now = Date.now();
      let newLinesToAdd: FreeDrawingLine[] = [];

      const gX = Math.round((guideLineRef.x1 + guideLineRef.x2) / 2);
      const gY = Math.round((guideLineRef.y1 + guideLineRef.y2) / 2);

      if (pieceType === 'travessa') {
        newLinesToAdd.push({
          id: `travessa-trena-${now}`,
          x1: minX,
          y1: gY,
          x2: maxX,
          y2: gY,
          lengthMm: Math.abs(maxX - minX),
          angleDeg: 0,
          profile: defaultProfile
        });
      } else if (pieceType === 'montante') {
        newLinesToAdd.push({
          id: `montante-trena-${now}`,
          x1: gX,
          y1: minY,
          x2: gX,
          y2: maxY,
          lengthMm: Math.abs(maxY - minY),
          angleDeg: 90,
          profile: defaultProfile
        });
      } else if (pieceType === 'diagonal') {
        const size = 800;
        newLinesToAdd.push({
          id: `diagonal-trena-${now}`,
          x1: gX,
          y1: gY,
          x2: gX + size,
          y2: gY + size,
          lengthMm: Math.round(size * Math.SQRT2),
          angleDeg: 45,
          profile: defaultProfile
        });
      } else if (pieceType === 'reforco') {
        const size = 300;
        newLinesToAdd.push({
          id: `reforco-trena-${now}`,
          x1: gX,
          y1: gY,
          x2: gX + size,
          y2: gY + size,
          lengthMm: Math.round(size * Math.SQRT2),
          angleDeg: 45,
          profile: defaultProfile
        });
      } else if (pieceType === 'porta') {
        const doorW = 800;
        const doorH = 2000;
        newLinesToAdd = [
          { id: `porta-top-${now}`, x1: gX, y1: gY, x2: gX + doorW, y2: gY, lengthMm: doorW, angleDeg: 0, profile: defaultProfile },
          { id: `porta-right-${now}`, x1: gX + doorW, y1: gY, x2: gX + doorW, y2: gY + doorH, lengthMm: doorH, angleDeg: 90, profile: defaultProfile },
          { id: `porta-bottom-${now}`, x1: gX + doorW, y1: gY + doorH, x2: gX, y2: gY + doorH, lengthMm: doorW, angleDeg: 180, profile: defaultProfile },
          { id: `porta-left-${now}`, x1: gX, y1: gY + doorH, x2: gX, y2: gY, lengthMm: doorH, angleDeg: 270, profile: defaultProfile },
        ];
      } else if (pieceType === 'janela') {
        const winW = 1000;
        const winH = 1000;
        newLinesToAdd = [
          { id: `janela-top-${now}`, x1: gX, y1: gY, x2: gX + winW, y2: gY, lengthMm: winW, angleDeg: 0, profile: defaultProfile },
          { id: `janela-right-${now}`, x1: gX + winW, y1: gY, x2: gX + winW, y2: gY + winH, lengthMm: winH, angleDeg: 90, profile: defaultProfile },
          { id: `janela-bottom-${now}`, x1: gX + winW, y1: gY + winH, x2: gX, y2: gY + winH, lengthMm: winW, angleDeg: 180, profile: defaultProfile },
          { id: `janela-left-${now}`, x1: gX, y1: gY + winH, x2: gX, y2: gY, lengthMm: winH, angleDeg: 270, profile: defaultProfile },
        ];
      }

      if (newLinesToAdd.length > 0) {
        const updated = [...lines, ...newLinesToAdd];
        commitLinesState(updated);
        selectSingleLine(newLinesToAdd[0].id);
        setIsDistanceModalOpen(false);
        setGuideLineRef(null);
        showToast(`Peça instalada com sucesso na marca de ${distanceMmValue}mm!`);
        setTimeout(() => handleCenterView(updated, true), 50);
      }
    } catch (err) {
      console.error("Erro ao instalar peça na marca da trena:", err);
      showToast("Ocorreu um erro ao instalar a peça. Tente novamente.");
    }
  };

  // Undo & Redo Handlers (Requirement 10: Nunca deixar o usuário sem resposta)
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevLines = history[prevIndex];
      setLines(prevLines);
      setHistoryIndex(prevIndex);

      const drawData: FreeDrawingData = {
        lines: prevLines,
        viewport: { zoom, panX: pan.x, panY: pan.y },
        updatedAt: new Date().toISOString()
      };
      if (project && onUpdateProject) {
        onUpdateProject({ ...project, freeDrawing: drawData });
      }
      showToast("Ação desfeita.");
    } else {
      showToast("Nada para desfazer.");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextLines = history[nextIndex];
      setLines(nextLines);
      setHistoryIndex(nextIndex);

      const drawData: FreeDrawingData = {
        lines: nextLines,
        viewport: { zoom, panX: pan.x, panY: pan.y },
        updatedAt: new Date().toISOString()
      };
      if (project && onUpdateProject) {
        onUpdateProject({ ...project, freeDrawing: drawData });
      }
      showToast("Ação refeita.");
    } else {
      showToast("Nada para refazer.");
    }
  };

  // Convert SVG Mouse coordinates to internal millimeter coordinates
  const getMouseMmCoordinates = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let xMm = (mouseX - pan.x) / zoom;
    let yMm = (mouseY - pan.y) / zoom;

    if (snapToGrid) {
      xMm = Math.round(xMm / gridSizeMm) * gridSizeMm;
      yMm = Math.round(yMm / gridSizeMm) * gridSizeMm;
    }

    return { x: Math.round(xMm), y: Math.round(yMm) };
  };

  // Find nearest endpoint for smart snapping
  const findNearestEndpoint = (coords: { x: number; y: number }, maxDistanceMm = 25): { x: number; y: number } | null => {
    if (!snapToEndpoints) return null;
    let nearest: { x: number; y: number } | null = null;
    let minDistance = maxDistanceMm;

    lines.forEach((line) => {
      const d1 = Math.hypot(line.x1 - coords.x, line.y1 - coords.y);
      const d2 = Math.hypot(line.x2 - coords.x, line.y2 - coords.y);

      if (d1 < minDistance) {
        minDistance = d1;
        nearest = { x: line.x1, y: line.y1 };
      }
      if (d2 < minDistance) {
        minDistance = d2;
        nearest = { x: line.x2, y: line.y2 };
      }
    });

    return nearest;
  };

  // Selected Line Object
  const selectedLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || null;
  }, [lines, selectedLineId]);

  // Keep inspector inputs synchronized with selected line
  useEffect(() => {
    if (selectedLine) {
      setEditLengthInput(selectedLine.lengthMm.toString());
      setEditAngleInput(selectedLine.angleDeg.toString());
      setEditProfileInput(selectedLine.profile || defaultProfile);
    }
  }, [selectedLine, defaultProfile]);

  // Trigger Delete Confirmation Modal (Rule: Never delete directly without confirmation)
  const handleDeleteSelected = () => {
    if (selectedLineId) {
      setIsDeleteModalOpen(true);
    }
  };

  // Helper for single and group selection synchronization (ET-009C.1)
  const selectSingleLine = (id: string | null) => {
    setSelectedLineId(id);
    setSelectedLineIds(id ? [id] : []);
  };

  const selectGroupLines = (ids: string[]) => {
    setSelectedLineIds(ids);
    if (ids.length === 1) {
      setSelectedLineId(ids[0]);
    } else {
      setSelectedLineId(null);
    }
  };

  // Single Piece Actions (ET-009C.1)
  const handleCopySinglePiece = () => {
    if (!selectedLine) return;
    const now = Date.now();
    const newPiece: FreeDrawingLine = {
      ...selectedLine,
      id: `line-copy-${now}-${Math.random().toString(36).substring(2, 6)}`,
      x1: selectedLine.x1 + 100,
      y1: selectedLine.y1 + 100,
      x2: selectedLine.x2 + 100,
      y2: selectedLine.y2 + 100,
    };
    const updated = [...lines, newPiece];
    commitLinesState(updated);
    selectSingleLine(newPiece.id);
    showToast("Peça copiada!");
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  const handleCutSinglePiece = () => {
    if (!selectedLine) return;
    setClipboardPieces([selectedLine]);
    const updated = lines.filter((l) => l.id !== selectedLine.id);
    commitLinesState(updated);
    selectSingleLine(null);
    showToast("Peça recortada!");
  };

  // Modo Seleção inteligente Handlers (ET-009C.1D)
  const handleEnterAreaSelectMode = () => {
    setActiveTool('area_select');
    setSelectionBox(null);
    setAreaCorner1(null);
    setSelectionSubMode('menu');
    setIsSelectionMenuOpen(true);
    setIsPanning(false);
  };

  const handleExitSelectionMode = () => {
    setActiveTool('select');
    setSelectionBox(null);
    setAreaCorner1(null);
    setSelectionSubMode(null);
    setIsSelectionMenuOpen(false);
    selectGroupLines([]);
    showToast("Modo Seleção encerrado.");
  };

  // Group Actions (ET-009C.1 / ET-009C.1D)
  const handleMoveGroup = (deltaX: number, deltaY: number) => {
    if (selectedLineIds.length === 0) return;
    const updated = lines.map((l) => {
      if (selectedLineIds.includes(l.id)) {
        return {
          ...l,
          x1: l.x1 + deltaX,
          y1: l.y1 + deltaY,
          x2: l.x2 + deltaX,
          y2: l.y2 + deltaY,
        };
      }
      return l;
    });
    commitLinesState(updated);
    setActiveTool('select');
    showToast("Grupo de peças movido!");
  };

  const handleCopyGroup = () => {
    const selectedLines = lines.filter((l) => selectedLineIds.includes(l.id));
    if (selectedLines.length === 0) return;
    const now = Date.now();
    const newCopiedLines: FreeDrawingLine[] = selectedLines.map((l, idx) => ({
      ...l,
      id: `line-group-copy-${now}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      x1: l.x1 + 150,
      y1: l.y1 + 150,
      x2: l.x2 + 150,
      y2: l.y2 + 150,
    }));
    const updated = [...lines, ...newCopiedLines];
    commitLinesState(updated);
    const newIds = newCopiedLines.map((l) => l.id);
    selectGroupLines(newIds);
    setActiveTool('select');
    showToast(`${newCopiedLines.length} peças copiadas!`);
    setTimeout(() => handleCenterView(updated, true), 50);
  };

  const handleCutGroup = () => {
    const selectedLines = lines.filter((l) => selectedLineIds.includes(l.id));
    if (selectedLines.length === 0) return;
    setClipboardPieces(selectedLines);
    const updated = lines.filter((l) => !selectedLineIds.includes(l.id));
    commitLinesState(updated);
    selectGroupLines([]);
    setActiveTool('select');
    showToast(`${selectedLines.length} peças recortadas!`);
  };

  const handleConfirmGroupProfile = () => {
    if (!groupProfileInput) return;
    const updated = lines.map((l) => {
      if (selectedLineIds.includes(l.id)) {
        return { ...l, profile: groupProfileInput };
      }
      return l;
    });
    commitLinesState(updated);
    setIsGroupProfileModalOpen(false);
    setActiveTool('select');
    showToast(`Perfil alterado para ${selectedLineIds.length} peças!`);
  };

  const handleConfirmGroupDelete = () => {
    const updated = lines.filter((l) => !selectedLineIds.includes(l.id));
    commitLinesState(updated);
    selectGroupLines([]);
    setIsGroupDeleteModalOpen(false);
    setActiveTool('select');
    showToast("Peças removidas com sucesso!");
  };

  // Perform Actual Delete after User Confirms "SIM"
  const handleConfirmDelete = () => {
    if (selectedLineId) {
      const filtered = lines.filter((l) => l.id !== selectedLineId);
      commitLinesState(filtered);
      selectSingleLine(null);
    }
    setIsDeleteModalOpen(false);
  };

  // Delete specific line with confirmation
  const handleDeleteLine = (id: string) => {
    selectSingleLine(id);
    setIsDeleteModalOpen(true);
  };

  // Line Click Selection (Safety rule: Touch on line = select line)
  const handleLineClick = (e: React.MouseEvent, line: FreeDrawingLine) => {
    e.stopPropagation();

    if (activeTool === 'eraser') {
      handleDeleteLine(line.id);
      return;
    }

    if (e.shiftKey || e.ctrlKey) {
      const nextIds = selectedLineIds.includes(line.id)
        ? selectedLineIds.filter((id) => id !== line.id)
        : [...selectedLineIds, line.id];
      selectGroupLines(nextIds);
    } else {
      selectSingleLine(line.id);
    }
  };

  // Update attributes of selected line from Inspector
  const handleApplyLineEdits = () => {
    if (!selectedLine) return;

    const newLen = parseFloat(editLengthInput) || selectedLine.lengthMm;
    const newAngle = parseFloat(editAngleInput) ?? selectedLine.angleDeg;
    const newProfile = editProfileInput || selectedLine.profile;

    const angleRad = (newAngle * Math.PI) / 180;
    const newX2 = Math.round(selectedLine.x1 + newLen * Math.cos(angleRad));
    const newY2 = Math.round(selectedLine.y1 + newLen * Math.sin(angleRad));

    const updatedLines = lines.map((l) => {
      if (l.id === selectedLine.id) {
        return {
          ...l,
          lengthMm: Math.round(newLen),
          angleDeg: Math.round(newAngle),
          profile: newProfile,
          x2: newX2,
          y2: newY2,
        };
      }
      return l;
    });

    commitLinesState(updatedLines);
  };

  // Endpoint Drag Handler
  const handleEndpointMouseDown = (
    e: React.MouseEvent,
    line: FreeDrawingLine,
    endpoint: 'p1' | 'p2'
  ) => {
    e.stopPropagation();
    const startCoords = getMouseMmCoordinates(e);
    setDragState({
      lineId: line.id,
      endpoint,
      startMouseMm: startCoords,
      initialLine: { ...line },
    });
    setSelectedLineId(line.id);
  };

  // Canvas mouse and touch coordinate extractors
  const getPointerMmCoordinates = (clientX: number, clientY: number) => {
    return getMouseMmCoordinates({ clientX, clientY });
  };

  // Canvas Down / Touch Start
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    const coords = getMouseMmCoordinates(e);
    handleCanvasPointerDown(coords, e.clientX, e.clientY);
  };

  const handleCanvasPointerDown = (coords: { x: number; y: number }, clientX: number, clientY: number) => {
    const snapPt = findNearestEndpoint(coords) || coords;

    if (activeTool === 'area_select') {
      try {
        if (selectionSubMode === 'two_points' || selectionSubMode === 'menu' || !selectionSubMode) {
          if (!areaCorner1) {
            setAreaCorner1(coords);
            setSelectionBox({
              startX: coords.x,
              startY: coords.y,
              currentX: coords.x,
              currentY: coords.y,
            });
            showToast("📍 Ponto 1 definido! Agora toque no Ponto 2 (segundo canto).");
          } else {
            // Point 2 tap in two_points mode
            const corner1 = areaCorner1;
            const corner2 = coords;
            const rectMinX = Math.min(corner1.x, corner2.x);
            const rectMaxX = Math.max(corner1.x, corner2.x);
            const rectMinY = Math.min(corner1.y, corner2.y);
            const rectMaxY = Math.max(corner1.y, corner2.y);

            const found = lines
              .filter((l) => {
                const minX = Math.min(l.x1, l.x2);
                const maxX = Math.max(l.x1, l.x2);
                const minY = Math.min(l.y1, l.y2);
                const maxY = Math.max(l.y1, l.y2);
                return (
                  minX <= rectMaxX &&
                  maxX >= rectMinX &&
                  minY <= rectMaxY &&
                  maxY >= rectMinY
                );
              })
              .map((l) => l.id);

            selectGroupLines(found);
            setSelectionBox(null);
            setAreaCorner1(null);
            setIsSelectionMenuOpen(false);
            setActiveTool('select');

            if (found.length > 0) {
              showToast(`✅ ${found.length} peças selecionadas!`);
            } else {
              showToast("Nenhuma peça encontrada na área.");
            }
          }
        } else if (selectionSubMode === 'drag') {
          setAreaCorner1(null);
          setSelectionBox({
            startX: coords.x,
            startY: coords.y,
            currentX: coords.x,
            currentY: coords.y,
          });
        }
      } catch (err) {
        console.error("Erro na seleção por área:", err);
        showToast("Ops! Erro ao selecionar por área. Tente novamente.");
        setSelectionBox(null);
        setAreaCorner1(null);
      }
      return;
    }

    if (activeTool === 'select') {
      selectGroupLines([]);
      return;
    }

    if (activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      return;
    }

    if (activeTool === 'line') {
      if (!drawingStart) {
        setDrawingStart(snapPt);
      } else {
        const dx = snapPt.x - drawingStart.x;
        const dy = snapPt.y - drawingStart.y;
        const lengthMm = Math.round(Math.hypot(dx, dy));
        const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

        if (lengthMm > 5) {
          const newLine: FreeDrawingLine = {
            id: `line-${Date.now()}`,
            x1: drawingStart.x,
            y1: drawingStart.y,
            x2: snapPt.x,
            y2: snapPt.y,
            lengthMm,
            angleDeg,
            profile: defaultProfile,
          };
          commitLinesState([...lines, newLine]);
          selectSingleLine(newLine.id);
        }

        setDrawingStart(null);
        setActiveTool('select');
      }
      return;
    }

    if (activeTool === 'rectangle') {
      if (!drawingStart) {
        setDrawingStart(snapPt);
      } else {
        const x1 = Math.min(drawingStart.x, snapPt.x);
        const y1 = Math.min(drawingStart.y, snapPt.y);
        const x2 = Math.max(drawingStart.x, snapPt.x);
        const y2 = Math.max(drawingStart.y, snapPt.y);

        const w = x2 - x1;
        const h = y2 - y1;

        if (w > 10 && h > 10) {
          const rectLines: FreeDrawingLine[] = [
            { id: `rect-1-${Date.now()}`, x1, y1, x2, y2: y1, lengthMm: w, angleDeg: 0, profile: defaultProfile },
            { id: `rect-2-${Date.now()}`, x1: x2, y1, x2, y2, lengthMm: h, angleDeg: 90, profile: defaultProfile },
            { id: `rect-3-${Date.now()}`, x1: x2, y1: y2, x2: x1, y2, lengthMm: w, angleDeg: 180, profile: defaultProfile },
            { id: `rect-4-${Date.now()}`, x1, y1: y2, x2: x1, y2: y1, lengthMm: h, angleDeg: 270, profile: defaultProfile },
          ];
          commitLinesState([...lines, ...rectLines]);
        }

        setDrawingStart(null);
        setActiveTool('select');
      }
      return;
    }

    if (activeTool === 'polyline') {
      setPolylinePoints((prev) => [...prev, snapPt]);
      return;
    }
  };

  // Mouse Move on Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getMouseMmCoordinates(e);
    handleCanvasPointerMove(coords, e.clientX, e.clientY);
  };

  const handleCanvasPointerMove = (coords: { x: number; y: number }, clientX: number, clientY: number) => {
    const snapPt = findNearestEndpoint(coords);

    setCurrentCursor(coords);
    setSnapIndicator(snapPt);

    if (activeTool === 'area_select') {
      if (selectionBox) {
        setSelectionBox((prev) =>
          prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
        );
      }
      return; // Frozen canvas during area select mode!
    }

    if (selectionBox) {
      setSelectionBox((prev) =>
        prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null
      );
      return;
    }

    if (isPanning) {
      setPan({
        x: clientX - panStart.x,
        y: clientY - panStart.y,
      });
      return;
    }

    if (dragState) {
      const activeCoords = snapPt || coords;
      const { lineId, endpoint } = dragState;

      const updatedLines = lines.map((l) => {
        if (l.id === lineId) {
          let newX1 = l.x1;
          let newY1 = l.y1;
          let newX2 = l.x2;
          let newY2 = l.y2;

          if (endpoint === 'p1') {
            newX1 = activeCoords.x;
            newY1 = activeCoords.y;
          } else if (endpoint === 'p2') {
            newX2 = activeCoords.x;
            newY2 = activeCoords.y;
          }

          const dx = newX2 - newX1;
          const dy = newY2 - newY1;
          const lengthMm = Math.round(Math.hypot(dx, dy));
          const angleDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

          return {
            ...l,
            x1: newX1,
            y1: newY1,
            x2: newX2,
            y2: newY2,
            lengthMm,
            angleDeg,
          };
        }
        return l;
      });

      setLines(updatedLines);
    }
  };

  // Mouse Up Handler
  const handleCanvasMouseUp = () => {
    if (activeTool === 'area_select' && selectionSubMode === 'drag' && selectionBox) {
      try {
        const rectMinX = Math.min(selectionBox.startX, selectionBox.currentX);
        const rectMaxX = Math.max(selectionBox.startX, selectionBox.currentX);
        const rectMinY = Math.min(selectionBox.startY, selectionBox.currentY);
        const rectMaxY = Math.max(selectionBox.startY, selectionBox.currentY);

        const dx = Math.abs(selectionBox.currentX - selectionBox.startX);
        const dy = Math.abs(selectionBox.currentY - selectionBox.startY);

        if (dx > 10 || dy > 10) {
          const found = lines
            .filter((l) => {
              const minX = Math.min(l.x1, l.x2);
              const maxX = Math.max(l.x1, l.x2);
              const minY = Math.min(l.y1, l.y2);
              const maxY = Math.max(l.y1, l.y2);
              return (
                minX <= rectMaxX &&
                maxX >= rectMinX &&
                minY <= rectMaxY &&
                maxY >= rectMinY
              );
            })
            .map((l) => l.id);

          selectGroupLines(found);
          setSelectionBox(null);
          setAreaCorner1(null);
          setIsSelectionMenuOpen(false);
          setActiveTool('select');

          if (found.length > 0) {
            showToast(`✅ ${found.length} peças selecionadas!`);
          } else {
            showToast("Nenhuma peça encontrada na área.");
          }
          return;
        }
      } catch (err) {
        console.error("Erro ao finalizar arrasto de área:", err);
      }
    }

    if (selectionBox) {
      try {
        const rectMinX = Math.min(selectionBox.startX, selectionBox.currentX);
        const rectMaxX = Math.max(selectionBox.startX, selectionBox.currentX);
        const rectMinY = Math.min(selectionBox.startY, selectionBox.currentY);
        const rectMaxY = Math.max(selectionBox.startY, selectionBox.currentY);

        const dx = Math.abs(selectionBox.currentX - selectionBox.startX);
        const dy = Math.abs(selectionBox.currentY - selectionBox.startY);

        if (dx > 15 || dy > 15) {
          const found = lines
            .filter((l) => {
              const minX = Math.min(l.x1, l.x2);
              const maxX = Math.max(l.x1, l.x2);
              const minY = Math.min(l.y1, l.y2);
              const maxY = Math.max(l.y1, l.y2);
              return (
                minX <= rectMaxX &&
                maxX >= rectMinX &&
                minY <= rectMaxY &&
                maxY >= rectMinY
              );
            })
            .map((l) => l.id);

          selectGroupLines(found);
          setSelectionBox(null);
          setAreaCorner1(null);
          setActiveTool('select');

          if (found.length > 0) {
            showToast(`${found.length} peças selecionadas!`);
          } else {
            showToast("Nenhuma peça encontrada na área.");
          }
          return;
        }
      } catch (err) {
        console.error("Erro ao finalizar arrasto de área:", err);
      }
    }

    if (isPanning) {
      setIsPanning(false);
    }
    if (dragState) {
      commitLinesState(lines);
      setDragState(null);
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (activeTool === 'area_select') return; // Lock zoom during area select
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.05), 3.0);
    setZoom(newZoom);
  };

  // Conclude Drawing Handler (saves and triggers completion callback)
  const handleConclude = () => {
    commitLinesState(lines);
    if (onCompleteDrawing) {
      onCompleteDrawing();
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full text-slate-900 select-none pb-20 lg:pb-0">
      
      {/* HEADER WITH TITLE AND PRIMARY ACTIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white">
                Editor de Estruturas
              </h2>
              <span className="bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">
                Oficina Inteligente
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Projeto: <strong className="text-slate-200">{project?.name || 'Montagem Personalizada'}</strong>
            </p>
          </div>
        </div>

        {/* TOP ACTION BAR & HISTORY */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Desfazer */}
          <button
            type="button"
            id="btn-header-desfazer"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition cursor-pointer ${
              historyIndex > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-800/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50'
            }`}
            title="Desfazer"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>

          {/* Refazer */}
          <button
            type="button"
            id="btn-header-refazer"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition cursor-pointer ${
              historyIndex < history.length - 1
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-800/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50'
            }`}
            title="Refazer"
          >
            <Redo2 className="w-4 h-4" />
            <span className="hidden sm:inline">Refazer</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Como Usar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBackModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            onClick={handleConclude}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluir</span>
          </button>
        </div>
      </div>



      {/* MAIN CONTAINER: DESKTOP SIDEBAR + SVG CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* DESKTOP FIXED TOOLBAR (COL 1-3) */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col gap-3 sticky top-4 z-20 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-2xl">
          <div className="border-b border-slate-800 pb-2 mb-1 flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
              Caixa de Ferramentas
            </span>
            <span className="text-[10px] bg-slate-800 text-amber-400 font-mono px-2 py-0.5 rounded font-bold">
              Lado Esquerdo
            </span>
          </div>

          {/* 1. Adicionar peça (PRIMARY BUTTON) */}
          <button
            type="button"
            id="btn-ferramenta-add-peca"
            onClick={() => setIsAddPieceModalOpen(true)}
            className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition duration-150 flex items-center gap-3 shadow-lg cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>➕ Adicionar Peça</span>
          </button>

          {/* 2. Selecionar Área */}
          <button
            type="button"
            id="btn-ferramenta-selecionar-area"
            onClick={handleEnterAreaSelectMode}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition duration-150 flex items-center gap-3 border cursor-pointer ${
              activeTool === 'area_select'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Square className="w-5 h-5" />
            <span>⬜ Selecionar Área</span>
          </button>

          {/* 3. Trena (Marcar Distância) */}
          <button
            type="button"
            id="btn-ferramenta-marcar-distancia"
            onClick={handleStartDistanceTool}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition duration-150 flex items-center gap-3 shadow-md cursor-pointer active:scale-[0.98]"
          >
            <Ruler className="w-5 h-5" />
            <span>📏 Trena</span>
          </button>

          {/* 4. Mover Desenho */}
          <button
            type="button"
            id="btn-ferramenta-mover"
            onClick={() => setActiveTool('pan')}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition duration-150 flex items-center gap-3 border cursor-pointer ${
              activeTool === 'pan'
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span>✋ Mover</span>
          </button>

          {/* 5. Excluir peça */}
          <button
            type="button"
            id="btn-ferramenta-excluir"
            disabled={selectedLineIds.length === 0}
            onClick={() => {
              if (selectedLineIds.length > 1) {
                setIsGroupDeleteModalOpen(true);
              } else {
                handleDeleteSelected();
              }
            }}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition duration-150 flex items-center gap-3 border cursor-pointer ${
              selectedLineIds.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md'
                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-5 h-5" />
            <span>🗑️ Excluir{selectedLineIds.length > 1 ? ` (${selectedLineIds.length})` : ''}</span>
          </button>

          {/* INSPECTOR CARD IF LINE IS SELECTED */}
          {selectedLine && (
            <div className="mt-2 bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-amber-400 font-mono flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  Peça Selecionada
                </span>
                <button
                  onClick={() => selectSingleLine(null)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Comprimento (mm)</label>
                <input
                  type="number"
                  value={editLengthInput}
                  onChange={(e) => setEditLengthInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Ângulo (°)</label>
                <input
                  type="number"
                  value={editAngleInput}
                  onChange={(e) => setEditAngleInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Perfil Metálico</label>
                <select
                  value={editProfileInput}
                  onChange={(e) => setEditProfileInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                >
                  {materialProfiles.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.thicknessMm}mm)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleApplyLineEdits}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Atualizar Peça
              </button>
            </div>
          )}
        </div>

        {/* SVG CANVAS AREA (COL 4-12) */}
        <div className="lg:col-span-9 xl:col-span-9 flex flex-col gap-3">
          
          {/* CANVAS STAGE */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[520px] sm:h-[620px] w-full flex flex-col">
            
            {/* INDICADOR VISUAL: MODO SELEÇÃO ATIVO (ET-009C.1D) */}
            {activeTool === 'area_select' ? (
              <div className="absolute top-3 left-3 right-3 z-30 bg-blue-600 text-white px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-2xl border border-blue-400/50 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200 shrink-0" />
                  <span className="font-display font-bold">Modo Seleção Ativo</span>
                  <span className="hidden md:inline-block text-[11px] bg-blue-800/90 text-blue-100 font-normal px-2 py-0.5 rounded-lg border border-blue-400/30">
                    {!areaCorner1 ? '👉 Toque no 1º canto (Ponto 1)' : '👉 Toque no 2º canto (Ponto 2)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectionSubMode !== 'menu' && (
                    <button
                      type="button"
                      onClick={() => setIsSelectionMenuOpen(true)}
                      className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      📋 Opções
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleExitSelectionMode}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancelar Seleção</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Top-Left Piece Count Badge */
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg text-xs font-mono text-slate-300">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Box className="w-3.5 h-3.5" />
                  {lines.length} Peças na Estrutura
                </span>
              </div>
            )}

            {/* SVG Interactive Blueprint Surface */}
            <svg
              ref={svgRef}
              className={`w-full h-full touch-none ${
                activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
              }`}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              {/* Background Technical Grid */}
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

              {/* Transformed Drawing Workspace */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Origin Marker (0,0) */}
                <circle cx="0" cy="0" r={6 / zoom} fill="#f59e0b" opacity="0.6" />
                <text x="10" y="-10" fill="#f59e0b" fontSize={12 / zoom} fontFamily="monospace" fontWeight="bold">
                  (0,0)
                </text>

                {/* Selection Box for Area Selection (ET-009C.1 / ET-009C.1D) */}
                {selectionBox && (
                  <rect
                    x={Math.min(selectionBox.startX, selectionBox.currentX)}
                    y={Math.min(selectionBox.startY, selectionBox.currentY)}
                    width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                    height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                    fill="rgba(16, 185, 129, 0.15)"
                    stroke="#10b981"
                    strokeWidth={2 / zoom}
                    strokeDasharray={`${6 / zoom} ${4 / zoom}`}
                  />
                )}

                {/* Marker for Ponto 1 (ET-009C.1D) */}
                {areaCorner1 && (
                  <g className="animate-fadeIn">
                    <circle
                      cx={areaCorner1.x}
                      cy={areaCorner1.y}
                      r={18 / zoom}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={2.5 / zoom}
                      className="animate-ping opacity-75"
                    />
                    <circle
                      cx={areaCorner1.x}
                      cy={areaCorner1.y}
                      r={8 / zoom}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={2 / zoom}
                    />
                    <g transform={`translate(${areaCorner1.x}, ${areaCorner1.y - 20 / zoom})`}>
                      <rect
                        x={-35 / zoom}
                        y={-12 / zoom}
                        width={70 / zoom}
                        height={20 / zoom}
                        fill="#064e3b"
                        rx={5 / zoom}
                        stroke="#34d399"
                        strokeWidth={1 / zoom}
                      />
                      <text
                        x="0"
                        y="0"
                        fill="#ffffff"
                        fontSize={10 / zoom}
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        📍 Ponto 1
                      </text>
                    </g>
                  </g>
                )}

                {/* Render All Saved Metallic Bars */}
                {lines.map((line) => {
                  const isSelected = selectedLineIds.includes(line.id) || line.id === selectedLineId;
                  const midX = (line.x1 + line.x2) / 2;
                  const midY = (line.y1 + line.y2) / 2;

                  return (
                    <g key={line.id} className="group">
                      {/* Interactive Wide Line for easy clicking/touching */}
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="transparent"
                        strokeWidth={24 / zoom}
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
                        strokeWidth={(isSelected ? 5.5 : 3.5) / zoom}
                        strokeLinecap="round"
                      />

                      {/* Line Endpoints */}
                      <circle
                        cx={line.x1}
                        cy={line.y1}
                        r={5.5 / zoom}
                        fill={isSelected ? '#f59e0b' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={1.5 / zoom}
                        onMouseDown={(e) => handleEndpointMouseDown(e, line, 'p1')}
                        className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      />

                      <circle
                        cx={line.x2}
                        cy={line.y2}
                        r={5.5 / zoom}
                        fill={isSelected ? '#f59e0b' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth={1.5 / zoom}
                        onMouseDown={(e) => handleEndpointMouseDown(e, line, 'p2')}
                        className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
                      />

                      {/* MANDATORY ET-009A UX RULE: HIDE MEASUREMENTS BY DEFAULT! Show ONLY when line is selected! */}
                      {isSelected && (
                        <g transform={`translate(${midX}, ${midY})`}>
                          <rect
                            x={-50 / zoom}
                            y={-14 / zoom}
                            width={100 / zoom}
                            height={22 / zoom}
                            fill="#0f172a"
                            rx={4 / zoom}
                            stroke="#f59e0b"
                            strokeWidth={1.5 / zoom}
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fbbf24"
                            fontSize={10 / zoom}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {line.lengthMm}mm | {line.angleDeg}°
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Nova Trena Guiada Green Guide Line Reference (Requirements 6 & 7) */}
                {guideLineRef && (
                  <g>
                    <line
                      x1={guideLineRef.x1}
                      y1={guideLineRef.y1}
                      x2={guideLineRef.x2}
                      y2={guideLineRef.y2}
                      stroke="#22c55e"
                      strokeWidth={3.5 / zoom}
                      strokeDasharray="8 4"
                    />
                    <g transform={`translate(${(guideLineRef.x1 + guideLineRef.x2) / 2}, ${(guideLineRef.y1 + guideLineRef.y2) / 2})`}>
                      <rect
                        x={-60 / zoom}
                        y={-12 / zoom}
                        width={120 / zoom}
                        height={20 / zoom}
                        fill="#15803d"
                        rx={4 / zoom}
                        stroke="#22c55e"
                        strokeWidth={1.5 / zoom}
                      />
                      <text
                        x="0"
                        y="2 / zoom"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={10 / zoom}
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        📏 GUIA: {distanceMmValue}mm
                      </text>
                    </g>
                  </g>
                )}

                {/* Distance Marker Visual Dot */}
                {distanceMarker && (
                  <g>
                    <circle
                      cx={distanceMarker.x}
                      cy={distanceMarker.y}
                      r={12 / zoom}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={3 / zoom}
                      className="animate-ping opacity-75"
                    />
                    <circle
                      cx={distanceMarker.x}
                      cy={distanceMarker.y}
                      r={6 / zoom}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth={2 / zoom}
                    />
                    <g transform={`translate(${distanceMarker.x + 12 / zoom}, ${distanceMarker.y - 12 / zoom})`}>
                      <rect
                        x="0"
                        y="-12"
                        width={90 / zoom}
                        height={18 / zoom}
                        fill="#15803d"
                        rx={3 / zoom}
                      />
                      <text
                        x="5"
                        y="-2"
                        fill="#ffffff"
                        fontSize={9 / zoom}
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        📍 Marca: {distanceMmValue}mm
                      </text>
                    </g>
                  </g>
                )}

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

                {/* Snap Indicator */}
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

            {/* Bottom Canvas Helper Text */}
            <div className="absolute bottom-3 left-3 max-w-[50%] sm:max-w-none bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 flex items-center gap-2">
              <span className="text-amber-400 font-bold">Dica:</span>
              <span className="truncate">
                {activeTool === 'select' && 'Arraste com 1 dedo para mover | Toque em uma peça para selecionar.'}
                {activeTool === 'pan' && 'Arraste a tela para navegar pelo desenho.'}
                {activeTool === 'line' && 'Clique na tela para iniciar e finalize a linha.'}
              </span>
            </div>

            {/* CANVAS VIEW CONTROLS (RIGHT SIDE / LADO DIREITO): ➕ Zoom +, ➖ Zoom -, 🎯 Centralizar */}
            <div className="absolute bottom-20 lg:bottom-4 right-3 z-40 flex flex-col gap-1.5 bg-slate-900/95 border border-slate-700 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl">
              <button
                type="button"
                id="btn-zoom-in-fixed"
                onClick={() => setZoom(z => Math.min(z * 1.25, 3.0))}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl flex items-center justify-center font-bold text-lg shadow border border-slate-700 active:scale-95 transition cursor-pointer"
                title="Zoom +"
                aria-label="Zoom +"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                id="btn-zoom-out-fixed"
                onClick={() => setZoom(z => Math.max(z * 0.75, 0.05))}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl flex items-center justify-center font-bold text-lg shadow border border-slate-700 active:scale-95 transition cursor-pointer"
                title="Zoom -"
                aria-label="Zoom -"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <button
                type="button"
                id="btn-centralizar-fixed"
                onClick={() => handleCenterView(lines, true)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-lg border border-amber-400 active:scale-95 transition cursor-pointer"
                title="Centralizar"
                aria-label="Centralizar"
              >
                <Target className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARTÃO DE INFORMAÇÕES DA PEÇA (REQUIREMENT 4: ET-009C.1B) */}
      {selectedLineIds.length === 1 && selectedLine && (() => {
        const specs = estimatePieceSpecs(selectedLine.profile || defaultProfile, selectedLine.lengthMm);
        const profileName = selectedLine.profile || defaultProfile;
        const weightKg = specs.weightKg;
        const materialName = specs.profileObj?.category || 'Aço Carbono Preto';

        return (
          <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/98 border border-amber-500/80 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2.5 w-[92vw] max-w-md text-white animate-fadeIn">
            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-amber-400 font-bold text-[10px] font-mono uppercase tracking-wider block">Metalon</span>
                <span className="text-sm font-extrabold text-slate-100">{profileName}</span>
              </div>
              <button
                type="button"
                onClick={() => selectSingleLine(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Comprimento</span>
                <span className="font-bold text-amber-300">{selectedLine.lengthMm} mm</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Peso Est.</span>
                <span className="font-bold text-emerald-400">{weightKg} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Material</span>
                <span className="font-bold text-sky-300 text-[11px] truncate block">{materialName}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setEditLengthInput(selectedLine.lengthMm.toString());
                  setIsEditLengthModalOpen(true);
                }}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow"
              >
                <Ruler className="w-4 h-4" />
                <span>📐 Alterar Medida</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditProfileInput(selectedLine.profile || defaultProfile);
                  setIsEditProfileModalOpen(true);
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow"
              >
                <Box className="w-4 h-4" />
                <span>📦 Trocar Material</span>
              </button>

              <button
                type="button"
                onClick={handleCopySinglePiece}
                className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow active:scale-95"
              >
                <Copy className="w-4 h-4" />
                <span>📋 Copiar</span>
              </button>

              <button
                type="button"
                onClick={handleCutSinglePiece}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow active:scale-95"
              >
                <Scissors className="w-4 h-4" />
                <span>✂ Recortar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 transition cursor-pointer shadow"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑 Remover</span>
              </button>

              <button
                type="button"
                onClick={() => selectSingleLine(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl shrink-0 transition cursor-pointer"
              >
                <span>Fechar</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* MENU SIMPLES - MODO SELEÇÃO DE ÁREA (ET-009C.1D) */}
      {isSelectionMenuOpen && activeTool === 'area_select' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-blue-500/50 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square className="w-5 h-5 text-blue-100" />
                <h3 className="text-base font-bold font-display text-white">Modo Seleção de Área</h3>
              </div>
              <button
                type="button"
                onClick={handleExitSelectionMode}
                className="p-1 text-blue-200 hover:text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Options */}
            <div className="p-5 space-y-3 bg-slate-900">
              <p className="text-xs text-slate-300 font-medium">
                Como você deseja selecionar as peças no celular?
              </p>

              {/* Option 1: Ponto 1 e Ponto 2 (Recomendado) */}
              <button
                type="button"
                onClick={() => {
                  setSelectionSubMode('two_points');
                  setAreaCorner1(null);
                  setIsSelectionMenuOpen(false);
                  showToast("📍 Toque no primeiro canto (Ponto 1) no desenho.");
                }}
                className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/60 text-left transition flex items-center space-x-3.5 cursor-pointer shadow-lg group active:scale-[0.98]"
              >
                <span className="text-2xl p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 group-hover:scale-105 transition shadow">🟩</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Selecionar Ponto 1 e Ponto 2</span>
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Recomendado</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 leading-snug">
                    Toque no 1º canto e depois no 2º canto. Sem arrastar, extremamente fácil no celular!
                  </div>
                </div>
              </button>

              {/* Option 2: Desenhar Área por Arrasto */}
              <button
                type="button"
                onClick={() => {
                  setSelectionSubMode('drag');
                  setAreaCorner1(null);
                  setIsSelectionMenuOpen(false);
                  showToast("👆 Mantenha o dedo pressionado e arraste para envolver as peças.");
                }}
                className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-left transition flex items-center space-x-3.5 cursor-pointer shadow group active:scale-[0.98]"
              >
                <span className="text-2xl p-2.5 bg-slate-700 text-slate-200 rounded-xl shrink-0">⬜</span>
                <div>
                  <div className="text-sm font-bold text-white">Desenhar Área por Arrasto</div>
                  <div className="text-xs text-slate-400 mt-1 leading-snug">
                    Mantenha o dedo pressionado na tela e arraste formando um retângulo.
                  </div>
                </div>
              </button>

              {/* Option 3: Cancelar */}
              <button
                type="button"
                onClick={handleExitSelectionMode}
                className="w-full p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-rose-950/50 text-rose-400 font-bold text-xs text-center transition cursor-pointer active:scale-[0.98]"
              >
                ❌ Cancelar Seleção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BAR FOR GROUP SELECTION (ET-009C.1 / ET-009C.1D) */}
      {selectedLineIds.length > 1 && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-amber-500/80 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[95vw] overflow-x-auto">
          <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700 text-amber-400 font-bold text-xs shrink-0 font-mono">
            <Box className="w-4 h-4 text-amber-400" />
            <span>Grupo ({selectedLineIds.length} peças)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsGroupMoveModalOpen(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow"
          >
            <Move className="w-4 h-4" />
            <span>↔ Mover</span>
          </button>

          <button
            type="button"
            onClick={handleCopyGroup}
            className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow"
          >
            <Copy className="w-4 h-4" />
            <span>📋 Copiar</span>
          </button>

          <button
            type="button"
            onClick={handleCutGroup}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow"
          >
            <Scissors className="w-4 h-4" />
            <span>✂ Recortar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGroupProfileInput(defaultProfile);
              setIsGroupProfileModalOpen(true);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow"
          >
            <Box className="w-4 h-4" />
            <span>📦 Trocar Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGroupDeleteModalOpen(true)}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow"
          >
            <Trash2 className="w-4 h-4" />
            <span>🗑 Excluir</span>
          </button>

          <button
            type="button"
            onClick={handleExitSelectionMode}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl shrink-0 transition cursor-pointer"
          >
            <span>❌ Cancelar</span>
          </button>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION (REQUIREMENT 10) */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-amber-500/80 text-amber-300 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-bounce">
          <Info className="w-5 h-5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE FIXED BOTTOM TOOLBAR (ET-009C.1A: FERRAMENTAS - CELL PHONES) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 p-2 shadow-2xl flex items-center justify-around gap-1.5 px-3">
        {/* 1. Adicionar Peça */}
        <button
          type="button"
          onClick={() => setIsAddPieceModalOpen(true)}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-[10px] min-w-[62px] shrink-0 active:scale-95 transition shadow-md cursor-pointer"
        >
          <Plus className="w-5 h-5 mx-auto stroke-[2.5]" />
          <span>+ Peça</span>
        </button>

        {/* 2. Selecionar Área */}
        <button
          type="button"
          onClick={handleEnterAreaSelectMode}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-[10px] font-bold min-w-[62px] shrink-0 active:scale-95 transition border cursor-pointer ${
            activeTool === 'area_select' 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          <Square className="w-5 h-5 mx-auto" />
          <span>Área</span>
        </button>

        {/* 3. Trena */}
        <button
          type="button"
          onClick={handleStartDistanceTool}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] min-w-[62px] shrink-0 active:scale-95 transition shadow-md cursor-pointer"
        >
          <Ruler className="w-5 h-5 mx-auto" />
          <span>Trena</span>
        </button>

        {/* 4. Mover */}
        <button
          type="button"
          onClick={() => setActiveTool('pan')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-[10px] font-bold min-w-[62px] shrink-0 active:scale-95 transition border cursor-pointer ${
            activeTool === 'pan' 
              ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold shadow-md' 
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
          }`}
        >
          <Hand className="w-5 h-5 mx-auto" />
          <span>Mover</span>
        </button>

        {/* 5. Excluir */}
        <button
          type="button"
          disabled={selectedLineIds.length === 0}
          onClick={() => {
            if (selectedLineIds.length > 1) {
              setIsGroupDeleteModalOpen(true);
            } else {
              handleDeleteSelected();
            }
          }}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl text-[10px] font-bold min-w-[62px] shrink-0 transition border cursor-pointer ${
            selectedLineIds.length > 0 
              ? 'bg-rose-600 text-white border-rose-500 shadow-md' 
              : 'bg-slate-900/50 text-slate-600 border-slate-900 cursor-not-allowed opacity-50'
          }`}
        >
          <Trash2 className="w-5 h-5 mx-auto" />
          <span>Excluir</span>
        </button>
      </div>

      {/* MODAL 1: COMO USAR ("AJUDA PARA O SEU ZÉ") */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-display">Como Usar o Editor de Estruturas</h3>
              </div>
              <button onClick={handleDismissHelp} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50 text-slate-800">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                👋 Olá! O Editor foi desenhado para ser simples e rápido, direto para a oficina de serralheria.
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Escolha onde deseja marcar</h4>
                    <p className="text-slate-500 mt-0.5">Selecione o ponto de referência (topo, base, lados ou centro).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Informe a distância</h4>
                    <p className="text-slate-500 mt-0.5">Digite a medida em milímetros (exemplo: 400 mm).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Escolha a peça</h4>
                    <p className="text-slate-500 mt-0.5">Selecione se deseja barra horizontal, vertical, diagonal, porta ou janela.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <h4 className="font-bold text-slate-900">O Mestre Serralheiro faz o restante</h4>
                    <p className="text-slate-500 mt-0.5">O sistema calcula tudo, cria a barra e centraliza a visualização sozinho.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleDismissHelp}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer shadow-md"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMAÇÃO VOLTAR */}
      {isBackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold font-display flex items-center gap-2">
                <ChevronLeft className="w-5 h-5 text-amber-400" />
                <span>Voltar para o Projeto?</span>
              </h3>
            </div>

            <div className="p-6 bg-slate-50 text-slate-700 text-sm">
              <p>Você tem certeza de que deseja voltar? Todas as peças e posições atuais do seu desenho foram salvas na estrutura.</p>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBackModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                NÃO, CONTINUAR
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsBackModalOpen(false);
                  if (onNavigateBack) onNavigateBack();
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
              >
                SIM, VOLTAR
              </button>
            </div>
          </div>
        </div>
      )}



      {/* MODAL: ALTERAR MEDIDA DA PEÇA */}
      {isEditLengthModalOpen && selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-display">📐 Alterar Medida da Peça</h3>
              </div>
              <button onClick={() => setIsEditLengthModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <p className="text-xs text-slate-600">
                Informe a nova medida em milímetros (mm) para esta peça.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block font-mono">Nova Medida (mm):</label>
                <input
                  type="number"
                  value={editLengthInput}
                  onChange={(e) => setEditLengthInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Ex: 1200"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditLengthModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleApplyLineEdits();
                    setIsEditLengthModalOpen(false);
                    showToast("Medida atualizada com sucesso!");
                    setTimeout(() => handleCenterView(lines, true), 50);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Medida
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TROCAR MATERIAL DA PEÇA */}
      {isEditProfileModalOpen && selectedLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold font-display">📦 Trocar Material</h3>
              </div>
              <button onClick={() => setIsEditProfileModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <p className="text-xs text-slate-600">
                Escolha o perfil metálico para esta barra.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block font-mono">Perfil de Material:</label>
                <select
                  value={editProfileInput}
                  onChange={(e) => setEditProfileInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {materialProfiles.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} - {p.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleApplyLineEdits();
                    setIsEditProfileModalOpen(false);
                    showToast("Material trocado com sucesso!");
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar Troca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADICIONAR PEÇA À ESTRUTURA */}
      {isAddPieceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
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

            <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50">
              <button
                type="button"
                id="btn-add-travessa"
                onClick={() => handleAddPiece('travessa')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Travessa</h4>
                  <p className="text-xs text-slate-500 mt-1">Barra horizontal de travamento.</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-montante"
                onClick={() => handleAddPiece('montante')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-indigo-100 text-indigo-800 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Montante</h4>
                  <p className="text-xs text-slate-500 mt-1">Barra vertical de apoio ou divisão.</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-diagonal"
                onClick={() => handleAddPiece('diagonal')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-sky-100 text-sky-800 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition">
                  <Spline className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Diagonal</h4>
                  <p className="text-xs text-slate-500 mt-1">Mão-de-força em X para esquadro.</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-porta"
                onClick={() => handleAddPiece('porta')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Porta Social</h4>
                  <p className="text-xs text-slate-500 mt-1">Caixilho para porta (800x2000mm).</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-janela"
                onClick={() => handleAddPiece('janela')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-purple-100 text-purple-800 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition">
                  <Grid className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Janela</h4>
                  <p className="text-xs text-slate-500 mt-1">Caixilho de janela (1000x1000mm).</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-reforco"
                onClick={() => handleAddPiece('reforco')}
                className="bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-rose-100 text-rose-800 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">➕ Reforço</h4>
                  <p className="text-xs text-slate-500 mt-1">Mão francesa em ângulo de 45°.</p>
                </div>
              </button>

              <button
                type="button"
                id="btn-add-barra-livre"
                onClick={() => handleAddPiece('barra_livre')}
                className="sm:col-span-2 bg-amber-500 hover:bg-amber-400 border border-amber-600 rounded-xl p-4 text-left transition flex items-start space-x-3.5 shadow-md cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-3 bg-slate-950 text-amber-400 rounded-xl">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">➕ Desenhar Barra Livre</h4>
                  <p className="text-xs text-slate-900 mt-1 font-medium">
                    Ativa a ferramenta para criar uma barra manualmente clicando na tela.
                  </p>
                </div>
              </button>
            </div>

            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-end">
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

      {/* MODAL: EXCLUIR PEÇA (CONFIRMAÇÃO - REQUISITO 8) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-rose-950 text-white px-6 py-4 border-b border-rose-900 flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">Excluir Peça</h3>
                <p className="text-xs text-rose-300">Confirmação de segurança</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 text-slate-800 text-sm font-medium space-y-2">
              <p className="text-base font-bold text-slate-900">Deseja realmente excluir esta peça?</p>
              <p className="text-xs text-slate-500">
                Esta ação removerá a barra do desenho e atualizará a lista de corte e o orçamento.
              </p>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                NÃO
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md active:scale-95"
              >
                SIM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 1: ADICIONAR BARRA HORIZONTAL (REQUISITO 1) */}
      {activeAddPieceType === 'travessa' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-display">Adicionar Barra Horizontal</h3>
              </div>
              <button onClick={() => setActiveAddPieceType(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">
                  Onde deseja colocar?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setHorizRef('topo')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      horizRef === 'topo'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⬆️</span>
                    <span>A partir do topo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHorizRef('centro')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      horizRef === 'centro'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⏺️</span>
                    <span>A partir do centro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHorizRef('base')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      horizRef === 'base'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⬇️</span>
                    <span>A partir da base</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-1">
                  Informe a distância (mm):
                </label>
                <input
                  type="number"
                  value={horizDist}
                  onChange={(e) => setHorizDist(e.target.value)}
                  placeholder="Ex: 400"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 A barra atravessará automaticamente toda a estrutura com o comprimento calculado pelo Mestre.
                </p>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAddPieceType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddHorizontalBar}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Criar Barra Horizontal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: ADICIONAR BARRA VERTICAL (REQUISITO 2) */}
      {activeAddPieceType === 'montante' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold font-display">Adicionar Barra Vertical</h3>
              </div>
              <button onClick={() => setActiveAddPieceType(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">
                  A partir de qual lado?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setVertRef('esquerda')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      vertRef === 'esquerda'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⬅️</span>
                    <span>Esquerda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVertRef('centro')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      vertRef === 'centro'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>⏺️</span>
                    <span>Centro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVertRef('direita')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      vertRef === 'direita'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>➡️</span>
                    <span>Direita</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-1">
                  Informe a distância (mm):
                </label>
                <input
                  type="number"
                  value={vertDist}
                  onChange={(e) => setVertDist(e.target.value)}
                  placeholder="Ex: 600"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 A barra vertical será criada com a altura exata da estrutura.
                </p>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAddPieceType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddVerticalBar}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Criar Barra Vertical
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: ADICIONAR DIAGONAL (REQUISITO 3) */}
      {activeAddPieceType === 'diagonal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Spline className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold font-display">Adicionar Diagonal</h3>
              </div>
              <button onClick={() => setActiveAddPieceType(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">
                  Qual diagonal deseja?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiagType('BL_TR')}
                    className={`p-4 rounded-xl border text-sm font-bold transition flex flex-col items-center gap-2 cursor-pointer ${
                      diagType === 'BL_TR'
                        ? 'bg-sky-500 text-slate-950 border-sky-600 shadow-md font-extrabold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-3xl font-mono">◢</span>
                    <span className="text-xs text-center">Baixo-Esquerda ➔ Cima-Direita</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagType('TL_BR')}
                    className={`p-4 rounded-xl border text-sm font-bold transition flex flex-col items-center gap-2 cursor-pointer ${
                      diagType === 'TL_BR'
                        ? 'bg-sky-500 text-slate-950 border-sky-600 shadow-md font-extrabold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-3xl font-mono">◣</span>
                    <span className="text-xs text-center">Cima-Esquerda ➔ Baixo-Direita</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">
                  Diagonal completa?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDiagFull(true)}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      diagFull
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ○ Sim (Ponta a ponta)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiagFull(false)}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      !diagFull
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ○ Não (Informar offsets)
                  </button>
                </div>
              </div>

              {!diagFull && (
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Distância Início (mm):</label>
                    <input
                      type="number"
                      value={diagStartOffset}
                      onChange={(e) => setDiagStartOffset(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Distância Fim (mm):</label>
                    <input
                      type="number"
                      value={diagEndOffset}
                      onChange={(e) => setDiagEndOffset(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold font-mono text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAddPieceType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddDiagonal}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Criar Diagonal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: COLOCAR PORTA (REQUISITO 4) */}
      {activeAddPieceType === 'porta' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-display">Colocar Porta</h3>
              </div>
              <button onClick={() => setActiveAddPieceType(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold font-mono text-slate-900 block mb-1">Largura (mm):</label>
                  <input
                    type="number"
                    value={doorWidth}
                    onChange={(e) => setDoorWidth(e.target.value)}
                    placeholder="800"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold font-mono text-slate-900 block mb-1">Altura (mm):</label>
                  <input
                    type="number"
                    value={doorHeight}
                    onChange={(e) => setDoorHeight(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">Posição:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDoorPos('esquerda')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                      doorPos === 'esquerda'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Esquerda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoorPos('centro')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                      doorPos === 'centro'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Centro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoorPos('direita')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                      doorPos === 'direita'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>Direita</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-2">Abrirá para:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDoorOpenDir('esquerda')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      doorOpenDir === 'esquerda'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>⬅ Esquerda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDoorOpenDir('direita')}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      doorOpenDir === 'direita'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>➡ Direita</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAddPieceType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddDoor}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Criar Porta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 5: COLOCAR JANELA (REQUISITO 5) */}
      {activeAddPieceType === 'janela' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold font-display">Colocar Janela</h3>
              </div>
              <button onClick={() => setActiveAddPieceType(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold font-mono text-slate-900 block mb-1">Largura (mm):</label>
                  <input
                    type="number"
                    value={winWidth}
                    onChange={(e) => setWinWidth(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold font-mono text-slate-900 block mb-1">Altura (mm):</label>
                  <input
                    type="number"
                    value={winHeight}
                    onChange={(e) => setWinHeight(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold font-mono text-slate-900 block mb-1">
                  Quantidade de divisões:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={winDivs}
                  onChange={(e) => setWinDivs(e.target.value)}
                  placeholder="1"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base font-bold font-mono text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 A janela será gerada com o caixilho e divisões montadas automaticamente.
                </p>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveAddPieceType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmAddWindow}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Criar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRENA GUIADA (PROBLEMA 2: ET-009C.1C) */}
      {isDistanceModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Ruler className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">Trena Guiada de Precisão</h3>
                  <span className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider block">
                    {distanceStep === 'choose_ref' && 'Passo 1 de 3: Escolher Referência'}
                    {distanceStep === 'input_dist' && 'Passo 2 de 3: Informar Medida'}
                    {distanceStep === 'choose_piece' && 'Passo 3 de 3: Selecionar Peça'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDistanceModalOpen(false);
                  setGuideLineRef(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 bg-slate-50">
              {/* PASSO 1: Escolher Referência */}
              {distanceStep === 'choose_ref' && (
                <div className="space-y-4">
                  <div className="text-slate-800">
                    <h4 className="text-sm font-bold text-slate-900">1. Escolha a Referência no Desenho</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecione a partir de qual ponto ou borda da estrutura a medida será calculada:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSelectTrenaRef('topo')}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        trenaRefPoint === 'topo'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">⬆️</span>
                      <div>
                        <div className="text-xs font-bold">Topo da Estrutura</div>
                        <div className={`text-[10px] ${trenaRefPoint === 'topo' ? 'text-indigo-100' : 'text-slate-500'}`}>Medir a partir da borda superior</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTrenaRef('base')}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        trenaRefPoint === 'base'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">⬇️</span>
                      <div>
                        <div className="text-xs font-bold">Base da Estrutura</div>
                        <div className={`text-[10px] ${trenaRefPoint === 'base' ? 'text-indigo-100' : 'text-slate-500'}`}>Medir a partir do chão/fundo</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTrenaRef('esquerda')}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        trenaRefPoint === 'esquerda'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">⬅️</span>
                      <div>
                        <div className="text-xs font-bold">Lado Esquerdo</div>
                        <div className={`text-[10px] ${trenaRefPoint === 'esquerda' ? 'text-indigo-100' : 'text-slate-500'}`}>Medir da extremidade esquerda</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTrenaRef('direita')}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        trenaRefPoint === 'direita'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">➡️</span>
                      <div>
                        <div className="text-xs font-bold">Lado Direito</div>
                        <div className={`text-[10px] ${trenaRefPoint === 'direita' ? 'text-indigo-100' : 'text-slate-500'}`}>Medir da extremidade direita</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectTrenaRef('centro')}
                      className={`sm:col-span-2 p-3.5 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                        trenaRefPoint === 'centro'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">⭕</span>
                      <div>
                        <div className="text-xs font-bold">Centro da Estrutura</div>
                        <div className={`text-[10px] ${trenaRefPoint === 'centro' ? 'text-indigo-100' : 'text-slate-500'}`}>Medir a partir do eixo central</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2: Informar Medida & Ver Guia Verde */}
              {distanceStep === 'input_dist' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">2. Informe a Medida da Marca</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Referência selecionada: <strong className="text-indigo-600 uppercase font-mono">{trenaRefPoint}</strong>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <label className="text-xs font-bold font-mono text-slate-800 block">
                      Distância em milímetros (mm):
                    </label>
                    <input
                      type="number"
                      value={distanceMmValue}
                      onChange={(e) => handleDistanceInputChange(e.target.value)}
                      placeholder="Ex: 400"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Banner Guia Verde no Desenho */}
                  <div className="bg-emerald-950 text-emerald-100 border border-emerald-600/80 p-3.5 rounded-xl text-xs flex items-center gap-3 shadow-md">
                    <span className="text-2xl shrink-0">🟢</span>
                    <div>
                      <span className="font-bold block text-emerald-300">Linha Guia Verde Ativa no Desenho</span>
                      <span className="text-[11px] text-emerald-200/90">
                        A linha de referência verde foi projetada exatamente a {distanceMmValue}mm do {trenaRefPoint}.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3 & 4: Escolher Peça para Colocar */}
              {distanceStep === 'choose_piece' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">3. O que deseja colocar nesta marca ({distanceMmValue}mm)?</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      A peça será instalada e ajustada automaticamente no desenho:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('travessa')}
                      className="bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition">🟩</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Barra Horizontal</div>
                        <div className="text-[10px] text-slate-500">Travessa horizontal na linha guia</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('montante')}
                      className="bg-white hover:bg-sky-50/80 border border-slate-200 hover:border-sky-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-sky-100 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition">🟦</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Barra Vertical</div>
                        <div className="text-[10px] text-slate-500">Montante vertical na posição</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('diagonal')}
                      className="bg-white hover:bg-rose-50/80 border border-slate-200 hover:border-rose-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-rose-100 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition">🟥</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Diagonal</div>
                        <div className="text-[10px] text-slate-500">Mão-de-força em 45° na marca</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('porta')}
                      className="bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-amber-100 rounded-lg group-hover:bg-amber-500 group-hover:text-slate-950 transition">🚪</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Porta Social</div>
                        <div className="text-[10px] text-slate-500">Caixilho de porta (800x2000mm)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('janela')}
                      className="bg-white hover:bg-purple-50/80 border border-slate-200 hover:border-purple-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition">🪟</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Janela</div>
                        <div className="text-[10px] text-slate-500">Caixilho de janela (1000x1000mm)</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddPieceAtTrenaMarker('reforco')}
                      className="bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-500 rounded-xl p-3.5 text-left transition flex items-center space-x-3 cursor-pointer shadow-xs group active:scale-[0.98]"
                    >
                      <span className="text-2xl p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition">📦</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Reforço de Canto</div>
                        <div className="text-[10px] text-slate-500">Mão francesa em 45° (300mm)</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-2">
              {distanceStep === 'choose_ref' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDistanceModalOpen(false);
                    setGuideLineRef(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              {distanceStep === 'input_dist' && (
                <>
                  <button
                    type="button"
                    onClick={() => setDistanceStep('choose_ref')}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ⬅ Alterar Referência
                  </button>
                  <button
                    type="button"
                    onClick={() => setDistanceStep('choose_piece')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Avançar para Escolher Peça ➔
                  </button>
                </>
              )}

              {distanceStep === 'choose_piece' && (
                <>
                  <button
                    type="button"
                    onClick={() => setDistanceStep('input_dist')}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    ⬅ Alterar Medida
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDistanceModalOpen(false);
                      setGuideLineRef(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOVER GRUPO DE PEÇAS (ET-009C.1) */}
      {isGroupMoveModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-indigo-400 font-display">
                <Move className="w-5 h-5" />
                Mover Grupo ({selectedLineIds.length} peças)
              </h3>
              <button
                onClick={() => setIsGroupMoveModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Distância do Deslocamento (mm)
              </label>
              <input
                type="number"
                value={groupMoveDist}
                onChange={(e) => setGroupMoveDist(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-2">
                Clique na Direção para Mover:
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleMoveGroup(0, -(parseFloat(groupMoveDist) || 100))}
                  className="py-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <span>⬆️ Para Cima</span>
                </button>
                <button
                  onClick={() => handleMoveGroup(0, parseFloat(groupMoveDist) || 100)}
                  className="py-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <span>⬇️ Para Baixo</span>
                </button>
                <button
                  onClick={() => handleMoveGroup(-(parseFloat(groupMoveDist) || 100), 0)}
                  className="py-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <span>⬅️ Esquerda</span>
                </button>
                <button
                  onClick={() => handleMoveGroup(parseFloat(groupMoveDist) || 100, 0)}
                  className="py-3 bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
                >
                  <span>➡️ Direita</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsGroupMoveModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TROCAR PERFIL DO GRUPO (ET-009C.1) */}
      {isGroupProfileModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2 text-amber-400 font-display">
                <Box className="w-5 h-5" />
                Trocar Perfil do Grupo ({selectedLineIds.length} peças)
              </h3>
              <button
                onClick={() => setIsGroupProfileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Selecione o Novo Material:
              </label>
              <select
                value={groupProfileInput || defaultProfile}
                onChange={(e) => setGroupProfileInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              >
                {materialProfiles.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.thicknessMm}mm) - R${p.costPerMeter}/m
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsGroupProfileModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGroupProfile}
                className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Aplicar Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR GRUPO DE PEÇAS (ET-009C.1) */}
      {isGroupDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-bold text-base font-display">Excluir {selectedLineIds.length} Peças?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Todas as peças do grupo selecionado serão removidas da estrutura.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setIsGroupDeleteModalOpen(false)}
                className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                NÃO, Cancelar
              </button>
              <button
                onClick={handleConfirmGroupDelete}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg"
              >
                SIM, Excluir Peças
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
