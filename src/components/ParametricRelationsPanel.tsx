/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FreeDrawingLine, 
  PieceConfig, 
  ParametricConstraint, 
  ParametricConstraintType, 
  StructuralFunction 
} from '../types';
import { objectManager } from '../core/ObjectManager';
import { inferPieceRelationships } from '../engines/parametricEngine';
import { Link2, Shield, Plus, X, Check, Box, Cpu } from 'lucide-react';

interface ParametricRelationsPanelProps {
  selectedPiece: FreeDrawingLine | PieceConfig | null;
  onUpdatePiece?: (updatedPiece: any) => void;
  compact?: boolean;
}

const CONSTRAINT_LABELS: Record<ParametricConstraintType, { label: string; icon: string; color: string }> = {
  vinculado_quadro: { label: 'Vinculado ao Quadro', icon: '🖼️', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  vinculado_folha: { label: 'Vinculado à Folha', icon: '🚪', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  equidistante: { label: 'Equidistante', icon: '⚖️', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  centralizado: { label: 'Centralizado', icon: '🎯', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  paralelo: { label: 'Paralelo', icon: '⏸️', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  perpendicular: { label: 'Perpendicular', icon: '➕', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  coincidente: { label: 'Coincidente', icon: '🎯', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  alinhado_esquerda: { label: 'Alinhado à Esquerda', icon: '⬅️', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  alinhado_direita: { label: 'Alinhado à Direita', icon: '➡️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  alinhado_topo: { label: 'Alinhado ao Topo', icon: '⬆️', color: 'bg-lime-500/20 text-lime-300 border-lime-500/40' },
  alinhado_base: { label: 'Alinhado à Base', icon: '⬇️', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  comprimento_fixo: { label: 'Comprimento Fixo', icon: '📏', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' },
  angulo_fixo: { label: 'Ângulo Fixo', icon: '📐', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' }
};

const FUNCTION_LABELS: Record<StructuralFunction, string> = {
  quadro_principal: 'Quadro Principal / Perímetro',
  quadro_folha: 'Quadro da Folha',
  travessa_horizontal: 'Travessa Horizontal',
  montante_vertical: 'Montante Vertical',
  diagonal: 'Diagonal Estrutural',
  reforco: 'Reforço / Mão de Força',
  porta_social: 'Porta Social Embutida',
  preenchimento: 'Barra de Preenchimento',
  batente: 'Batente / Trilho Guia',
  coluna_suporte: 'Coluna de Sustentação',
  viga_superior: 'Viga Superior',
  perfil_livre: 'Perfil Livre'
};

export const ParametricRelationsPanel: React.FC<ParametricRelationsPanelProps> = ({
  selectedPiece,
  onUpdatePiece,
  compact = false
}) => {
  if (!selectedPiece) return null;

  const line = selectedPiece as FreeDrawingLine;
  const inferred = inferPieceRelationships(line);

  const activeConstraints = line.constraints && line.constraints.length > 0 
    ? line.constraints 
    : inferred.constraints;

  const currentFunc: StructuralFunction = line.structuralFunction || inferred.structuralFunction;
  const parentId = line.parentId || 'quadro_principal';
  const dependencies = line.dependencies || inferred.dependencies;

  const [isAddingConstraint, setIsAddingConstraint] = useState(false);
  const [selectedNewType, setSelectedNewType] = useState<ParametricConstraintType>('vinculado_quadro');

  const handleToggleConstraint = (typeToToggle: ParametricConstraintType) => {
    let nextConstraints: ParametricConstraint[] = [];
    const exists = activeConstraints.some(c => c.type === typeToToggle);

    if (exists) {
      nextConstraints = activeConstraints.filter(c => c.type !== typeToToggle);
    } else {
      nextConstraints = [
        ...activeConstraints,
        {
          type: typeToToggle,
          targetId: parentId,
          description: CONSTRAINT_LABELS[typeToToggle]?.label || typeToToggle
        }
      ];
    }

    objectManager.updatePieceConstraints(selectedPiece.id, nextConstraints);
    if (onUpdatePiece) {
      onUpdatePiece({
        ...selectedPiece,
        constraints: nextConstraints,
        restricoes: nextConstraints
      });
    }
  };

  const handleAddConstraintConfirm = () => {
    handleToggleConstraint(selectedNewType);
    setIsAddingConstraint(false);
  };

  return (
    <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3 text-xs space-y-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-indigo-400 font-mono text-xs">
          <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>Restrições Paramétricas</span>
        </div>
        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">
          ObjectManager Active
        </span>
      </div>

      {/* Relações de Hierarquia */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">ID da Peça</span>
          <span className="text-slate-200 font-bold truncate block" title={selectedPiece.id}>
            {selectedPiece.id}
          </span>
        </div>
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Elemento Pai (Parent)</span>
          <span className="text-amber-300 font-bold flex items-center gap-1">
            <Link2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{parentId}</span>
          </span>
        </div>
      </div>

      {/* Função Estrutural */}
      <div>
        <label className="text-[10px] text-slate-400 font-mono block mb-1">
          Função Estrutural na Estrutura
        </label>
        <div className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-indigo-300 font-bold font-mono text-xs flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{FUNCTION_LABELS[currentFunc] || currentFunc}</span>
        </div>
      </div>

      {/* Dependências Estruturais */}
      <div>
        <span className="text-[10px] text-slate-400 font-mono block mb-1">
          Dependências Diretas ({dependencies.length})
        </span>
        <div className="flex flex-wrap gap-1">
          {dependencies.map((dep, i) => (
            <span 
              key={i} 
              className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1"
            >
              <Shield className="w-2.5 h-2.5 text-amber-400" />
              {dep}
            </span>
          ))}
        </div>
      </div>

      {/* Restrições Paramétricas Ativas */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 font-mono block uppercase tracking-wider">
            Restrições Ativas ({activeConstraints.length})
          </span>
          <button
            type="button"
            onClick={() => setIsAddingConstraint(!isAddingConstraint)}
            className="text-[10px] text-indigo-300 hover:text-indigo-200 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition cursor-pointer"
          >
            {isAddingConstraint ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            <span>{isAddingConstraint ? 'Cancelar' : 'Adicionar Restrição'}</span>
          </button>
        </div>

        {/* Modal / Selector para adicionar nova restrição */}
        {isAddingConstraint && (
          <div className="bg-slate-900 border border-indigo-500/50 rounded-lg p-2 mb-2 space-y-2">
            <label className="text-[10px] text-slate-300 font-mono block">Selecione o tipo de restrição:</label>
            <select
              value={selectedNewType}
              onChange={(e) => setSelectedNewType(e.target.value as ParametricConstraintType)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-400"
            >
              {Object.entries(CONSTRAINT_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.icon} {val.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddConstraintConfirm}
              className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Restrição</span>
            </button>
          </div>
        )}

        {/* Lista de Badges de Restrições */}
        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {activeConstraints.map((c, idx) => {
            const meta = CONSTRAINT_LABELS[c.type] || {
              label: c.type,
              icon: '⚙️',
              color: 'bg-slate-800 text-slate-200 border-slate-700'
            };

            return (
              <span
                key={idx}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 ${meta.color} transition`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <button
                  type="button"
                  onClick={() => handleToggleConstraint(c.type)}
                  className="ml-1 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Remover Restrição"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
