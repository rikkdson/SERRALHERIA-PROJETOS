/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Lock,
  Copy,
  Archive,
  Trash2,
  Edit2,
  ShieldCheck,
  RefreshCw,
  Info,
  Sliders,
  Check,
  X,
  Hammer,
  Zap,
  ChevronRight,
  Eye,
  FileCode,
  Layers,
  Wrench
} from 'lucide-react';

import {
  StructuralConnection,
  StructuralConnectionType,
  ConnectionCategory,
  WeldSpecs,
  BoltSpecs,
  ReinforcementSpecs,
} from '../types';

import {
  getConnections,
  saveConnection,
  duplicateConnection,
  archiveConnection,
  deleteConnection,
  resetConnectionsToDefault,
  runConnectionsTestSuite,
  ConnectionTestResult,
  CONNECTIONS_UPDATED_EVENT,
} from '../utils/connectionsStore';

export const CONNECTION_TYPE_LABELS: Record<StructuralConnectionType, { label: string; icon: string; desc: string }> = {
  canto_90: { label: 'Canto 90°', icon: '📐', desc: 'Encontro reto perpendicular' },
  meia_esquadria_45: { label: 'Meia-Esquadria 45°', icon: '✂️', desc: 'Corte angular a 45°' },
  topo_topo: { label: 'Topo x Topo', icon: '🔗', desc: 'Prolongamento de peça reta' },
  ligacao_t: { label: 'Ligação em T', icon: '┳', desc: 'Encontro perpendicular em travessa' },
  ligacao_cruz: { label: 'Ligação em Cruz (+)', icon: '╋', desc: 'Cruzamento de duas barras' },
  tubo_continuo_interrompido: { label: 'Tubo Contínuo x Interrompido', icon: '⭕', desc: 'Ajuste de tubo com curva/boca de lobo' },
  emenda_interna: { label: 'Emenda Interna', icon: '🔩', desc: 'Bucha de expansão interna' },
  emenda_luva: { label: 'Emenda com Luva', icon: '🧱', desc: 'Luva externa de contenção' },
  sobreposicao: { label: 'Sobreposição', icon: '🪜', desc: 'Barras cruzadas sem encaixe' },
  reforco_canto: { label: 'Reforço de Canto', icon: '📐', desc: 'Mão de força ou gusset' },
  reforco_central: { label: 'Reforço Central', icon: '🛡️', desc: 'Chapa de rigidez central' },
  ligacao_soldada: { label: 'Ligação Soldada', icon: '⚡', desc: 'Solda contínua nos 4 lados' },
  ligacao_aparafusada: { label: 'Ligação Aparafusada', icon: '🔧', desc: 'Flange com furos para parafusos' },
};

