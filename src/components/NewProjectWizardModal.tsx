/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Ruler, 
  Grid, 
  Zap, 
  ChevronRight, 
  ArrowLeft,
  Info,
  FolderPlus
} from 'lucide-react';
import { MetalProject, FreeDrawingLine, PieceConfig, PieceType, FrameConfig, FreeDrawingData } from '../types';
import { getMaterialProfiles } from '../utils/materialsStore';

export type StructureTypeId = 
  | 'portao_abrir' 
  | 'portao_correr' 
  | 'janela' 
  | 'prateleira' 
  | 'estante' 
  | 'bancada' 
  | 'personalizada';

export interface StructureCardDef {
  id: StructureTypeId;
  title: string;
  icon: string;
  badge: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultDepth?: number;
  defaultProfile: string;
}

export const STRUCTURE_TYPES: StructureCardDef[] = [
  {
    id: 'portao_abrir',
    title: 'Portão de Abrir',
    icon: '🚪',
    badge: 'Esquadria',
    description: 'Portão pivotante (1 ou 2 folhas) com opção de social',
    defaultWidth: 2400,
    defaultHeight: 2000,
    defaultProfile: 'Metalon 40x40 mm'
  },
  {
    id: 'portao_correr',
    title: 'Portão de Correr',
    icon: '🚪',
    badge: 'Deslizante',
    description: 'Portão reforçado para correr em trilho com roldanas',
    defaultWidth: 3000,
    defaultHeight: 2100,
    defaultProfile: 'Metalon 50x30 mm'
  },
  {
    id: 'janela',
    title: 'Janela',
    icon: '🪟',
    badge: 'Esquadria',
    description: 'Janela metálica de correr ou basculante',
    defaultWidth: 1200,
    defaultHeight: 1000,
    defaultProfile: 'Metalon 30x30 mm'
  },
  {
    id: 'prateleira',
    title: 'Prateleira',
    icon: '📚',
    badge: 'Móveis',
    description: 'Estrutura vertical com prateleiras metálicas',
    defaultWidth: 1000,
    defaultHeight: 1800,
    defaultDepth: 400,
    defaultProfile: 'Metalon 30x30 mm'
  },
  {
    id: 'estante',
    title: 'Estante',
    icon: '🗄️',
    badge: 'Móveis',
    description: 'Estante industrial com divisórias horizontais e verticais',
    defaultWidth: 1200,
    defaultHeight: 2000,
    defaultDepth: 400,
    defaultProfile: 'Metalon 30x30 mm'
  },
  {
    id: 'bancada',
    title: 'Bancada',
    icon: '🛠️',
    badge: 'Oficina',
    description: 'Mesa de trabalho reforçada com travessas e pés',
    defaultWidth: 1500,
    defaultHeight: 900,
    defaultDepth: 700,
    defaultProfile: 'Metalon 40x40 mm'
  },
  {
    id: 'personalizada',
    title: 'Estrutura Personalizada',
    icon: '⭐',
    badge: 'Livre',
    description: 'Iniciar com quadro limpo para desenhar livremente',
    defaultWidth: 2000,
    defaultHeight: 2000,
    defaultProfile: 'Metalon 30x30 mm'
  }
];

interface NewProjectWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: MetalProject) => void;
  initialType?: StructureTypeId | null;
}

