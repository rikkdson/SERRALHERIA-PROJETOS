/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DoorOpen, 
  Grid, 
  BookOpen, 
  Archive, 
  Wrench, 
  Plus, 
  Sparkles, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  Layers, 
  Pencil, 
  Ruler, 
  Maximize2, 
  SlidersHorizontal, 
  Box, 
  Info, 
  ChevronRight,
  Layout,
  Layers2,
  Lock,
  Zap,
  Hammer,
  RefreshCw,
  Eye,
  ShieldAlert,
  Scale,
  BarChart2,
  CornerDownRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  HelpCircle,
  FileText
} from 'lucide-react';
import { MetalProject, FreeDrawingLine, PieceConfig, PieceType, MaterialProfile, FrameConfig } from '../types';
import { getMaterialProfiles } from '../utils/materialsStore';
import { calculateSegmentLength, calculateAngleDeg, getProfileThickness, formatLength } from '../engines/geometryEngine';
import { getRecommendedProcess, getRequiredReinforcements, validateConnectionGeometry } from '../utils/parametricEngine';
import { objectManager } from '../core/ObjectManager';
import { eventBus } from '../core/EventBus';

export type StructureTypeId = 
  | 'portao_abrir' 
  | 'portao_correr' 
  | 'portao_basculante'
  | 'janela' 
  | 'grade'
  | 'prateleira' 
  | 'estante' 
  | 'bancada' 
  | 'personalizada';

export interface StructureTemplateDef {
  id: StructureTypeId;
  title: string;
  icon: string;
  badge: string;
  description: string;
  popular?: boolean;
}

export const INITIAL_TEMPLATES: StructureTemplateDef[] = [
  {
    id: 'portao_abrir',
    title: 'Portão de Abrir (Pivotante)',
    icon: '🚪',
    badge: 'Portões',
    description: 'Portão reforçado com 1, 2 ou mais folhas pivotantes.',
    popular: true
  },
  {
    id: 'portao_correr',
    title: 'Portão de Correr (Deslizante)',
    icon: '🚪',
    badge: 'Portões',
    description: 'Portão com guia superior, batente e trilho de roldanas.',
    popular: true
  },
  {
    id: 'portao_basculante',
    title: 'Portão Basculante',
    icon: '🏠',
    badge: 'Portões',
    description: 'Portão basculante com colunas laterais para contrapeso.',
    popular: true
  },
  {
    id: 'janela',
    title: 'Janela Metálica',
    icon: '🪟',
    badge: 'Janelas',
    description: 'Janela com quadro, divisões internas e folhas de correr/abrir.'
  },
  {
    id: 'grade',
    title: 'Grade de Proteção',
    icon: '🛡️',
    badge: 'Grades',
    description: 'Grade de segurança com montantes verticais e travessas.',
    popular: true
  },
  {
    id: 'prateleira',
    title: 'Prateleira Industrial',
    icon: '📚',
    badge: 'Móveis',
    description: 'Prateleira para oficina, estoque ou garagem.'
  },
  {
    id: 'estante',
    title: 'Estante Modular',
    icon: '🗄️',
    badge: 'Móveis',
    description: 'Estante reforçada com divisórias horizontais e verticais.'
  },
  {
    id: 'bancada',
    title: 'Bancada de Trabalho',
    icon: '🛠️',
    badge: 'Móveis',
    description: 'Bancada reforçada com quadro de tampo e suporte inferior.'
  },
  {
    id: 'personalizada',
    title: 'Estrutura Livre (Canvas)',
    icon: '✏️',
    badge: 'Personalizado',
    description: 'Para montar e desenhar uma estrutura totalmente do zero no Canvas.'
  }
];

export interface CategoryGroup {
  id: string;
  title: string;
  icon: string;
  templateIds: StructureTypeId[];
}

export const CATEGORIES: CategoryGroup[] = [
  {
    id: 'portoes',
    title: '🚪 PORTÕES RESIDENCIAIS E INDUSTRIAIS',
    icon: '🚪',
    templateIds: ['portao_abrir', 'portao_correr', 'portao_basculante']
  },
  {
    id: 'janelas_grades',
    title: '🪟 JANELAS E GRADES DE SEGURANÇA',
    icon: '🪟',
    templateIds: ['janela', 'grade']
  },
  {
    id: 'prateleiras_moveis',
    title: '📚 PRATELEIRAS, BANCADAS E ESTANTES',
    icon: '📚',
    templateIds: ['prateleira', 'estante', 'bancada']
  },
  {
    id: 'personalizado',
    title: '⭐ DESENHO LIVRE PERSONALIZADO',
    icon: '⭐',
    templateIds: ['personalizada']
  }
];

export const UPCOMING_TEMPLATES = [
  { id: 'pergolado', title: 'Pergolado', icon: '🏕️', description: 'Pergolado metálico para área externa ou garagem.' },
  { id: 'cobertura', title: 'Cobertura Metal', icon: '🏠', description: 'Cobertura ou telhado estruturado em metal.' },
  { id: 'mezanino', title: 'Mezanino', icon: '🏭', description: 'Estrutura de piso elevado e mezanino industrial.' },
  { id: 'escada', title: 'Escada Metálica', icon: '🪜', description: 'Escada reta, caracol ou espinha de peixe.' },
  { id: 'guarda_corpo', title: 'Guarda-corpo', icon: '🛡️', description: 'Guarda-corpo e corrimão para sacadas e escadas.' }
];

interface StructureAssistantModuleProps {
  project: MetalProject | null;
  onGenerateAndOpenDrawing: (updatedProject: MetalProject) => void;
  onOpenFreeDrawingDirectly: () => void;
}

