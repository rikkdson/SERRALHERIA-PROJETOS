/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  RefreshCw, 
  Building2, 
  Layers, 
  Disc, 
  Wrench, 
  Box, 
  Plus, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Store, 
  Info, 
  Search, 
  Filter, 
  Tag, 
  ShieldAlert, 
  Check, 
  Sparkles,
  ArrowRight,
  Package,
  History,
  ArrowUpDown
} from 'lucide-react';
import { 
  PriceCenterData, 
  ProfilePriceItem, 
  ConsumablePriceItem, 
  HardwarePriceItem, 
  OtherMaterialPriceItem, 
  Supplier 
} from '../types';
import { 
  getPriceCenterData, 
  savePriceCenterData, 
  setActiveSupplier, 
  updateProfilePrice, 
  batchUpdateProfilePrices,
  addProfilePriceItem,
  saveConsumableItem,
  saveHardwareItem,
  saveSupplier,
  PRICE_CENTER_UPDATED_EVENT
} from '../utils/priceCenterStore';

interface PriceCenterModuleProps {
  onNavigateToBudget?: () => void;
}

export const PriceCenterModule: React.FC<PriceCenterModuleProps> = ({ onNavigateToBudget }) => {
  const [data, setData] = useState<PriceCenterData>(getPriceCenterData());
  const [activeTab, setActiveTab] = useState<'perfis' | 'consumiveis' | 'ferragens' | 'outros' | 'fornecedores'>('perfis');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isQuickUpdateOpen, setIsQuickUpdateOpen] = useState(false);
  const [quickPrices, setQuickPrices] = useState<Record<string, number>>({});
  
  // New Item / Edit States
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editBarPrice, setEditBarPrice] = useState<number>(0);

  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileFinish, setNewProfileFinish] = useState<'Preto' | 'Galvanizado'>('Preto');
  const [newProfileBarCost, setNewProfileBarCost] = useState<number>(60);
  const [newProfileBarLength, setNewProfileBarLength] = useState<number>(6000);
  const [newProfileSupplier, setNewProfileSupplier] = useState<string>('');

  const [isAddConsumableModalOpen, setIsAddConsumableModalOpen] = useState(false);
  const [newConsumableName, setNewConsumableName] = useState('');
  const [newConsumablePrice, setNewConsumablePrice] = useState<number>(10);
  const [newConsumableUnit, setNewConsumableUnit] = useState('unid');

  const [isAddHardwareModalOpen, setIsAddHardwareModalOpen] = useState(false);
  const [newHardwareName, setNewHardwareName] = useState('');
  const [newHardwarePrice, setNewHardwarePrice] = useState<number>(15);
  const [newHardwareUnit, setNewHardwareUnit] = useState('unid');

  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state from store
  useEffect(() => {
    setData(getPriceCenterData());

    const handleUpdate = () => {
      setData(getPriceCenterData());
    };

    window.addEventListener(PRICE_CENTER_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(PRICE_CENTER_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch Supplier Table
  const handleSupplierChange = (supId: string) => {
    const updated = setActiveSupplier(supId);
    setData(updated);
    const supName = updated.suppliers.find(s => s.id === supId)?.name || 'Tabela Padrão';
    showToast(`Tabela de preços alterada para: ${supName}`);
  };

  // Open Quick Price Update Modal
  const handleOpenQuickUpdate = () => {
    const initialMap: Record<string, number> = {};
    data.profiles.forEach(p => {
      initialMap[p.id] = p.costPerBar;
    });
    setQuickPrices(initialMap);
    setIsQuickUpdateOpen(true);
  };

  // Save Quick Price Updates
  const handleSaveQuickPrices = () => {
    const updated = batchUpdateProfilePrices(quickPrices);
    setData(updated);
    setIsQuickUpdateOpen(false);
    showToast('Preços de perfis atualizados com sucesso!');
  };

  // Single Profile Inline Price Save
  const handleSaveInlineProfilePrice = (profileId: string) => {
    if (editBarPrice > 0) {
      const updated = updateProfilePrice(profileId, editBarPrice);
      setData(updated);
      setEditingProfileId(null);
      showToast('Preço do perfil atualizado!');
    }
  };

  // Handle Add Profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName) return;

    addProfilePriceItem({
      name: newProfileName,
      materialFinish: newProfileFinish,
      defaultBarLengthMm: newProfileBarLength,
      costPerBar: newProfileBarCost,
      supplierId: newProfileSupplier,
      supplierName: data.suppliers.find(s => s.id === newProfileSupplier)?.name || 'Fornecedor Geral'
    });

    setIsAddProfileModalOpen(false);
    setNewProfileName('');
    showToast(`Perfil ${newProfileName} cadastrado com sucesso!`);
  };

  // Handle Add Consumable
  const handleCreateConsumable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsumableName) return;

    saveConsumableItem({
      name: newConsumableName,
      price: newConsumablePrice,
      unit: newConsumableUnit
    });

    setIsAddConsumableModalOpen(false);
    setNewConsumableName('');
    showToast(`Consumível ${newConsumableName} adicionado!`);
  };

  // Handle Add Hardware
  const handleCreateHardware = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHardwareName) return;

    saveHardwareItem({
      name: newHardwareName,
      price: newHardwarePrice,
      unit: newHardwareUnit
    });

    setIsAddHardwareModalOpen(false);
    setNewHardwareName('');
    showToast(`Ferragem ${newHardwareName} adicionada!`);
  };

  // Handle Add Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName) return;

    saveSupplier({
      name: newSupplierName,
      phone: newSupplierPhone,
      email: newSupplierEmail
    });

    setIsAddSupplierModalOpen(false);
    setNewSupplierName('');
    showToast(`Fornecedor ${newSupplierName} cadastrado!`);
  };

  // Filtered Items by search query
  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return data.profiles;
    const q = searchQuery.toLowerCase();
    return data.profiles.filter(p => p.name.toLowerCase().includes(q) || p.materialFinish.toLowerCase().includes(q));
  }, [data.profiles, searchQuery]);

  const filteredConsumables = useMemo(() => {
    if (!searchQuery) return data.consumables;
    const q = searchQuery.toLowerCase();
    return data.consumables.filter(c => c.name.toLowerCase().includes(q));
  }, [data.consumables, searchQuery]);

  const filteredHardware = useMemo(() => {
    if (!searchQuery) return data.hardware;
    const q = searchQuery.toLowerCase();
    return data.hardware.filter(h => h.name.toLowerCase().includes(q));
  }, [data.hardware, searchQuery]);

  const activeSupplierObj = useMemo(() => {
    return data.suppliers.find(s => s.id === data.activeSupplierId);
  }, [data.suppliers, data.activeSupplierId]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>ET-006A • Gestão Comercial</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>💲 Central Inteligente de Preços</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Gerenciamento exclusivo de preços para Perfis, Consumíveis, Ferragens e Fornecedores. Atualize valores e troque de fornecedor para recalcular orçamentos em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            id="btn-atualizar-precos-rapido"
            type="button"
            onClick={handleOpenQuickUpdate}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition duration-150 shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            <span>🔄 Atualizar Preços Rápido</span>
          </button>
        </div>
      </div>

      {/* Supplier Price Table Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider block">
              Usar Tabela de Preços de:
            </span>
            <span className="text-sm font-bold text-slate-900 font-sans">
              {activeSupplierObj ? activeSupplierObj.name : 'Tabela Padrão Base'}
            </span>
          </div>
        </div>

        {/* Supplier Pill Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSupplierChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
              data.activeSupplierId === 'all'
                ? 'bg-slate-900 text-amber-400 border-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🏛️ Padrão
          </button>

          {data.suppliers.map((sup) => (
            <button
              key={sup.id}
              type="button"
              id={`btn-fornecedor-tabela-${sup.id}`}
              onClick={() => handleSupplierChange(sup.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition border cursor-pointer ${
                data.activeSupplierId === sup.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🏢 {sup.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsAddSupplierModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 transition cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            id="tab-central-perfis"
            type="button"
            onClick={() => setActiveTab('perfis')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'perfis'
                ? 'bg-slate-900 text-amber-400 shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Box className="w-4 h-4 text-amber-400" />
            <span>1. Perfis ({data.profiles.length})</span>
          </button>

          <button
            id="tab-central-consumiveis"
            type="button"
            onClick={() => setActiveTab('consumiveis')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'consumiveis'
                ? 'bg-slate-900 text-amber-400 shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Disc className="w-4 h-4 text-purple-400" />
            <span>2. Consumíveis ({data.consumables.length})</span>
          </button>

          <button
            id="tab-central-ferragens"
            type="button"
            onClick={() => setActiveTab('ferragens')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'ferragens'
                ? 'bg-slate-900 text-amber-400 shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>3. Ferragens ({data.hardware.length})</span>
          </button>

          <button
            id="tab-central-fornecedores"
            type="button"
            onClick={() => setActiveTab('fornecedores')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'fornecedores'
                ? 'bg-slate-900 text-amber-400 shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>4. Fornecedores ({data.suppliers.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-48 sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* TAB 1: PERFIS */}
      {activeTab === 'perfis' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Tabela de Preços de Perfis Metalon</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                  {filteredProfiles.length} Perfis
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                O valor por metro é calculado automaticamente dividindo o valor da barra de 6 metros (6000mm).
              </p>
            </div>

            <button
              id="btn-add-novo-perfil-preco"
              type="button"
              onClick={() => setIsAddProfileModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Perfil</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Perfil</th>
                  <th className="py-3 px-4 font-bold text-center">Acabamento</th>
                  <th className="py-3 px-4 font-bold text-center">Comprimento Bar</th>
                  <th className="py-3 px-4 font-bold text-right">Valor Barra (6m)</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / Metro</th>
                  <th className="py-3 px-4 font-bold text-center">Fornecedor</th>
                  <th className="py-3 px-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const isEditing = editingProfileId === p.id;
                  const isGalv = p.materialFinish === 'Galvanizado';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900 text-sm">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isGalv
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-200 text-slate-800 border border-slate-300'
                        }`}>
                          {p.materialFinish || 'Preto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {(p.defaultBarLengthMm / 1000).toFixed(1)} m ({p.defaultBarLengthMm}mm)
                      </td>
                      
                      {/* Bar Cost Cell */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-500 font-bold">R$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={editBarPrice}
                              onChange={(e) => setEditBarPrice(parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-white border-2 border-amber-500 rounded text-xs font-bold text-slate-900 focus:outline-none"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900 text-sm">
                            R$ {p.costPerBar.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Calculated Cost Per Meter */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          R$ {p.costPerMeter.toFixed(2)} /m
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-sans text-xs text-slate-600">
                        {p.supplierName || 'Fornecedor Geral'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineProfilePrice(p.id)}
                              className="bg-emerald-500 text-slate-950 p-1.5 rounded hover:bg-emerald-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Salvar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProfileId(null)}
                              className="bg-slate-200 text-slate-700 p-1.5 rounded hover:bg-slate-300 font-bold text-[10px] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfileId(p.id);
                              setEditBarPrice(p.costPerBar);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Editar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONSUMÍVEIS */}
      {activeTab === 'consumiveis' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <Disc className="w-4 h-4 text-purple-600" />
                <span>Insumos e Consumíveis de Oficina</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddConsumableModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Consumível</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredConsumables.map((c) => (
              <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-purple-300 transition">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm font-sans">{c.name}</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {c.unit || 'unid'}
                    </span>
                  </div>
                  {c.notes && (
                    <p className="text-xs text-slate-500 mb-2">{c.notes}</p>
                  )}
                  {c.supplierName && (
                    <p className="text-[11px] font-mono text-slate-400">Fornecedor: {c.supplierName}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-xs text-slate-500">Preço Atual:</span>
                  <span className="text-lg font-bold text-slate-900">
                    R$ {c.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FERRAGENS */}
      {activeTab === 'ferragens' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Ferragens, Acessórios e Fixadores</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddHardwareModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Ferragem</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {filteredHardware.map((h) => (
              <div key={h.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-blue-300 transition">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-sm font-sans">{h.name}</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {h.unit || 'unid'}
                    </span>
                  </div>
                  {h.notes && (
                    <p className="text-xs text-slate-500 mb-2">{h.notes}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
                  <span className="text-xs text-slate-500">Valor Unit.:</span>
                  <span className="text-base font-bold text-slate-900">
                    R$ {h.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FORNECEDORES */}
      {activeTab === 'fornecedores' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Cadastro de Fornecedores</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Fornecedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
            {data.suppliers.map((s) => (
              <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                    {data.activeSupplierId === s.id && (
                      <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300">
                        ✓ Tabela Ativa
                      </span>
                    )}
                  </div>
                  {s.phone && <p className="text-xs text-slate-600">📞 {s.phone}</p>}
                  {s.email && <p className="text-xs text-slate-600">✉️ {s.email}</p>}
                  {s.address && <p className="text-xs text-slate-600 mt-1">📍 {s.address}</p>}
                  {s.notes && <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">{s.notes}</p>}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSupplierChange(s.id)}
                    className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white text-xs font-bold font-mono px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Usar Preços deste Fornecedor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: 🔄 ATUALIZAÇÃO RÁPIDA DE PREÇOS */}
      {isQuickUpdateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-mono">🔄 Atualização Rápida de Preços</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickUpdateOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
              <p className="text-slate-600 font-sans text-xs">
                Atualize diretamente o valor da barra (6 metros) de cada perfil. Os valores por metro e o Orçamento Inteligente serão atualizados imediatamente.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {data.profiles.map((p) => {
                  const val = quickPrices[p.id] !== undefined ? quickPrices[p.id] : p.costPerBar;
                  const perMeter = (val / 6).toFixed(2);

                  return (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition">
                      <div>
                        <span className="font-bold text-slate-900 font-sans text-sm block">{p.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {p.materialFinish || 'Preto'} • R$ {perMeter}/m
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={val}
                          onChange={(e) => {
                            const newV = parseFloat(e.target.value) || 0;
                            setQuickPrices(prev => ({ ...prev, [p.id]: newV }));
                          }}
                          className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsQuickUpdateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPrices}
                className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todos os Preços</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR NOVO PERFIL */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateProfile} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase font-mono">Cadastrar Novo Perfil</h3>
              <button type="button" onClick={() => setIsAddProfileModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Nome do Perfil</label>
              <input
                type="text"
                required
                placeholder="Ex: Metalon 100x50"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Acabamento</label>
                <select
                  value={newProfileFinish}
                  onChange={(e) => setNewProfileFinish(e.target.value as 'Preto' | 'Galvanizado')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Preto">Preto</option>
                  <option value="Galvanizado">Galvanizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Valor Barra (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newProfileBarCost}
                  onChange={(e) => setNewProfileBarCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddProfileModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Salvar Perfil</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR CONSUMÍVEL */}
      {isAddConsumableModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateConsumable} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase font-mono">Adicionar Consumível</h3>
              <button type="button" onClick={() => setIsAddConsumableModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Nome do Item</label>
              <input
                type="text"
                required
                placeholder="Ex: Disco de Desbaste 7 polegadas"
                value={newConsumableName}
                onChange={(e) => setNewConsumableName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newConsumablePrice}
                  onChange={(e) => setNewConsumablePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Unidade</label>
                <input
                  type="text"
                  value={newConsumableUnit}
                  onChange={(e) => setNewConsumableUnit(e.target.value)}
                  placeholder="unid, lata, kg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddConsumableModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Salvar Item</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR FERRAGEM */}
      {isAddHardwareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateHardware} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase font-mono">Adicionar Ferragem</h3>
              <button type="button" onClick={() => setIsAddHardwareModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Nome da Ferragem</label>
              <input
                type="text"
                required
                placeholder="Ex: Fechadura Digital Elétrica"
                value={newHardwareName}
                onChange={(e) => setNewHardwareName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newHardwarePrice}
                  onChange={(e) => setNewHardwarePrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Unidade</label>
                <input
                  type="text"
                  value={newHardwareUnit}
                  onChange={(e) => setNewHardwareUnit(e.target.value)}
                  placeholder="par, unid, m"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddHardwareModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Salvar Ferragem</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADICIONAR FORNECEDOR */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateSupplier} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase font-mono">Cadastrar Fornecedor</h3>
              <button type="button" onClick={() => setIsAddSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Nome do Fornecedor</label>
              <input
                type="text"
                required
                placeholder="Ex: Aço & Cia Ltda"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">Telefone</label>
                <input
                  type="text"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  placeholder="(11) 99999-8888"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1">E-mail</label>
                <input
                  type="email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  placeholder="vendas@fornecedor.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddSupplierModalOpen(false)} className="px-3 py-2 text-slate-600 font-bold">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Cadastrar Fornecedor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