export const NewProjectWizardModal: React.FC<NewProjectWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  initialType
}) => {
  const [step, setStep] = useState<'select_type' | 'configure'>('select_type');
  const [selectedType, setSelectedType] = useState<StructureTypeId>('portao_abrir');

  // Form states
  const [projectName, setProjectName] = useState<string>('');
  const [largura, setLargura] = useState<string>('2400');
  const [altura, setAltura] = useState<string>('2000');
  const [profundidade, setProfundidade] = useState<string>('400');
  const [numFolhas, setNumFolhas] = useState<string>('1');
  const [vaiTerPorta, setVaiTerPorta] = useState<boolean>(false);
  const [prateleiras, setPrateleiras] = useState<string>('4');
  const [divisoesH, setDivisoesH] = useState<string>('3');
  const [divisoesV, setDivisoesV] = useState<string>('1');
  const [temPrateleiraInf, setTemPrateleiraInf] = useState<boolean>(true);
  const [perfilGeral, setPerfilGeral] = useState<string>('Metalon 30x30 mm');

  const [availableProfiles, setAvailableProfiles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const profs = getMaterialProfiles();
    if (profs && profs.length > 0) {
      setAvailableProfiles(profs.map(p => ({ id: p.id, name: p.name })));
    } else {
      setAvailableProfiles([
        { id: 'm30', name: 'Metalon 30x30 mm' },
        { id: 'm40', name: 'Metalon 40x40 mm' },
        { id: 'm50', name: 'Metalon 50x30 mm' },
        { id: 'm5050', name: 'Metalon 50x50 mm' }
      ]);
    }
  }, []);

  useEffect(() => {
    if (initialType) {
      handleSelectType(initialType);
    }
  }, [initialType]);

  if (!isOpen) return null;

  const handleSelectType = (typeId: StructureTypeId) => {
    setSelectedType(typeId);
    const card = STRUCTURE_TYPES.find(t => t.id === typeId) || STRUCTURE_TYPES[0];
    
    setProjectName(`${card.title} #1`);
    setLargura(card.defaultWidth.toString());
    setAltura(card.defaultHeight.toString());
    if (card.defaultDepth) {
      setProfundidade(card.defaultDepth.toString());
    }
    setPerfilGeral(card.defaultProfile);

    setStep('configure');
  };

  const handleCreate = () => {
    const card = STRUCTURE_TYPES.find(t => t.id === selectedType) || STRUCTURE_TYPES[0];
    const W = Math.max(100, Number(largura) || card.defaultWidth);
    const H = Math.max(100, Number(altura) || card.defaultHeight);
    const D = Math.max(50, Number(profundidade) || 400);

    const name = projectName.trim() || `${card.title} (${W}x${H}mm)`;
    const lines: FreeDrawingLine[] = [];
    const pieces: PieceConfig[] = [];

    const addLine = (
      x1: number, y1: number, x2: number, y2: number,
      prof: string, typeLabel: PieceType, nameLabel: string
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenMm = Math.round(Math.hypot(dx, dy));
      let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (angle < 0) angle += 360;

      const lineId = `gen-${Date.now()}-${lines.length + 1}`;

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
        observations: `Gerado automaticamente (${card.title})`,
        perfil: prof,
        comprimento: lenMm,
        orientacao: isVert ? 'vertical' : 'horizontal',
        'orientação': isVert ? 'vertical' : 'horizontal',
        grupo: card.title,
        ordem: pieces.length + 1
      });
    };

    // GENERATE STRUCTURE GEOMETRY
    if (
      selectedType === 'portao_abrir' || 
      selectedType === 'portao_correr' || 
      selectedType === 'janela' || 
      selectedType === 'grade' || 
      selectedType === 'personalizada'
    ) {
      // Quadro externo SOMENTE (ET-009D.2A - Correção 01)
      addLine(0, 0, W, 0, perfilGeral, 'quadro_interno', 'Quadro Superior');
      addLine(W, 0, W, H, perfilGeral, 'quadro_interno', 'Quadro Direito');
      addLine(W, H, 0, H, perfilGeral, 'quadro_interno', 'Quadro Inferior');
      addLine(0, H, 0, 0, perfilGeral, 'quadro_interno', 'Quadro Esquerdo');

    } else if (selectedType === 'prateleira') {
      // Columns
      addLine(0, 0, 0, H, perfilGeral, 'coluna', 'Coluna Esquerda');
      addLine(W, 0, W, H, perfilGeral, 'coluna', 'Coluna Direita');

      // Top & Bottom Ties
      addLine(0, 0, W, 0, perfilGeral, 'travessa', 'Travessa Superior');
      addLine(0, H, W, H, perfilGeral, 'travessa', 'Base Inferior');

      // Shelves
      const numP = Math.max(1, Number(prateleiras) || 3);
      for (let i = 1; i <= numP; i++) {
        const y = Math.round((i * H) / (numP + 1));
        addLine(0, y, W, y, perfilGeral, 'travessa', `Prateleira ${i}`);
      }

      // 3D Depth projections
      const depthOffsetX = Math.round(D * 0.35);
      const depthOffsetY = Math.round(-D * 0.25);
      addLine(0, 0, depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Projeção Profundidade Sup Esq');
      addLine(W, 0, W + depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Projeção Profundidade Sup Dir');
      addLine(0, H, depthOffsetX, H + depthOffsetY, perfilGeral, 'travessa', 'Projeção Profundidade Inf Esq');
      addLine(W, H, W + depthOffsetX, H + depthOffsetY, perfilGeral, 'travessa', 'Projeção Profundidade Inf Dir');
      addLine(depthOffsetX, depthOffsetY, W + depthOffsetX, depthOffsetY, perfilGeral, 'travessa', 'Trilho Traseiro');

    } else if (selectedType === 'estante') {
      // Outer Frame
      addLine(0, 0, W, 0, perfilGeral, 'quadro_interno', 'Quadro Superior');
      addLine(W, 0, W, H, perfilGeral, 'quadro_interno', 'Coluna Direita');
      addLine(W, H, 0, H, perfilGeral, 'quadro_interno', 'Base Inferior');
      addLine(0, H, 0, 0, perfilGeral, 'quadro_interno', 'Coluna Esquerda');

      const numH = Math.max(0, Number(divisoesH) || 2);
      for (let i = 1; i <= numH; i++) {
        const y = Math.round((i * H) / (numH + 1));
        addLine(0, y, W, y, perfilGeral, 'divisao_horizontal', `Divisória Horizontal ${i}`);
      }

      const numV = Math.max(0, Number(divisoesV) || 1);
      for (let j = 1; j <= numV; j++) {
        const x = Math.round((j * W) / (numV + 1));
        addLine(x, 0, x, H, perfilGeral, 'divisao_vertical', `Divisória Vertical ${j}`);
      }

    } else if (selectedType === 'bancada') {
      // Top Frame
      addLine(0, 0, W, 0, perfilGeral, 'travessa', 'Tampo Frontal');
      addLine(W, 0, W, D, perfilGeral, 'travessa', 'Tampo Lateral Dir');
      addLine(W, D, 0, D, perfilGeral, 'travessa', 'Tampo Traseiro');
      addLine(0, D, 0, 0, perfilGeral, 'travessa', 'Tampo Lateral Esq');

      // 4 Legs
      addLine(0, 0, 0, H, perfilGeral, 'coluna', 'Pé Frontal Esquerdo');
      addLine(W, 0, W, H, perfilGeral, 'coluna', 'Pé Frontal Direito');
      addLine(0, D, 0, D + H, perfilGeral, 'coluna', 'Pé Traseiro Esquerdo');
      addLine(W, D, W, D + H, perfilGeral, 'coluna', 'Pé Traseiro Direito');

      if (temPrateleiraInf) {
        const tieY = Math.round(H * 0.75);
        addLine(0, tieY, W, tieY, perfilGeral, 'travessa', 'Prateleira Inferior Frontal');
        addLine(0, D + tieY, W, D + tieY, perfilGeral, 'travessa', 'Prateleira Inferior Traseira');
        addLine(0, tieY, 0, D + tieY, perfilGeral, 'travessa', 'Prateleira Inferior Lateral Esq');
        addLine(W, tieY, W, D + tieY, perfilGeral, 'travessa', 'Prateleira Inferior Lateral Dir');
      }

    } else {
      // Personalizada - Clean 4-sided frame
      addLine(0, 0, W, 0, perfilGeral, 'quadro_interno', 'Quadro Superior');
      addLine(W, 0, W, H, perfilGeral, 'quadro_interno', 'Quadro Direito');
      addLine(W, H, 0, H, perfilGeral, 'quadro_interno', 'Quadro Inferior');
      addLine(0, H, 0, 0, perfilGeral, 'quadro_interno', 'Quadro Esquerdo');
    }

    const frameConfig: FrameConfig = {
      width: W,
      height: H,
      displayUnit: 'mm',
      displayWidth: W,
      displayHeight: H,
      profile: perfilGeral
    };

    const drawData: FreeDrawingData = {
      lines: lines,
      viewport: { zoom: 0.35, panX: 300, panY: 250 },
      updatedAt: new Date().toISOString()
    };

    const newProject: MetalProject = {
      id: `proj-${Date.now()}`,
      name: name,
      status: 'planejamento',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      frame: frameConfig,
      pieces: pieces,
      freeDrawing: drawData
    };

    // Store in localStorage for instant drawing sync
    localStorage.setItem(`serralheria_freedraw_${newProject.id}`, JSON.stringify(drawData));

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 text-white my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Handle bar for mobile drag */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden opacity-80" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            {step === 'configure' && (
              <button
                type="button"
                onClick={() => setStep('select_type')}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                {step === 'select_type' ? 'O que você deseja fabricar hoje?' : 'Configurar Medidas'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {step === 'select_type' 
                  ? 'Escolha o tipo de estrutura para iniciar' 
                  : `Ajuste as dimensões de ${STRUCTURE_TYPES.find(t => t.id === selectedType)?.title}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: SELECT STRUCTURE TYPE */}
        {step === 'select_type' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {STRUCTURE_TYPES.map((typeCard) => (
              <button
                key={typeCard.id}
                type="button"
                onClick={() => handleSelectType(typeCard.id)}
                className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/60 transition text-left flex items-start gap-3.5 group cursor-pointer active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 flex items-center justify-center text-2xl shrink-0 transition">
                  {typeCard.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 font-display truncate">
                      {typeCard.title}
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 shrink-0">
                      {typeCard.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {typeCard.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: CONFIGURATION FORM */}
        {step === 'configure' && (
          <div className="flex flex-col gap-6">
            
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                Nome do Projeto
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                placeholder="Ex: Portão da Garagem"
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                  Largura Total (mm)
                </label>
                <input
                  type="number"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: 2400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                  Altura Total (mm)
                </label>
                <input
                  type="number"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: 2000"
                />
              </div>

              {(selectedType === 'prateleira' || selectedType === 'estante' || selectedType === 'bancada') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                    Profundidade (mm)
                  </label>
                  <input
                    type="number"
                    value={profundidade}
                    onChange={(e) => setProfundidade(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    placeholder="Ex: 400"
                  />
                </div>
              )}

              {/* Profile Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
                  Perfil Principal
                </label>
                <select
                  value={perfilGeral}
                  onChange={(e) => setPerfilGeral(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {availableProfiles.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type-Specific Options */}
            {(selectedType === 'portao_abrir' || selectedType === 'portao_correr') && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                  Opções do Portão
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">
                      Quantidade de Folhas
                    </label>
                    <select
                      value={numFolhas}
                      onChange={(e) => setNumFolhas(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                    >
                      <option value="1">1 Folha (Única)</option>
                      <option value="2">2 Folhas (Duplo)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="chk-porta-embutida"
                      checked={vaiTerPorta}
                      onChange={(e) => setVaiTerPorta(e.target.checked)}
                      className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="chk-porta-embutida" className="text-xs text-slate-200 font-semibold cursor-pointer">
                      Incluir Porta Social Embutida
                    </label>
                  </div>
                </div>
              </div>
            )}

            {selectedType === 'janela' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Quantidade de Divisões / Folhas
                </label>
                <select
                  value={numFolhas}
                  onChange={(e) => setNumFolhas(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white"
                >
                  <option value="1">1 Folha Fixa</option>
                  <option value="2">2 Folhas (Central)</option>
                  <option value="3">3 Folhas</option>
                  <option value="4">4 Folhas (Bipartida)</option>
                </select>
              </div>
            )}

            {selectedType === 'prateleira' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Quantidade de Níveis de Prateleira
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={prateleiras}
                  onChange={(e) => setPrateleiras(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                />
              </div>
            )}

            {selectedType === 'estante' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Divisórias Horizontais
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={divisoesH}
                    onChange={(e) => setDivisoesH(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">
                    Divisórias Verticais
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={divisoesV}
                    onChange={(e) => setDivisoesV(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
              </div>
            )}

            {selectedType === 'bancada' && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chk-prateleira-inf"
                  checked={temPrateleiraInf}
                  onChange={(e) => setTemPrateleiraInf(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="chk-prateleira-inf" className="text-xs text-slate-200 font-semibold cursor-pointer">
                  Possui prateleira inferior de apoio
                </label>
              </div>
            )}

            {/* Action button */}
            <button
              type="button"
              id="btn-confirmar-criar-estrutura"
              onClick={handleCreate}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold font-mono text-sm sm:text-base rounded-2xl shadow-xl transition transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer mt-2"
            >
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>⚡ CRIAR ESTRUTURA NO EDITOR</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