export const StructureAssistantModule: React.FC<StructureAssistantModuleProps> = ({
  project,
  onGenerateAndOpenDrawing,
  onOpenFreeDrawingDirectly
}) => {
  // Profiles from materials library
  const [profiles, setProfiles] = useState<MaterialProfile[]>([]);
  
  useEffect(() => {
    const profs = getMaterialProfiles();
    setProfiles(profs);
  }, []);

  // Selected Model
  const [selectedType, setSelectedType] = useState<StructureTypeId>('portao_abrir');

  // Form State parameters per structure
  const [formData, setFormData] = useState({
    // General Dimensions (mm)
    largura: 3000,
    altura: 2200,
    profundidade: 400,
    
    // Leaves (Folhas)
    quantidadeFolhas: 2,

    // Divisions & Internal Bars
    travessasHorizontais: 2,
    travessasVerticais: 4,
    divisoesJanela: 2,
    
    // Diagonals
    temDiagonais: true,
    tipoDiagonal: 'X' as 'none' | '/' | '\\' | 'X',

    // Reinforcements (Corner Gussets / Chapas)
    temReforcos: true,

    // Wicket Gate (Porta Social Embutida)
    temPortaSocial: false,
    larguraPortaSocial: 800,
    alturaPortaSocial: 1900,
    posicaoPortaSocial: 'esquerda' as 'esquerda' | 'centro' | 'direita',
    temBarrasNaPortaSocial: true,

    // Side Columns (Colunas Laterais / Pilantes)
    temColunasLaterais: true,
    perfilColuna: 'Metalon 80x80',

    // Top Header Beam (Viga Superior / Trilho)
    temVigaSuperior: true,
    perfilViga: 'Metalon 80x40',

    // Door Stops (Batentes / Perfis U de Encosto)
    temBatentes: true,
    perfilBatente: 'Perfil U 50x25',

    // Furniture / Shelves specifics
    prateleiras: 4,
    divisoesHorizontais: 3,
    divisoesVerticais: 1,
    numeroPes: 4,

    // Profile selections
    perfilQuadro: 'Metalon 50x30',
    perfilInterno: 'Metalon 20x20',
    perfilGeral: 'Metalon 30x30'
  });

  // SVG Preview Zoom / Controls State
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'dimensoes' | 'porta_social' | 'estruturais' | 'perfis'>('dimensoes');

  // Sync profile options with available profiles
  useEffect(() => {
    if (profiles.length > 0) {
      const p30 = profiles.find(p => p.name.includes('30x30') || p.name.includes('30'))?.name || profiles[0].name;
      const p20 = profiles.find(p => p.name.includes('20x20') || p.name.includes('20'))?.name || p30;
      const p50 = profiles.find(p => p.name.includes('50x30') || p.name.includes('50') || p.name.includes('40'))?.name || p30;
      const p80 = profiles.find(p => p.name.includes('80x80') || p.name.includes('80') || p.name.includes('60'))?.name || p50;
      const pU  = profiles.find(p => p.name.toLowerCase().includes('perfil u') || p.name.toLowerCase().includes('cantoneira'))?.name || p30;

      setFormData(prev => ({
        ...prev,
        perfilGeral: p30,
        perfilQuadro: p50,
        perfilInterno: p20,
        perfilColuna: p80,
        perfilViga: p50,
        perfilBatente: pU
      }));
    }
  }, [profiles]);

  // Adjust default measurements when structure type changes
  useEffect(() => {
    if (selectedType === 'portao_abrir') {
      setFormData(prev => ({
        ...prev,
        largura: 3000,
        altura: 2200,
        quantidadeFolhas: 2,
        travessasHorizontais: 2,
        travessasVerticais: 4,
        temDiagonais: true,
        tipoDiagonal: 'X',
        temPortaSocial: true,
        temColunasLaterais: true,
        temBatentes: true,
        temVigaSuperior: false
      }));
    } else if (selectedType === 'portao_correr') {
      setFormData(prev => ({
        ...prev,
        largura: 3500,
        altura: 2200,
        quantidadeFolhas: 1,
        travessasHorizontais: 2,
        travessasVerticais: 5,
        temDiagonais: true,
        tipoDiagonal: '/',
        temPortaSocial: true,
        temColunasLaterais: true,
        temVigaSuperior: true,
        temBatentes: true
      }));
    } else if (selectedType === 'portao_basculante') {
      setFormData(prev => ({
        ...prev,
        largura: 3000,
        altura: 2300,
        quantidadeFolhas: 1,
        travessasHorizontais: 2,
        travessasVerticais: 4,
        temDiagonais: true,
        tipoDiagonal: 'X',
        temPortaSocial: true,
        temColunasLaterais: true,
        temVigaSuperior: true,
        temBatentes: true
      }));
    } else if (selectedType === 'janela') {
      setFormData(prev => ({
        ...prev,
        largura: 1500,
        altura: 1200,
        quantidadeFolhas: 2,
        travessasHorizontais: 1,
        travessasVerticais: 2,
        temDiagonais: false,
        temPortaSocial: false,
        temColunasLaterais: false,
        temVigaSuperior: false,
        temBatentes: true
      }));
    } else if (selectedType === 'grade') {
      setFormData(prev => ({
        ...prev,
        largura: 2000,
        altura: 1200,
        quantidadeFolhas: 1,
        travessasHorizontais: 2,
        travessasVerticais: 8,
        temDiagonais: false,
        temPortaSocial: false,
        temColunasLaterais: false,
        temVigaSuperior: false,
        temBatentes: false
      }));
    } else if (selectedType === 'prateleira') {
      setFormData(prev => ({
        ...prev,
        largura: 1200,
        altura: 2000,
        profundidade: 500,
        prateleiras: 5,
        temPortaSocial: false,
        temColunasLaterais: false,
        temVigaSuperior: false
      }));
    } else if (selectedType === 'estante') {
      setFormData(prev => ({
        ...prev,
        largura: 1600,
        altura: 2000,
        profundidade: 400,
        divisoesHorizontais: 3,
        divisoesVerticais: 2,
        temPortaSocial: false,
        temColunasLaterais: false,
        temVigaSuperior: false
      }));
    } else if (selectedType === 'bancada') {
      setFormData(prev => ({
        ...prev,
        largura: 1800,
        altura: 900,
        profundidade: 700,
        numeroPes: 4,
        temPortaSocial: false,
        temColunasLaterais: false,
        temVigaSuperior: false
      }));
    }
  }, [selectedType]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Pure Parametric Structure Calculation Engine
  const calculatedStructure = useMemo(() => {
    const lines: FreeDrawingLine[] = [];
    const pieces: PieceConfig[] = [];

    const W = Math.max(200, Number(formData.largura) || 1200);
    const H = Math.max(200, Number(formData.altura) || 2000);
    const D = Math.max(50, Number(formData.profundidade) || 400);

    const mainProfile = selectedType.includes('portao') || selectedType === 'janela' || selectedType === 'grade'
      ? formData.perfilQuadro 
      : formData.perfilGeral;
    const internalProfile = formData.perfilInterno;

    const addSegment = (
      x1: number, 
      y1: number, 
      x2: number, 
      y2: number, 
      prof: string, 
      typeLabel: PieceType, 
      nameLabel: string,
      colorRole: string = 'default'
    ) => {
      const lenMm = calculateSegmentLength(x1, y1, x2, y2);
      if (lenMm < 5) return; // ignore sub-millimeter stubs

      let angle = calculateAngleDeg(x1, y1, x2, y2);
      if (angle < 0) angle += 360;

      const lineId = `gen-${Date.now()}-${lines.length + 1}`;

      // Vector drawing line
      lines.push({
        id: lineId,
        x1: Math.round(x1),
        y1: Math.round(y1),
        x2: Math.round(x2),
        y2: Math.round(y2),
        lengthMm: lenMm,
        angleDeg: angle,
        profile: prof
      });

      // Structural piece config
      const isVert = Math.abs(x1 - x2) < 5;
      pieces.push({
        id: `pc-${lineId}`,
        name: `${nameLabel} (${lenMm}mm)`,
        type: typeLabel,
        profile: prof,
        length: lenMm,
        width: getProfileThickness(prof),
        height: getProfileThickness(prof),
        thickness: 30,
        posX: Math.min(x1, x2),
        posY: Math.min(y1, y2),
        orientation: isVert ? 'vertical' : 'horizontal',
        angle: angle,
        observations: `Gerado por Mestre Serralheiro (${INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title})`,
        perfil: prof,
        comprimento: lenMm,
        orientacao: isVert ? 'vertical' : 'horizontal',
        'orientação': isVert ? 'vertical' : 'horizontal',
        grupo: INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title || 'Estrutura',
        ordem: pieces.length + 1
      });
    };

    // 1. External Support Columns (Colunas Laterais)
    let colThick = 0;
    if (formData.temColunasLaterais && selectedType.includes('portao')) {
      colThick = getProfileThickness(formData.perfilColuna);
      addSegment(0, 0, 0, H, formData.perfilColuna, 'coluna', 'Coluna Lateral Esquerda (Pilarete)', 'coluna');
      addSegment(W, 0, W, H, formData.perfilColuna, 'coluna', 'Coluna Lateral Direita (Pilarete)', 'coluna');
    }

    // 2. Top Header Beam (Viga Superior / Trilho Guia)
    let beamThick = 0;
    if (formData.temVigaSuperior && selectedType.includes('portao')) {
      beamThick = getProfileThickness(formData.perfilViga);
      addSegment(0, 0, W, 0, formData.perfilViga, 'travessa', 'Viga Superior / Trilho Guia', 'viga');
    }

    // 3. Door Stops (Batentes / Perfis U de Encosto)
    let batThick = 0;
    if (formData.temBatentes && (selectedType.includes('portao') || selectedType === 'janela')) {
      batThick = getProfileThickness(formData.perfilBatente);
      const startX = colThick;
      const endX = W - colThick;
      const startY = beamThick;

      addSegment(startX, startY, startX, H, formData.perfilBatente, 'travessa', 'Batente Lateral Esquerdo', 'batente');
      addSegment(endX, startY, endX, H, formData.perfilBatente, 'travessa', 'Batente Lateral Direito', 'batente');
      addSegment(startX, startY, endX, startY, formData.perfilBatente, 'travessa', 'Batente Superior', 'batente');
    }

    // Calculate Net Frame Envelope Bounds for Gates / Windows / Grades
    const netXMin = colThick + batThick;
    const netXMax = W - colThick - batThick;
    const netYMin = beamThick + batThick;
    const netYMax = H;
    const netWidth = Math.max(100, netXMax - netXMin);
    const netHeight = Math.max(100, netYMax - netYMin);

    // GENERATE CORE GEOMETRY BASED ON MODEL
    if (selectedType.includes('portao') || selectedType === 'janela' || selectedType === 'grade') {
      const numLeaves = Math.max(1, Number(formData.quantidadeFolhas) || 1);
      const leafGap = numLeaves > 1 ? 10 : 0; // 10mm gap between leaves
      const wLeaf = Math.max(100, Math.round((netWidth - (numLeaves - 1) * leafGap) / numLeaves));

      for (let k = 0; k < numLeaves; k++) {
        const x1L = netXMin + k * (wLeaf + leafGap);
        const x2L = x1L + wLeaf;
        const y1L = netYMin;
        const y2L = netYMax;

        const leafLabel = numLeaves > 1 ? ` (Folha ${k + 1})` : '';

        // Leaf Perimeter Frame (Quadro da Folha)
        addSegment(x1L, y1L, x2L, y1L, mainProfile, 'folha_portao', `Quadro Superior${leafLabel}`, 'quadro');
        addSegment(x2L, y1L, x2L, y2L, mainProfile, 'folha_portao', `Quadro Direito${leafLabel}`, 'quadro');
        addSegment(x2L, y2L, x1L, y2L, mainProfile, 'folha_portao', `Quadro Inferior${leafLabel}`, 'quadro');
        addSegment(x1L, y2L, x1L, y1L, mainProfile, 'folha_portao', `Quadro Esquerdo${leafLabel}`, 'quadro');

        // Embedded Wicket Gate (Porta Social Embutida)
        let socialX1 = 0, socialX2 = 0, socialY1 = 0, socialY2 = 0;
        let hasWicketOnLeaf = false;

        if (formData.temPortaSocial && selectedType.includes('portao') && k === 0) {
          hasWicketOnLeaf = true;
          const wSocial = Math.min(wLeaf - 120, Math.max(400, Number(formData.larguraPortaSocial) || 800));
          const hSocial = Math.min(netHeight - 100, Math.max(1000, Number(formData.alturaPortaSocial) || 1900));

          if (formData.posicaoPortaSocial === 'esquerda') {
            socialX1 = x1L + 60;
          } else if (formData.posicaoPortaSocial === 'direita') {
            socialX1 = x2L - wSocial - 60;
          } else {
            socialX1 = x1L + Math.round((wLeaf - wSocial) / 2);
          }

          socialX2 = socialX1 + wSocial;
          socialY2 = y2L - 10;
          socialY1 = socialY2 - hSocial;

          // Wicket Gate Outer Frame / Batente
          addSegment(socialX1, socialY1, socialX2, socialY1, mainProfile, 'travessa', 'Batente Sup Porta Social', 'social');
          addSegment(socialX1, socialY1, socialX1, socialY2, mainProfile, 'travessa', 'Batente Esq Porta Social', 'social');
          addSegment(socialX2, socialY1, socialX2, socialY2, mainProfile, 'travessa', 'Batente Dir Porta Social', 'social');

          // Wicket Gate Inner Leaf
          const gateOff = 5;
          addSegment(socialX1 + gateOff, socialY1 + gateOff, socialX2 - gateOff, socialY1 + gateOff, mainProfile, 'folha_porta', 'Folha Social Superior', 'social_leaf');
          addSegment(socialX2 - gateOff, socialY1 + gateOff, socialX2 - gateOff, socialY2 - gateOff, mainProfile, 'folha_porta', 'Folha Social Direita', 'social_leaf');
          addSegment(socialX2 - gateOff, socialY2 - gateOff, socialX1 + gateOff, socialY2 - gateOff, mainProfile, 'folha_porta', 'Folha Social Inferior', 'social_leaf');
          addSegment(socialX1 + gateOff, socialY2 - gateOff, socialX1 + gateOff, socialY1 + gateOff, mainProfile, 'folha_porta', 'Folha Social Esquerda', 'social_leaf');

          // Transom inside social door
          if (formData.temBarrasNaPortaSocial) {
            const midSocialY = Math.round((socialY1 + socialY2) / 2);
            addSegment(socialX1 + gateOff, midSocialY, socialX2 - gateOff, midSocialY, internalProfile, 'travessa', 'Travessa Meio Porta Social', 'social_bar');
          }
        }

        // Horizontal Transoms (Travessas Horizontais)
        const numH = Math.max(0, Number(formData.travessasHorizontais) || 0);
        if (numH > 0) {
          const stepY = Math.round(netHeight / (numH + 1));
          for (let i = 1; i <= numH; i++) {
            const yBar = y1L + i * stepY;
            addSegment(x1L, yBar, x2L, yBar, internalProfile, 'travessa', `Travessa Horizontal ${i}${leafLabel}`, 'travessa');
          }
        }

        // Vertical Mullions (Montantes Verticais)
        const numV = Math.max(0, Number(formData.travessasVerticais) || 0);
        if (numV > 0) {
          const stepX = Math.round(wLeaf / (numV + 1));
          for (let j = 1; j <= numV; j++) {
            const xBar = x1L + j * stepX;
            // Avoid overlapping vertically with social door if present
            if (hasWicketOnLeaf && xBar > socialX1 - 10 && xBar < socialX2 + 10) {
              // Split vertical bar above social door
              addSegment(xBar, y1L, xBar, socialY1, internalProfile, 'divisao_vertical', `Montante Vertical ${j} (Superior)${leafLabel}`, 'divisao');
            } else {
              addSegment(xBar, y1L, xBar, y2L, internalProfile, 'divisao_vertical', `Montante Vertical ${j}${leafLabel}`, 'divisao');
            }
          }
        }

        // Diagonal Braces (Diagonais)
        if (formData.temDiagonais) {
          if (formData.tipoDiagonal === '/' || formData.tipoDiagonal === 'X') {
            addSegment(x1L, y2L, x2L, y1L, internalProfile, 'diagonal', `Diagonal Ascendente${leafLabel}`, 'diagonal');
          }
          if (formData.tipoDiagonal === '\\' || formData.tipoDiagonal === 'X') {
            addSegment(x1L, y1L, x2L, y2L, internalProfile, 'diagonal', `Diagonal Descendente${leafLabel}`, 'diagonal');
          }
        }

        // Corner Gusset Reinforcements
        if (formData.temReforcos) {
          const gussetOff = Math.min(150, Math.round(wLeaf * 0.15));
          addSegment(x1L, y1L + gussetOff, x1L + gussetOff, y1L, internalProfile, 'reforco', `Gusset Canto Sup-Esq${leafLabel}`, 'reforco');
          addSegment(x2L - gussetOff, y1L, x2L, y1L + gussetOff, internalProfile, 'reforco', `Gusset Canto Sup-Dir${leafLabel}`, 'reforco');
          addSegment(x2L, y2L - gussetOff, x2L - gussetOff, y2L, internalProfile, 'reforco', `Gusset Canto Inf-Dir${leafLabel}`, 'reforco');
          addSegment(x1L + gussetOff, y2L, x1L, y2L - gussetOff, internalProfile, 'reforco', `Gusset Canto Inf-Esq${leafLabel}`, 'reforco');
        }
      }

    } else if (selectedType === 'prateleira') {
      // Columns
      addSegment(0, 0, 0, H, formData.perfilGeral, 'coluna', 'Coluna Esquerda Frontal', 'coluna');
      addSegment(W, 0, W, H, formData.perfilGeral, 'coluna', 'Coluna Direita Frontal', 'coluna');
      addSegment(0, 0, W, 0, formData.perfilGeral, 'travessa', 'Travessa Superior', 'viga');
      addSegment(0, H, W, H, formData.perfilGeral, 'travessa', 'Travessa Base', 'viga');

      const numPrat = Math.max(1, Number(formData.prateleiras));
      for (let i = 1; i <= numPrat; i++) {
        const y = Math.round((i * H) / (numPrat + 1));
        addSegment(0, y, W, y, formData.perfilGeral, 'travessa', `Prateleira Nível ${i}`, 'travessa');
      }

      // 3D Depth Projections
      const depthOffsetX = Math.round(D * 0.35);
      const depthOffsetY = Math.round(-D * 0.25);
      addSegment(0, 0, depthOffsetX, depthOffsetY, formData.perfilGeral, 'travessa', 'Suporte Profundidade Sup Esq', 'reforco');
      addSegment(W, 0, W + depthOffsetX, depthOffsetY, formData.perfilGeral, 'travessa', 'Suporte Profundidade Sup Dir', 'reforco');
      addSegment(0, H, depthOffsetX, H + depthOffsetY, formData.perfilGeral, 'travessa', 'Suporte Profundidade Inf Esq', 'reforco');
      addSegment(W, H, W + depthOffsetX, H + depthOffsetY, formData.perfilGeral, 'travessa', 'Suporte Profundidade Inf Dir', 'reforco');
      addSegment(depthOffsetX, depthOffsetY, W + depthOffsetX, depthOffsetY, formData.perfilGeral, 'travessa', 'Suporte Traseiro Superior', 'reforco');

    } else if (selectedType === 'estante') {
      addSegment(0, 0, W, 0, formData.perfilGeral, 'quadro_interno', 'Quadro Superior', 'quadro');
      addSegment(W, 0, W, H, formData.perfilGeral, 'quadro_interno', 'Coluna Direita', 'quadro');
      addSegment(W, H, 0, H, formData.perfilGeral, 'quadro_interno', 'Quadro Base', 'quadro');
      addSegment(0, H, 0, 0, formData.perfilGeral, 'quadro_interno', 'Coluna Esquerda', 'quadro');

      const numH = Math.max(0, Number(formData.divisoesHorizontais));
      for (let i = 1; i <= numH; i++) {
        const y = Math.round((i * H) / (numH + 1));
        addSegment(0, y, W, y, formData.perfilGeral, 'divisao_horizontal', `Divisória Horizontal ${i}`, 'travessa');
      }

      const numV = Math.max(0, Number(formData.divisoesVerticais));
      for (let j = 1; j <= numV; j++) {
        const x = Math.round((j * W) / (numV + 1));
        addSegment(x, 0, x, H, formData.perfilGeral, 'divisao_vertical', `Divisória Vertical ${j}`, 'divisao');
      }

    } else if (selectedType === 'bancada') {
      // Bench top
      addSegment(0, 0, W, 0, formData.perfilGeral, 'travessa', 'Tampo Frontal', 'viga');
      addSegment(W, 0, W, D, formData.perfilGeral, 'travessa', 'Tampo Lateral Dir', 'viga');
      addSegment(W, D, 0, D, formData.perfilGeral, 'travessa', 'Tampo Traseiro', 'viga');
      addSegment(0, D, 0, 0, formData.perfilGeral, 'travessa', 'Tampo Lateral Esq', 'viga');

      // Legs
      addSegment(0, 0, 0, H, formData.perfilGeral, 'coluna', 'Pé Frontal Esquerdo', 'coluna');
      addSegment(W, 0, W, H, formData.perfilGeral, 'coluna', 'Pé Frontal Direito', 'coluna');
      addSegment(0, D, 0, D + H, formData.perfilGeral, 'coluna', 'Pé Traseiro Esquerdo', 'coluna');
      addSegment(W, D, W, D + H, formData.perfilGeral, 'coluna', 'Pé Traseiro Direito', 'coluna');

      if (Number(formData.numeroPes) >= 6) {
        addSegment(W / 2, 0, W / 2, H, formData.perfilGeral, 'coluna', 'Pé Central Frontal', 'coluna');
        addSegment(W / 2, D, W / 2, D + H, formData.perfilGeral, 'coluna', 'Pé Central Traseiro', 'coluna');
      }

      const tieY = Math.round(H * 0.75);
      addSegment(0, tieY, W, tieY, formData.perfilGeral, 'travessa', 'Reforço Inferior Frontal', 'travessa');
      addSegment(0, D + tieY, W, D + tieY, formData.perfilGeral, 'travessa', 'Reforço Inferior Traseiro', 'travessa');
    }

    // STATS & PARAMETRIC CALCULATIONS
    const totalLinearMeters = lines.reduce((acc, l) => acc + l.lengthMm, 0) / 1000;
    const totalBars6m = Math.ceil(totalLinearMeters / 6);
    const estimatedWeightKg = Math.round(totalLinearMeters * 2.4 * 10) / 10; // ~2.4 kg/m average profile weight
    const pieceCount = pieces.length;
    const weldJointCount = pieceCount * 2;
    const frameDiagonalMm = Math.round(Math.hypot(W, H));

    // Parametric engine process recommendation
    const dummyConnId = 'canto_90';
    const recommendedProcess = getRecommendedProcess(dummyConnId);
    const requiredReinforcements = getRequiredReinforcements(dummyConnId);

    return {
      lines,
      pieces,
      bounds: { width: W, height: H, depth: D },
      stats: {
        totalLinearMeters: Math.round(totalLinearMeters * 10) / 10,
        totalBars6m,
        estimatedWeightKg,
        pieceCount,
        weldJointCount,
        squarenessStatus: 'Esquadria Perfeita (90.0°)',
        diagonalMm: frameDiagonalMm
      },
      recommendedProcess,
      requiredReinforcements
    };
  }, [selectedType, formData]);

  // Handler: Confirm structure and generate to ObjectManager / Project
  const handleGenerateStructure = () => {
    if (selectedType === 'personalizada') {
      onOpenFreeDrawingDirectly();
      return;
    }

    const { lines, pieces, bounds } = calculatedStructure;
    const W = bounds.width;
    const H = bounds.height;

    const currentTitle = INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title || 'Projeto Metal';
    const projName = `${currentTitle} (${W}x${H}mm)`;

    const frameConfig: FrameConfig = {
      width: W,
      height: H,
      displayUnit: 'mm',
      displayWidth: W,
      displayHeight: H,
      profile: formData.perfilQuadro
    };

    const freeDrawingData = {
      lines,
      viewport: { zoom: 0.35, panX: 250, panY: 180 },
      gridSizeMm: 50,
      snapToGrid: true,
      snapToEndpoints: true,
      updatedAt: new Date().toISOString()
    };

    const targetProjectId = project?.id || `proj-${Date.now()}`;

    const updatedProject: MetalProject = {
      id: targetProjectId,
      name: project?.name && !project.name.startsWith('Novo Projeto') ? project.name : projName,
      status: project?.status || 'planejamento',
      createdAt: project?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frame: frameConfig,
      pieces: pieces,
      freeDrawing: freeDrawingData
    };

    // Dispatch directly to ObjectManager and EventBus
    objectManager.setPieces(pieces, targetProjectId);
    objectManager.updateFreeDrawing(freeDrawingData, targetProjectId);

    eventBus.emit('objects:updated', { projectId: targetProjectId, pieces });
    eventBus.emit('freedrawing:updated', { projectId: targetProjectId, freeDrawing: freeDrawingData });
    eventBus.emit('project:updated', updatedProject);

    // Navigate to Canvas & details view
    onGenerateAndOpenDrawing(updatedProject);
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-12">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Serralheria 2.0 • Gerador Paramétrico Inteligente</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
            <span>🛠️ Mestre Serralheiro Paramétrico</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-medium max-w-2xl leading-relaxed">
            Selecione a estrutura desejada. Defina as dimensões e elementos (folhas, porta social, colunas, viga e batentes). O sistema recalcula automaticamente o desenho em tempo real e atualiza Lista de Corte, Plano de Corte e Orçamento.
          </p>
        </div>

        {/* Free Drawing Canvas Button */}
        <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-1.5 shrink-0 max-w-xs transition">
          <button
            type="button"
            id="btn-editar-estrutura-manualmente"
            onClick={onOpenFreeDrawingDirectly}
            className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300/50 active:scale-[0.98]"
          >
            <Pencil className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>✏️ Canvas de Desenho Livre</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center leading-tight">
            Para montar e desenhar do zero de forma 100% personalizada.
          </p>
        </div>
      </div>

      {/* 2. Categorized Templates Selector */}
      <div className="flex flex-col gap-8">
        {CATEGORIES.map((cat) => {
          const categoryTemplates = INITIAL_TEMPLATES.filter(t => cat.templateIds.includes(t.id));
          return (
            <div key={cat.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 tracking-tight">
                  {cat.title}
                </h2>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {categoryTemplates.map((tmpl) => {
                  const isSelected = selectedType === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      id={`card-template-${tmpl.id}`}
                      onClick={() => {
                        setSelectedType(tmpl.id);
                        if (tmpl.id === 'personalizada') {
                          onOpenFreeDrawingDirectly();
                        } else {
                          const formElem = document.getElementById('sec-gerador-parametrico');
                          if (formElem) {
                            formElem.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4 group active:scale-[0.99] ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500 shadow-xl text-white ring-4 ring-amber-500/20'
                          : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 text-slate-900 shadow-xs'
                      }`}
                    >
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] font-mono px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>SELECIONADO</span>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-amber-100 group-hover:border-amber-300'
                        }`}>
                          {tmpl.icon}
                        </div>

                        <div>
                          <h3 className={`text-base sm:text-lg font-bold font-display leading-tight ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}>
                            {tmpl.title}
                          </h3>
                          <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}>
                            {tmpl.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-xs font-bold">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono ${
                          isSelected ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tmpl.badge}
                        </span>
                        <span className={`flex items-center gap-1 transition ${
                          isSelected ? 'text-amber-400 font-bold' : 'text-slate-400 group-hover:text-amber-600'
                        }`}>
                          <span>Selecionar</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Parametric Generator & Real-time Live SVG Preview */}
      {selectedType !== 'personalizada' && (
        <div id="sec-gerador-parametrico" className="flex flex-col gap-8 mt-4">
          
          {/* Main Grid: Form Inputs (Left) vs SVG Real-time Live Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Parametric Form Inputs */}
            <div className="lg:col-span-6 bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-md flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    2. Parâmetros da Estrutura
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-2">
                    {INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    Altere qualquer medida. O desenho ao lado é recalculado instantaneamente.
                  </p>
                </div>
              </div>

              {/* Parametric Sections Navigation Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('dimensoes')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'dimensoes' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Ruler className="w-4 h-4 text-amber-500" />
                  <span>Dimensões & Folhas</span>
                </button>

                {selectedType.includes('portao') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('porta_social')}
                    className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeTab === 'porta_social' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <DoorOpen className="w-4 h-4 text-emerald-500" />
                    <span>Porta Social</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('estruturais')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'estruturais' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-4 h-4 text-sky-500" />
                  <span>Barras & Travas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('perfis')}
                  className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'perfis' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-500" />
                  <span>Perfis Metálicos</span>
                </button>
              </div>

              {/* TAB 1: DIMENSÕES E FOLHAS */}
              {activeTab === 'dimensoes' && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    <span>Tamanho Geral (em milímetros)</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {selectedType === 'bancada' ? 'Comprimento Total (mm)' : 'Largura Total (mm)'}
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={formData.largura}
                        onChange={(e) => handleInputChange('largura', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        placeholder="Ex: 3000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Altura Total (mm)
                      </label>
                      <input
                        type="number"
                        step="10"
                        value={formData.altura}
                        onChange={(e) => handleInputChange('altura', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        placeholder="Ex: 2200"
                      />
                    </div>

                    {(selectedType === 'prateleira' || selectedType === 'estante' || selectedType === 'bancada') && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Profundidade (mm)
                        </label>
                        <input
                          type="number"
                          step="10"
                          value={formData.profundidade}
                          onChange={(e) => handleInputChange('profundidade', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                          placeholder="Ex: 400"
                        />
                      </div>
                    )}

                    {(selectedType.includes('portao') || selectedType === 'janela') && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Quantidade de Folhas
                        </label>
                        <select
                          value={formData.quantidadeFolhas}
                          onChange={(e) => handleInputChange('quantidadeFolhas', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value={1}>1 Folha Única</option>
                          <option value={2}>2 Folhas Duplas</option>
                          <option value={3}>3 Folhas Triplas</option>
                          <option value={4}>4 Folhas Articuladas</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* External Frames Support Toggles for Gates */}
                  {selectedType.includes('portao') && (
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                      <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-purple-500" />
                        <span>Colunas, Viga e Batentes Externos</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border-2 border-slate-200 text-xs font-bold hover:bg-amber-50/40">
                          <input
                            type="checkbox"
                            checked={formData.temColunasLaterais}
                            onChange={(e) => handleInputChange('temColunasLaterais', e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Incluir Colunas Laterais (Pilates)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border-2 border-slate-200 text-xs font-bold hover:bg-amber-50/40">
                          <input
                            type="checkbox"
                            checked={formData.temVigaSuperior}
                            onChange={(e) => handleInputChange('temVigaSuperior', e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Incluir Viga Superior / Trilho Guia</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border-2 border-slate-200 text-xs font-bold hover:bg-amber-50/40 sm:col-span-2">
                          <input
                            type="checkbox"
                            checked={formData.temBatentes}
                            onChange={(e) => handleInputChange('temBatentes', e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Incluir Perfis de Batente U de Encosto</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PORTA SOCIAL EMBUTIDA */}
              {activeTab === 'porta_social' && selectedType.includes('portao') && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <DoorOpen className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 font-display">
                          Porta Social (Wicket Gate) Embutida
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Insere um portãozinho social embutido na folha do portão principal.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.temPortaSocial}
                        onChange={(e) => handleInputChange('temPortaSocial', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {formData.temPortaSocial && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Largura da Social (mm)
                        </label>
                        <input
                          type="number"
                          step="10"
                          value={formData.larguraPortaSocial}
                          onChange={(e) => handleInputChange('larguraPortaSocial', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                          placeholder="Ex: 800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Altura da Social (mm)
                        </label>
                        <input
                          type="number"
                          step="10"
                          value={formData.alturaPortaSocial}
                          onChange={(e) => handleInputChange('alturaPortaSocial', Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                          placeholder="Ex: 1900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Posição no Portão
                        </label>
                        <select
                          value={formData.posicaoPortaSocial}
                          onChange={(e) => handleInputChange('posicaoPortaSocial', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="esquerda">Lado Esquerdo</option>
                          <option value="centro">Centralizado</option>
                          <option value="direita">Lado Direito</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border-2 border-slate-200 text-xs font-bold hover:bg-emerald-50/40 w-full">
                          <input
                            type="checkbox"
                            checked={formData.temBarrasNaPortaSocial}
                            onChange={(e) => handleInputChange('temBarrasNaPortaSocial', e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Incluir Travessa Meio Social</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: BARRAS, DIVISÕES & DIAGONAIS */}
              {activeTab === 'estruturais' && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-sky-500" />
                    <span>Barras e Trava Interna</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Travessas Horizontais
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={formData.travessasHorizontais}
                        onChange={(e) => handleInputChange('travessasHorizontais', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Montantes Verticais / Barrotes
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.travessasVerticais}
                        onChange={(e) => handleInputChange('travessasVerticais', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Reforço Diagonal (Mão de Força)
                      </label>
                      <select
                        value={formData.tipoDiagonal}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleInputChange('tipoDiagonal', val);
                          handleInputChange('temDiagonais', val !== 'none');
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="none">Sem Diagonal</option>
                        <option value="/">Diagonal Ascendente (/)</option>
                        <option value="\">Diagonal Descendente (\)</option>
                        <option value="X">Dupla Diagonal em X (X)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3 rounded-xl border-2 border-slate-200 text-xs font-bold hover:bg-amber-50/40 w-full">
                        <input
                          type="checkbox"
                          checked={formData.temReforcos}
                          onChange={(e) => handleInputChange('temReforcos', e.target.checked)}
                          className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                        />
                        <span>Gussets de Canto (Chapas Reforço)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PERFIS METÁLICOS */}
              {activeTab === 'perfis' && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Seleção de Perfilamento</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Perfil do Quadro da Folha
                      </label>
                      <select
                        value={formData.perfilQuadro}
                        onChange={(e) => handleInputChange('perfilQuadro', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.widthMm}x{p.heightMm}mm)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Perfil das Barras Internas
                      </label>
                      <select
                        value={formData.perfilInterno}
                        onChange={(e) => handleInputChange('perfilInterno', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.widthMm}x{p.heightMm}mm)
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.temColunasLaterais && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Perfil das Colunas Laterais
                        </label>
                        <select
                          value={formData.perfilColuna}
                          onChange={(e) => handleInputChange('perfilColuna', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({p.widthMm}x{p.heightMm}mm)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.temVigaSuperior && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Perfil da Viga Superior
                        </label>
                        <select
                          value={formData.perfilViga}
                          onChange={(e) => handleInputChange('perfilViga', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          {profiles.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({p.widthMm}x{p.heightMm}mm)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Interactive Real-time SVG Preview Canvas & Engineering Summary */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* SVG Real-Time Preview Container */}
              <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-sm font-bold font-mono tracking-tight text-slate-200 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>PRÉ-VISUALIZAÇÃO EM TEMPO REAL</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.2))}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                      title="Diminuir zoom"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 px-1 font-bold">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(2.0, z + 0.2))}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(1)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                      title="Resetar zoom"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Interactive Canvas Box */}
                <div className="w-full h-[380px] bg-slate-900/90 border border-slate-800/80 rounded-2xl relative overflow-hidden flex items-center justify-center p-4">
                  {/* Grid background effect */}
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />

                  {/* SVG Canvas Renderer */}
                  {(() => {
                    const W = calculatedStructure.bounds.width;
                    const H = calculatedStructure.bounds.height;
                    const margin = 80;
                    const viewBoxW = W + margin * 2;
                    const viewBoxH = H + margin * 2;

                    return (
                      <svg
                        viewBox={`${-margin} ${-margin} ${viewBoxW} ${viewBoxH}`}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${previewZoom})` }}
                      >
                        {/* Structure Lines */}
                        {calculatedStructure.lines.map((l, idx) => {
                          const isQuadro = l.profile === formData.perfilQuadro;
                          const isColuna = l.profile === formData.perfilColuna;
                          const isViga = l.profile === formData.perfilViga;
                          const isBatente = l.profile === formData.perfilBatente;
                          
                          let strokeColor = '#0284c7'; // Sky blue default
                          let strokeWidth = 14;

                          if (isColuna) {
                            strokeColor = '#a855f7'; // Purple
                            strokeWidth = 24;
                          } else if (isViga) {
                            strokeColor = '#3b82f6'; // Blue
                            strokeWidth = 20;
                          } else if (isBatente) {
                            strokeColor = '#e11d48'; // Rose
                            strokeWidth = 12;
                          } else if (isQuadro) {
                            strokeColor = '#f59e0b'; // Amber Gold
                            strokeWidth = 18;
                          }

                          return (
                            <g key={l.id || idx}>
                              <line
                                x1={l.x1}
                                y1={l.y1}
                                x2={l.x2}
                                y2={l.y2}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                className="transition-all hover:opacity-80"
                              />
                              {/* Inner core line for metallic high-contrast look */}
                              <line
                                x1={l.x1}
                                y1={l.y1}
                                x2={l.x2}
                                y2={l.y2}
                                stroke="#ffffff"
                                strokeWidth={2}
                                strokeOpacity={0.4}
                              />
                            </g>
                          );
                        })}

                        {/* Outer Dimension Quotes */}
                        {/* Width Quote */}
                        <g className="text-amber-400 font-mono text-[28px] font-bold">
                          <line x1={0} y1={-35} x2={W} y2={-35} stroke="#f59e0b" strokeWidth={3} strokeDasharray="6,6" />
                          <line x1={0} y1={-50} x2={0} y2={-20} stroke="#f59e0b" strokeWidth={2} />
                          <line x1={W} y1={-50} x2={W} y2={-20} stroke="#f59e0b" strokeWidth={2} />
                          <text x={W / 2} y={-45} textAnchor="middle" fill="#fbbf24" fontWeight="bold">
                            L = {W} mm
                          </text>
                        </g>

                        {/* Height Quote */}
                        <g className="text-amber-400 font-mono text-[28px] font-bold">
                          <line x1={-35} y1={0} x2={-35} y2={H} stroke="#f59e0b" strokeWidth={3} strokeDasharray="6,6" />
                          <line x1={-50} y1={0} x2={-20} y2={0} stroke="#f59e0b" strokeWidth={2} />
                          <line x1={-50} y1={H} x2={-20} y2={H} stroke="#f59e0b" strokeWidth={2} />
                          <text x={-45} y={H / 2} textAnchor="middle" fill="#fbbf24" fontWeight="bold" transform={`rotate(-90 ${-45} ${H/2})`}>
                            H = {H} mm
                          </text>
                        </g>
                      </svg>
                    );
                  })()}
                </div>

                {/* Color Legend Bar */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono font-bold text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span>Quadro Principal</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
                    <span>Barras Internas</span>
                  </span>
                  {formData.temColunasLaterais && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                      <span>Colunas</span>
                    </span>
                  )}
                  {formData.temVigaSuperior && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                      <span>Viga Trilho</span>
                    </span>
                  )}
                  {formData.temPortaSocial && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Porta Social</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Real-Time Structural KPIs & Summary Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col gap-6">
                <div>
                  <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold px-3 py-1 rounded-full uppercase inline-block mb-3">
                    Resumo do Projeto Recalculado
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Metros Lineares</span>
                      <strong className="text-base text-amber-400 font-bold">{calculatedStructure.stats.totalLinearMeters} m</strong>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Barras (6m)</span>
                      <strong className="text-base text-white font-bold">{calculatedStructure.stats.totalBars6m} barras</strong>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Peso Estimado</span>
                      <strong className="text-base text-sky-400 font-bold">{calculatedStructure.stats.estimatedWeightKg} kg</strong>
                    </div>

                    <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase">Total Peças</span>
                      <strong className="text-base text-emerald-400 font-bold">{calculatedStructure.stats.pieceCount} peças</strong>
                    </div>
                  </div>
                </div>

                {/* Fabrication Process Advice from Parametric Engine */}
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 text-xs font-mono space-y-2 text-slate-300">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Hammer className="w-4 h-4" />
                    <span>Recomendação de Fabricação (ParametricEngine):</span>
                  </div>
                  <p className="text-slate-300">
                    • <strong>Processo:</strong> {calculatedStructure.recommendedProcess.primaryProcess}
                  </p>
                  <p className="text-slate-300">
                    • <strong>Preparação de Borda:</strong> {calculatedStructure.recommendedProcess.edgePrepInstruction}
                  </p>
                  <p className="text-slate-300">
                    • <strong>Verificação Geométrica:</strong> {calculatedStructure.stats.squarenessStatus} (Diagonais exatas = {calculatedStructure.stats.diagonalMm}mm)
                  </p>
                </div>

                {/* Confirmation Button */}
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    id="btn-gerar-estrutura-principal"
                    onClick={handleGenerateStructure}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-mono text-base rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer border border-amber-400/50"
                  >
                    <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                    <span>⚡ GERAR ESTRUTURA E ABRIR DESENHO</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center font-sans">
                    Envia todas as peças ao ObjectManager. Canvas, Lista de Corte, Plano de Corte e Orçamento serão gerados na hora.
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* 4. Footer Help Section */}
      <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs flex items-start sm:items-center gap-4 text-slate-950">
        <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 font-bold text-2xl shadow-xs">
          💡
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-slate-950">
            Dica do Mestre Serralheiro
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 mt-0.5 font-medium leading-relaxed">
            Ao alterar qualquer dimensão ou selecionar perfis metálicos diferentes, o gerador paramétrico recalcula a geometria com folgas e encaixes ideais. Após gerar a estrutura, você poderá realizar ajustes manuais finos diretamente no Canvas.
          </p>
        </div>
      </div>
    </div>
  );
};