export const CATEGORY_LABELS: Record<ConnectionCategory, { label: string; badge: string }> = {
  soldada: { label: 'Soldada', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  aparafusada: { label: 'Aparafusada', badge: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  mista: { label: 'Mista (Solda + Parafuso)', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  encaixe: { label: 'Encaixe / Luva', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const PROFILE_OPTIONS = [
  'Todos',
  'Metalon Quadrado',
  'Metalon Retangular',
  'Tubos Redondos',
  'Cantoneira',
  'Barra Chata',
  'Perfil U',
  'Perfil U Enrijecido',
  'Perfil C',
  'Perfil Z',
  'Perfil I',
  'Perfil H',
  'Perfil T',
  'Vergalhão',
];

export const ConnectionsLibraryModule: React.FC = () => {
  const [connections, setConnections] = useState<StructuralConnection[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'test_suite'>('catalog');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConn, setEditingConn] = useState<StructuralConnection | null>(null);
  const [viewingConn, setViewingConn] = useState<StructuralConnection | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<StructuralConnectionType>('canto_90');
  const [formCategory, setFormCategory] = useState<ConnectionCategory>('soldada');
  const [formDescription, setFormDescription] = useState('');
  const [formProfiles, setFormProfiles] = useState<string[]>(['Metalon Quadrado', 'Metalon Retangular']);
  const [formDeductionMm, setFormDeductionMm] = useState<string>('0');
  const [formAllowCutOffset, setFormAllowCutOffset] = useState<boolean>(false);
  const [formNotes, setFormNotes] = useState('');

  // Weld spec fields
  const [hasWeldSpecs, setHasWeldSpecs] = useState(true);
  const [weldType, setWeldType] = useState<'solda_mig_mag' | 'solda_mma_eletrodo' | 'solda_tig' | 'solda_ponteado'>('solda_mig_mag');
  const [weldGapMm, setWeldGapMm] = useState('1.0');
  const [weldBevelAngle, setWeldBevelAngle] = useState('0');
  const [weldPasses, setWeldPasses] = useState('1');

  // Bolt spec fields
  const [hasBoltSpecs, setHasBoltSpecs] = useState(false);
  const [boltDiameter, setBoltDiameter] = useState('M8');
  const [boltType, setBoltType] = useState<'sextavado' | 'allen' | 'frances' | 'chumbador'>('sextavado');
  const [boltHoleCount, setBoltHoleCount] = useState('4');
  const [boltPlateThickness, setBoltPlateThickness] = useState('3.0');

  // Reinforcement spec fields
  const [hasReinforcementSpecs, setHasReinforcementSpecs] = useState(false);
  const [reinfType, setReinfType] = useState<'mao_de_forca' | 'cantoneira_reforco' | 'chapa_gusset' | 'luva_interna'>('cantoneira_reforco');
  const [reinfThickness, setReinfThickness] = useState('3.0');
  const [reinfLength, setReinfLength] = useState('100');

  // Test suite results state
  const [testResults, setTestResults] = useState<ConnectionTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Load connections and setup event listener
  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(CONNECTIONS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const loadData = () => {
    const list = getConnections();
    setConnections(list);
  };

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNoticeMessage({ text, type });
    setTimeout(() => {
      setNoticeMessage(null);
    }, 4000);
  };

  // Open modal for new connection
  const handleOpenNewModal = () => {
    setEditingConn(null);
    setFormName('');
    setFormType('canto_90');
    setFormCategory('soldada');
    setFormDescription('');
    setFormProfiles(['Metalon Quadrado', 'Metalon Retangular']);
    setFormDeductionMm('0');
    setFormAllowCutOffset(false);
    setFormNotes('');

    setHasWeldSpecs(true);
    setWeldType('solda_mig_mag');
    setWeldGapMm('1.0');
    setWeldBevelAngle('0');
    setWeldPasses('1');

    setHasBoltSpecs(false);
    setHasReinforcementSpecs(false);

    setIsModalOpen(true);
  };

  // Open modal for editing connection
  const handleOpenEditModal = (conn: StructuralConnection) => {
    setEditingConn(conn);
    setFormName(conn.name);
    setFormType(conn.type);
    setFormCategory(conn.category);
    setFormDescription(conn.description || '');
    setFormProfiles(conn.compatibleProfiles || ['Todos']);
    setFormDeductionMm(String(conn.deductionMm ?? 0));
    setFormAllowCutOffset(!!conn.allowCutAngleOffset);
    setFormNotes(conn.notes || '');

    if (conn.weldSpecs) {
      setHasWeldSpecs(true);
      setWeldType(conn.weldSpecs.weldType);
      setWeldGapMm(String(conn.weldSpecs.gapMm ?? 1.0));
      setWeldBevelAngle(String(conn.weldSpecs.bevelAngleDegrees ?? 0));
      setWeldPasses(String(conn.weldSpecs.passCount ?? 1));
    } else {
      setHasWeldSpecs(false);
    }

    if (conn.boltSpecs) {
      setHasBoltSpecs(true);
      setBoltDiameter(conn.boltSpecs.boltDiameter || 'M8');
      setBoltType(conn.boltSpecs.boltType || 'sextavado');
      setBoltHoleCount(String(conn.boltSpecs.holeCount ?? 4));
      setBoltPlateThickness(String(conn.boltSpecs.plateThicknessMm ?? 3.0));
    } else {
      setHasBoltSpecs(false);
    }

    if (conn.reinforcementSpecs) {
      setHasReinforcementSpecs(true);
      setReinfType(conn.reinforcementSpecs.reinforcementType || 'cantoneira_reforco');
      setReinfThickness(String(conn.reinforcementSpecs.thicknessMm ?? 3.0));
      setReinfLength(String(conn.reinforcementSpecs.lengthMm ?? 100));
    } else {
      setHasReinforcementSpecs(false);
    }

    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('Informe um nome para a ligação estrutural.', 'error');
      return;
    }

    let weldSpecsData: WeldSpecs | undefined = undefined;
    if (hasWeldSpecs) {
      weldSpecsData = {
        weldType,
        gapMm: parseFloat(weldGapMm) || 0,
        bevelAngleDegrees: parseFloat(weldBevelAngle) || 0,
        passCount: parseInt(weldPasses) || 1,
      };
    }

    let boltSpecsData: BoltSpecs | undefined = undefined;
    if (hasBoltSpecs) {
      boltSpecsData = {
        boltDiameter,
        boltType,
        holeCount: parseInt(boltHoleCount) || 4,
        plateThicknessMm: parseFloat(boltPlateThickness) || 3.0,
      };
    }

    let reinfSpecsData: ReinforcementSpecs | undefined = undefined;
    if (hasReinforcementSpecs) {
      reinfSpecsData = {
        reinforcementType: reinfType,
        thicknessMm: parseFloat(reinfThickness) || 3.0,
        lengthMm: parseFloat(reinfLength) || 100,
      };
    }

    const saved = saveConnection({
      id: editingConn?.id,
      name: formName.trim(),
      type: formType,
      category: formCategory,
      description: formDescription.trim(),
      compatibleProfiles: formProfiles.length > 0 ? formProfiles : ['Todos'],
      deductionMm: parseFloat(formDeductionMm) || 0,
      allowCutAngleOffset: formAllowCutOffset,
      weldSpecs: weldSpecsData,
      boltSpecs: boltSpecsData,
      reinforcementSpecs: reinfSpecsData,
      notes: formNotes.trim(),
    });

    showNotification(
      editingConn ? `Ligação "${saved.name}" atualizada!` : `Nova ligação "${saved.name}" cadastrada com sucesso!`,
      'success'
    );
    setIsModalOpen(false);
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateConnection(id);
    if (copy) {
      showNotification(`Cópias geradas: "${copy.name}".`, 'success');
    }
  };

  const handleArchive = (id: string, currentlyArchived: boolean) => {
    const updated = archiveConnection(id, !currentlyArchived);
    if (updated) {
      showNotification(
        updated.isArchived ? `Ligação "${updated.name}" arquivada.` : `Ligação "${updated.name}" desarquivada.`,
        'info'
      );
    }
  };

  const handleDelete = (id: string) => {
    const res = deleteConnection(id);
    if (res.success) {
      showNotification(res.message, 'success');
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Deseja restaurar as ligações padrão de fábrica? Suas ligações personalizadas serão preservadas se arquivadas.')) {
      resetConnectionsToDefault();
      showNotification('Ligações redefinidas para os padrões oficiais do sistema.', 'info');
    }
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const res = runConnectionsTestSuite();
      setTestResults(res);
      setIsRunningTests(false);
    }, 300);
  };

  const toggleProfileSelection = (profileName: string) => {
    if (profileName === 'Todos') {
      setFormProfiles(['Todos']);
      return;
    }

    let updated = formProfiles.filter((p) => p !== 'Todos');
    if (updated.includes(profileName)) {
      updated = updated.filter((p) => p !== profileName);
    } else {
      updated.push(profileName);
    }

    if (updated.length === 0) updated = ['Todos'];
    setFormProfiles(updated);
  };

  // Filtered Connections list
  const filteredConnections = connections.filter((conn) => {
    // Show/Hide archived
    if (!showArchived && conn.isArchived) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = conn.name.toLowerCase().includes(q);
      const descMatch = conn.description?.toLowerCase().includes(q);
      const typeLabel = CONNECTION_TYPE_LABELS[conn.type]?.label.toLowerCase().includes(q);
      const profileMatch = conn.compatibleProfiles?.some((p) => p.toLowerCase().includes(q));
      if (!nameMatch && !descMatch && !typeLabel && !profileMatch) return false;
    }

    // Category filter
    if (selectedCategory !== 'todas' && conn.category !== selectedCategory) return false;

    // Type filter
    if (selectedType !== 'todos' && conn.type !== selectedType) return false;

    return true;
  });

  // Metrics
  const totalCount = connections.length;
  const standardCount = connections.filter((c) => c.isStandard).length;
  const customCount = connections.filter((c) => !c.isStandard).length;
  const weldedCount = connections.filter((c) => c.category === 'soldada').length;
  const boltedCount = connections.filter((c) => c.category === 'aparafusada').length;
  const archivedCount = connections.filter((c) => c.isArchived).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      
      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {noticeMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border font-mono text-xs flex items-center gap-2 max-w-md ${
              noticeMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : noticeMessage.type === 'error'
                ? 'bg-red-900 text-red-100 border-red-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {noticeMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : noticeMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{noticeMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              ET-021.1 • Módulo Independente
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Core Engine Safe
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2.5">
            <Link2 className="w-7 h-7 text-indigo-400" />
            <span>Biblioteca Inteligente de Ligações</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Repositório único e padronizador para uniões estruturais: cantos 90°, meias-esquadrias 45°, travessas, soldas, furos, luvas internas e juntas aparafusadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleOpenNewModal}
            className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Ligação</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition text-xs cursor-pointer"
            title="Restaurar ligações oficiais de fábrica"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DASHBOARD METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Total</p>
            <p className="text-lg font-bold font-mono text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Soldadas</p>
            <p className="text-lg font-bold font-mono text-slate-900">{weldedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Aparafusadas</p>
            <p className="text-lg font-bold font-mono text-slate-900">{boltedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Padrão vs Custom</p>
            <p className="text-lg font-bold font-mono text-slate-900">{standardCount} / {customCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 bg-slate-100 text-slate-500 rounded-lg shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Arquivadas</p>
            <p className="text-lg font-bold font-mono text-slate-900">{archivedCount}</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS (CATÁLOGO DE LIGAÇÕES vs SUÍTE DE TESTES ET-021.1) */}
      <div className="bg-white p-2 border border-slate-200 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Catálogo de Ligações ({filteredConnections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('test_suite');
              if (testResults.length === 0) handleRunTests();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'test_suite'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Suíte de Testes e Certificação ET-021.1</span>
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="text-[11px] font-mono text-slate-500 px-3">
            Única Fonte Oficial de Regras de Ligação
          </div>
        )}
      </div>

      {/* TAB CONTENT 1: CATALOG OF CONNECTIONS */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col gap-6">
          
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, tipo, perfil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter selects */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              
              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="todas">Todas Categorias</option>
                <option value="soldada">Soldada</option>
                <option value="aparafusada">Aparafusada</option>
                <option value="mista">Mista</option>
                <option value="encaixe">Encaixe / Luva</option>
              </select>

              {/* Structural Type Dropdown */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[200px]"
              >
                <option value="todos">Todos os Tipos Estruturais</option>
                {Object.entries(CONNECTION_TYPE_LABELS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.icon} {val.label}
                  </option>
                ))}
              </select>

              {/* Toggle Show Archived */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-mono cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Arquivadas ({archivedCount})</span>
              </label>

            </div>
          </div>

          {/* CONNECTIONS GRID */}
          {filteredConnections.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full mb-3">
                <Link2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Nenhuma ligação encontrada</h4>
              <p className="text-slate-500 text-xs max-w-sm mt-1 mb-4">
                Ajuste os filtros de busca ou crie uma nova regra de união personalizada.
              </p>
              <button
                type="button"
                onClick={handleOpenNewModal}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Nova Ligação</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredConnections.map((conn) => {
                const typeInfo = CONNECTION_TYPE_LABELS[conn.type] || {
                  label: conn.type,
                  icon: '📐',
                  desc: '',
                };
                const catInfo = CATEGORY_LABELS[conn.category] || {
                  label: conn.category,
                  badge: 'bg-slate-100 text-slate-800 border-slate-200',
                };

                return (
                  <div
                    key={conn.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                      conn.isArchived
                        ? 'opacity-60 bg-slate-50 border-slate-200'
                        : conn.isStandard
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-indigo-200/80 hover:border-indigo-400'
                    }`}
                  >
                    {/* Top Status Bar */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${catInfo.badge}`}>
                            {catInfo.label}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                            <span>{typeInfo.icon}</span>
                            <span>{typeInfo.label}</span>
                          </span>
                        </div>

                        {conn.isStandard ? (
                          <span
                            className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0"
                            title="Ligação Padrão do Sistema (Protegida)"
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Padrão</span>
                          </span>
                        ) : (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold shrink-0">
                            Personalizada
                          </span>
                        )}
                      </div>

                      {/* Connection Name */}
                      <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {conn.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {conn.description || typeInfo.desc}
                      </p>

                      {/* Technical Attributes Box */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3 space-y-2 text-xs font-mono">
                        
                        {/* Deduction / Gap */}
                        <div className="flex justify-between items-center text-slate-700">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Folga / Desconto:</span>
                          <strong className="text-slate-900">{conn.deductionMm} mm</strong>
                        </div>

                        {/* Weld Specs preview */}
                        {conn.weldSpecs && (
                          <div className="flex justify-between items-center text-slate-700 border-t border-slate-200/60 pt-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Solda:</span>
                            <span className="text-amber-800 font-semibold truncate max-w-[150px]">
                              {conn.weldSpecs.weldType.replace('solda_', '').toUpperCase()} ({conn.weldSpecs.gapMm}mm fresta)
                            </span>
                          </div>
                        )}

                        {/* Bolt Specs preview */}
                        {conn.boltSpecs && (
                          <div className="flex justify-between items-center text-slate-700 border-t border-slate-200/60 pt-1.5">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Parafusos:</span>
                            <span className="text-indigo-800 font-semibold">
                              {conn.boltSpecs.holeCount}x {conn.boltSpecs.boltDiameter} ({conn.boltSpecs.plateThicknessMm}mm chapa)
                            </span>
                          </div>
                        )}

                        {/* Compatible Profiles preview */}
                        <div className="flex justify-between items-center text-slate-700 border-t border-slate-200/60 pt-1.5">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Perfis:</span>
                          <span className="text-slate-600 font-medium truncate max-w-[150px]" title={conn.compatibleProfiles?.join(', ')}>
                            {conn.compatibleProfiles?.join(', ')}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between gap-1">
                      
                      {/* View Details button */}
                      <button
                        type="button"
                        onClick={() => setViewingConn(conn)}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detalhes</span>
                      </button>

                      <div className="flex items-center gap-1">
                        
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(conn)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Editar especificações"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Duplicate Button */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(conn.id)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Duplicar ligação"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Archive / Unarchive Button */}
                        <button
                          type="button"
                          onClick={() => handleArchive(conn.id, !!conn.isArchived)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            conn.isArchived
                              ? 'text-indigo-600 hover:bg-indigo-50'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title={conn.isArchived ? 'Desarquivar' : 'Arquivar'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>

                        {/* Delete Button (Disabled for Standard items) */}
                        <button
                          type="button"
                          disabled={conn.isStandard}
                          onClick={() => handleDelete(conn.id)}
                          className={`p-1.5 rounded-lg transition ${
                            conn.isStandard
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                          }`}
                          title={
                            conn.isStandard
                              ? 'Ligações padrão do sistema são protegidas contra exclusão'
                              : 'Excluir ligação'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT 2: CERTIFICATION TEST SUITE ET-021.1 */}
      {activeTab === 'test_suite' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                  ET-021.1 • Certificação de Suíte de Ligações
                </span>
              </div>
              <h3 className="text-xl font-bold font-display text-slate-900">
                Suíte de Regressão Permanente do Módulo de Ligações
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Executa testes automatizados de cadastro, edição, duplicação, arquivamento e proteção contra exclusão de ligações padrão de fábrica.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-mono font-bold text-xs px-5 py-3 rounded-xl transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Executando Testes...' : 'EXECUTAR TESTES NOVAMENTE'}</span>
            </button>
          </div>

          {/* Test Results Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden font-mono text-xs">
            <div className="bg-slate-900 text-slate-200 px-4 py-3 font-bold grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider">
              <span className="col-span-2">ID do Teste</span>
              <span className="col-span-4">Nome do Teste</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-4">Resultado / Mensagem</span>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {testResults.map((test) => (
                <div key={test.testId} className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center hover:bg-slate-50/80">
                  <span className="col-span-2 font-bold text-slate-700">{test.testId}</span>
                  <span className="col-span-4 font-semibold text-slate-900">{test.name}</span>
                  <span className="col-span-2">
                    {test.passed ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        <Check className="w-3 h-3 stroke-[3]" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        <X className="w-3 h-3 stroke-[3]" /> FAIL
                      </span>
                    )}
                  </span>
                  <span className="col-span-4 text-slate-600 text-[11px] leading-tight">
                    {test.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-mono block mb-0.5">Garantia de Isolamento Arquitetural:</strong>
              Nenhum destes testes altera o Core Engine v1.0. A Biblioteca de Ligações opera de forma completamente desacoplada e disponibiliza suas especificações técnicas para futuros módulos da plataforma (Portões, Portas, Janelas, Estruturas).
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT CONNECTION FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col relative z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-display">
                      {editingConn ? 'Editar Ligação Estrutural' : 'Nova Ligação Estrutural'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {editingConn ? `ID: ${editingConn.id}` : 'Padronizador Universal de Ligações'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="form-connection-save" onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
                
                {/* Nome & Tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Nome da Ligação *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Canto 90° Reforçado"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Tipo Estrutural</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as StructuralConnectionType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {Object.entries(CONNECTION_TYPE_LABELS).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.icon} {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categoria & Desconto/Folga */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Categoria de Processo</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ConnectionCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="soldada">⚡ Soldada</option>
                      <option value="aparafusada">🔧 Aparafusada</option>
                      <option value="mista">🔨 Mista (Solda + Parafuso)</option>
                      <option value="encaixe">🧱 Encaixe / Luva</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Desconto / Folga de Fabricação (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0"
                      value={formDeductionMm}
                      onChange={(e) => setFormDeductionMm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Descrição Detalhada</label>
                  <textarea
                    rows={2}
                    placeholder="Detalhes sobre a preparação, frestas, ângulos de bisel ou aperto..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Perfis Compatíveis */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Perfis Compatíveis</label>
                  <div className="flex flex-wrap gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    {PROFILE_OPTIONS.map((prof) => {
                      const isSelected = formProfiles.includes(prof);
                      return (
                        <button
                          key={prof}
                          type="button"
                          onClick={() => toggleProfileSelection(prof)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-700 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{prof}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SPECIFICATIONS TOGGLES ACCORDION */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Especificações Técnicas Específicas</h4>

                  {/* 1. Especificações de Solda */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <label className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-100/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasWeldSpecs}
                          onChange={(e) => setHasWeldSpecs(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-800">Especificações de Solda</span>
                      </div>
                      <span className="text-[10px] text-slate-400">⚡ MIG/MMA/TIG</span>
                    </label>

                    {hasWeldSpecs && (
                      <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-t border-slate-200">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Processo</label>
                          <select
                            value={weldType}
                            onChange={(e) => setWeldType(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          >
                            <option value="solda_mig_mag">MIG/MAG</option>
                            <option value="solda_mma_eletrodo">MMA / Eletrodo</option>
                            <option value="solda_tig">TIG</option>
                            <option value="solda_ponteado">Ponteado</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Fresta (mm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={weldGapMm}
                            onChange={(e) => setWeldGapMm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Bisel (°)</label>
                          <input
                            type="number"
                            value={weldBevelAngle}
                            onChange={(e) => setWeldBevelAngle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Passes</label>
                          <input
                            type="number"
                            value={weldPasses}
                            onChange={(e) => setWeldPasses(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Especificações de Parafuso */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <label className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-100/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasBoltSpecs}
                          onChange={(e) => setHasBoltSpecs(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-800">Especificações de Parafusos / Flange</span>
                      </div>
                      <span className="text-[10px] text-slate-400">🔧 M8, M10, 3/8"</span>
                    </label>

                    {hasBoltSpecs && (
                      <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-t border-slate-200">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Diâmetro</label>
                          <input
                            type="text"
                            placeholder="M8, M10, 3/8"
                            value={boltDiameter}
                            onChange={(e) => setBoltDiameter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Tipo</label>
                          <select
                            value={boltType}
                            onChange={(e) => setBoltType(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          >
                            <option value="sextavado">Sextavado</option>
                            <option value="allen">Allen</option>
                            <option value="frances">Francês</option>
                            <option value="chumbador">Chumbador</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Furos</label>
                          <input
                            type="number"
                            value={boltHoleCount}
                            onChange={(e) => setBoltHoleCount(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Chapa (mm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={boltPlateThickness}
                            onChange={(e) => setBoltPlateThickness(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Especificações de Reforço */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    <label className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-100/80">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hasReinforcementSpecs}
                          onChange={(e) => setHasReinforcementSpecs(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-bold text-slate-800">Gusset / Mão de Força / Reforço</span>
                      </div>
                      <span className="text-[10px] text-slate-400">🛡️ Chapas & Enrijecedores</span>
                    </label>

                    {hasReinforcementSpecs && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border-t border-slate-200">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Tipo Reforço</label>
                          <select
                            value={reinfType}
                            onChange={(e) => setReinfType(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          >
                            <option value="cantoneira_reforco">Cantoneira</option>
                            <option value="chapa_gusset">Chapa Gusset</option>
                            <option value="mao_de_forca">Mão de Força</option>
                            <option value="luva_interna">Luva Interna</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Espessura (mm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={reinfThickness}
                            onChange={(e) => setReinfThickness(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block">Comprimento (mm)</label>
                          <input
                            type="number"
                            value={reinfLength}
                            onChange={(e) => setReinfLength(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Observações de Oficina</label>
                  <input
                    type="text"
                    placeholder="Instruções para o serralheiro ou montador..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

              </form>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="form-connection-save"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Salvar Ligação</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DETAIL VIEW */}
      <AnimatePresence>
        {viewingConn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingConn(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden relative z-10"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {CONNECTION_TYPE_LABELS[viewingConn.type]?.icon || '📐'}
                  </span>
                  <div>
                    <h3 className="font-bold text-base font-display">{viewingConn.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {CONNECTION_TYPE_LABELS[viewingConn.type]?.label}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingConn(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 font-mono text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Categoria:</span>
                    <strong className="text-slate-900 capitalize">{viewingConn.category}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Desconto/Folga:</span>
                    <strong className="text-slate-900">{viewingConn.deductionMm} mm</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tipo do Sistema:</span>
                    <strong className={viewingConn.isStandard ? 'text-amber-700 font-bold' : 'text-indigo-700 font-bold'}>
                      {viewingConn.isStandard ? '🔒 Padrão de Fábrica (Protegida)' : '✏️ Personalizada'}
                    </strong>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase mb-1">Descrição</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {viewingConn.description || 'Sem descrição.'}
                  </p>
                </div>

                {viewingConn.weldSpecs && (
                  <div>
                    <h4 className="font-bold text-amber-800 text-[11px] uppercase mb-1">⚡ Parâmetros de Solda</h4>
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 space-y-1 text-amber-950">
                      <div>Processo: <strong>{viewingConn.weldSpecs.weldType.toUpperCase()}</strong></div>
                      <div>Fresta: <strong>{viewingConn.weldSpecs.gapMm} mm</strong></div>
                      <div>Passes: <strong>{viewingConn.weldSpecs.passCount || 1}</strong></div>
                    </div>
                  </div>
                )}

                {viewingConn.boltSpecs && (
                  <div>
                    <h4 className="font-bold text-indigo-800 text-[11px] uppercase mb-1">🔧 Parâmetros de Parafusos</h4>
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/60 space-y-1 text-indigo-950">
                      <div>Diâmetro: <strong>{viewingConn.boltSpecs.boltDiameter}</strong> ({viewingConn.boltSpecs.boltType})</div>
                      <div>Furos: <strong>{viewingConn.boltSpecs.holeCount}</strong></div>
                      <div>Chapa Flange: <strong>{viewingConn.boltSpecs.plateThicknessMm} mm</strong></div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase mb-1">Perfis Compatíveis</h4>
                  <div className="flex flex-wrap gap-1">
                    {viewingConn.compatibleProfiles?.map((p) => (
                      <span key={p} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {viewingConn.notes && (
                  <div className="text-[11px] italic text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    Obs: {viewingConn.notes}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingConn(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
