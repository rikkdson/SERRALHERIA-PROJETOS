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
  Hammer
} from 'lucide-react';
import { MetalProject, FreeDrawingLine, PieceConfig, PieceType, MaterialProfile, FrameConfig } from '../types';
import { getMaterialProfiles } from '../utils/materialsStore';

export type StructureTypeId = 
  | 'portao_abrir' 
  | 'portao_correr' 
  | 'janela' 
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
    title: 'Portão de Abrir',
    icon: '🚪',
    badge: 'Portões',
    description: 'Portão comum com uma ou duas folhas.',
    popular: true
  },
  {
    id: 'portao_correr',
    title: 'Portão de Correr',
    icon: '🚪',
    badge: 'Portões',
    description: 'Portão reforçado para correr em trilho.',
    popular: true
  },
  {
    id: 'janela',
    title: 'Janela',
    icon: '🪟',
    badge: 'Janelas',
    description: 'Janela metálica simples ou dividida.'
  },
  {
    id: 'prateleira',
    title: 'Prateleira',
    icon: '📚',
    badge: 'Móveis',
    description: 'Prateleira para oficina, estoque ou garagem.',
    popular: true
  },
  {
    id: 'estante',
    title: 'Estante',
    icon: '🗄️',
    badge: 'Móveis',
    description: 'Estante com várias divisões para guardar objetos e peças.'
  },
  {
    id: 'bancada',
    title: 'Bancada',
    icon: '🛠️',
    badge: 'Móveis',
    description: 'Bancada de trabalho reforçada para oficina.'
  },
  {
    id: 'personalizada',
    title: 'Estrutura Personalizada',
    icon: '✏️',
    badge: 'Personalizado',
    description: 'Para quem deseja montar uma estrutura totalmente personalizada.'
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
    title: '🚪 PORTÕES',
    icon: '🚪',
    templateIds: ['portao_abrir', 'portao_correr']
  },
  {
    id: 'janelas',
    title: '🪟 JANELAS',
    icon: '🪟',
    templateIds: ['janela']
  },
  {
    id: 'prateleiras_moveis',
    title: '📚 PRATELEIRAS E MÓVEIS',
    icon: '📚',
    templateIds: ['prateleira', 'estante', 'bancada']
  },
  {
    id: 'personalizado',
    title: '⭐ PERSONALIZADO',
    icon: '⭐',
    templateIds: ['personalizada']
  }
];

export const UPCOMING_TEMPLATES = [
  { id: 'pergolado', title: 'Pergolado', icon: '🏕️', description: 'Pergolado metálico para área externa ou garagem.' },
  { id: 'cobertura', title: 'Cobertura', icon: '🏠', description: 'Cobertura ou telhado estruturado em metal.' },
  { id: 'mezanino', title: 'Mezanino', icon: '🏭', description: 'Estrutura de piso elevado e mezanino industrial.' },
  { id: 'escada', title: 'Escada', icon: '🪜', description: 'Escada reta, caracol ou espinha de peixe.' },
  { id: 'guarda_corpo', title: 'Guarda-corpo', icon: '🛡️', description: 'Guarda-corpo e corrimão para sacadas e escadas.' }
];

