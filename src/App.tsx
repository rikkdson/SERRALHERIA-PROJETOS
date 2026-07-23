/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Folder, 
  ChevronLeft, 
  Save, 
  Trash2, 
  Ruler, 
  Clock, 
  CheckCircle, 
  Construction, 
  AlertCircle, 
  Hammer, 
  Info,
  Layers,
  Sparkles,
  Calendar,
  Settings,
  Flame,
  LayoutGrid,
  Scissors,
  Check,
  X,
  Edit2,
  Copy,
  GitBranch,
  DoorOpen,
  Slash,
  Columns,
  Rows,
  Shield,
  Menu,
  Tags,
  Zap,
  Box,
  DollarSign,
  Compass,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MetalProject, 
  FrameConfig, 
  MeasurementUnit, 
  PRESET_PROFILES, 
  PieceConfig, 
  PieceType, 
  PIECE_TYPE_LABELS,
  MaterialProfile 
} from './types';
import { ProjectBlueprint } from './components/ProjectBlueprint';
import { CutListModule } from './components/CutListModule';
import { BarOptimizationModule } from './components/BarOptimizationModule';
import { MaterialsLibraryModule } from './components/MaterialsLibraryModule';
import { BudgetModule } from './components/BudgetModule';
import { PriceCenterModule } from './components/PriceCenterModule';
import { GeometricEngineModule } from './components/GeometricEngineModule';
import { FreeDrawingModule } from './components/FreeDrawingModule';
import { StructureAssistantModule } from './components/StructureAssistantModule';
import { CategorizedHeaderNav } from './components/CategorizedHeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QuickActionFabModal } from './components/QuickActionFabModal';
import { getMaterialProfiles, MATERIALS_UPDATED_EVENT } from './utils/materialsStore';

// Initial pre-loaded projects for a premium, zero-friction first-use experience
const DEFAULT_PROJECTS: MetalProject[] = [
  {
    id: 'proj-1',
    name: 'Portão da casa',
    status: 'planejamento',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    frame: {
      width: 2400,
      height: 1800,
      displayUnit: 'cm',
      displayWidth: 240,
      displayHeight: 180,
      profile: 'Metalon 40x40 mm'
    }
  },
  {
    id: 'proj-2',
    name: 'Janela da sala',
    status: 'em_producao',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    frame: {
      width: 1500,
      height: 1200,
      displayUnit: 'mm',
      displayWidth: 1500,
      displayHeight: 1200,
      profile: 'Metalon 30x30 mm'
    }
  },
  {
    id: 'proj-3',
    name: 'Prateleira Industrial',
    status: 'concluido',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    frame: {
      width: 800,
      height: 1600,
      displayUnit: 'm',
      displayWidth: 0.8,
      displayHeight: 1.6,
      profile: 'Metalon 20x20 mm'
    }
  },
  {
    // Prepopulated project without a frame to explicitly let the user try adding a frame immediately
    id: 'proj-4',
    name: 'Estrutura do telhado',
    status: 'planejamento',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // No frame set yet, to prompt user to "+ ADICIONAR QUADRO"
  }
];

