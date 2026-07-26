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
  AlertTriangle,
  Eye,
  Wrench,
  Flame,
  Scissors,
  FileText,
  Truck,
  Cpu,
  Printer
} from 'lucide-react';
import { MaterialProfile, ProfileCategory, MaterialUnit, CompatibleProcesses } from '../types';
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

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'tecnica' | 'processos' | 'comercial'>('geral');
  const [editingProfile, setEditingProfile] = useState<MaterialProfile | null>(null);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState<MaterialProfile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Inspector Datasheet Modal
  const [inspectorProfile, setInspectorProfile] = useState<MaterialProfile | null>(null);

  // Validation report modal state
  const [validationReport, setValidationReport] = useState<ReturnType<typeof runMaterialsLibraryValidationTests> | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    // Geral
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
    notes: '',

    // FASE 1: Técnica
    mechanicalStrength: 'ASTM A36 (Tensão Escoamento 250 MPa)',
    densityGcm3: '7.85',
    specificWeightKgm3: '7850',
    commercialThicknesses: '1.2 mm (#18), 1.5 mm (#16), 2.0 mm (#14), 3.0 mm (#11)',
    availableFinishes: 'Bruto / Preto, Pintado / Primer, Galvanizado',
    isGalvanized: false,
    isStainless: false,
    isAluminum: false,
    minBendRadiusMm: '3',
    technicalNotes: '',

    // FASE 2: Processos Compatíveis
    compatibleProcesses: {
      weldingMig: true,
      weldingTig: true,
      weldingStick: true,
      bolting: true,
      riveting: true,
      plasmaCutting: true,
      laserCutting: true,
      oxyfuelCutting: true,
      sawing: true,
      shearing: true,
      bending: true
    } as CompatibleProcesses,

    // FASE 3: Comercial
    internalCode: 'MAT-MET-3030-15',
    mainSupplier: 'Gerdau',
    alternativeSuppliers: 'ArcelorMittal, AçoCearense',
    leadTimeDays: '3',
    purchaseUnit: 'barra',
    commercialNotes: ''
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

    let density = parseFloat(formData.densityGcm3);
    if (isNaN(density) || density <= 0) {
      density = formData.isAluminum ? 2.70 : formData.isStainless ? 8.00 : 7.85;
    }

    if (w > 0 && h > 0 && t > 0) {
      if (formData.category.startsWith('Chapa')) {
        const weightKgPerM2 = t * density;
        setFormData(prev => ({ ...prev, weightKgPerMeter: weightKgPerM2.toFixed(2) }));
      } else if (formData.category === 'Tubo Redondo' || formData.category === 'Vergalhão' || formData.category === 'Barra Maciça Redonda') {
        if (formData.category === 'Tubo Redondo') {
          const R = w / 2;
          const r = Math.max(0, R - t);
          const areaMm2 = Math.PI * (R * R - r * r);
          const weight = areaMm2 * 1000 * (density * 0.000001);
          setFormData(prev => ({ ...prev, weightKgPerMeter: weight.toFixed(2) }));
        } else {
          const R = w / 2;
          const areaMm2 = Math.PI * R * R;
          const weight = areaMm2 * 1000 * (density * 0.000001);
          setFormData(prev => ({ ...prev, weightKgPerMeter: weight.toFixed(2) }));
        }
      } else {
        const perimeterMm = 2 * (w + h);
        const areaMm2 = perimeterMm * t;
        const weightKgPerMeter = areaMm2 * 1000 * (density * 0.000001);
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
    setActiveTab('geral');
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
      notes: '',

      mechanicalStrength: 'ASTM A36 (Tensão Escoamento 250 MPa)',
      densityGcm3: '7.85',
      specificWeightKgm3: '7850',
      commercialThicknesses: '1.2 mm (#18), 1.5 mm (#16), 2.0 mm (#14), 3.0 mm (#11)',
      availableFinishes: 'Bruto / Preto, Pintado / Primer, Galvanizado',
      isGalvanized: false,
      isStainless: false,
      isAluminum: false,
      minBendRadiusMm: '3',
      technicalNotes: '',

      compatibleProcesses: {
        weldingMig: true,
        weldingTig: true,
        weldingStick: true,
        bolting: true,
        riveting: true,
        plasmaCutting: true,
        laserCutting: true,
        oxyfuelCutting: true,
        sawing: true,
        shearing: true,
        bending: true
      },

      internalCode: 'MAT-MET-3030-15',
      mainSupplier: 'Gerdau',
      alternativeSuppliers: 'ArcelorMittal, AçoCearense',
      leadTimeDays: '3',
      purchaseUnit: 'barra',
      commercialNotes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal for EDIT profile
  const handleOpenEditModal = (profile: MaterialProfile) => {
    setEditingProfile(profile);
    setActiveTab('geral');
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
      notes: profile.notes || '',

      mechanicalStrength: profile.mechanicalStrength || 'ASTM A36 (Tensão Escoamento 250 MPa)',
      densityGcm3: (profile.densityGcm3 || 7.85).toString(),
      specificWeightKgm3: (profile.specificWeightKgm3 || 7850).toString(),
      commercialThicknesses: (profile.commercialThicknesses || ['1.2 mm', '1.5 mm', '2.0 mm', '3.0 mm']).join(', '),
      availableFinishes: (profile.availableFinishes || ['Bruto / Preto', 'Galvanizado', 'Pintado / Primer']).join(', '),
      isGalvanized: Boolean(profile.isGalvanized),
      isStainless: Boolean(profile.isStainless),
      isAluminum: Boolean(profile.isAluminum),
      minBendRadiusMm: (profile.minBendRadiusMm || Math.round(profile.wallThicknessMm * 2)).toString(),
      technicalNotes: profile.technicalNotes || '',

      compatibleProcesses: {
        weldingMig: profile.compatibleProcesses?.weldingMig ?? true,
        weldingTig: profile.compatibleProcesses?.weldingTig ?? true,
        weldingStick: profile.compatibleProcesses?.weldingStick ?? true,
        bolting: profile.compatibleProcesses?.bolting ?? true,
        riveting: profile.compatibleProcesses?.riveting ?? true,
        plasmaCutting: profile.compatibleProcesses?.plasmaCutting ?? true,
        laserCutting: profile.compatibleProcesses?.laserCutting ?? true,
        oxyfuelCutting: profile.compatibleProcesses?.oxyfuelCutting ?? true,
        sawing: profile.compatibleProcesses?.sawing ?? true,
        shearing: profile.compatibleProcesses?.shearing ?? true,
        bending: profile.compatibleProcesses?.bending ?? true
      },

      internalCode: profile.internalCode || `MAT-${profile.category.substring(0, 3).toUpperCase()}-${profile.widthMm}${profile.heightMm}`,
      mainSupplier: profile.mainSupplier || profile.supplier || profile.manufacturer || 'Gerdau',
      alternativeSuppliers: (profile.alternativeSuppliers || ['ArcelorMittal', 'AçoCearense']).join(', '),
      leadTimeDays: (profile.leadTimeDays || 3).toString(),
      purchaseUnit: profile.purchaseUnit || profile.unit || 'barra',
      commercialNotes: profile.commercialNotes || ''
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

    // Parse array string fields
    const commercialThicknesses = formData.commercialThicknesses
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const availableFinishes = formData.availableFinishes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const alternativeSuppliers = formData.alternativeSuppliers
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const profileData: Partial<MaterialProfile> = {
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
      notes: formData.notes.trim() || undefined,

      // FASE 1: Propriedades Técnicas
      mechanicalStrength: formData.mechanicalStrength.trim() || 'ASTM A36 (Tensão Escoamento 250 MPa)',
      densityGcm3: parseFloat(formData.densityGcm3) || 7.85,
      specificWeightKgm3: parseFloat(formData.specificWeightKgm3) || 7850,
      commercialThicknesses: commercialThicknesses.length > 0 ? commercialThicknesses : ['1.2 mm', '1.5 mm', '2.0 mm'],
      availableFinishes: availableFinishes.length > 0 ? availableFinishes : ['Bruto / Preto', 'Galvanizado', 'Pintado / Primer'],
      isGalvanized: formData.isGalvanized,
      isStainless: formData.isStainless,
      isAluminum: formData.isAluminum,
      minBendRadiusMm: parseFloat(formData.minBendRadiusMm) || Math.round(parseFloat(formData.wallThicknessMm) * 2),
      technicalNotes: formData.technicalNotes.trim() || undefined,

      // FASE 2: Processos Compatíveis
      compatibleProcesses: formData.compatibleProcesses,

      // FASE 3: Informações Comerciais
      internalCode: formData.internalCode.trim() || `MAT-${formData.category.substring(0, 3).toUpperCase()}-${formData.widthMm}${formData.heightMm}`,
      mainSupplier: formData.mainSupplier.trim() || formData.supplier.trim() || 'Gerdau',
      alternativeSuppliers: alternativeSuppliers.length > 0 ? alternativeSuppliers : ['ArcelorMittal'],
      leadTimeDays: parseInt(formData.leadTimeDays, 10) || 3,
      purchaseUnit: formData.purchaseUnit || formData.unit,
      commercialNotes: formData.commercialNotes.trim() || undefined
    };

    if (editingProfile) {
      updateMaterialProfile(editingProfile.id, profileData);
    } else {
      addMaterialProfile(profileData as any);
    }

    setIsModalOpen(false);
  };

  // Toggle compatible process flag in form
  const toggleProcess = (key: keyof CompatibleProcesses) => {
    setFormData(prev => ({
      ...prev,
      compatibleProcesses: {
        ...prev.compatibleProcesses,
        [key]: !prev.compatibleProcesses[key]
      }
    }));
  };

  // Filtered profiles list
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Archive filter
      if (!showArchived && profile.isArchived) return false;
      if (showArchived && !profile.isArchived) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = profile.name.toLowerCase().includes(query);
        const matchCategory = (profile.category || '').toLowerCase().includes(query);
        const matchManufacturer = (profile.manufacturer || profile.supplier || '').toLowerCase().includes(query);
        const matchInternalCode = (profile.internalCode || '').toLowerCase().includes(query);
        const matchStrength = (profile.mechanicalStrength || '').toLowerCase().includes(query);
        const matchNotes = (profile.notes || '').toLowerCase().includes(query);
        const matchMeasures = `${profile.widthMm}x${profile.heightMm}`.includes(query);

        if (!matchName && !matchCategory && !matchManufacturer && !matchNotes && !matchMeasures && !matchInternalCode && !matchStrength) {
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
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>ET-020.2 • Repositório Universal Inteligente</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              18 Categorias Oficiais
            </span>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              11 Processos Compatíveis
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white flex items-center gap-3">
            <span>📦 Biblioteca Universal de Propriedades dos Materiais</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-3xl">
            Fonte oficial de engenharia, especificações técnicas, parâmetros de corte, soldabilidade, conformação e dados comerciais de estoque da serralheria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-executar-homologacao-materiais"
            type="button"
            onClick={handleRunValidation}
            className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-mono font-bold px-4 py-3 rounded-xl transition duration-150 shadow-md flex items-center gap-2 text-xs cursor-pointer"
            title="Executar suíte de validação do repositório inteligente"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Homologação ET-020.2</span>
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
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Perfis Cadastrados</p>
            <p className="text-lg font-bold font-mono text-slate-950">{activeProfiles.length} materiais</p>
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
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Processos Suportados</p>
            <p className="text-lg font-bold font-mono text-purple-900">11 Operações</p>
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
            placeholder="Buscar por nome, código, liga, processo..."
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
            <span>Catálogo Oficial de Propriedades ({showArchived ? 'Arquivados' : 'Ativos'})</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Exibindo <strong className="text-slate-900">{filteredProfiles.length}</strong> materiais
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
                  <th className="py-3 px-4 font-bold">Perfil & Liga Técnica</th>
                  <th className="py-3 px-4 font-bold">Categoria & Código</th>
                  <th className="py-3 px-4 font-bold text-center">Dimensões (mm)</th>
                  <th className="py-3 px-4 font-bold text-right">Peso Linear</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / m</th>
                  <th className="py-3 px-4 font-bold text-right">Valor / Barra</th>
                  <th className="py-3 px-4 font-bold">Fornecedor & Prazo</th>
                  <th className="py-3 px-4 font-bold text-center min-w-[160px]">Ações & Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredProfiles.map((profile) => (
                  <tr 
                    key={profile.id}
                    className={`hover:bg-slate-50/80 transition duration-150 group ${profile.isArchived ? 'bg-slate-50/60 opacity-75' : ''}`}
                  >
                    {/* Name & Badges */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {profile.name}
                          </span>
                          
                          {profile.isStainless ? (
                            <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                              Inox
                            </span>
                          ) : profile.isAluminum ? (
                            <span className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                              Alumínio
                            </span>
                          ) : profile.isGalvanized ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                              Galvanizado
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                              Aço Carbono
                            </span>
                          )}

                          {profile.isDefault && (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>Padrão</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 font-mono line-clamp-1">
                          ⚡ {profile.mechanicalStrength || 'ASTM A36 (250 MPa)'} • {profile.densityGcm3 || 7.85} g/cm³
                        </p>
                      </div>
                    </td>

                    {/* Category & Internal Code */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-block bg-slate-100 text-slate-800 text-[11px] font-medium px-2 py-0.5 rounded-md border border-slate-200 w-fit">
                          {profile.category || 'Metalon'}
                        </span>
                        {profile.internalCode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            Cód: {profile.internalCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dimensions */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      {profile.widthMm} × {profile.heightMm} mm
                      <span className="block text-[10px] font-normal text-slate-400">
                        parede: {profile.wallThicknessMm} mm
                      </span>
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

                    {/* Manufacturer / Supplier & Lead Time */}
                    <td className="py-3.5 px-4 font-sans text-slate-600">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{profile.mainSupplier || profile.manufacturer || profile.supplier || 'Gerdau'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Truck className="w-3 h-3 text-amber-500" />
                          <span>Entrega: {profile.leadTimeDays || 3} dias úteis</span>
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1">
                        {/* Spec Inspector Button */}
                        <button
                          id={`btn-ficha-tecnica-${profile.id}`}
                          type="button"
                          onClick={() => setInspectorProfile(profile)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 font-mono font-bold rounded-lg border border-amber-500/30 transition cursor-pointer flex items-center gap-1 text-[10px]"
                          title="Visualizar Ficha Técnica Completa"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ficha</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          id={`btn-editar-perfil-${profile.id}`}
                          type="button"
                          onClick={() => handleOpenEditModal(profile)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Editar propriedades"
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

      {/* CREATE / EDIT TABBED MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="bg-amber-500 text-slate-950 p-2 rounded-lg font-bold">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-display">
                    {editingProfile ? `Editar Material: ${editingProfile.name}` : '➕ Novo Perfil de Material'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ET-020.2 • Ficha Técnica, Propriedades Mecânicas e Comerciais
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

            {/* TAB NAVIGATION BAR */}
            <div className="flex border-b border-slate-200 bg-slate-100/80 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
              <button
                id="tab-btn-geral"
                type="button"
                onClick={() => setActiveTab('geral')}
                className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  activeTab === 'geral'
                    ? 'bg-white border-slate-200 text-amber-600 font-bold -mb-px'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>1. Dados Gerais</span>
              </button>

              <button
                id="tab-btn-tecnica"
                type="button"
                onClick={() => setActiveTab('tecnica')}
                className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  activeTab === 'tecnica'
                    ? 'bg-white border-slate-200 text-amber-600 font-bold -mb-px'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>2. Propriedades Técnicas</span>
              </button>

              <button
                id="tab-btn-processos"
                type="button"
                onClick={() => setActiveTab('processos')}
                className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  activeTab === 'processos'
                    ? 'bg-white border-slate-200 text-amber-600 font-bold -mb-px'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>3. Processos (11)</span>
              </button>

              <button
                id="tab-btn-comercial"
                type="button"
                onClick={() => setActiveTab('comercial')}
                className={`px-4 py-2.5 rounded-t-xl transition flex items-center gap-1.5 border-t border-x cursor-pointer ${
                  activeTab === 'comercial'
                    ? 'bg-white border-slate-200 text-amber-600 font-bold -mb-px'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>4. Informações Comerciais</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* TAB 1: DADOS GERAIS */}
              {activeTab === 'geral' && (
                <div className="space-y-4">
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
                          <span>Auto Calcular</span>
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
                        Comprimento Padrão da Barra (mm) <span className="text-red-500">*</span>
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
                        Fabricante Principal
                      </label>
                      <input
                        id="input-perfil-fabricante"
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="Ex: Gerdau, ArcelorMittal, Vallourec..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Observações Gerais
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
                </div>
              )}

              {/* TAB 2: PROPRIEDADES TÉCNICAS (FASE 1) */}
              {activeTab === 'tecnica' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Ficha Técnica de Engenharia (FASE 1):</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Especifique a liga, resistência mecânica, tratamentos de superfície e raio mínimo de dobra do perfil.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Resistência Mecânica
                      </label>
                      <input
                        id="input-tecnica-resistencia"
                        type="text"
                        value={formData.mechanicalStrength}
                        onChange={(e) => setFormData({ ...formData, mechanicalStrength: e.target.value })}
                        placeholder="Ex: ASTM A36 (Escoamento 250 MPa), SAE 1020"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Raio Mínimo de Dobra (mm)
                      </label>
                      <input
                        id="input-tecnica-raio-dobra"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.minBendRadiusMm}
                        onChange={(e) => setFormData({ ...formData, minBendRadiusMm: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Densidade (g/cm³)
                      </label>
                      <input
                        id="input-tecnica-densidade"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.densityGcm3}
                        onChange={(e) => setFormData({ ...formData, densityGcm3: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Peso Específico (kg/m³)
                      </label>
                      <input
                        id="input-tecnica-peso-especifico"
                        type="number"
                        step="10"
                        min="0"
                        value={formData.specificWeightKgm3}
                        onChange={(e) => setFormData({ ...formData, specificWeightKgm3: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Material Flags */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <p className="text-[11px] font-bold text-slate-700 font-mono uppercase">Tipo de Material / Liga</p>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={formData.isGalvanized}
                          onChange={(e) => setFormData({ ...formData, isGalvanized: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Galvanizado</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={formData.isStainless}
                          onChange={(e) => setFormData({ ...formData, isStainless: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Inox</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={formData.isAluminum}
                          onChange={(e) => setFormData({ ...formData, isAluminum: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span>Alumínio</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Espessuras Comerciais Disponíveis (Separadas por vírgula)
                    </label>
                    <input
                      id="input-tecnica-espessuras-comerciais"
                      type="text"
                      value={formData.commercialThicknesses}
                      onChange={(e) => setFormData({ ...formData, commercialThicknesses: e.target.value })}
                      placeholder="Ex: 1.2 mm (#18), 1.5 mm (#16), 2.0 mm (#14), 3.0 mm (#11)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Acabamentos Disponíveis (Separados por vírgula)
                    </label>
                    <input
                      id="input-tecnica-acabamentos"
                      type="text"
                      value={formData.availableFinishes}
                      onChange={(e) => setFormData({ ...formData, availableFinishes: e.target.value })}
                      placeholder="Ex: Bruto / Preto, Decapado, Galvanizado a Fogo, Pintado / Primer"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Observações Técnicas Adicionais
                    </label>
                    <textarea
                      id="textarea-tecnica-obs"
                      rows={2}
                      value={formData.technicalNotes}
                      onChange={(e) => setFormData({ ...formData, technicalNotes: e.target.value })}
                      placeholder="Ex: Requer resfriamento controlado na soldagem MIG..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PROCESSOS COMPATÍVEIS (FASE 2) */}
              {activeTab === 'processos' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Processos de Fabricação Compatíveis (FASE 2):</strong>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Selecione as operações autorizadas para este material. O motor de corte e homologação utilizará estas permissões.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'weldingMig', label: 'Solda MIG', icon: Flame },
                      { key: 'weldingTig', label: 'Solda TIG', icon: Flame },
                      { key: 'weldingStick', label: 'Eletrodo Revestido', icon: Flame },
                      { key: 'bolting', label: 'Parafusamento', icon: Wrench },
                      { key: 'riveting', label: 'Rebitagem', icon: Wrench },
                      { key: 'plasmaCutting', label: 'Corte Plasma', icon: Scissors },
                      { key: 'laserCutting', label: 'Corte Laser', icon: Scissors },
                      { key: 'oxyfuelCutting', label: 'Corte Oxicorte', icon: Scissors },
                      { key: 'sawing', label: 'Serra Mecânica', icon: Scissors },
                      { key: 'shearing', label: 'Guilhotina', icon: Scissors },
                      { key: 'bending', label: 'Dobradeira', icon: Layers },
                    ].map(({ key, label, icon: IconComponent }) => {
                      const isChecked = Boolean(formData.compatibleProcesses[key as keyof CompatibleProcesses]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleProcess(key as keyof CompatibleProcesses)}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-4 h-4 ${isChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="text-xs">{label}</span>
                          </div>
                          {isChecked ? (
                            <Check className="w-4 h-4 text-emerald-600 font-bold" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: INFORMAÇÕES COMERCIAIS (FASE 3) */}
              {activeTab === 'comercial' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Informações Comerciais e Estoque (FASE 3):</strong>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Forneça códigos de controle interno, fornecedores cadastrados e prazos logísticos.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Código Interno de Estoque
                      </label>
                      <input
                        id="input-comercial-codigo-interno"
                        type="text"
                        value={formData.internalCode}
                        onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                        placeholder="Ex: MAT-MET-3030-15"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Unidade de Compra
                      </label>
                      <input
                        id="input-comercial-unidade-compra"
                        type="text"
                        value={formData.purchaseUnit}
                        onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })}
                        placeholder="Ex: barra, m, kg, m², chapa, fardo"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Fornecedor Principal
                      </label>
                      <input
                        id="input-comercial-fornecedor-principal"
                        type="text"
                        value={formData.mainSupplier}
                        onChange={(e) => setFormData({ ...formData, mainSupplier: e.target.value })}
                        placeholder="Ex: Gerdau Distribuição"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                        Prazo Médio de Entrega (Dias)
                      </label>
                      <input
                        id="input-comercial-prazo-entrega"
                        type="number"
                        step="1"
                        min="1"
                        value={formData.leadTimeDays}
                        onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Fornecedores Alternativos (Separados por vírgula)
                    </label>
                    <input
                      id="input-comercial-fornecedores-alt"
                      type="text"
                      value={formData.alternativeSuppliers}
                      onChange={(e) => setFormData({ ...formData, alternativeSuppliers: e.target.value })}
                      placeholder="Ex: ArcelorMittal, AçoCearense, Distribuidora Tubos Ibirá"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 font-mono mb-1">
                      Observações Comerciais
                    </label>
                    <textarea
                      id="textarea-comercial-obs"
                      rows={2}
                      value={formData.commercialNotes}
                      onChange={(e) => setFormData({ ...formData, commercialNotes: e.target.value })}
                      placeholder="Ex: Lote mínimo de compra: 10 barras..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

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

      {/* INSPECTOR MODAL (FICHA TÉCNICA COMPLETA) */}
      {inspectorProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase">Ficha Técnica de Engenharia</span>
                    {inspectorProfile.internalCode && (
                      <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                        Cód: {inspectorProfile.internalCode}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white font-display">
                    {inspectorProfile.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectorProfile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto font-sans">
              
              {/* Basic Specs Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Categoria</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{inspectorProfile.category}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Dimensão / Parede</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{inspectorProfile.widthMm}x{inspectorProfile.heightMm} mm ({inspectorProfile.wallThicknessMm}mm)</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Peso Linear</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{inspectorProfile.weightKgPerMeter} kg/m</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold font-mono">Valor Comercial</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">R$ {inspectorProfile.costPerMeter.toFixed(2)} / m</p>
                </div>
              </div>

              {/* FASE 1: Propriedades Técnicas */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span>1. Propriedades Técnicas & Mecânicas</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Resistência Mecânica:</span>
                    <strong className="text-slate-900 font-mono">{inspectorProfile.mechanicalStrength || 'ASTM A36 (250 MPa)'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Liga / Material:</span>
                    <span className="font-bold">
                      {inspectorProfile.isStainless ? 'Aço Inoxidável (Inox)' : inspectorProfile.isAluminum ? 'Alumínio' : inspectorProfile.isGalvanized ? 'Aço Galvanizado' : 'Aço Carbono Standard'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Densidade:</span>
                    <strong className="text-slate-900 font-mono">{inspectorProfile.densityGcm3 || 7.85} g/cm³</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Peso Específico:</span>
                    <strong className="text-slate-900 font-mono">{inspectorProfile.specificWeightKgm3 || 7850} kg/m³</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Raio Mínimo de Dobra:</span>
                    <strong className="text-slate-900 font-mono">{inspectorProfile.minBendRadiusMm || 3} mm</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Espessuras Comerciais:</span>
                    <span className="text-slate-800 font-mono">{(inspectorProfile.commercialThicknesses || ['1.2 mm', '1.5 mm', '2.0 mm']).join(', ')}</span>
                  </div>
                </div>

                {inspectorProfile.availableFinishes && inspectorProfile.availableFinishes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 font-mono block text-[10px] mb-1">Acabamentos Disponíveis:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectorProfile.availableFinishes.map((f, i) => (
                        <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-slate-700">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* FASE 2: Processos Compatíveis */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Wrench className="w-4 h-4 text-purple-600" />
                  <span>2. Compatibilidade com Processos de Fabricação</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'weldingMig', label: 'Solda MIG' },
                    { key: 'weldingTig', label: 'Solda TIG' },
                    { key: 'weldingStick', label: 'Eletrodo Revestido' },
                    { key: 'bolting', label: 'Parafusamento' },
                    { key: 'riveting', label: 'Rebitagem' },
                    { key: 'plasmaCutting', label: 'Corte Plasma' },
                    { key: 'laserCutting', label: 'Corte Laser' },
                    { key: 'oxyfuelCutting', label: 'Corte Oxicorte' },
                    { key: 'sawing', label: 'Serra Mecânica' },
                    { key: 'shearing', label: 'Guilhotina' },
                    { key: 'bending', label: 'Dobradeira' },
                  ].map(({ key, label }) => {
                    const isOk = inspectorProfile.compatibleProcesses?.[key as keyof CompatibleProcesses] ?? true;
                    return (
                      <div 
                        key={key}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between ${
                          isOk ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                        }`}
                      >
                        <span>{label}</span>
                        {isOk ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FASE 3: Informações Comerciais */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>3. Informações Comerciais & Logística</span>
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Fabricante Oficial:</span>
                    <strong className="text-slate-900">{inspectorProfile.manufacturer || inspectorProfile.supplier || 'Gerdau'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Fornecedor Principal:</span>
                    <strong className="text-slate-900">{inspectorProfile.mainSupplier || inspectorProfile.supplier || 'Gerdau'}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Prazo de Entrega:</span>
                    <strong className="text-slate-900 font-mono">{inspectorProfile.leadTimeDays || 3} dias úteis</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 font-mono block text-[10px]">Unidade de Compra:</span>
                    <strong className="text-slate-900 font-mono capitalize">{inspectorProfile.purchaseUnit || inspectorProfile.unit || 'barra'}</strong>
                  </div>
                </div>

                {inspectorProfile.alternativeSuppliers && inspectorProfile.alternativeSuppliers.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500 font-mono block text-[10px]">Fornecedores Alternativos:</span>
                    <span className="text-slate-800 font-semibold">{inspectorProfile.alternativeSuppliers.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectorProfile(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Fechar Ficha
                </button>
              </div>

            </div>
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
                    Relatório de Homologação ET-020.2
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Validação da Biblioteca Universal de Propriedades dos Materiais
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
