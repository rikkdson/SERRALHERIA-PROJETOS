/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Folder, Pencil, Plus, Scissors, Menu, Zap, Box, DollarSign, Compass } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenQuickAction: () => void;
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAction,
  onOpenMoreMenu
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 pb-safe">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        
        {/* 1. 🏠 Projetos */}
        <button
          type="button"
          onClick={() => onSelectTab('meus-projetos')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'meus-projetos' || activeTab === 'detalhes-projeto'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] font-mono tracking-tight">Projetos</span>
        </button>

        {/* 2. 📐 Cálculos */}
        <button
          type="button"
          onClick={() => onSelectTab('motor-geometrico')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'motor-geometrico'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] font-mono tracking-tight">Cálculos</span>
        </button>

        {/* 3. ➕ Central Floating Action Button */}
        <div className="relative -top-4 px-1">
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-4 ring-slate-900 transform active:scale-90 transition cursor-pointer"
            title="Criar Nova Estrutura / Projeto"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* 4. ✂️ Corte */}
        <button
          type="button"
          onClick={() => onSelectTab('detalhes-projeto')}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'detalhes-projeto'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scissors className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] font-mono tracking-tight">Corte</span>
        </button>

        {/* 5. ☰ Mais */}
        <button
          type="button"
          onClick={onOpenMoreMenu}
          className="flex flex-col items-center justify-center w-14 py-1 rounded-xl transition text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5 stroke-[2.2]" />
          <span className="text-[10px] font-mono tracking-tight">Mais</span>
        </button>

      </div>
    </nav>
  );
};
