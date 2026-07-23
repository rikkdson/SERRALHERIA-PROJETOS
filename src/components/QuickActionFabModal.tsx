/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  FolderPlus, 
  DoorOpen, 
  BookOpen, 
  Grid, 
  Wrench, 
  Pencil, 
  Zap,
  ArrowRight
} from 'lucide-react';

interface QuickActionFabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProjectModal: () => void;
  onSelectStructureType: (typeId: string) => void;
  onOpenFreeDrawing: () => void;
}

export const QuickActionFabModal: React.FC<QuickActionFabModalProps> = ({
  isOpen,
  onClose,
  onOpenNewProjectModal,
  onSelectStructureType,
  onOpenFreeDrawing
}) => {
  if (!isOpen) return null;

  const quickItems = [
    {
      id: 'assistente_geral',
      title: 'Assistente de Estruturas',
      badge: 'Recomendado',
      icon: '⚡',
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      description: 'Criação guidada de estruturas com cálculo automático',
      action: () => {
        onSelectStructureType('portao_abrir');
        onClose();
      }
    },
    {
      id: 'portao_abrir',
      title: 'Novo Portão de Abrir',
      badge: 'Esquadria',
      icon: '🚪',
      color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
      description: 'Portão pivotante com quadro e montantes',
      action: () => {
        onSelectStructureType('portao_abrir');
        onClose();
      }
    },
    {
      id: 'portao_correr',
      title: 'Novo Portão de Correr',
      badge: 'Deslizante',
      icon: '🚪',
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      description: 'Estrutura para portão deslizante reforçado',
      action: () => {
        onSelectStructureType('portao_correr');
        onClose();
      }
    },
    {
      id: 'prateleira',
      title: 'Nova Prateleira Industrial',
      badge: 'Móveis',
      icon: '📚',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      description: 'Estrutura vertical com prateleiras metálicas',
      action: () => {
        onSelectStructureType('prateleira');
        onClose();
      }
    },
    {
      id: 'janela',
      title: 'Nova Janela Metálica',
      badge: 'Esquadria',
      icon: '🪟',
      color: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
      description: 'Caixilho com divisões de folhas',
      action: () => {
        onSelectStructureType('janela');
        onClose();
      }
    },
    {
      id: 'bancada',
      title: 'Nova Bancada de Trabalho',
      badge: 'Oficina',
      icon: '🛠',
      color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      description: 'Mesa reforçada para oficina com travessas',
      action: () => {
        onSelectStructureType('bancada');
        onClose();
      }
    },
    {
      id: 'desenho_livre',
      title: 'Editor de Estruturas',
      badge: 'Editor 2D',
      icon: '🛠️',
      color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      description: 'Monte e organize barras, travessas e esquadrias livremente',
      action: () => {
        onOpenFreeDrawing();
        onClose();
      }
    },
    {
      id: 'novo_projeto',
      title: 'Novo Projeto Vazio',
      badge: 'Geral',
      icon: '📁',
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      description: 'Iniciar projeto em branco no dashboard',
      action: () => {
        onOpenNewProjectModal();
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      {/* Background overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 text-white max-h-[85vh] overflow-y-auto">
        
        {/* Top Handle bar for touch */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 sm:hidden opacity-80" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl font-bold">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Criar Nova Estrutura</h3>
              <p className="text-xs text-slate-400 font-mono">Escolha uma opção para começar imediatamente</p>
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

        {/* Quick Grid List */}
        <div className="grid grid-cols-1 gap-2.5">
          {quickItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className="w-full p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/50 transition flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xl shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition font-display">
                      {item.title}
                    </h4>
                    <span className="text-[9px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.2 rounded-md border border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition transform group-hover:translate-x-1 shrink-0 ml-2" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