export default function App() {
  // State variables
  const [projects, setProjects] = useState<MetalProject[]>([]);
  const [currentProject, setCurrentProject] = useState<MetalProject | null>(null);
  const [activeTab, setActiveTab] = useState<'meus-projetos' | 'detalhes-projeto' | 'biblioteca-materiais' | 'central-precos' | 'motor-geometrico' | 'desenho-livre' | 'assistente-estruturas'>('assistente-estruturas');
  const [projectSubTab, setProjectSubTab] = useState<'estrutura' | 'desenho-livre' | 'lista-corte' | 'otimizacao-barras' | 'orcamento'>('estrutura');
  
  // Material Profiles from Library (ET-006)
  const [materialProfiles, setMaterialProfiles] = useState<MaterialProfile[]>([]);

  useEffect(() => {
    setMaterialProfiles(getMaterialProfiles());

    const handleMaterialsUpdate = () => {
      setMaterialProfiles(getMaterialProfiles());
    };

    window.addEventListener(MATERIALS_UPDATED_EVENT, handleMaterialsUpdate);
    return () => {
      window.removeEventListener(MATERIALS_UPDATED_EVENT, handleMaterialsUpdate);
    };
  }, []);
  
  // Modals & form states
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isQuickFabOpen, setIsQuickFabOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<MetalProject | null>(null);
  
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [frameWidth, setFrameWidth] = useState<string>('');
  const [frameHeight, setFrameHeight] = useState<string>('');
  const [frameUnit, setFrameUnit] = useState<MeasurementUnit>('mm');
  const [frameProfile, setFrameProfile] = useState<string>('Metalon 30x30 mm');
  const [customProfile, setCustomProfile] = useState<string>('');
  const [isCustomProfileActive, setIsCustomProfileActive] = useState<boolean>(false);

  // Draft pieces state for structural changes
  const [draftPieces, setDraftPieces] = useState<PieceConfig[]>([]);
  const [hasStructuralChanges, setHasStructuralChanges] = useState(false);
  const [highlightedPieceId, setHighlightedPieceId] = useState<string | null>(null);

  // Piece configuration modal states
  const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);
  const [pieceModalStep, setPieceModalStep] = useState<'select_type' | 'configure_form'>('select_type');
  const [editingPiece, setEditingPiece] = useState<PieceConfig | null>(null);

  // Piece form fields
  const [pieceName, setPieceName] = useState('');
  const [pieceType, setPieceType] = useState<PieceType>('travessa');
  const [pieceProfile, setPieceProfile] = useState('');
  const [pieceLength, setPieceLength] = useState('');
  const [pieceWidth, setPieceWidth] = useState('');
  const [pieceHeight, setPieceHeight] = useState('');
  const [pieceThickness, setPieceThickness] = useState('');
  const [piecePosX, setPiecePosX] = useState('');
  const [piecePosY, setPiecePosY] = useState('');
  const [pieceOrientation, setPieceOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [pieceAngle, setPieceAngle] = useState('0');
  const [pieceObservations, setPieceObservations] = useState('');

  // Special Diagonal fields
  const [diagonalStart, setDiagonalStart] = useState('Inferior Esquerdo');
  const [diagonalEnd, setDiagonalEnd] = useState('Superior Direito');
  const [diagonalDirection, setDiagonalDirection] = useState<'/' | '\\'>('\\');
  const [diagonalAngle, setDiagonalAngle] = useState('45');
  const [diagonalLength, setDiagonalLength] = useState('');

  // Special Leaf fields
  const [leafQuantity, setLeafQuantity] = useState('1');
  const [leafType, setLeafType] = useState<'esquerda' | 'direita' | 'dupla' | 'deslizante' | 'basculante'>('esquerda');

  // Smart Fill (Preenchimento Inteligente) Modal states
  const [isFillModalOpen, setIsFillModalOpen] = useState(false);
  const [fillType, setFillType] = useState<'vertical' | 'horizontal'>('vertical');
  const [fillProfile, setFillProfile] = useState('Metalon 20x20 mm');
  const [customFillProfile, setCustomFillProfile] = useState('');
  const [isCustomFillProfileActive, setIsCustomFillProfileActive] = useState(false);
  const [fillSpacing, setFillSpacing] = useState('100'); // Desired spacing in mm
  const [isCustomFillSpacing, setIsCustomFillSpacing] = useState(false);
  const [customFillSpacingVal, setCustomFillSpacingVal] = useState('');
  const [fillDistribution, setFillDistribution] = useState<'auto' | 'exact'>('auto');

  // State for preview calculations
  const [previewFillPieces, setPreviewFillPieces] = useState<PieceConfig[]>([]);
  const [previewFillSpacingReal, setPreviewFillSpacingReal] = useState<number>(0);
  const [previewFillCount, setPreviewFillCount] = useState<number>(0);
  const [previewFillInnerWidth, setPreviewFillInnerWidth] = useState<number>(0);

  // Derived calculations for Smart Fill (ET-003A.1)
  const activeFillProfile = isCustomFillProfileActive ? customFillProfile : fillProfile;
  const desiredFillSpacingMm = parseFloat(isCustomFillSpacing ? customFillSpacingVal : fillSpacing) || 100;
  const totalFillLengthMm = previewFillCount * (previewFillPieces[0]?.length || 0);
  const totalFillMeters = totalFillLengthMm / 1000;
  const fillBarsNeeded = Math.ceil(totalFillMeters / 6);
  const isFillSpacingVeryClose = Math.abs(previewFillSpacingReal - desiredFillSpacingMm) <= 5;

  // Helper to parse profile size from profile name (e.g., "Metalon 30x20 mm" -> 30)
  const parseProfileThickness = (profileName: string): number => {
    let thicknessVal = 30; // Default fallback
    const match = profileName.match(/(\d+)x(\d+)/);
    if (match) {
      thicknessVal = parseInt(match[1]);
    }
    return thicknessVal;
  };

  // Calculate preview fill pieces in real-time
  useEffect(() => {
    if (!isFillModalOpen || !currentProject || !currentProject.frame) {
      setPreviewFillPieces([]);
      return;
    }

    const { width: fWidth, height: fHeight, profile: fProfile } = currentProject.frame;
    const frameProfileThickness = parseProfileThickness(fProfile);
    const innerWidth = fWidth - 2 * frameProfileThickness;
    const innerHeight = fHeight - 2 * frameProfileThickness;

    const fillProfileName = isCustomFillProfileActive ? customFillProfile : fillProfile;
    const fillProfileWidth = parseProfileThickness(fillProfileName);
    const desiredSpacingMm = parseFloat(isCustomFillSpacing ? customFillSpacingVal : fillSpacing) || 100;

    let N = 0;
    let realSpacing = desiredSpacingMm;
    const pieces: PieceConfig[] = [];

    if (fillDistribution === 'auto') {
      N = Math.round((innerWidth - desiredSpacingMm) / (fillProfileWidth + desiredSpacingMm));
      if (N < 1) N = 1;
      realSpacing = (innerWidth - N * fillProfileWidth) / (N + 1);

      for (let i = 0; i < N; i++) {
        const posX = frameProfileThickness + realSpacing + i * (fillProfileWidth + realSpacing);
        pieces.push({
          id: `preview-fill-${i}`,
          name: `Metalon ${String(i + 1).padStart(2, '0')}`,
          type: 'coluna',
          profile: fillProfileName,
          length: innerHeight,
          width: fillProfileWidth,
          height: fillProfileWidth,
          thickness: fillProfileWidth,
          posX: posX,
          posY: frameProfileThickness,
          orientation: 'vertical',
          angle: 0,
          observations: 'Preenchimento Vertical',
          fillGroupId: 'preview-fill',
        });
      }
    } else {
      N = Math.floor((innerWidth + desiredSpacingMm) / (fillProfileWidth + desiredSpacingMm));
      if (N < 1) N = 1;
      const patternWidth = N * fillProfileWidth + (N - 1) * desiredSpacingMm;
      const margin = (innerWidth - patternWidth) / 2;
      realSpacing = desiredSpacingMm;

      for (let i = 0; i < N; i++) {
        const posX = frameProfileThickness + margin + i * (fillProfileWidth + desiredSpacingMm);
        pieces.push({
          id: `preview-fill-${i}`,
          name: `Metalon ${String(i + 1).padStart(2, '0')}`,
          type: 'coluna',
          profile: fillProfileName,
          length: innerHeight,
          width: fillProfileWidth,
          height: fillProfileWidth,
          thickness: fillProfileWidth,
          posX: posX,
          posY: frameProfileThickness,
          orientation: 'vertical',
          angle: 0,
          observations: 'Preenchimento Vertical',
          fillGroupId: 'preview-fill',
        });
      }
    }

    setPreviewFillPieces(pieces);
    setPreviewFillCount(N);
    setPreviewFillSpacingReal(realSpacing);
    setPreviewFillInnerWidth(innerWidth);
  }, [
    isFillModalOpen,
    currentProject?.frame?.width,
    currentProject?.frame?.height,
    currentProject?.frame?.profile,
    fillProfile,
    customFillProfile,
    isCustomFillProfileActive,
    fillSpacing,
    isCustomFillSpacing,
    customFillSpacingVal,
    fillDistribution,
  ]);

  // Synchronize draft pieces with project state
  useEffect(() => {
    if (currentProject) {
      setDraftPieces(currentProject.pieces || []);
      setHasStructuralChanges(false);
      setHighlightedPieceId(null);
    } else {
      setDraftPieces([]);
      setHasStructuralChanges(false);
      setHighlightedPieceId(null);
    }
  }, [currentProject?.id]);

  // Convert mm to selected display unit
  const convertFromMillimeters = (value: number, unit: MeasurementUnit): number => {
    switch (unit) {
      case 'm':
        return value / 1000;
      case 'cm':
        return value / 10;
      case 'mm':
      default:
        return value;
    }
  };

  // Populate dynamic default fields based on selected piece type
  const applyPieceTypeDefaults = (type: PieceType) => {
    setPieceType(type);
    const displayUnit = currentProject?.frame?.displayUnit || 'mm';
    const fWidth = currentProject?.frame?.displayWidth || 0;
    const fHeight = currentProject?.frame?.displayHeight || 0;
    const profileName = currentProject?.frame?.profile || 'Metalon 30x30 mm';
    
    let thicknessVal = 30;
    const match = profileName.match(/(\d+)x(\d+)/);
    if (match) {
      thicknessVal = parseInt(match[1]);
    }

    const displayThickness = displayUnit === 'm' ? thicknessVal / 1000 : displayUnit === 'cm' ? thicknessVal / 10 : thicknessVal;

    setPieceProfile(profileName);
    setPieceThickness(displayThickness.toString());
    setPieceWidth(displayThickness.toString());
    setPieceHeight(displayThickness.toString());
    setPieceAngle('0');
    setPieceObservations('');

    const pieceCount = draftPieces.filter(p => p.type === type).length + 1;

    switch (type) {
      case 'quadro_interno':
        setPieceName(`Quadro Interno ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength((fWidth * 0.9).toFixed(1));
        setPiecePosX((fWidth * 0.05).toFixed(1));
        setPiecePosY((fHeight * 0.05).toFixed(1));
        break;
      case 'divisao_vertical':
        setPieceName(`Divisão Vertical ${pieceCount}`);
        setPieceOrientation('vertical');
        setPieceLength(fHeight.toString());
        setPiecePosX((fWidth / 2).toString());
        setPiecePosY('0');
        break;
      case 'divisao_horizontal':
        setPieceName(`Divisão Horizontal ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength(fWidth.toString());
        setPiecePosX('0');
        setPiecePosY((fHeight / 2).toString());
        break;
      case 'travessa':
        setPieceName(`Travessa ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength(fWidth.toString());
        setPiecePosX('0');
        setPiecePosY('0');
        break;
      case 'coluna':
        setPieceName(`Coluna ${pieceCount}`);
        setPieceOrientation('vertical');
        setPieceLength(fHeight.toString());
        setPiecePosX('0');
        setPiecePosY('0');
        break;
      case 'diagonal':
        setPieceName(`Diagonal ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength(fWidth.toString());
        setPieceHeight(fHeight.toString());
        setPiecePosX('0');
        setPiecePosY('0');
        setDiagonalDirection('\\');
        setDiagonalStart('Superior Esquerdo');
        setDiagonalEnd('Inferior Direito');
        const deg = (Math.atan2(fHeight, fWidth) * 180 / Math.PI).toFixed(1);
        setDiagonalAngle(deg);
        const len = Math.sqrt(fWidth * fWidth + fHeight * fHeight).toFixed(1);
        setDiagonalLength(len);
        break;
      case 'reforco':
        setPieceName(`Reforço ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength((fWidth * 0.25).toFixed(1));
        setPiecePosX('0');
        setPiecePosY('0');
        break;
      case 'folha_porta':
      case 'folha_portao':
      case 'folha_janela':
        const baseName = type === 'folha_porta' ? 'Folha Porta' : type === 'folha_portao' ? 'Folha Portão' : 'Folha Janela';
        setPieceName(`${baseName} ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength((fWidth / 2).toString());
        setPieceHeight(fHeight.toString());
        setPiecePosX('0');
        setPiecePosY('0');
        setLeafQuantity('1');
        setLeafType('esquerda');
        break;
      case 'perfil_personalizado':
      default:
        setPieceName(`Perfil Customizado ${pieceCount}`);
        setPieceOrientation('horizontal');
        setPieceLength((fWidth / 2).toString());
        setPiecePosX((fWidth / 4).toString());
        setPiecePosY((fHeight / 2).toString());
        break;
    }
  };

  // Load projects from localStorage or default presets
  useEffect(() => {
    const stored = localStorage.getItem('serralheria_projetos');
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing stored projects, falling back to defaults", e);
        setProjects(DEFAULT_PROJECTS);
        localStorage.setItem('serralheria_projetos', JSON.stringify(DEFAULT_PROJECTS));
      }
    } else {
      setProjects(DEFAULT_PROJECTS);
      localStorage.setItem('serralheria_projetos', JSON.stringify(DEFAULT_PROJECTS));
    }
  }, []);

  // Save projects helper
  const saveProjectsToLocalStorage = (updatedList: MetalProject[]) => {
    setProjects(updatedList);
    localStorage.setItem('serralheria_projetos', JSON.stringify(updatedList));
  };

  // Format date helper in Portuguese
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handler: Create new project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: MetalProject = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      status: 'planejamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Prepared empty fields for future updates:
      pieces: [],
      diagonals: [],
      divisions: [],
      leaves: [],
      calculations: {},
      cutList: []
    };

    const updatedProjects = [newProject, ...projects];
    saveProjectsToLocalStorage(updatedProjects);
    
    // Reset state & navigate directly to the project detail view
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
    setCurrentProject(newProject);
    setActiveTab('detalhes-projeto');
  };

  // Handler: Save active project changes (status, frames, details)
  const handleSaveActiveProject = (updatedProj: MetalProject) => {
    updatedProj.updatedAt = new Date().toISOString();
    
    // Ensure if project doesn't exist in array yet, add it
    const exists = projects.some(p => p.id === updatedProj.id);
    const updatedProjects = exists
      ? projects.map(p => p.id === updatedProj.id ? updatedProj : p)
      : [updatedProj, ...projects];

    saveProjectsToLocalStorage(updatedProjects);
    setCurrentProject(updatedProj);
  };

  // Handler: Generate structure via assistant and navigate to Free Drawing
  const handleGenerateAndOpenDrawing = (updatedProj: MetalProject) => {
    handleSaveActiveProject(updatedProj);
    setCurrentProject(updatedProj);
    setDraftPieces(updatedProj.pieces || []);
    setActiveTab('desenho-livre');
    setProjectSubTab('desenho-livre');
  };

  // Handler: Initiate Delete project
  const handleDeleteProject = (proj: MetalProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent opening the project when clicking delete card
    setProjectToDelete(proj);
  };

  // Handler: Confirm deletion of project
  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    const targetId = projectToDelete.id;
    const filtered = projects.filter(p => p.id !== targetId);
    saveProjectsToLocalStorage(filtered);
    
    if (currentProject?.id === targetId) {
      setCurrentProject(null);
      setActiveTab('meus-projetos');
    }
    
    setProjectToDelete(null);
  };

  // Handler: Save Piece Configuration
  const handleSavePiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const unit = currentProject.frame?.displayUnit || 'mm';

    // Parse values from display unit input to numbers
    const lenVal = parseFloat(pieceLength.replace(',', '.')) || 0;
    const widthVal = parseFloat(pieceWidth.replace(',', '.')) || 0;
    const heightVal = parseFloat(pieceHeight.replace(',', '.')) || 0;
    const thickVal = parseFloat(pieceThickness.replace(',', '.')) || 0;
    const posXVal = parseFloat(piecePosX.replace(',', '.')) || 0;
    const posYVal = parseFloat(piecePosY.replace(',', '.')) || 0;
    const angleVal = parseFloat(pieceAngle.replace(',', '.')) || 0;

    // Convert dimensions to millimeters internally
    const lengthMm = convertToMillimeters(lenVal, unit);
    const widthMm = convertToMillimeters(widthVal, unit);
    const heightMm = convertToMillimeters(heightVal, unit);
    const thicknessMm = convertToMillimeters(thickVal, unit);
    const posXMm = convertToMillimeters(posXVal, unit);
    const posYMm = convertToMillimeters(posYVal, unit);

    const updatedPiece: PieceConfig = {
      id: editingPiece ? editingPiece.id : `piece-${Date.now()}`,
      name: pieceName.trim() || 'Sem nome',
      type: pieceType,
      profile: pieceProfile.trim() || 'Metalon 30x30 mm',
      length: lengthMm,
      width: widthMm,
      height: heightMm,
      thickness: thicknessMm,
      posX: posXMm,
      posY: posYMm,
      orientation: pieceOrientation,
      angle: angleVal,
      observations: pieceObservations.trim(),
      perfil: pieceProfile.trim() || 'Metalon 30x30 mm',
      comprimento: lengthMm,
      orientacao: pieceOrientation,
      'orientação': pieceOrientation,
      grupo: PIECE_TYPE_LABELS[pieceType] || 'Estrutura Interna',
      ordem: editingPiece?.ordem !== undefined ? editingPiece.ordem : draftPieces.length + 2,
    };

    // Specific for Diagonal
    if (pieceType === 'diagonal') {
      const diagAngleVal = parseFloat(diagonalAngle.replace(',', '.')) || 0;
      const diagLenVal = parseFloat(diagonalLength.replace(',', '.')) || 0;
      updatedPiece.diagonalStart = diagonalStart;
      updatedPiece.diagonalEnd = diagonalEnd;
      updatedPiece.diagonalDirection = diagonalDirection;
      updatedPiece.diagonalAngle = diagAngleVal;
      updatedPiece.diagonalLength = convertToMillimeters(diagLenVal, unit);
    }

    // Specific for Leaves (Folhas)
    if (pieceType === 'folha_porta' || pieceType === 'folha_portao' || pieceType === 'folha_janela') {
      updatedPiece.leafQuantity = parseInt(leafQuantity) || 1;
      updatedPiece.leafType = leafType;
    }

    let nextPieces: PieceConfig[] = [];
    if (editingPiece) {
      nextPieces = draftPieces.map(p => p.id === editingPiece.id ? updatedPiece : p);
    } else {
      nextPieces = [...draftPieces, updatedPiece];
    }

    setDraftPieces(nextPieces);
    setHasStructuralChanges(true);
    setIsPieceModalOpen(false);
    setEditingPiece(null);
  };

  // Handler: Edit piece (opens form)
  const handleEditPiece = (piece: PieceConfig) => {
    setEditingPiece(piece);
    const unit = currentProject?.frame?.displayUnit || 'mm';

    setPieceName(piece.name);
    setPieceType(piece.type);
    setPieceProfile(piece.profile);
    setPieceOrientation(piece.orientation);
    setPieceObservations(piece.observations);
    setPieceAngle(piece.angle.toString());

    // Convert values back to display unit
    setPieceLength(convertFromMillimeters(piece.length, unit).toString());
    setPieceWidth(convertFromMillimeters(piece.width, unit).toString());
    setPieceHeight(convertFromMillimeters(piece.height, unit).toString());
    setPieceThickness(convertFromMillimeters(piece.thickness, unit).toString());
    setPiecePosX(convertFromMillimeters(piece.posX, unit).toString());
    setPiecePosY(convertFromMillimeters(piece.posY, unit).toString());

    if (piece.type === 'diagonal') {
      setDiagonalStart(piece.diagonalStart || 'Inferior Esquerdo');
      setDiagonalEnd(piece.diagonalEnd || 'Superior Direito');
      setDiagonalDirection(piece.diagonalDirection || '\\');
      setDiagonalAngle((piece.diagonalAngle || 0).toString());
      setDiagonalLength(convertFromMillimeters(piece.diagonalLength || 0, unit).toString());
    }

    if (piece.type === 'folha_porta' || piece.type === 'folha_portao' || piece.type === 'folha_janela') {
      setLeafQuantity((piece.leafQuantity || 1).toString());
      setLeafType(piece.leafType || 'esquerda');
    }

    setPieceModalStep('configure_form');
    setIsPieceModalOpen(true);
  };

  // Handler: Delete piece
  const handleDeletePiece = (pieceId: string) => {
    if (confirm("Tem certeza que deseja remover esta peça?")) {
      const nextPieces = draftPieces.filter(p => p.id !== pieceId);
      setDraftPieces(nextPieces);
      setHasStructuralChanges(true);
      if (highlightedPieceId === pieceId) {
        setHighlightedPieceId(null);
      }
    }
  };

  // Handler: Save Smart Fill (Preenchimento Inteligente)
  const handleSaveSmartFill = () => {
    if (!currentProject) return;
    
    // Assign a permanent group ID and individual piece IDs
    const groupId = `fill-${Date.now()}`;
    const newPieces = previewFillPieces.map((p, idx) => ({
      ...p,
      id: `piece-fill-${groupId}-${idx}`,
      fillGroupId: groupId,
      perfil: p.profile,
      comprimento: p.length,
      orientacao: p.orientation,
      'orientação': p.orientation,
      grupo: groupId,
      ordem: idx,
    }));

    // Update draftPieces with the newly created pieces
    const nextPieces = [...draftPieces, ...newPieces];
    setDraftPieces(nextPieces);

    // Update and immediately save the active project to satisfy immediate storage
    const updated = {
      ...currentProject,
      pieces: nextPieces
    };
    handleSaveActiveProject(updated);
    setHasStructuralChanges(false);
    setIsFillModalOpen(false);
  };

  // Handler: Delete Smart Fill Group
  const handleDeleteFillGroup = (groupId: string) => {
    if (confirm("Tem certeza que deseja remover este preenchimento inteligente completo?")) {
      const nextPieces = draftPieces.filter(p => p.fillGroupId !== groupId);
      setDraftPieces(nextPieces);
      
      // Update and immediately save the active project
      if (currentProject) {
        const updated = {
          ...currentProject,
          pieces: nextPieces
        };
        handleSaveActiveProject(updated);
        setHasStructuralChanges(false);
      }
    }
  };

  // Handler: Duplicate piece
  const handleDuplicatePiece = (piece: PieceConfig) => {
    const duplicated: PieceConfig = {
      ...piece,
      id: `piece-${Date.now()}`,
      name: `${piece.name} (Cópia)`
    };
    const nextPieces = [...draftPieces, duplicated];
    setDraftPieces(nextPieces);
    setHasStructuralChanges(true);
  };

  // Handler: Confirm draft structural changes
  const handleConfirmStructuralChanges = () => {
    if (!currentProject) return;
    const updated = {
      ...currentProject,
      pieces: draftPieces
    };
    handleSaveActiveProject(updated);
    setHasStructuralChanges(false);
  };

  // Handler: Cancel draft structural changes
  const handleCancelStructuralChanges = () => {
    if (!currentProject) return;
    setDraftPieces(currentProject.pieces || []);
    setHasStructuralChanges(false);
    setHighlightedPieceId(null);
  };

  // Convert custom display measurements to mm internally
  const convertToMillimeters = (value: number, unit: MeasurementUnit): number => {
    switch (unit) {
      case 'm':
        return value * 1000;
      case 'cm':
        return value * 10;
      case 'mm':
      default:
        return value;
    }
  };

  // Handler: Save Frame Configuration (Quadro Principal)
  const handleSaveFrame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const widthNum = parseFloat(frameWidth.replace(',', '.'));
    const heightNum = parseFloat(frameHeight.replace(',', '.'));

    if (isNaN(widthNum) || widthNum <= 0 || isNaN(heightNum) || heightNum <= 0) {
      alert("Por favor, insira medidas válidas maiores que zero.");
      return;
    }

    const finalProfile = isCustomProfileActive ? customProfile.trim() : frameProfile;
    if (!finalProfile) {
      alert("Por favor, especifique ou selecione o perfil de metal.");
      return;
    }

    const internalWidthMm = convertToMillimeters(widthNum, frameUnit);
    const internalHeightMm = convertToMillimeters(heightNum, frameUnit);

    const frameConfig: FrameConfig = {
      width: internalWidthMm,
      height: internalHeightMm,
      displayUnit: frameUnit,
      displayWidth: widthNum,
      displayHeight: heightNum,
      profile: finalProfile
    };

    const updatedProject: MetalProject = {
      ...currentProject,
      frame: frameConfig
    };

    handleSaveActiveProject(updatedProject);
    setIsFrameModalOpen(false);
  };

  // Open the Frame Configuration dialog (populate values if existing)
  const openFrameModal = () => {
    if (currentProject?.frame) {
      setFrameWidth(currentProject.frame.displayWidth.toString());
      setFrameHeight(currentProject.frame.displayHeight.toString());
      setFrameUnit(currentProject.frame.displayUnit);
      
      const isPreset = PRESET_PROFILES.includes(currentProject.frame.profile);
      if (isPreset) {
        setFrameProfile(currentProject.frame.profile);
        setIsCustomProfileActive(false);
      } else {
        setFrameProfile('custom');
        setCustomProfile(currentProject.frame.profile);
        setIsCustomProfileActive(true);
      }
    } else {
      setFrameWidth('');
      setFrameHeight('');
      setFrameUnit('mm');
      setFrameProfile('Metalon 30x30 mm');
      setCustomProfile('');
      setIsCustomProfileActive(false);
    }
    setIsFrameModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Categorized Upper Brand bar & Navigation */}
      <CategorizedHeaderNav
        activeTab={activeTab}
        projectSubTab={projectSubTab}
        onSelectTab={(tab, subTab) => {
          setActiveTab(tab as any);
          if (subTab) setProjectSubTab(subTab as any);
        }}
        onOpenQuickAction={() => setIsQuickFabOpen(true)}
      />

      {/* Main Content Space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD (MEUS PROJETOS) */}
          {activeTab === 'meus-projetos' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* Dashboard Hero Section */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Projetos de Serralheria</h2>
                  <p className="text-slate-300 text-sm mt-2 max-w-xl">
                    Planeje suas estruturas de metal, defina medidas com precisão milimétrica e visualize o quadro principal antes de ligar a lixadeira ou a máquina de solda.
                  </p>
                </div>
                <button
                  id="btn-novo-projeto-hero"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-3 rounded-xl transition-all duration-150 shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>NOVO PROJETO</span>
                </button>
              </div>

              {/* Quick statistics widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg text-slate-700">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</p>
                    <p className="text-lg font-bold font-mono text-slate-950">{projects.length}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Construction className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Planejados</p>
                    <p className="text-lg font-bold font-mono text-slate-950">
                      {projects.filter(p => p.status === 'planejamento').length}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Em Produção</p>
                    <p className="text-lg font-bold font-mono text-slate-950">
                      {projects.filter(p => p.status === 'em_producao').length}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Concluídos</p>
                    <p className="text-lg font-bold font-mono text-slate-950">
                      {projects.filter(p => p.status === 'concluido').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Projects List Title Section */}
              <div className="flex items-center justify-between mt-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider font-mono">Meus Projetos Salvos</h3>
                {projects.length > 0 && (
                  <span className="text-xs font-mono text-slate-400">{projects.length} projeto(s) encontrados</span>
                )}
              </div>

              {/* Projects Grid */}
              {projects.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                  <div className="bg-amber-50 text-amber-600 p-4 rounded-full mb-4">
                    <Construction className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Nenhum projeto encontrado</h4>
                  <p className="text-slate-500 text-sm max-w-sm mt-1">
                    Crie sua primeira peça para dimensionar o quadro e começar a calcular perfis de metal.
                  </p>
                  <button
                    id="btn-novo-projeto-vazio"
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="mt-5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeiro Projeto</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {projects.map((project) => (
                    <div
                      id={`project-card-${project.id}`}
                      key={project.id}
                      onClick={() => {
                        setCurrentProject(project);
                        setActiveTab('detalhes-projeto');
                      }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Accent color tab based on status */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${
                        project.status === 'concluido' ? 'bg-emerald-500' :
                        project.status === 'em_producao' ? 'bg-sky-500' :
                        'bg-amber-500'
                      }`} />

                      <div>
                        {/* Title and Badge */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors duration-150 pr-4">
                            {project.name}
                          </h4>
                          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${
                            project.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            project.status === 'em_producao' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {project.status === 'concluido' ? 'Concluído' :
                             project.status === 'em_producao' ? 'Em Produção' :
                             'Planejamento'}
                          </span>
                        </div>

                        {/* Updated date */}
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-mono mb-4">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Atualizado em: {formatDate(project.updatedAt)}</span>
                        </p>

                        {/* Preview measurements if configured */}
                        {project.frame ? (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-slate-600 mb-4">
                            <div>
                              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Quadro Principal</p>
                              <p className="text-slate-800 font-semibold mt-0.5">
                                {project.frame.displayWidth} x {project.frame.displayHeight} {project.frame.displayUnit}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Metal Utilizado</p>
                              <p className="text-indigo-600 font-semibold mt-0.5">{project.frame.profile}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50/50 border border-amber-100 border-dashed rounded-xl p-3 flex items-center justify-between text-xs text-amber-800 mb-4">
                            <span className="flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                              Quadro não configurado
                            </span>
                            <span className="text-[11px] font-semibold text-amber-600 hover:underline">Configurar agora →</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-slate-100 pt-3.5 mt-2 flex items-center justify-between shrink-0">
                        <span className="text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform duration-150 flex items-center gap-1">
                          Abrir projeto técnico
                          <ChevronLeft className="w-4 h-4 rotate-180" />
                        </span>

                        <button
                          id={`btn-excluir-projeto-${project.id}`}
                          onClick={(e) => handleDeleteProject(project, e)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors duration-150 cursor-pointer"
                          title="Excluir projeto"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: PROJECT DETAILS (TELA DO PROJETO) */}
          {activeTab === 'detalhes-projeto' && currentProject && (
            <motion.div
              key="project-details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              {/* Back button and quick Save */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    id="btn-voltar-meus-projetos"
                    onClick={() => setActiveTab('meus-projetos')}
                    className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Voltar para Meus Projetos</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      id="btn-excluir-projeto-ativo"
                      type="button"
                      onClick={() => setProjectToDelete(currentProject)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-3 py-2 rounded-xl transition duration-150 inline-flex items-center gap-1.5 cursor-pointer"
                      title="Excluir este projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Projeto</span>
                    </button>

                    <button
                      id="btn-salvar-projeto-manual"
                      onClick={() => {
                        handleSaveActiveProject(currentProject);
                        alert("Projeto salvo com sucesso!");
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Projeto</span>
                    </button>
                  </div>
                </div>

                {/* Project Header Title & Status Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-widest block mb-1">
                        Projeto Ativo
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
                        {currentProject.name}
                      </h2>
                    </div>

                    {/* Status Select dropdown */}
                    <div className="flex items-center space-x-2">
                      <label htmlFor="select-status-projeto" className="text-xs text-slate-500 font-medium font-mono whitespace-nowrap">STATUS:</label>
                      <select
                        id="select-status-projeto"
                        value={currentProject.status}
                        onChange={(e) => {
                          const updated = { 
                            ...currentProject, 
                            status: e.target.value as any 
                          };
                          handleSaveActiveProject(updated);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="planejamento">📋 Planejamento</option>
                        <option value="em_producao">⚡ Em Produção</option>
                        <option value="concluido">✅ Concluído</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SUB-NAV TABS: ESTRUTURA vs LISTA DE CORTE vs OTIMIZAÇÃO DE BARRAS */}
                <div className="bg-white p-2.5 border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      id="btn-subtab-estrutura"
                      type="button"
                      onClick={() => setProjectSubTab('estrutura')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer ${
                        projectSubTab === 'estrutura'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>📐 Quadro Principal</span>
                    </button>

                    <button
                      id="btn-subtab-desenho-livre"
                      type="button"
                      onClick={() => setProjectSubTab('desenho-livre')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer ${
                        projectSubTab === 'desenho-livre'
                          ? 'bg-slate-900 text-amber-400 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span>✏️ Desenho Livre</span>
                    </button>

                    <button
                      id="btn-subtab-lista-corte"
                      type="button"
                      onClick={() => setProjectSubTab('lista-corte')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer ${
                        projectSubTab === 'lista-corte'
                          ? 'bg-slate-900 text-amber-400 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Scissors className="w-4 h-4 text-amber-500" />
                      <span>✂️ Lista de Corte</span>
                    </button>

                    <button
                      id="btn-subtab-otimizacao-barras"
                      type="button"
                      onClick={() => setProjectSubTab('otimizacao-barras')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer ${
                        projectSubTab === 'otimizacao-barras'
                          ? 'bg-slate-900 text-amber-400 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>⚡ Otimização de Barras</span>
                    </button>

                    <button
                      id="btn-subtab-orcamento"
                      type="button"
                      onClick={() => setProjectSubTab('orcamento')}
                      className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer ${
                        projectSubTab === 'orcamento'
                          ? 'bg-slate-900 text-emerald-400 shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>💰 Orçamento</span>
                    </button>
                  </div>

                  {projectSubTab === 'estrutura' && (
                    <button
                      id="btn-atalho-lista-corte"
                      type="button"
                      onClick={() => setProjectSubTab('lista-corte')}
                      className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer border border-amber-200/60 shrink-0"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ver Lista de Corte Completa →</span>
                    </button>
                  )}
                </div>

                {/* CONDITIONAL CONTENT BASED ON SUB-TAB */}
                {projectSubTab === 'desenho-livre' ? (
                  <FreeDrawingModule
                    project={currentProject}
                    onUpdateProject={handleSaveActiveProject}
                  />
                ) : projectSubTab === 'orcamento' ? (
                  <BudgetModule 
                    project={currentProject} 
                    pieces={draftPieces} 
                    onUpdateProject={handleSaveActiveProject}
                    onNavigateToLibrary={() => setActiveTab('biblioteca-materiais')}
                  />
                ) : projectSubTab === 'otimizacao-barras' ? (
                  <BarOptimizationModule 
                    project={currentProject} 
                    pieces={draftPieces} 
                    onNavigateToCutList={() => setProjectSubTab('lista-corte')}
                    onNavigateToStructure={() => setProjectSubTab('estrutura')}
                  />
                ) : projectSubTab === 'lista-corte' ? (
                  <CutListModule 
                    project={currentProject} 
                    pieces={draftPieces} 
                    onNavigateToStructure={() => setProjectSubTab('estrutura')} 
                  />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                    {/* Left Column: Blueprint, Conversion Info, Project Structure */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                {/* VISUALIZATION AREA (RESERVED FOR FUTURE BLUEPRINT / INTERACTIVE DRAWING) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 font-display text-lg">Quadro Principal</h3>
                      <p className="text-xs text-slate-500">Desenho técnico proporcional e especificações estruturais</p>
                    </div>
                    {currentProject.frame && (
                      <button
                        id="btn-editar-quadro-principal"
                        onClick={openFrameModal}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition duration-150 cursor-pointer"
                      >
                        Editar Dimensões
                      </button>
                    )}
                  </div>

                  {/* Render Blueprint or empty state prompt */}
                  {currentProject.frame ? (
                    <ProjectBlueprint 
                      frame={currentProject.frame} 
                      pieces={draftPieces} 
                      highlightedPieceId={highlightedPieceId} 
                    />
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-3">
                        <Ruler className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800">Nenhum quadro configurado</h4>
                      <p className="text-slate-500 text-xs max-w-sm mt-1 mb-5">
                        Comece adicionando o quadro principal. Ele servirá como a estrutura externa base que abrigará futuras peças e divisões.
                      </p>
                      <button
                        id="btn-adicionar-quadro-inicial"
                        onClick={openFrameModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-2 shadow-md hover:scale-[1.01] cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ ADICIONAR QUADRO</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* INFO BOX ON CONVERSIONS */}
                {currentProject.frame && (
                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-blue-950 font-mono uppercase tracking-wider mb-1">Conversor Técnico Interno</h5>
                      <p className="leading-relaxed">
                        A medida original definida por você foi de <strong>{currentProject.frame.displayWidth} x {currentProject.frame.displayHeight} {currentProject.frame.displayUnit}</strong>.
                        O aplicativo converteu e salvou estas medidas internamente como <strong>{currentProject.frame.width} mm de largura por {currentProject.frame.height} mm de altura</strong> para garantir que os futuros cálculos de cortes, frestas, diagonais e dobras permaneçam estáveis, imunes a desvios métricos.
                      </p>
                    </div>
                  </div>
                )}

                {/* SECTION: ESTRUTURA DO PROJETO */}
                {currentProject.frame && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                    {/* Header with "+ ADICIONAR PEÇA" button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 font-display text-lg uppercase tracking-tight">Estrutura do Projeto</h3>
                        <p className="text-xs text-slate-500">Desenhe e configure divisões, travessas, folhas e reforços no quadro principal</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          id="btn-ver-lista-corte-estrutura"
                          type="button"
                          onClick={() => setProjectSubTab('lista-corte')}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer"
                        >
                          <Scissors className="w-4 h-4 stroke-[2.5]" />
                          <span>✂️ Ver Lista de Corte</span>
                        </button>

                        <button
                          id="btn-adicionar-preenchimento"
                          type="button"
                          onClick={() => {
                            setFillType('vertical');
                            setFillProfile('Metalon 20x20 mm');
                            setCustomFillProfile('');
                            setIsCustomFillProfileActive(false);
                            setFillSpacing('100');
                            setIsCustomFillSpacing(false);
                            setCustomFillSpacingVal('');
                            setFillDistribution('auto');
                            setIsFillModalOpen(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>➕ Adicionar Preenchimento</span>
                        </button>

                        <button
                          id="btn-adicionar-peca"
                          type="button"
                          onClick={() => {
                            setEditingPiece(null);
                            setPieceModalStep('select_type');
                            setIsPieceModalOpen(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition duration-150 inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>➕ ADICIONAR PEÇA</span>
                        </button>
                      </div>
                    </div>

                    {/* Pending Changes banner */}
                    {hasStructuralChanges && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">Alterações não salvas na estrutura</p>
                            <p className="text-[11px] text-amber-700">As peças adicionadas ou modificadas estão em modo prévia no desenho.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <button
                            id="btn-cancelar-alteracoes-estrutura"
                            onClick={handleCancelStructuralChanges}
                            className="flex-1 sm:flex-none text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition duration-150 cursor-pointer"
                          >
                            CANCELAR ALTERAÇÕES
                          </button>
                          <button
                            id="btn-confirmar-alteracoes-estrutura"
                            onClick={handleConfirmStructuralChanges}
                            className="flex-1 sm:flex-none text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-lg transition duration-150 shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            CONFIRMAR ALTERAÇÕES
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Structure Tree / List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                      {/* Structure title node */}
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center space-x-2 text-xs font-bold text-slate-700">
                        <GitBranch className="w-4 h-4 text-indigo-500" />
                        <span>ÁRVORE DA ESTRUTURA</span>
                      </div>

                      <div className="p-2 space-y-1">
                        {/* Parent/Frame Node */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            <span className="font-bold text-slate-800">Quadro Principal (Base)</span>
                            <span className="text-[10px] text-slate-400">|</span>
                            <span className="text-slate-500">{currentProject.frame.displayWidth}x{currentProject.frame.displayHeight} {currentProject.frame.displayUnit} ({currentProject.frame.profile})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 rounded">Raiz</span>
                        </div>

                        {/* Pieces Nodes */}
                        {draftPieces.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg">
                            Nenhuma peça interna adicionada à estrutura ainda.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* 1. Independent/Normal pieces */}
                            {draftPieces.filter(p => !p.fillGroupId).map((piece) => {
                              const pLabel = PIECE_TYPE_LABELS[piece.type] || piece.type;
                              const unit = currentProject.frame?.displayUnit || 'mm';
                              const displayLength = convertFromMillimeters(piece.length, unit).toFixed(1);
                              const displayPosX = convertFromMillimeters(piece.posX, unit).toFixed(1);
                              const displayPosY = convertFromMillimeters(piece.posY, unit).toFixed(1);

                              // Colors mapping
                              let typeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                              if (piece.type === 'quadro_interno') typeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
                              else if (piece.type === 'divisao_vertical' || piece.type === 'divisao_horizontal') typeBg = 'bg-amber-50 text-amber-700 border-amber-200/60';
                              else if (piece.type === 'travessa' || piece.type === 'coluna') typeBg = 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
                              else if (piece.type === 'diagonal') typeBg = 'bg-rose-50 text-rose-700 border-rose-200/60';
                              else if (piece.type === 'reforco') typeBg = 'bg-purple-50 text-purple-700 border-purple-200/60';
                              else if (piece.type === 'folha_porta' || piece.type === 'folha_portao' || piece.type === 'folha_janela') typeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200/60';

                              return (
                                <div
                                  key={piece.id}
                                  onMouseEnter={() => setHighlightedPieceId(piece.id)}
                                  onMouseLeave={() => setHighlightedPieceId(null)}
                                  className={`bg-white border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-150 ${
                                    highlightedPieceId === piece.id 
                                      ? 'border-indigo-400 shadow-sm ring-1 ring-indigo-400 bg-slate-50/20' 
                                      : 'border-slate-200'
                                  }`}
                                >
                                  <div className="flex flex-col gap-1 text-xs">
                                    <div className="flex items-center flex-wrap gap-2">
                                      <span className="text-slate-300 font-bold font-mono">└─</span>
                                      <span className="font-bold text-slate-800">{piece.name}</span>
                                      <span className={`text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${typeBg}`}>
                                        {pLabel}
                                      </span>
                                      {piece.profile !== currentProject.frame?.profile && (
                                        <span className="text-[10px] text-slate-400 font-mono">({piece.profile})</span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 font-mono text-[11px] pl-5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <span>Comp: <strong className="text-slate-700">{displayLength} {unit}</strong></span>
                                      <span>•</span>
                                      <span>Pos: <strong className="text-slate-700">({displayPosX}, {displayPosY}) {unit}</strong></span>
                                      {piece.type === 'diagonal' && (
                                        <>
                                          <span>•</span>
                                          <span className="text-rose-600">Direção: {piece.diagonalDirection} ({piece.diagonalStart} → {piece.diagonalEnd})</span>
                                        </>
                                      )}
                                      {(piece.type === 'folha_porta' || piece.type === 'folha_portao' || piece.type === 'folha_janela') && (
                                        <>
                                          <span>•</span>
                                          <span className="text-indigo-600">Folhas: {piece.leafQuantity}x ({piece.leafType})</span>
                                        </>
                                      )}
                                    </div>
                                    {piece.observations && (
                                      <p className="text-[10px] text-slate-400 italic pl-5 mt-0.5">Obs: {piece.observations}</p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-end gap-1.5 sm:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleEditPiece(piece)}
                                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-150 cursor-pointer"
                                      title="Editar especificações"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicatePiece(piece)}
                                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition duration-150 cursor-pointer"
                                      title="Duplicar peça"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePiece(piece.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition duration-150 cursor-pointer"
                                      title="Excluir peça"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* 2. Grouped Smart Fill pieces */}
                            {Array.from(new Set(draftPieces.map(p => p.fillGroupId).filter((id): id is string => !!id))).map((groupId: string) => {
                              const groupPieces = draftPieces.filter(p => p.fillGroupId === groupId);
                              if (groupPieces.length === 0) return null;
                              
                              const profileUsed = groupPieces[0].profile;
                              const unit = currentProject.frame?.displayUnit || 'mm';
                              
                              return (
                                <div key={groupId} className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 font-bold font-mono">├─</span>
                                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                                        <Menu className="w-4 h-4 stroke-[2]" />
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-bold text-slate-800">Preenchimento Vertical</h4>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                          {groupPieces.length} peças ({profileUsed})
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFillGroup(groupId)}
                                      className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition font-semibold cursor-pointer"
                                    >
                                      Excluir Grupo
                                    </button>
                                  </div>

                                  <div className="pl-4 space-y-1.5 border-l-2 border-dashed border-slate-200">
                                    {groupPieces.map((piece) => {
                                      const displayLength = convertFromMillimeters(piece.length, unit).toFixed(1);
                                      const displayPosX = convertFromMillimeters(piece.posX, unit).toFixed(1);
                                      const displayPosY = convertFromMillimeters(piece.posY, unit).toFixed(1);

                                      return (
                                        <div
                                          key={piece.id}
                                          onMouseEnter={() => setHighlightedPieceId(piece.id)}
                                          onMouseLeave={() => setHighlightedPieceId(null)}
                                          className={`bg-white border rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all duration-150 ${
                                            highlightedPieceId === piece.id 
                                              ? 'border-indigo-400 shadow-sm ring-1 ring-indigo-400 bg-slate-50/20' 
                                              : 'border-slate-200'
                                          }`}
                                        >
                                          <div className="flex flex-col gap-0.5 text-xs">
                                            <div className="flex items-center flex-wrap gap-2">
                                              <span className="text-slate-300 font-bold font-mono">│  ├─</span>
                                              <span className="font-bold text-slate-700">{piece.name}</span>
                                            </div>
                                            <div className="text-slate-500 font-mono text-[10px] pl-7 flex flex-wrap items-center gap-x-2">
                                              <span>Comp: <strong className="text-slate-700">{displayLength} {unit}</strong></span>
                                              <span>•</span>
                                              <span>Pos: <strong className="text-slate-700">({displayPosX}, {displayPosY}) {unit}</strong></span>
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-end gap-1.5 sm:self-center">
                                            <button
                                              type="button"
                                              onClick={() => handleDeletePiece(piece.id)}
                                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition duration-150 cursor-pointer"
                                              title="Excluir peça individual"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Future modules and metal specification summary */}
              <div className="flex flex-col gap-6">
                
                {/* METALS & SPECS (SUMMARY PANEL) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 font-display text-base mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    Especificação do Quadro
                  </h3>
                  
                  {currentProject.frame ? (
                    <div className="space-y-4">
                      {/* Height / Width items */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">LARGURA</span>
                          <span className="text-lg font-bold text-slate-800">{currentProject.frame.displayWidth}</span>
                          <span className="text-xs text-slate-500 ml-1">{currentProject.frame.displayUnit}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">{currentProject.frame.width} mm</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl font-mono">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">ALTURA</span>
                          <span className="text-lg font-bold text-slate-800">{currentProject.frame.displayHeight}</span>
                          <span className="text-xs text-slate-500 ml-1">{currentProject.frame.displayUnit}</span>
                          <span className="text-[10px] text-slate-400 block mt-1">{currentProject.frame.height} mm</span>
                        </div>
                      </div>

                      {/* Metal profile detailed item */}
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 uppercase font-bold font-mono block">PERFIL METALON</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span>
                          <span className="text-sm font-semibold text-slate-800">{currentProject.frame.profile}</span>
                        </div>
                      </div>

                      {/* Quick reminder for user */}
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Este quadro agora serve como limite externo. Qualquer peça interna futura que você adicione será deduzida da espessura do metal ({currentProject.frame.profile}).</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">Adicione o quadro principal para detalhar as especificações métricas.</p>
                      <button
                        id="btn-adicionar-quadro-especificacao"
                        onClick={openFrameModal}
                        className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        + Adicionar Quadro Principal
                      </button>
                    </div>
                  )}
                </div>

                {/* PREPARATION FOR FUTURE STEPS (VISUALLY MOCKED ACCORDING TO REQUIREMENTS IN STEP 5 & 6) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 font-display text-base flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-indigo-500" />
                      Próximas Etapas
                    </h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      Fases Futuras
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    A estrutura de dados deste aplicativo já está arquitetada para persistir e processar os seguintes módulos em atualizações futuras:
                  </p>

                  <div className="space-y-3">
                    {/* Future Step: Pieces & Divisions */}
                    <div className="border border-slate-100 rounded-xl p-3 flex items-start space-x-3 opacity-60">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Divisões e Peças Internas</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Definição de frestas, número de folhas, barras de reforço e montantes.</p>
                      </div>
                    </div>

                    {/* Future Step: Diagonal calculations */}
                    <div className="border border-slate-100 rounded-xl p-3 flex items-start space-x-3 opacity-60">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Esquadro & Diagonais</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Cálculo pitagórico automático das diagonais para garantir a quadratura perfeita (sem peças tortas).</p>
                      </div>
                    </div>

                    {/* Future Step: Cut List & Calculations */}
                    <div className="border border-slate-100 rounded-xl p-3 flex items-start space-x-3 opacity-60">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 mt-0.5">
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Plano de Corte Otimizado</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Organização das barras metálicas padrão de 6m para menor desperdício possível com ângulos de corte.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

            </motion.div>
          )}

          {/* TAB 3: BIBLIOTECA DE MATERIAIS (ET-006) */}
          {activeTab === 'biblioteca-materiais' && (
            <motion.div
              key="materials-library"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              <MaterialsLibraryModule />
            </motion.div>
          )}

          {/* TAB 4: CENTRAL INTELIGENTE DE PREÇOS (ET-006A) */}
          {activeTab === 'central-precos' && (
            <motion.div
              key="central-precos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              <PriceCenterModule onNavigateToBudget={() => {
                if (currentProject) {
                  setActiveTab('detalhes-projeto');
                  setProjectSubTab('orcamento');
                }
              }} />
            </motion.div>
          )}

          {/* TAB 5: MOTOR GEOMÉTRICO INTELIGENTE (ET-008A) */}
          {activeTab === 'motor-geometrico' && (
            <motion.div
              key="motor-geometrico"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              <GeometricEngineModule />
            </motion.div>
          )}

          {/* TAB 6: DESENHO INTELIGENTE LIVRE (ET-008B) */}
          {activeTab === 'desenho-livre' && (
            <motion.div
              key="desenho-livre"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              <FreeDrawingModule 
                project={currentProject} 
                onUpdateProject={handleSaveActiveProject} 
              />
            </motion.div>
          )}

          {/* TAB 7: ASSISTENTE INTELIGENTE DE ESTRUTURAS (ET-008C) */}
          {activeTab === 'assistente-estruturas' && (
            <motion.div
              key="assistente-estruturas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 w-full"
            >
              <StructureAssistantModule
                project={currentProject}
                onGenerateAndOpenDrawing={handleGenerateAndOpenDrawing}
                onOpenFreeDrawingDirectly={() => {
                  setActiveTab('desenho-livre');
                  setProjectSubTab('desenho-livre');
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER METADATA */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4">
          <p>Serralheria Projetos © {new Date().getFullYear()} — Auxiliar Técnico de Medições de Metal</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Estrutura de dados preparada para otimização de barras e diagonais</p>
        </div>
      </footer>

      {/* MODAL 1: CREATE NEW PROJECT */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white font-display">Criar Novo Projeto</h3>
                <p className="text-xs text-slate-400">Insira um nome claro para identificar o projeto na oficina</p>
              </div>

              <form onSubmit={handleCreateProject} className="p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input-nome-projeto" className="text-xs font-semibold text-slate-700">Nome do Projeto</label>
                  <input
                    id="input-nome-projeto"
                    type="text"
                    required
                    placeholder="Ex: Portão da casa, Grade da janela"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    id="btn-cancelar-novo-projeto"
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-novo-projeto"
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD / EDIT FRAME CONFIGURATION (QUADRO PRINCIPAL) */}
      <AnimatePresence>
        {isFrameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFrameModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Dialog Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white font-display">Configurar Quadro Principal</h3>
                <p className="text-xs text-slate-400">Defina os limites externos metálicos da estrutura</p>
              </div>

              <form onSubmit={handleSaveFrame} className="p-6 flex flex-col gap-5">
                {/* 1. Unit Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Unidade de Medida</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['mm', 'cm', 'm'] as MeasurementUnit[]).map((unit) => (
                      <button
                        id={`btn-unidade-${unit}`}
                        key={unit}
                        type="button"
                        onClick={() => setFrameUnit(unit)}
                        className={`py-2 px-3 text-xs font-mono font-bold rounded-xl border transition-all duration-150 cursor-pointer ${
                          frameUnit === unit 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {unit === 'mm' ? 'Milímetros (mm)' : unit === 'cm' ? 'Centímetros (cm)' : 'Metros (m)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Measurements */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="input-largura-quadro" className="text-xs font-semibold text-slate-700">Largura ({frameUnit})</label>
                    <div className="relative">
                      <input
                        id="input-largura-quadro"
                        type="text"
                        required
                        placeholder={`Largura em ${frameUnit}`}
                        value={frameWidth}
                        onChange={(e) => setFrameWidth(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono w-full"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        {frameUnit}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="input-altura-quadro" className="text-xs font-semibold text-slate-700">Altura ({frameUnit})</label>
                    <div className="relative">
                      <input
                        id="input-altura-quadro"
                        type="text"
                        required
                        placeholder={`Altura em ${frameUnit}`}
                        value={frameHeight}
                        onChange={(e) => setFrameHeight(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono w-full"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                        {frameUnit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Metal Profile selector */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="select-perfil-quadro" className="text-xs font-semibold text-slate-700">Perfil de Metal utilizado</label>
                  <select
                    id="select-perfil-quadro"
                    value={isCustomProfileActive ? 'custom' : frameProfile}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setIsCustomProfileActive(true);
                      } else {
                        setFrameProfile(val);
                        setIsCustomProfileActive(false);
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 cursor-pointer"
                  >
                    {materialProfiles.length > 0 ? (
                      materialProfiles.map((m) => {
                        const profileLabel = m.name.endsWith('mm') ? m.name : `${m.name} mm`;
                        return (
                          <option key={m.id} value={profileLabel}>
                            {m.name} ({m.widthMm}x{m.heightMm}x{m.wallThicknessMm}mm)
                          </option>
                        );
                      })
                    ) : (
                      PRESET_PROFILES.map((profile) => (
                        <option key={profile} value={profile}>{profile}</option>
                      ))
                    )}
                    <option value="custom">Outro Perfil (Personalizado)...</option>
                  </select>

                  {/* Render Custom input if 'custom' is active */}
                  {isCustomProfileActive && (
                    <div className="flex flex-col gap-1.5 mt-1.5">
                      <label htmlFor="input-perfil-personalizado" className="text-xs text-slate-500 font-medium">Especificar Perfil Personalizado</label>
                      <input
                        id="input-perfil-personalizado"
                        type="text"
                        required
                        placeholder="Ex: Metalon 50x20 mm, Ferro Chato 1x1/4"
                        value={customProfile}
                        onChange={(e) => setCustomProfile(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Internal Conversion helper message */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] text-slate-500 font-mono flex gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>Cálculos automáticos deduzirão o dobro deste perfil de metal para peças em esquadro reto.</span>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    id="btn-cancelar-quadro"
                    type="button"
                    onClick={() => setIsFrameModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-quadro"
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition duration-150 shadow-md cursor-pointer"
                  >
                    Confirmar Quadro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: ADICIONAR / EDITAR PEÇA ESTRUTURAL */}
        {isPieceModalOpen && currentProject && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {editingPiece ? 'Editar Peça Estrutural' : 'Adicionar Peça Estrutural'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {pieceModalStep === 'select_type' 
                      ? 'Selecione o tipo de peça para integrar ao projeto' 
                      : `Configure os parâmetros métricos para ${PIECE_TYPE_LABELS[pieceType]}`}
                  </p>
                </div>
                <button
                  id="btn-fechar-modal-peca"
                  type="button"
                  onClick={() => setIsPieceModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1: SELECT PIECE TYPE */}
              {pieceModalStep === 'select_type' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {[
                      { type: 'quadro_interno', label: 'Quadro Interno', icon: LayoutGrid, desc: 'Quadro secundário embutido na estrutura' },
                      { type: 'divisao_vertical', label: 'Divisão Vertical', icon: Columns, desc: 'Divisória interna de cima a baixo' },
                      { type: 'divisao_horizontal', label: 'Divisão Horizontal', icon: Rows, desc: 'Divisória interna de lado a lado' },
                      { type: 'travessa', label: 'Travessa', icon: Menu, desc: 'Barra de travamento horizontal' },
                      { type: 'coluna', label: 'Coluna', icon: Columns, desc: 'Barra de travamento vertical' },
                      { type: 'diagonal', label: 'Diagonal', icon: Slash, desc: 'Travamento angular de reforço (mão francesa)' },
                      { type: 'reforco', label: 'Reforço', icon: Shield, desc: 'Cantoneira, chapa ou reforço de canto' },
                      { type: 'folha_porta', label: 'Folha de Porta', icon: DoorOpen, desc: 'Folha pivotante ou de abrir' },
                      { type: 'folha_portao', label: 'Folha de Portão', icon: DoorOpen, desc: 'Folha de grande porte deslizante ou abrir' },
                      { type: 'folha_janela', label: 'Folha de Janela', icon: LayoutGrid, desc: 'Folha de correr ou basculante para janelas' },
                      { type: 'perfil_personalizado', label: 'Perfil Personalizado', icon: Settings, desc: 'Qualquer outro perfil com dimensões livres' },
                    ].map((opt) => {
                      const IconComponent = opt.icon;
                      return (
                        <button
                          id={`btn-escolher-tipo-peca-${opt.type}`}
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            applyPieceTypeDefaults(opt.type as PieceType);
                            setPieceModalStep('configure_form');
                          }}
                          className="flex items-start text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition duration-150 group cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 mr-3 shrink-0">
                            <IconComponent className="w-5 h-5 stroke-[2]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide group-hover:text-indigo-900">{opt.label}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end mt-6 border-t border-slate-100 pt-4">
                    <button
                      id="btn-cancelar-selecao-peca"
                      type="button"
                      onClick={() => setIsPieceModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CONFIGURE FORM */}
              {pieceModalStep === 'configure_form' && (
                <form onSubmit={handleSavePiece} className="p-6 flex flex-col gap-5 max-h-[500px] overflow-y-auto">
                  {/* General Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="input-nome-peca" className="text-xs font-semibold text-slate-700">Nome da Peça</label>
                      <input
                        id="input-nome-peca"
                        type="text"
                        required
                        placeholder="Ex: Travessa Central, Diagonal Esquerda"
                        value={pieceName}
                        onChange={(e) => setPieceName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="select-perfil-peca" className="text-xs font-semibold text-slate-700">Perfil de Metal</label>
                      <select
                        id="select-perfil-peca"
                        value={pieceProfile}
                        onChange={(e) => setPieceProfile(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 cursor-pointer"
                      >
                        {materialProfiles.length > 0 ? (
                          materialProfiles.map((m) => {
                            const profileLabel = m.name.endsWith('mm') ? m.name : `${m.name} mm`;
                            return (
                              <option key={m.id} value={profileLabel}>
                                {m.name} ({m.widthMm}x{m.heightMm}x{m.wallThicknessMm}mm)
                              </option>
                            );
                          })
                        ) : (
                          PRESET_PROFILES.map((profile) => (
                            <option key={profile} value={profile}>{profile}</option>
                          ))
                        )}
                        {pieceProfile && !materialProfiles.some(m => `${m.name} mm` === pieceProfile || m.name === pieceProfile) && (
                          <option value={pieceProfile}>{pieceProfile} (Do Projeto)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-wider mb-3">
                      Posicionamento e Dimensões ({currentProject.frame?.displayUnit})
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* X position */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="input-pos-x-peca" className="text-xs text-slate-600">Posição X ({currentProject.frame?.displayUnit})</label>
                        <input
                          id="input-pos-x-peca"
                          type="text"
                          required
                          value={piecePosX}
                          onChange={(e) => setPiecePosX(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          title="Distância da lateral esquerda"
                        />
                      </div>

                      {/* Y position */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="input-pos-y-peca" className="text-xs text-slate-600">Posição Y ({currentProject.frame?.displayUnit})</label>
                        <input
                          id="input-pos-y-peca"
                          type="text"
                          required
                          value={piecePosY}
                          onChange={(e) => setPiecePosY(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          title="Distância do topo"
                        />
                      </div>

                      {/* Length */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="input-comprimento-peca" className="text-xs text-slate-600">Comprimento ({currentProject.frame?.displayUnit})</label>
                        <input
                          id="input-comprimento-peca"
                          type="text"
                          required
                          value={pieceLength}
                          onChange={(e) => setPieceLength(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          title="Extensão linear da barra"
                        />
                      </div>

                      {/* Thickness/Profile Width */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="input-espessura-peca" className="text-xs text-slate-600">Espessura ({currentProject.frame?.displayUnit})</label>
                        <input
                          id="input-espessura-peca"
                          type="text"
                          required
                          value={pieceThickness}
                          onChange={(e) => setPieceThickness(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          title="Espessura/Bitola do metal utilizado"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION FOR SPECIAL PIECE TYPES */}
                  {/* 1. DIAGONAL DETAILS */}
                  {pieceType === 'diagonal' && (
                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-4">
                      <h4 className="text-[10px] font-bold text-rose-700 font-mono uppercase tracking-wider">
                        Configuração da Diagonal / Escora
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Start and End nodes */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="select-diag-start" className="text-xs text-slate-700">Ponto de Partida</label>
                          <select
                            id="select-diag-start"
                            value={diagonalStart}
                            onChange={(e) => setDiagonalStart(e.target.value)}
                            className="bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            <option value="Inferior Esquerdo">Inferior Esquerdo</option>
                            <option value="Superior Esquerdo">Superior Esquerdo</option>
                            <option value="Inferior Direito">Inferior Direito</option>
                            <option value="Superior Direito">Superior Direito</option>
                            <option value="Personalizado">Posição Personalizada...</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="select-diag-end" className="text-xs text-slate-700">Ponto Final</label>
                          <select
                            id="select-diag-end"
                            value={diagonalEnd}
                            onChange={(e) => setDiagonalEnd(e.target.value)}
                            className="bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                          >
                            <option value="Superior Direito">Superior Direito</option>
                            <option value="Inferior Direito">Inferior Direito</option>
                            <option value="Superior Esquerdo">Superior Esquerdo</option>
                            <option value="Inferior Esquerdo">Inferior Esquerdo</option>
                            <option value="Personalizado">Posição Personalizada...</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Direction */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-slate-700">Sentido visual</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['\\', '/'] as const).map((dir) => (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => setDiagonalDirection(dir)}
                                className={`py-1.5 rounded text-xs font-bold border transition ${
                                  diagonalDirection === dir 
                                    ? 'bg-rose-100 border-rose-400 text-rose-800' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {dir === '\\' ? 'Descida (\\)' : 'Subida (/)'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Angle */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="input-diag-angle" className="text-xs text-slate-700">Ângulo (graus °)</label>
                          <input
                            id="input-diag-angle"
                            type="text"
                            value={diagonalAngle}
                            onChange={(e) => setDiagonalAngle(e.target.value)}
                            className="bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            placeholder="Ex: 45"
                          />
                        </div>

                        {/* Diagonal Length */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="input-diag-length" className="text-xs text-slate-700">Comp. Real ({currentProject.frame?.displayUnit})</label>
                          <input
                            id="input-diag-length"
                            type="text"
                            value={diagonalLength}
                            onChange={(e) => setDiagonalLength(e.target.value)}
                            className="bg-white border border-rose-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            placeholder="Mão francesa real"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. LEAF DETAILS */}
                  {(pieceType === 'folha_porta' || pieceType === 'folha_portao' || pieceType === 'folha_janela') && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-4">
                      <h4 className="text-[10px] font-bold text-indigo-700 font-mono uppercase tracking-wider">
                        Parâmetros da Folha de Abertura
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Leaf Type */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="select-leaf-type" className="text-xs text-slate-700">Tipo de Folha (Abertura)</label>
                          <select
                            id="select-leaf-type"
                            value={leafType}
                            onChange={(e) => setLeafType(e.target.value as any)}
                            className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="esquerda">Folha esquerda (Abrir p/ Esquerda)</option>
                            <option value="direita">Folha direita (Abrir p/ Direita)</option>
                            <option value="dupla">Folha dupla (Duas folhas centrais)</option>
                            <option value="deslizante">Folha deslizante (Correr)</option>
                            <option value="basculante">Folha basculante (Basculante/Pivot)</option>
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="input-leaf-quantity" className="text-xs text-slate-700">Quantidade de Folhas no Vão</label>
                          <input
                            id="input-leaf-quantity"
                            type="number"
                            min="1"
                            max="6"
                            value={leafQuantity}
                            onChange={(e) => setLeafQuantity(e.target.value)}
                            className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. NON-DIAGONAL/LEAF ORIENTATION */}
                  {pieceType !== 'diagonal' && pieceType !== 'folha_porta' && pieceType !== 'folha_portao' && pieceType !== 'folha_janela' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Orientation */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">Orientação da Barra</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['horizontal', 'vertical'] as const).map((orient) => (
                            <button
                              key={orient}
                              type="button"
                              onClick={() => setPieceOrientation(orient)}
                              className={`py-2 rounded-xl text-xs font-bold border transition ${
                                pieceOrientation === orient 
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {orient === 'horizontal' ? 'Horizontal (━)' : 'Vertical (┃)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Angle */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="input-piece-angle" className="text-xs font-semibold text-slate-700">Inclinação Adicional (Graus °)</label>
                        <input
                          id="input-piece-angle"
                          type="text"
                          value={pieceAngle}
                          onChange={(e) => setPieceAngle(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ex: 0 para reto, 90"
                        />
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="textarea-observacoes-peca" className="text-xs font-semibold text-slate-700">Observações / Instruções de Corte</label>
                    <textarea
                      id="textarea-observacoes-peca"
                      rows={2}
                      placeholder="Ex: Corte em esquadria dupla de 45 graus, soldar rente à parede interna, lixar rebarbas."
                      value={pieceObservations}
                      onChange={(e) => setPieceObservations(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-medium"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 mt-4 border-t border-slate-100 pt-4 shrink-0">
                    <div>
                      {!editingPiece && (
                        <button
                          id="btn-voltar-selecao-tipo"
                          type="button"
                          onClick={() => setPieceModalStep('select_type')}
                          className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          ← Alterar tipo de peça
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-cancelar-configuracao-peca"
                        type="button"
                        onClick={() => setIsPieceModalOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition duration-150 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        id="btn-salvar-configuracao-peca"
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition duration-150 shadow-md hover:scale-[1.01] cursor-pointer"
                      >
                        {editingPiece ? 'Salvar Peça' : 'Adicionar Peça'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* MODAL: PREENCHIMENTO INTELIGENTE (SMART FILL) */}
        {isFillModalOpen && currentProject && currentProject.frame && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
            >
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 animate-pulse">
                    <Sparkles className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      Preenchimento Inteligente (Smart Fill)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Preencha o quadro principal com peças verticais calculadas de forma automática
                    </p>
                  </div>
                </div>
                <button
                  id="btn-fechar-modal-preenchimento"
                  type="button"
                  onClick={() => setIsFillModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 max-h-[75vh] overflow-y-auto">
                
                {/* Left Column (5/12): SVG Visualizer Preview & Workshop Results */}
                <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col gap-6 min-h-[350px] overflow-y-auto">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider mb-2">
                      Prévia Técnica do Desenho
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                      Visualize a distribuição real em tempo real com base nos ajustes inseridos.
                    </p>
                    
                    {/* SVG Container */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-inner flex items-center justify-center min-h-[220px]">
                      <ProjectBlueprint 
                        frame={currentProject.frame} 
                        pieces={[...draftPieces, ...previewFillPieces]} 
                      />
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-700 font-display uppercase tracking-wider flex items-center gap-1">
                      <span>⚙️</span> Cálculos de Fabricação
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      
                      {/* Vão Interno */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 font-mono flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">Vão Interno</span>
                          <strong className="text-base text-slate-800 block mt-1">{previewFillInnerWidth} mm</strong>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">Luz útil de borda a borda</span>
                      </div>

                      {/* ✂️ RESULTADO DO CORTE */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 font-mono flex flex-col justify-between shadow-sm">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">✂️ Resultado do Corte</span>
                          <strong className="text-sm text-slate-800 block mt-1 leading-tight font-bold">
                            {previewFillCount} peças × {previewFillPieces[0]?.length || 0} mm
                          </strong>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1 truncate" title={activeFillProfile}>
                          Perfil: {activeFillProfile.replace(' mm', '')}
                        </span>
                      </div>

                      {/* 📦 Material Utilizado */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 font-mono col-span-2 shadow-sm">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">📦 Material Utilizado</span>
                        <div className="mt-1.5 flex flex-col gap-0.5">
                          <strong className="text-sm text-slate-800 block font-bold">
                            {totalFillMeters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} metros de {activeFillProfile.replace(' mm', '')}
                          </strong>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                            <span>🔩</span> ≈ {fillBarsNeeded} barras de 6 metros
                          </span>
                        </div>
                      </div>

                      {/* 📏 Espaçamento */}
                      <div className={`border rounded-xl p-3 font-mono col-span-2 transition-all duration-300 shadow-sm ${
                        isFillSpacingVeryClose 
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/30' 
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block leading-none">📏 Espaçamento entre Peças</span>
                          {isFillSpacingVeryClose && (
                            <span className="bg-emerald-100 text-emerald-800 text-[8px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-0.5">
                              ✓ Ajuste Ideal
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Solicitado</span>
                            <strong className="text-xs text-slate-600 block mt-0.5">{desiredFillSpacingMm} mm</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold">Obtido Real</span>
                            <strong className={`text-sm block mt-0.5 ${isFillSpacingVeryClose ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                              {previewFillSpacingReal.toFixed(1)} mm
                            </strong>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 📋 Resumo Técnico Card */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md font-mono space-y-3 border border-slate-800 mt-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      <span className="text-sm">📋</span>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Resumo Técnico</h5>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Projeto</span>
                        <span className="text-slate-100 font-medium text-right max-w-[180px] truncate" title={currentProject.name}>
                          {currentProject.name}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Estrutura</span>
                        <span className="text-slate-200 text-right">
                          {currentProject.frame?.displayWidth}x{currentProject.frame?.displayHeight} {currentProject.frame?.displayUnit}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Perfil</span>
                        <span className="text-slate-200 text-right truncate max-w-[180px]" title={activeFillProfile}>
                          {activeFillProfile}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Resultado do Corte</span>
                        <span className="text-emerald-400 font-bold text-right">
                          Cortar {previewFillCount} peças de {previewFillPieces[0]?.length || 0} mm
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Material Utilizado</span>
                        <span className="text-slate-200 text-right">
                          {totalFillMeters.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m (≈ {fillBarsNeeded} barras de 6m)
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-850 pb-1.5">
                        <span className="text-slate-400 font-bold">Espaçamento Solicitado</span>
                        <span className="text-slate-200 text-right">{desiredFillSpacingMm} mm</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400 font-bold">Espaçamento Obtido</span>
                        <span className="text-emerald-400 font-bold text-right">{previewFillSpacingReal.toFixed(1)} mm</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column (7/12): Configuration Fields */}
                <div className="lg:col-span-7 p-6 flex flex-col justify-between gap-6">
                  <div className="space-y-5">
                    {/* 1. Tipo do preenchimento */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Tipo de preenchimento</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="py-2 px-3 rounded-xl text-xs font-bold border bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm text-left flex items-center justify-between"
                        >
                          <span>Vertical (┃)</span>
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">Ativo</span>
                        </button>
                        <button
                          type="button"
                          disabled
                          className="py-2 px-3 rounded-xl text-xs font-semibold border bg-slate-100 border-slate-200 text-slate-400 text-left flex items-center justify-between cursor-not-allowed"
                          title="Preenchimento horizontal será implementado no futuro"
                        >
                          <span>Horizontal (━)</span>
                          <span className="text-[10px] bg-slate-300 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold">Em breve</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Perfil Utilizado */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Perfil utilizado para o preenchimento</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['Metalon 15x15 mm', 'Metalon 20x20 mm', 'Metalon 30x20 mm', 'Metalon 30x30 mm'].map((prof) => (
                          <button
                            key={prof}
                            type="button"
                            onClick={() => {
                              setIsCustomFillProfileActive(false);
                              setFillProfile(prof);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                              !isCustomFillProfileActive && fillProfile === prof
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {prof.replace(' mm', '')}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsCustomFillProfileActive(true)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            isCustomFillProfileActive
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Personalizado...
                        </button>
                      </div>

                      {isCustomFillProfileActive && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <label htmlFor="input-custom-fill-profile" className="text-[10px] font-bold text-slate-500 uppercase">Especificar Perfil Personalizado</label>
                          <input
                            id="input-custom-fill-profile"
                            type="text"
                            placeholder="Ex: Metalon 40x40 mm"
                            value={customFillProfile}
                            onChange={(e) => setCustomFillProfile(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. Espaçamento Desejado */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Espaçamento aproximado desejado</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['80', '90', '100'].map((sp) => (
                          <button
                            key={sp}
                            type="button"
                            onClick={() => {
                              setIsCustomFillSpacing(false);
                              setFillSpacing(sp);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                              !isCustomFillSpacing && fillSpacing === sp
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {sp} mm
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsCustomFillSpacing(true)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                            isCustomFillSpacing
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Personalizado...
                        </button>
                      </div>

                      {isCustomFillSpacing && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          <label htmlFor="input-custom-fill-spacing" className="text-[10px] font-bold text-slate-500 uppercase">Inserir espaçamento em mm</label>
                          <input
                            id="input-custom-fill-spacing"
                            type="text"
                            placeholder="Ex: 120"
                            value={customFillSpacingVal}
                            onChange={(e) => setCustomFillSpacingVal(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-700"
                          />
                        </div>
                      )}
                    </div>

                    {/* 4. Modo de Distribuição */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Como deseja distribuir?</label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setFillDistribution('auto')}
                          className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                            fillDistribution === 'auto'
                              ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-1 rounded-full border-2 mt-0.5 shrink-0 ${
                            fillDistribution === 'auto' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase block tracking-tight">Ajustar automaticamente para ocupar toda a largura</span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              Calcula o número de peças ideais para que o espaçamento entre elas seja o mais próximo do desejado, garantindo uma distribuição 100% simétrica de borda a borda.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFillDistribution('exact')}
                          className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                            fillDistribution === 'exact'
                              ? 'bg-indigo-50/50 border-indigo-500 text-indigo-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-1 rounded-full border-2 mt-0.5 shrink-0 ${
                            fillDistribution === 'exact' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase block tracking-tight">Manter exatamente o espaçamento informado</span>
                            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                              Adiciona o máximo de peças possível usando rigorosamente o espaçamento digitado, dividindo a sobra que restar igualmente apenas nas duas extremidades (margens).
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Section */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm mt-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 font-display">Deseja aplicar este preenchimento?</h4>
                        <p className="text-[10px] text-emerald-700 leading-tight">Ao confirmar, o grupo de preenchimento será salvo instantaneamente no projeto.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id="btn-confirmar-preenchimento-cancelar"
                        type="button"
                        onClick={() => setIsFillModalOpen(false)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-250/20 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition duration-150 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        id="btn-confirmar-preenchimento-salvar"
                        type="button"
                        onClick={handleSaveSmartFill}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition duration-150 shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE PROJECT CONFIRMATION MODAL */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center space-x-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Excluir Projeto</h3>
                  <p className="text-xs text-slate-500 font-mono">{projectToDelete.name}</p>
                </div>
              </div>

              <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-xs text-red-950 space-y-1">
                <p className="font-bold text-sm text-red-950">
                  Tem certeza que deseja excluir este projeto?
                </p>
                <p className="text-red-700">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  id="btn-cancelar-excluir-projeto"
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirmar-excluir-projeto"
                  type="button"
                  onClick={confirmDeleteProject}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Projeto</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (md:hidden) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab as any);
          if (tab === 'detalhes-projeto' && !currentProject && projects.length > 0) {
            setCurrentProject(projects[0]);
          }
        }}
        onOpenQuickAction={() => setIsQuickFabOpen(true)}
        onOpenMoreMenu={() => setIsQuickFabOpen(true)}
      />

      {/* QUICK ACTION FAB MODAL / BOTTOM SHEET */}
      <QuickActionFabModal
        isOpen={isQuickFabOpen}
        onClose={() => setIsQuickFabOpen(false)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onSelectStructureType={(typeId) => {
          setActiveTab('assistente-estruturas');
        }}
        onOpenFreeDrawing={() => {
          setActiveTab('desenho-livre');
        }}
      />
    </div>
  );
}
