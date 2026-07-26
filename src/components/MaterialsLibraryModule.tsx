/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  Tag, 
  DollarSign, 
  Weight, 
  Ruler, 
  Building2, 
  Info, 
  X, 
  Check, 
  RotateCcw,
  Sparkles,
  Zap,
  TrendingUp,
  Layers,
  ShoppingBag,
  FileCheck,
  Archive,
  ArchiveRestore,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MaterialProfile, ProfileCategory, MaterialUnit } from '../types';
import { 
  getMaterialProfiles, 
  addMaterialProfile, 
  updateMaterialProfile, 
  duplicateMaterialProfile, 
  toggleArchiveMaterialProfile,
  deleteMaterialProfile,
  runMaterialsLibraryValidationTests,
  MATERIALS_UPDATED_EVENT 
} from '../utils/materialsStore';

interface MaterialsLibraryModuleProps {
  onSelectProfileForProject?: (profileName: string) => void;
}

const ALL_CATEGORIES: ProfileCategory[] = [
  'Metalon',
  'Tubo Redondo',
  'Tubo Quadrado',
  'Tubo Retangular',
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
  'Barra Maciça Redonda',
  'Barra Maciça Quadrada',
  'Chapa Lisa',
  'Chapa Xadrez',
  'Outros'
];

