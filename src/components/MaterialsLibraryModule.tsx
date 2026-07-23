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
  FileCheck
} from 'lucide-react';
import { MaterialProfile } from '../types';
import { 
  getMaterialProfiles, 
  addMaterialProfile, 
  updateMaterialProfile, 
  duplicateMaterialProfile, 
  deleteMaterialProfile,
  MATERIALS_UPDATED_EVENT 
} from '../utils/materialsStore';

interface MaterialsLibraryModuleProps {
  onSelectProfileForProject?: (profileName: string) => void;
}

export const MaterialsLibraryModule: React.FC<MaterialsLibraryModuleProps> = () => {
  const [profiles, setProfiles] = useState<MaterialProfile[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [measureFilter, setMeasureFilter] = useState<string>('todos');
  const [thicknessFilter, setThicknessFilter] = useState<string>('todos');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<MaterialProfile | null>(null);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<MaterialProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    name: '',
    widthMm: '30',
    heightMm: '30',
    wallThicknessMm: '1.5',
    weightKgPerMeter: '1.30',
    costPerMeter: '18.00',
    costPerBar: '108.00',
    defaultBarLengthMm: '6000',
    supplier: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch profiles on mount & listen to updates
  const loadProfiles = () => {
    setProfiles(getMaterialProfiles());
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

  // Estimate theoretical weight for steel tube (Density = 7.85 g/cm³)
  const handleAutoCalculateWeight = () => {
    const w = parseFloat(formData.widthMm) || 0;
    const h = parseFloat(formData.heightMm) || 0;
    const t = parseFloat(formData.wallThicknessMm) || 0;

    if (w > 0 && h > 0 && t > 0) {
      // Perimeter in mm = 2*(w + h)
      // Cross-sectional area approx = perimeter * thickness (in mm²)
      const perimeterMm = 2 * (w + h);
      const areaMm2 = perimeterMm * t;
      // Volume per meter (1000 mm) = areaMm2 * 1000 mm³
      // Steel density = 0.00000785 kg/mm³
      const weightKgPerMeter = areaMm2 * 1000 * 0.00000785;
      setFormData(prev => ({
        ...prev,
        weightKgPerMeter: weightKgPerMeter.toFixed(2)
      }));
    }
  };

  // Open modal for NEW profile
  const handleOpenNewModal = () => {
    setEditingProfile(null);
    setFormData({
      name: 'Metalon ',
      widthMm: '30',
      heightMm: '30',
      wallThicknessMm: '1.5',
      weightKgPerMeter: '1.30',
      costPerMeter: '18.00',
      costPerBar: '108.00',
      defaultBarLengthMm: '6000',
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
      widthMm: profile.widthMm.toString(),
      heightMm: profile.heightMm.toString(),
      wallThicknessMm: profile.wallThicknessMm.toString(),
      weightKgPerMeter: profile.weightKgPerMeter.toString(),
      costPerMeter: profile.costPerMeter.toString(),
      costPerBar: profile.costPerBar.toString(),
      defaultBarLengthMm: profile.defaultBarLengthMm.toString(),
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
      widthMm: parseFloat(formData.widthMm),
      heightMm: parseFloat(formData.heightMm),
      wallThicknessMm: parseFloat(formData.wallThicknessMm),
      weightKgPerMeter: parseFloat(formData.weightKgPerMeter),
      costPerMeter: parseFloat(formData.costPerMeter),
      costPerBar: parseFloat(formData.costPerBar),
      defaultBarLengthMm: parseFloat(formData.defaultBarLengthMm),
      supplier: formData.supplier.trim() || undefined,
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
      // Search Query filter (matches Name, Supplier, or Notes)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = profile.name.toLowerCase().includes(query);
        const matchSupplier = (profile.supplier || '').toLowerCase().includes(query);
        const matchNotes = (profile.notes || '').toLowerCase().includes(query);
        const matchMeasures = `${profile.widthMm}x${profile.heightMm}`.includes(query);
        if (!matchName && !matchSupplier && !matchNotes && !matchMeasures) {
          return false;
        }
      }

      // Measures filter
      if (measureFilter !== 'todos') {
        const measureKey = `${profile.widthMm}x${profile.heightMm}`;
        if (measureFilter === 'outros') {
          const commonList = ['15x15', '20x20', '30x20', '30x30', '40x20', '40x40', '50x30', '50x50', '60x40', '80x40'];
          if (commonList.includes(measureKey)) return false;
        } else if (measureKey !== measureFilter) {
          return false;
        }
      }

      // Wall Thickness filter
      if (thicknessFilter !== 'todos') {
        if (thicknessFilter === 'outros') {
          if ([1.2, 1.5, 2.0].includes(profile.wallThicknessMm)) return false;
        } else {
          if (profile.wallThicknessMm.toString() !== thicknessFilter) return false;
        }
      }

      return true;
    });
  }, [profiles, searchQuery, measureFilter, thicknessFilter]);

  // Statistics
  const defaultCount = useMemo(() => profiles.filter(p => p.isDefault).length, [profiles]);
  const customCount = useMemo(() => profiles.filter(p => !p.isDefault).length, [profiles]);
  const avgCostPerMeter = useMemo(() => {
    if (profiles.length === 0) return 0;
    const total = profiles.reduce((sum, p) => sum + p.costPerMeter, 0);
    return (total / profiles.length).toFixed(2);
  }, [profiles]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>ET-006 • Módulo Oficial</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Banco de Dados Ativo
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>📦 Biblioteca de Materiais</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Gerencie o catálogo de perfis, tubos e barras da serralheria. Todos os cálculos de estrutura, lista de corte e otimização utilizam automaticamente as especificações desta biblioteca.
          </p>
        </div>

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

      {/* Quick Statistics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-lg">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total na Biblioteca</p>
            <p className="text-lg font-bold font-mono text-slate-950">{profiles.length} perfis</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Perfis Padrão</p>
            <p className="text-lg font-bold font-mono text-slate-950">{defaultCount} protegidos</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Personalizados</p>
            <p className="text-lg font-bold font-mono text-slate-950">{customCount} customizados</p>
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
            placeholder="Buscar perfil (ex: Metalon 30x30, Gerdau)..."
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

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Measure Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Ruler className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium hidden sm:inline">Medidas:</span>
            <select
              id="select-filtro-medidas"
              value={measureFilter}
              onChange={(e) => setMeasureFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todos">Todas as Medidas</option>
              <option value="15x15">15x15 mm</option>
              <option value="20x20">20x20 mm</option>
              <option value="30x20">30x20 mm</option>
              <option value="30x30">30x30 mm</option>
              <option value="40x20">40x20 mm</option>
              <option value="40x40">40x40 mm</option>
              <option value="50x30">50x30 mm</option>
              <option value="50x50">50x50 mm</option>
              <option value="60x40">60x40 mm</option>
              <option value="80x40">80x40 mm</option>
              <option value="outros">Outras medidas</option>
            </select>
          </div>

          {/* Thickness Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium hidden sm:inline">Espessura:</span>
            <select
              id="select-filtro-espessura"
              value={thicknessFilter}
              onChange={(e) => setThicknessFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="todos">Todas Espessuras</option>
              <option value="1.2">1.2 mm (#18)</option>
              <option value="1.5">1.5 mm (#16)</option>
              <option value="2.0">2.0 mm (#14)</option>
              <option value="outros">Outras espessuras</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || measureFilter !== 'todos' || thicknessFilter !== 'todos') && (
            <button
              id="btn-limpar-filtros"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMeasureFilter('todos');
                setThicknessFilter('todos');
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
            <span>Tabela de Perfis Cadastrados</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Exibindo <strong className="text-slate-900">{filteredProfiles.length}</strong> de {profiles.length} perfis
          </span>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-amber-50 text-amber-600 p-4 rounded-full mb-3">
              <Box className="w-8 h-8 stroke-[1.5]" />
            </div>
            <p className="text-slate-800 font-bold text-base">Nenhum perfil encontrado</p>
            <p className="text-slate-500 text-xs mt-1 max-w-sm">
              Tente redefinir os filtros de busca ou clique no botão abaixo para adicionar um novo perfil.
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
                  <th className="py-3 px-4 font-bold text-center">Largura × Altura</th>
                  <th className="py-3 px-4 font-bold text-center">Espessura</th>
                  <th className="py-3 px-4 font-bold text-right">Peso / m</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / m</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / Barra</th>
                  <th className="py-3 px-4 font-bold text-center">Barra Padrão</th>
                  <th className="py-3 px-4 font-bold">Fornecedor</th>
                  <th className="py-3 px-4 font-bold text-center min-w-[130px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredProfiles.map((profile) => (
                  <tr 
                    key={profile.id}
                    className="hover:bg-slate-50/80 transition duration-150 group"
                  >
                    {/* Name & Badge */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {profile.name}
                        </span>
                        {profile.isDefault ? (
                          <span 
                            className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                            title="Perfil Padrão do Sistema (Protegido contra exclusão)"
                          >
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>Padrão</span>
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Tag className="w-3 h-3 text-amber-600" />
                            <span>Personalizado</span>
                          </span>
                        )}
                      </div>
                      {profile.notes && (
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5 line-clamp-1">
                          {profile.notes}
                        </p>
                      )}
                    </td>

                    {/* Dimensions */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {profile.widthMm} × {profile.heightMm} mm
                    </td>

                    {/* Wall Thickness */}
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {profile.wallThicknessMm} mm
                    </td>

                    {/* Weight per Meter */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                      {profile.weightKgPerMeter.toFixed(2)} kg
                    </td>

                    {/* Cost per Meter */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      R$ {profile.costPerMeter.toFixed(2)}
                    </td>

                    {/* Cost per Bar */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 bg-slate-50/50">
                      R$ {profile.costPerBar.toFixed(2)}
                    </td>

                    {/* Default Bar Length */}
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      {(profile.defaultBarLengthMm / 1000).toFixed(2)} m ({profile.defaultBarLengthMm} mm)
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      {profile.supplier ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-md">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{profile.supplier}</span>
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
                          title="Editar especificações do perfil"
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

      {/* Future Preparation Banner / System Architecture Specs */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Arquitetura Preparada para Expansões Futuras
            </h4>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Esta Biblioteca de Materiais já fornece dados unificados de peso (kg/m), custo por metro/barra e fornecedores. As métricas do projeto alimentam automaticamente os futuros módulos de:
          </p>
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
            <span className="bg-slate-800 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Weight className="w-3 h-3" /> Peso Total do Projeto
            </span>
            <span className="bg-slate-800 text-emerald-300 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Custo Automático
            </span>
            <span className="bg-slate-800 text-sky-300 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1">
              <Layers className="w-3 h-3" /> Gestão de Estoque
            </span>
            <span className="bg-slate-800 text-purple-300 border border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Orçamentos & Compras
            </span>
          </div>
        </div>
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
                    {editingProfile ? 'Atualize as propriedades e preços do perfil' : 'Cadastre um novo perfil para uso em todo o aplicativo'}
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
              {/* Profile Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-1">
                  Nome do Perfil <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-perfil-nome"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Metalon 30x30, Perfil U 50x25..."
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:bg-white transition ${
                    formErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-amber-500'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-red-500 mt-1">{formErrors.name}</p>}
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
                    step="1"
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
                    step="1"
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
                    step="0.1"
                    min="0.5"
                    value={formData.wallThicknessMm}
                    onChange={(e) => setFormData({ ...formData, wallThicknessMm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  {formErrors.wallThicknessMm && <p className="text-[10px] text-red-500 mt-0.5">{formErrors.wallThicknessMm}</p>}
                </div>
              </div>

              {/* Weight per Meter with Auto Calculator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 font-mono">
                    Peso por Metro (kg/m) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateWeight}
                    className="text-[10px] font-mono text-amber-600 hover:text-amber-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Calcular peso teórico (aço)</span>
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

              {/* Commercial Bar Length & Supplier */}
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
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Padrão nacional: 6000 mm (6 metros)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                    Fornecedor (Opcional)
                  </label>
                  <input
                    id="input-perfil-fornecedor"
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ex: Gerdau, ArcelorMittal..."
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
                  placeholder="Ex: Usado em portões basculantes e travessas reforçadas..."
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