export const FUTURE_TEMPLATES = UPCOMING_TEMPLATES.map(u => ({
  name: u.title,
  category: 'Em breve',
  icon: u.icon
}));

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
    largura: 1200,
    altura: 2000,
    profundidade: 400,
    
    // Quantity Divisions
    prateleiras: 4,
    divisoesHorizontais: 3,
    divisoesVerticais: 1,
    divisoesJanela: 2,
    
    // Gate specifics
    travessas: 2,
    montantes: 5,
    possuiDiagonal: true,
    
    // Bench specifics
    numeroPes: 4,

    // Profile selections
    perfilQuadro: 'Metalon 40x40',
    perfilInterno: 'Metalon 20x20',
    perfilGeral: 'Metalon 30x30'
  });

  // Ensure default profiles are populated from available profiles if present
  useEffect(() => {
    if (profiles.length > 0) {
      const p1 = profiles[0]?.name || 'Metalon 30x30';
      const p2 = profiles.find(p => p.name.includes('20') || p.name.includes('15'))?.name || p1;
      const pQuadro = profiles.find(p => p.name.includes('40') || p.name.includes('50'))?.name || p1;

      setFormData(prev => ({
        ...prev,
        perfilGeral: p1,
        perfilQuadro: pQuadro,
        perfilInterno: p2
      }));
    }
  }, [profiles]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to generate Lines and Pieces based on selected structure type and form inputs
  const handleGenerateStructure = () => {
    if (selectedType === 'personalizada') {
      onOpenFreeDrawingDirectly();
      return;
    }

    const {
      largura,
      altura,
      profundidade,
      prateleiras,
      divisoesHorizontais,
      divisoesVerticais,
      divisoesJanela,
      travessas,
      montantes,
      possuiDiagonal,
      numeroPes,
      perfilQuadro,
      perfilInterno,
      perfilGeral
    } = formData;

    const lines: FreeDrawingLine[] = [];
    const pieces: PieceConfig[] = [];

    const W = Math.max(100, Number(largura) || 1000);
    const H = Math.max(100, Number(altura) || 1000);
    const D = Math.max(50, Number(profundidade) || 400);

    const mainProfileName = selectedType.includes('portao') ? perfilQuadro : perfilGeral;
    const secondaryProfileName = selectedType.includes('portao') ? perfilInterno : perfilGeral;

    const addLine = (
      x1: number, 
      y1: number, 
      x2: number, 
      y2: number, 
      prof: string, 
      typeLabel: PieceType, 
      nameLabel: string
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenMm = Math.round(Math.hypot(dx, dy));
      let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (angle < 0) angle += 360;

      const lineId = `gen-${Date.now()}-${lines.length + 1}`;

      // 2D Drawing Vector Line
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

      // PieceConfig for Cut List & Budget
      const isVert = Math.abs(x1 - x2) < 5;
      pieces.push({
        id: `pc-${lineId}`,
        name: `${nameLabel} (${lenMm}mm)`,
        type: typeLabel,
        profile: prof,
        length: lenMm,
        width: 30,
        height: 30,
        thickness: 30,
        posX: Math.min(x1, x2),
        posY: Math.min(y1, y2),
        orientation: isVert ? 'vertical' : 'horizontal',
        angle: angle,
        observations: `Gerado por Assistente (${INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title})`,
        perfil: prof,
        comprimento: lenMm,
        orientacao: isVert ? 'vertical' : 'horizontal',
        'orientação': isVert ? 'vertical' : 'horizontal',
        grupo: INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title || 'Estrutura',
        ordem: pieces.length + 1
      });
    };

    // GENERATE GEOMETRY BASED ON MODEL
    if (
      selectedType === 'portao_abrir' || 
      selectedType === 'portao_correr' || 
      selectedType === 'janela' || 
      selectedType === 'grade' || 
      selectedType === 'personalizada'
    ) {
      // Quadro externo SOMENTE (ET-009D.2A - Correção 01)
      addLine(0, 0, W, 0, mainProfileName, 'quadro_interno', 'Quadro Superior');
      addLine(W, 0, W, H, mainProfileName, 'quadro_interno', 'Quadro Direito');
      addLine(W, H, 0, H, mainProfileName, 'quadro_interno', 'Quadro Inferior');
      addLine(0, H, 0, 0, mainProfileName, 'quadro_interno', 'Quadro Esquerdo');

    } else if (selectedType === 'prateleira') {
      // Main Left & Right Columns
      addLine(0, 0, 0, H, perfilGeral, 'coluna', 'Coluna Esquerda Frontal');
      addLine(W, 0, W, H, perfilGeral, 'coluna', 'Coluna Direita Frontal');

      // Top and Bottom Ties
      addLine(0, 0, W, 0, perfilGeral, 'travessa', 'Travessa Superior');
      addLine(0, H, W, H, perfilGeral, 'travessa', 'Travessa Base');

      // Shelves
      const numPrat = Math.max(1, Number(prateleiras));
      for (let i = 1; i <= numPrat; i++) {
        const y = Math.round((i * H) / (numPrat + 1));
        addLine(0, y, W, y, perfilGeral, 'travessa', `Prateleira ${i}`);
      }

      // Side Depth Visual Projection
      const depthOffsetX = Math.round(D * 0.35);
      const depthOffsetY = Math.round(-D * 0.25);

      addLine(0, 0, depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Suporte Profundidade Sup Esq');
      addLine(W, 0, W + depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Suporte Profundidade Sup Dir');
      addLine(0, H, depthOffsetX, H + depthOffsetY, perfilGeral, 'travessa', 'Suporte Profundidade Inf Esq');
      addLine(W, H, W + depthOffsetX, H + depthOffsetY, perfilGeral, 'travessa', 'Suporte Profundidade Inf Dir');
      addLine(depthOffsetX, depthOffsetY, W + depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Suporte Traseiro Superior');

    } else if (selectedType === 'estante') {
      // Outer Frame
      addLine(0, 0, W, 0, perfilGeral, 'quadro_interno', 'Quadro Superior');
      addLine(W, 0, W, H, perfilGeral, 'quadro_interno', 'Coluna Direita');
      addLine(W, H, 0, H, perfilGeral, 'quadro_interno', 'Quadro Base');
      addLine(0, H, 0, 0, perfilGeral, 'quadro_interno', 'Coluna Esquerda');

      // Horizontal Divisions
      const numH = Math.max(0, Number(divisoesHorizontais));
      for (let i = 1; i <= numH; i++) {
        const y = Math.round((i * H) / (numH + 1));
        addLine(0, y, W, y, perfilGeral, 'divisao_horizontal', `Divisória Horizontal ${i}`);
      }

      // Vertical Divisions
      const numV = Math.max(0, Number(divisoesVerticais));
      for (let j = 1; j <= numV; j++) {
        const x = Math.round((j * W) / (numV + 1));
        addLine(x, 0, x, H, perfilGeral, 'divisao_vertical', `Divisória Vertical ${j}`);
      }

    } else if (selectedType === 'bancada') {
      // Top Frame (Tampo)
      addLine(0, 0, W, 0, perfilGeral, 'travessa', 'Estrutura Tampo Frontal');
      addLine(W, 0, W, D, perfilGeral, 'travessa', 'Estrutura Tampo Lateral Dir');
      addLine(W, D, 0, D, perfilGeral, 'travessa', 'Estrutura Tampo Traseira');
      addLine(0, D, 0, 0, perfilGeral, 'travessa', 'Estrutura Tampo Lateral Esq');

      // Legs
      addLine(0, 0, 0, H, perfilGeral, 'coluna', 'Pé Frontal Esquerdo');
      addLine(W, 0, W, H, perfilGeral, 'coluna', 'Pé Frontal Direito');
      addLine(0, D, 0, D + H, perfilGeral, 'coluna', 'Pé Traseiro Esquerdo');
      addLine(W, D, W, D + H, perfilGeral, 'coluna', 'Pé Traseiro Direito');

      if (Number(numeroPes) >= 6) {
        addLine(W / 2, 0, W / 2, H, perfilGeral, 'coluna', 'Pé Central Frontal');
        addLine(W / 2, D, W / 2, D + H, perfilGeral, 'coluna', 'Pé Central Traseiro');
      }

      // Reinforcement Lower Ties
      const tieY = Math.round(H * 0.75);
      addLine(0, tieY, W, tieY, perfilGeral, 'travessa', 'Reforço Inferior Frontal');
      addLine(0, D + tieY, W, D + tieY, perfilGeral, 'travessa', 'Reforço Inferior Traseiro');
      addLine(0, tieY, 0, D + tieY, perfilGeral, 'travessa', 'Reforço Inferior Lateral Esq');
      addLine(W, tieY, W, D + tieY, perfilGeral, 'travessa', 'Reforço Inferior Lateral Dir');
    }

    // Build or Update Project Object
    const currentTitle = INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title || 'Projeto Metal';
    const projName = `${currentTitle} (${W}x${H}mm)`;

    const frameConfig: FrameConfig = {
      width: W,
      height: H,
      displayUnit: 'mm',
      displayWidth: W,
      displayHeight: H,
      profile: mainProfileName
    };

    const updatedProject: MetalProject = {
      id: project?.id || `proj-${Date.now()}`,
      name: project?.name && !project.name.startsWith('Novo Projeto') ? project.name : projName,
      status: project?.status || 'planejamento',
      createdAt: project?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frame: frameConfig,
      pieces: pieces,
      freeDrawing: {
        lines,
        viewport: { zoom: 0.35, panX: 250, panY: 180 },
        gridSizeMm: 50,
        snapToGrid: true,
        snapToEndpoints: true,
        updatedAt: new Date().toISOString()
      }
    };

    onGenerateAndOpenDrawing(updatedProject);
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-8">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>ET-009A.2 • Mestre Serralheiro</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white flex items-center gap-3">
            <span>🛠️ O que você quer fabricar hoje?</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 font-medium max-w-2xl leading-relaxed">
            Escolha um modelo abaixo. Depois informe apenas as medidas.
          </p>
        </div>

        {/* Manual Editing Button */}
        <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-4 flex flex-col gap-1.5 shrink-0 max-w-xs transition">
          <button
            type="button"
            id="btn-editar-estrutura-manualmente"
            onClick={onOpenFreeDrawingDirectly}
            className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300/50 active:scale-[0.98]"
          >
            <Pencil className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>✏️ Editar Estrutura Manualmente</span>
          </button>
          <p className="text-[11px] text-slate-400 text-center leading-tight">
            Para quem deseja montar uma estrutura totalmente personalizada.
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

              {/* Grid of Cards: 1 col (mobile), 2 cols (tablet), 3/4 cols (desktop) */}
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
                          const formElem = document.getElementById('sec-medidas-form');
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
                        {/* Big Icon */}
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

        {/* 3. Upcoming Models (Em Breve) */}
        <div className="flex flex-col gap-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
            <span className="text-2xl">🚧</span>
            <h2 className="text-lg sm:text-xl font-black font-display text-slate-900 tracking-tight">
              EM BREVE (NOVOS MODELOS)
            </h2>
            <span className="text-xs font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full ml-auto">
              Em Desenvolvimento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {UPCOMING_TEMPLATES.map((up) => (
              <div
                key={up.id}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 text-slate-500 flex items-start gap-3.5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-200/80 border border-slate-300 flex items-center justify-center text-2xl shrink-0 opacity-70">
                  {up.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-700 font-display">
                      {up.title}
                    </h3>
                    <span className="bg-slate-200 text-slate-600 font-bold text-[10px] font-mono px-2 py-0.5 rounded-full">
                      Em breve
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                    {up.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Measurement Form Section */}
      {selectedType !== 'personalizada' && (
        <div id="sec-medidas-form" className="bg-white border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                2. Medidas da Peça
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-display text-slate-900 mt-2">
                Informe as Medidas ({INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title})
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Digite os tamanhos em milímetros (mm). O aplicativo cuida de todos os cortes e encaixes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Inputs Grid */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Dimensions Section */}
              <div>
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-amber-500" />
                  <span>Tamanho da Estrutura</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {selectedType === 'bancada' ? 'Comprimento (mm)' : 'Largura Total (mm)'}
                    </label>
                    <input
                      type="number"
                      value={formData.largura}
                      onChange={(e) => handleInputChange('largura', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      placeholder="Ex: 1200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Altura Total (mm)
                    </label>
                    <input
                      type="number"
                      value={formData.altura}
                      onChange={(e) => handleInputChange('altura', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      placeholder="Ex: 2000"
                    />
                  </div>

                  {(selectedType === 'prateleira' || selectedType === 'estante' || selectedType === 'bancada') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Profundidade (mm)
                      </label>
                      <input
                        type="number"
                        value={formData.profundidade}
                        onChange={(e) => handleInputChange('profundidade', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        placeholder="Ex: 400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Simple Structural Division Inputs */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-amber-500" />
                  <span>Barras e Divisões Internas</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedType === 'prateleira' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Quantidade de Prateleiras
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={formData.prateleiras}
                        onChange={(e) => handleInputChange('prateleiras', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                  )}

                  {selectedType === 'estante' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Barras Horizontais
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="15"
                          value={formData.divisoesHorizontais}
                          onChange={(e) => handleInputChange('divisoesHorizontais', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Barras Verticais
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.divisoesVerticais}
                          onChange={(e) => handleInputChange('divisoesVerticais', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>
                    </>
                  )}

                  {(selectedType === 'portao_abrir' || selectedType === 'portao_correr') && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Barras Horizontais
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.travessas}
                          onChange={(e) => handleInputChange('travessas', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Barras Verticais
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="25"
                          value={formData.montantes}
                          onChange={(e) => handleInputChange('montantes', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2 pt-1">
                        <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 p-3.5 rounded-xl border-2 border-slate-200 text-slate-800 text-xs font-bold hover:bg-amber-50/40">
                          <input
                            type="checkbox"
                            checked={formData.possuiDiagonal}
                            onChange={(e) => handleInputChange('possuiDiagonal', e.target.checked)}
                            className="rounded text-amber-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                          <span>Incluir Barra Diagonal de Reforço</span>
                        </label>
                      </div>
                    </>
                  )}

                  {selectedType === 'janela' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Número de Divisões
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formData.divisoesJanela}
                        onChange={(e) => handleInputChange('divisoesJanela', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                      />
                    </div>
                  )}

                  {selectedType === 'bancada' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Número de Pés
                      </label>
                      <select
                        value={formData.numeroPes}
                        onChange={(e) => handleInputChange('numeroPes', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value={4}>4 Pés (Padrão)</option>
                        <option value={6}>6 Pés (Reforço Central)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Profiles Selection */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Escolha do Perfil Metálico</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedType === 'portao_abrir' || selectedType === 'portao_correr') ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Perfil da Borda (Quadro)
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
                    </>
                  ) : (
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Perfil Metálico Principal
                      </label>
                      <select
                        value={formData.perfilGeral}
                        onChange={(e) => handleInputChange('perfilGeral', e.target.value)}
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

            </div>

            {/* Action Box Side Column */}
            <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 gap-6">
              <div>
                <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold px-3 py-1 rounded-full uppercase inline-block mb-3">
                  Resumo Rápido
                </div>
                <h3 className="text-xl font-bold font-display text-white">
                  {INITIAL_TEMPLATES.find(t => t.id === selectedType)?.title}
                </h3>
                <ul className="text-xs text-slate-300 mt-3 space-y-2 font-mono">
                  <li className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Largura:</span>
                    <strong className="text-white">{formData.largura} mm</strong>
                  </li>
                  <li className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span>Altura:</span>
                    <strong className="text-white">{formData.altura} mm</strong>
                  </li>
                  {(selectedType === 'prateleira' || selectedType === 'estante' || selectedType === 'bancada') && (
                    <li className="flex justify-between border-b border-slate-800 pb-1.5">
                      <span>Profundidade:</span>
                      <strong className="text-white">{formData.profundidade} mm</strong>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  id="btn-gerar-estrutura-principal"
                  onClick={handleGenerateStructure}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer border border-amber-400/50"
                >
                  <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                  <span>⚡ CRIAR ESTRUTURA AGORA</span>
                </button>
                <p className="text-[11px] text-slate-400 text-center font-sans">
                  Gera o desenho completo, lista de corte e orçamento automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Help Footer Box */}
      <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs flex items-start sm:items-center gap-4 text-slate-950">
        <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0 font-bold text-2xl shadow-xs">
          💡
        </div>
        <div>
          <h3 className="text-base font-bold font-display text-slate-950">
            Primeira vez usando?
          </h3>
          <p className="text-xs sm:text-sm text-slate-800 mt-0.5 font-medium leading-relaxed">
            O Mestre Serralheiro cria praticamente todo o desenho para você. Depois você apenas faz pequenos ajustes.
          </p>
        </div>
      </div>
    </div>
  );
};
