/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Folder, 
  Pencil, 
  Zap, 
  Compass, 
  Scissors, 
  DollarSign, 
  Box, 
  ChevronDown, 
  Hammer, 
  Layout, 
  Layers, 
  SlidersHorizontal,
  X,
  Sparkles,
  Menu,
  Link2
} from 'lucide-react';

export type MainCategoryTab = 
  | 'projetos'
  | 'desenho'
  | 'calculos'
  | 'fabricacao'
  | 'financeiro'
  | 'materiais'
  | 'mais';

interface CategorizedHeaderNavProps {
  activeTab: string;
  projectSubTab?: string;
  onSelectTab: (tab: string, subTab?: string) => void;
  onOpenQuickAction: () => void;
}

export const CategorizedHeaderNav: React.FC<CategorizedHeaderNavProps> = ({
  activeTab,
  projectSubTab,
  onSelectTab,
  onOpenQuickAction
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  const closeDropdowns = () => setOpenDropdown(null);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => {
            onSelectTab('meus-projetos');
            closeDropdowns();
          }}
        >
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center shadow-md group-hover:bg-amber-400 transition transform group-hover:scale-105">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight font-display text-white flex items-center gap-1.5">
              <span>Serralheria Projetos</span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-mono px-2 py-0.2 rounded-full border border-amber-500/30 hidden sm:inline-block">
                Mobile-First
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Suporte Técnico & Medidas</p>
          </div>
        </div>

        {/* DESKTOP / TABLET CATEGORIZED MENU TABS */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 relative">
          
          {/* 🏠 1. PROJETOS */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('meus-projetos');
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'meus-projetos' || activeTab === 'detalhes-projeto'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Projetos</span>
          </button>

          {/* 📐 2. CÁLCULOS */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('motor-geometrico');
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'motor-geometrico'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Cálculos</span>
          </button>

          {/* ✂️ 3. FABRICAÇÃO */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'detalhes-projeto') {
                onSelectTab('detalhes-projeto', 'lista-corte');
              } else {
                onSelectTab('detalhes-projeto', 'lista-corte');
              }
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'detalhes-projeto' && (projectSubTab === 'lista-corte' || projectSubTab === 'otimizacao-barras')
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Fabricação</span>
          </button>

          {/* 💰 4. FINANCEIRO */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'detalhes-projeto') {
                onSelectTab('detalhes-projeto', 'orcamento');
              } else {
                onSelectTab('central-precos');
              }
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'central-precos' || (activeTab === 'detalhes-projeto' && projectSubTab === 'orcamento')
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financeiro</span>
          </button>

          {/* 📦 5. MATERIAIS */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('biblioteca-materiais');
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'biblioteca-materiais'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Materiais</span>
          </button>

          {/* 🔗 6. LIGAÇÕES */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('biblioteca-ligacoes');
              closeDropdowns();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'biblioteca-ligacoes'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Ligações</span>
          </button>

        </nav>

        {/* Quick FAB Action Button Header (All Screens) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span className="hidden sm:inline">Nova Estrutura</span>
            <span className="sm:hidden">+ Criar</span>
          </button>

          {/* Mobile Category Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 md:hidden cursor-pointer"
            title="Abrir Menu de Categorias"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* MOBILE FULL CATEGORY DRAWER / SLIDE-OVER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between p-6 text-white md:hidden animate-fade-in">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold">
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Categorias do Aplicativo</h3>
                  <p className="text-xs text-slate-400 font-mono">Navegação simplificada para celular</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('meus-projetos');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">🏠</span>
                <div>
                  <div>🏠 Projetos</div>
                  <div className="text-xs font-normal text-slate-400">Meus projetos salvos e orçamentos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('assistente-estruturas');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">⚡</span>
                <div>
                  <div>✏️ Assistente de Desenho</div>
                  <div className="text-xs font-normal text-slate-400">Gerador automático de portões e móveis</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('motor-geometrico');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">📐</span>
                <div>
                  <div>📐 Cálculos & Geometria</div>
                  <div className="text-xs font-normal text-slate-400">Triângulos, arcos e graus de corte</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('detalhes-projeto', 'lista-corte');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">✂️</span>
                <div>
                  <div>✂️ Fabricação & Corte</div>
                  <div className="text-xs font-normal text-slate-400">Lista de corte e otimizador de barras</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('central-precos');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">💰</span>
                <div>
                  <div>💰 Financeiro & Preços</div>
                  <div className="text-xs font-normal text-slate-400">Preço do kg, barra e hora de solda</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('biblioteca-materiais');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">📦</span>
                <div>
                  <div>📦 Biblioteca de Materiais</div>
                  <div className="text-xs font-normal text-slate-400">Tubos, metalons e cantoneiras</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('biblioteca-ligacoes');
                  setIsMobileDrawerOpen(false);
                }}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center gap-3 font-bold text-sm text-left"
              >
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">🔗</span>
                <div>
                  <div>🔗 Biblioteca de Ligações</div>
                  <div className="text-xs font-normal text-slate-400">Uniões, cantos 90°, soldas e parafusos</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
            Serralheria Projetos • Interface Responsiva Universal
          </div>
        </div>
      )}

    </header>
  );
};