export const MaterialsLibraryModule: React.FC<MaterialsLibraryModuleProps> = () => {
  const [profiles, setProfiles] = useState<MaterialProfile[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MaterialProfile | null>(null);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<MaterialProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Validation report modal state
  const [validationReport, setValidationReport] = useState<ReturnType<typeof runMaterialsLibraryValidationTests> | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    category: 'Metalon' as ProfileCategory,
    widthMm: '30',
    heightMm: '30',
    wallThicknessMm: '1.5',
    weightKgPerMeter: '1.30',
    costPerMeter: '18.00',
    costPerBar: '108.00',
    defaultBarLengthMm: '6000',
    unit: 'barra' as MaterialUnit,
    manufacturer: 'Gerdau',
    supplier: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch profiles on mount & listen to updates
  const loadProfiles = () => {
    setProfiles(getMaterialProfiles({ includeArchived: true }));
  };

  useEffect(() => {
    loadProfiles();

    const handleUpdate = () => {
      loadProfiles();
    };

    window.addEventListener(MATERIALS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(MATERIALS_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Sync costPerMeter <-> costPerBar when user inputs changes
  const handleCostPerMeterChange = (val: string) => {
    const numMeter = parseFloat(val);
    const numBarLen = parseFloat(formData.defaultBarLengthMm) || 6000;
    if (!isNaN(numMeter)) {
      const calculatedBar = (numMeter * (numBarLen / 1000)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        costPerMeter: val,
        costPerBar: calculatedBar
      }));
    } else {
      setFormData(prev => ({ ...prev, costPerMeter: val }));
    }
  };

  const handleCostPerBarChange = (val: string) => {
    const numBar = parseFloat(val);
    const numBarLen = parseFloat(formData.defaultBarLengthMm) || 6000;
    if (!isNaN(numBar) && numBarLen > 0) {
      const calculatedMeter = (numBar / (numBarLen / 1000)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        costPerBar: val,
        costPerMeter: calculatedMeter
      }));
    } else {
      setFormData(prev => ({ ...prev, costPerBar: val }));
    }
  };

  // Estimate theoretical weight for steel tube / bar / sheet
  const handleAutoCalculateWeight = () => {
    const w = parseFloat(formData.widthMm) || 0;
    const h = parseFloat(formData.heightMm) || 0;
    const t = parseFloat(formData.wallThicknessMm) || 0;

    if (w > 0 && h > 0 && t > 0) {
      if (formData.category.startsWith('Chapa')) {
        // Sheet weight approx kg/m² = thickness * 7.85
        const weightKgPerM2 = t * 7.85;
        setFormData(prev => ({ ...prev, weightKgPerMeter: weightKgPerM2.toFixed(2) }));
      } else if (formData.category === 'Tubo Redondo' || formData.category === 'Vergalhão' || formData.category === 'Barra Maciça Redonda') {
        // Circular cross section or tube
        if (formData.category === 'Tubo Redondo') {
          // Outer radius R = w/2, inner radius r = R - t
          const R = w / 2;
          const r = Math.max(0, R - t);
          const areaMm2 = Math.PI * (R * R - r * r);
          const weight = areaMm2 * 1000 * 0.00000785;
          setFormData(prev => ({ ...prev, weightKgPerMeter: weight.toFixed(2) }));
        } else {
          // Solid round bar
          const R = w / 2;
          const areaMm2 = Math.PI * R * R;
          const weight = areaMm2 * 1000 * 0.00000785;
          setFormData(prev => ({ ...prev, weightKgPerMeter: weight.toFixed(2) }));
        }
      } else {
        // Tube or angle perimeter approx
        const perimeterMm = 2 * (w + h);
        const areaMm2 = perimeterMm * t;
        const weightKgPerMeter = areaMm2 * 1000 * 0.00000785;
        setFormData(prev => ({
          ...prev,
          weightKgPerMeter: weightKgPerMeter.toFixed(2)
        }));
      }
    }
  };

  // Open modal for NEW profile
  const handleOpenNewModal = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      category: 'Metalon',
      widthMm: '30',
      heightMm: '30',
      wallThicknessMm: '1.5',
      weightKgPerMeter: '1.30',
      costPerMeter: '18.00',
      costPerBar: '108.00',
      defaultBarLengthMm: '6000',
      unit: 'barra',
      manufacturer: 'Gerdau',
      supplier: 'Gerdau',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for EDIT profile
  const handleOpenEditModal = (profile: MaterialProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      category: profile.category || 'Metalon',
      widthMm: profile.widthMm.toString(),
      heightMm: profile.heightMm.toString(),
      wallThicknessMm: profile.wallThicknessMm.toString(),
      weightKgPerMeter: profile.weightKgPerMeter.toString(),
      costPerMeter: profile.costPerMeter.toString(),
      costPerBar: profile.costPerBar.toString(),
      defaultBarLengthMm: profile.defaultBarLengthMm.toString(),
      unit: profile.unit || 'barra',
      manufacturer: profile.manufacturer || profile.supplier || '',
      supplier: profile.supplier || '',
      notes: profile.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle DUPLICATE
  const handleDuplicate = (profile: MaterialProfile) => {
    duplicateMaterialProfile(profile.id);
  };

  // Handle ARCHIVE toggle
  const handleToggleArchive = (profile: MaterialProfile) => {
    toggleArchiveMaterialProfile(profile.id);
  };

  // Handle DELETE attempt
  const handleDeleteAttempt = (profile: MaterialProfile) => {
    if (profile.isDefault) {
      alert('Perfis padrão do sistema são protegidos contra exclusão.');
      return;
    }
    setDeleteError(null);
    setDeleteConfirmProfile(profile);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmProfile) return;
    try {
      deleteMaterialProfile(deleteConfirmProfile.id);
      setDeleteConfirmProfile(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Erro ao excluir perfil.');
    }
  };

  // Run Homologation
  const handleRunValidation = () => {
    const res = runMaterialsLibraryValidationTests();
    setValidationReport(res);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório.';
    if (!formData.widthMm || parseFloat(formData.widthMm) <= 0) errors.widthMm = 'Largura inválida.';
    if (!formData.heightMm || parseFloat(formData.heightMm) <= 0) errors.heightMm = 'Altura inválida.';
    if (!formData.wallThicknessMm || parseFloat(formData.wallThicknessMm) <= 0) errors.wallThicknessMm = 'Espessura inválida.';
    if (!formData.weightKgPerMeter || parseFloat(formData.weightKgPerMeter) < 0) errors.weightKgPerMeter = 'Peso inválido.';
    if (!formData.costPerMeter || parseFloat(formData.costPerMeter) < 0) errors.costPerMeter = 'Valor/m inválido.';
    if (!formData.costPerBar || parseFloat(formData.costPerBar) < 0) errors.costPerBar = 'Valor/barra inválido.';
    if (!formData.defaultBarLengthMm || parseFloat(formData.defaultBarLengthMm) <= 0) errors.defaultBarLengthMm = 'Comprimento comercial inválido.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const profileData = {
      name: formData.name.trim(),
      category: formData.category,
      widthMm: parseFloat(formData.widthMm),
      heightMm: parseFloat(formData.heightMm),
      wallThicknessMm: parseFloat(formData.wallThicknessMm),
      weightKgPerMeter: parseFloat(formData.weightKgPerMeter),
      costPerMeter: parseFloat(formData.costPerMeter),
      costPerBar: parseFloat(formData.costPerBar),
      defaultBarLengthMm: parseFloat(formData.defaultBarLengthMm),
      unit: formData.unit,
      manufacturer: formData.manufacturer.trim() || undefined,
      supplier: formData.supplier.trim() || formData.manufacturer.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    if (editingProfile) {
      updateMaterialProfile(editingProfile.id, profileData);
    } else {
      addMaterialProfile(profileData);
    }

    setIsModalOpen(false);
  };

  // Filtered profiles list
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Archive filter
      if (!showArchived && profile.isArchived) return false;
      if (showArchived && !profile.isArchived) return false;

      // Search Query filter (matches Name, Category, Manufacturer, Notes)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = profile.name.toLowerCase().includes(query);
        const matchCategory = (profile.category || '').toLowerCase().includes(query);
        const matchManufacturer = (profile.manufacturer || profile.supplier || '').toLowerCase().includes(query);
        const matchNotes = (profile.notes || '').toLowerCase().includes(query);
        const matchMeasures = `${profile.widthMm}x${profile.heightMm}`.includes(query);
        if (!matchName && !matchCategory && !matchManufacturer && !matchNotes && !matchMeasures) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'todos') {
        if (profile.category !== selectedCategory) return false;
      }

      return true;
    });
  }, [profiles, searchQuery, selectedCategory, showArchived]);

  // Statistics
  const activeProfiles = useMemo(() => profiles.filter(p => !p.isArchived), [profiles]);
  const defaultCount = useMemo(() => activeProfiles.filter(p => p.isDefault).length, [activeProfiles]);
  const customCount = useMemo(() => activeProfiles.filter(p => !p.isDefault).length, [activeProfiles]);
  const categoriesCount = useMemo(() => new Set(activeProfiles.map(p => p.category)).size, [activeProfiles]);
  const avgCostPerMeter = useMemo(() => {
    if (activeProfiles.length === 0) return '0.00';
    const total = activeProfiles.reduce((sum, p) => sum + p.costPerMeter, 0);
    return (total / activeProfiles.length).toFixed(2);
  }, [activeProfiles]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>ET-020.1 • Repositório Universal</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              18 Categorias Oficiais
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>📦 Biblioteca Universal de Perfis e Materiais</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Fonte única oficial de materiais para toda a plataforma. Cadastre, edite, duplique ou arquive perfis metálicos. Todos os cálculos de Render, Lista de Corte, Orçamento e Otimização consomem este repositório.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-executar-homologacao-materiais"
            type="button"
            onClick={handleRunValidation}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-mono font-bold px-4 py-3 rounded-xl transition duration-150 shadow-md flex items-center gap-2 text-xs cursor-pointer"
            title="Executar suíte de validação do repositório"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Homologação ET-020.1</span>
          </button>

          <button
            id="btn-novo-perfil-header"
            type="button"
            onClick={handleOpenNewModal}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition duration-150 shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap text-sm shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>➕ Novo Perfil</span>
          </button>
        </div>
      </div>

      {/* Quick Statistics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Perfis Ativos</p>
            <p className="text-lg font-bold font-mono text-slate-950">{activeProfiles.length} perfis</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Categorias em Uso</p>
            <p className="text-lg font-bold font-mono text-slate-950">{categoriesCount} de 18</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Personalizados</p>
            <p className="text-lg font-bold font-mono text-slate-950">{customCount} perfis</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Valor Médio / Metro</p>
            <p className="text-lg font-bold font-mono text-emerald-700">R$ {avgCostPerMeter}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-busca-materiais"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar perfil, categoria, fornecedor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Archive Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium hidden sm:inline">Categoria:</span>
            <select
              id="select-filtro-categoria"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer max-w-[180px]"
            >
              <option value="todos">Todas as Categorias ({ALL_CATEGORIES.length})</option>
              {ALL_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Archive Toggle Button */}
          <button
            id="btn-toggle-arquivados"
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
              showArchived
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Exibindo Arquivados' : 'Ver Arquivados'}</span>
          </button>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== 'todos' || showArchived) && (
            <button
              id="btn-limpar-filtros"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
                setShowArchived(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Materials Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-500" />
            <span>Catálogo Oficial de Perfis ({showArchived ? 'Arquivados' : 'Ativos'})</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Exibindo <strong className="text-slate-900">{filteredProfiles.length}</strong> perfis
          </span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-full mb-3">
              <Box className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-slate-800 font-bold text-base">Nenhum perfil encontrado</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Nenhum material encontrado com os filtros selecionados. Tente redefinir a busca ou cadastre um novo perfil.
            </p>
            <button
              onClick={handleOpenNewModal}
              className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Perfil</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Perfil / Material</th>
                  <th className="py-3 px-4 font-bold">Categoria</th>
                  <th className="py-3 px-4 font-bold text-center">Largura × Altura</th>
                  <th className="py-3 px-4 font-bold text-center">Espessura</th>
                  <th className="py-3 px-4 font-bold text-right">Peso Linear</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / m</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / Barra</th>
                  <th className="py-3 px-4 font-bold text-center">Unidade</th>
                  <th className="py-3 px-4 font-bold">Fabricante</th>
                  <th className="py-3 px-4 font-bold text-center min-w-[140px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredProfiles.map((profile) => (
                  <tr 
                    key={profile.id}
                    className={`hover:bg-slate-50/80 transition duration-150 group ${profile.isArchived ? 'bg-slate-50/60 opacity-75' : ''}`}
                  >
                    {/* Name & Badge */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {profile.name}
                        </span>
                        {profile.isDefault ? (
                          <span 
                            className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0"
                            title="Perfil Padrão do Sistema (Protegido contra exclusão)"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>Padrão</span>
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                            <Tag className="w-3 h-3 text-amber-600" />
                            <span>Personalizado</span>
                          </span>
                        )}
                        {profile.isArchived && (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                            Arquivado
                          </span>
                        )}
                      </div>
                      {profile.notes && (
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                          {profile.notes}
                        </p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-sans">
                      <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap">
                        {profile.category || 'Metalon'}
                      </span>
                    </td>

                    {/* Dimensions */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      {profile.widthMm} × {profile.heightMm} mm
                    </td>

                    {/* Wall Thickness */}
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold whitespace-nowrap">
                      {profile.wallThicknessMm} mm
                    </td>

                    {/* Weight per Meter */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                      {profile.weightKgPerMeter.toFixed(2)} {profile.unit === 'm2' || profile.category.startsWith('Chapa') ? 'kg/m²' : 'kg/m'}
                    </td>

                    {/* Cost per Meter */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                      R$ {profile.costPerMeter.toFixed(2)}
                    </td>

                    {/* Cost per Bar */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                      R$ {profile.costPerBar.toFixed(2)}
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4 text-center text-slate-600 capitalize">
                      {profile.unit || 'barra'}
                    </td>

                    {/* Manufacturer */}
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      {profile.manufacturer || profile.supplier ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{profile.manufacturer || profile.supplier}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          id={`btn-editar-perfil-${profile.id}`}
                          type="button"
                          onClick={() => handleOpenEditModal(profile)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Editar perfil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate Button */}
                        <button
                          id={`btn-duplicar-perfil-${profile.id}`}
                          type="button"
                          onClick={() => handleDuplicate(profile)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Duplicar este perfil"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Archive / Unarchive Button */}
                        <button
                          id={`btn-arquivar-perfil-${profile.id}`}
                          type="button"
                          onClick={() => handleToggleArchive(profile)}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                          title={profile.isArchived ? "Desarquivar perfil" : "Arquivar perfil"}
                        >
                          {profile.isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-purple-600" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`btn-excluir-perfil-${profile.id}`}
                          type="button"
                          onClick={() => handleDeleteAttempt(profile)}
                          disabled={profile.isDefault}
                          className={`p-1.5 rounded-lg transition ${
                            profile.isDefault 
                              ? 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-50' 
                              : 'text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                          }`}
                          title={profile.isDefault ? "Perfil padrão do sistema (protegido contra exclusão)" : "Excluir perfil personalizado"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    {editingProfile ? `Editar Perfil: ${editingProfile.name}` : '➕ Novo Perfil de Material'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Cadastre as propriedades de qualquer material para consumo global no aplicativo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Profile Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1">
                    Nome do Perfil <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-nome"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Metalon 30x30, Tubo Redondo 2"
                    className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:bg-white transition ${
                      formErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-amber-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-perfil-categoria"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProfileCategory })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 focus:bg-white transition cursor-pointer"
                  >
                    {ALL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dimensions Grid (Largura x Altura x Espessura) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Largura (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-largura"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.widthMm}
                    onChange={(e) => setFormData({ ...formData, widthMm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {formErrors.widthMm && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.widthMm}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Altura (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-altura"
                    type="number"
                    step="0.1"
                    min="1"
                    value={formData.heightMm}
                    onChange={(e) => setFormData({ ...formData, heightMm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {formErrors.heightMm && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.heightMm}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Espessura (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-espessura"
                    type="number"
                    step="0.05"
                    min="0.2"
                    value={formData.wallThicknessMm}
                    onChange={(e) => setFormData({ ...formData, wallThicknessMm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {formErrors.wallThicknessMm && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.wallThicknessMm}</p>}
                </div>
              </div>

              {/* Weight per Meter & Selling Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 font-mono">
                      Peso Linear (kg/m) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoCalculateWeight}
                      className="text-[10px] font-mono text-amber-600 hover:text-amber-800 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Auto</span>
                    </button>
                  </div>
                  <input
                    id="input-perfil-peso"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weightKgPerMeter}
                    onChange={(e) => setFormData({ ...formData, weightKgPerMeter: e.target.value })}
                    placeholder="Ex: 1.30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {formErrors.weightKgPerMeter && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.weightKgPerMeter}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Unidade de Venda
                  </label>
                  <select
                    id="select-perfil-unidade"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as MaterialUnit })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="barra">Barra comercial</option>
                    <option value="m">Metro linear (m)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="m2">Metro quadrado (m²)</option>
                    <option value="chapa">Chapa / Placa</option>
                  </select>
                </div>
              </div>

              {/* Price Fields (Meter vs Bar) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Valor por Metro (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-valor-metro"
                    type="number"
                    step="0.10"
                    min="0"
                    value={formData.costPerMeter}
                    onChange={(e) => handleCostPerMeterChange(e.target.value)}
                    placeholder="Ex: 18.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                  {formErrors.costPerMeter && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.costPerMeter}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Valor por Barra (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-valor-barra"
                    type="number"
                    step="0.50"
                    min="0"
                    value={formData.costPerBar}
                    onChange={(e) => handleCostPerBarChange(e.target.value)}
                    placeholder="Ex: 108.00"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                  {formErrors.costPerBar && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.costPerBar}</p>}
                </div>
              </div>

              {/* Commercial Bar Length & Manufacturer */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Comprimento Comercial (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-perfil-comprimento-barra"
                    type="number"
                    step="100"
                    min="1000"
                    value={formData.defaultBarLengthMm}
                    onChange={(e) => setFormData({ ...formData, defaultBarLengthMm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Fabricante / Fornecedor
                  </label>
                  <input
                    id="input-perfil-fabricante"
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Ex: Gerdau, ArcelorMittal, CSN..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  id="textarea-perfil-observacoes"
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Usado para vigas e montantes principais..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  id="btn-cancelar-perfil-modal"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  id="btn-salvar-perfil-modal"
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProfile ? 'Salvar Alterações' : 'Cadastrar Perfil'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VALIDATION / HOMOLOGATION REPORT MODAL */}
      {validationReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="bg-emerald-500 text-slate-950 p-2 rounded-lg font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    Relatório de Homologação ET-020.1
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Validação do Repositório Universal de Materiais
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Status do Teste</p>
                  <p className={`text-base font-bold font-mono ${validationReport.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {validationReport.success ? 'PASSED (100%)' : 'FAILED'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Testes Executados</p>
                  <p className="text-base font-bold font-mono text-slate-900">
                    {validationReport.passedTests} / {validationReport.totalTests}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] text-slate-500 font-mono uppercase font-bold">Categorias Cobertas</p>
                  <p className="text-base font-bold font-mono text-blue-600">
                    {validationReport.categoriesCovered} / 18
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl max-h-72 overflow-y-auto space-y-1.5 border border-slate-800">
                {validationReport.report.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">{line}</div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setValidationReport(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Fechar Relatório
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      {deleteConfirmProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="p-3 bg-red-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Excluir Perfil Personalizado?</h3>
                <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Você está prestes a excluir o perfil <strong className="text-slate-900">{deleteConfirmProfile.name}</strong> da biblioteca.
            </p>

            {deleteError && (
              <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="btn-cancelar-exclusao-perfil"
                type="button"
                onClick={() => setDeleteConfirmProfile(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-exclusao-perfil"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-md cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

