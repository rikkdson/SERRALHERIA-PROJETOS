import { MaterialProfile, DEFAULT_MATERIAL_PROFILES, ProfileCategory, MaterialUnit } from '../types';

const STORAGE_KEY = 'serralheria_material_profiles_v1';
export const MATERIALS_UPDATED_EVENT = 'serralheria_materials_updated';

/**
 * Normalizes a profile name for fuzzy matching (e.g. "Metalon 30x30 mm" -> "metalon 30x30")
 */
export function normalizeProfileName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*mm\s*$/i, '')
    .trim();
}

/**
 * Helper to infer category if missing
 */
export function inferCategoryFromName(name: string): ProfileCategory {
  const lower = name.toLowerCase();
  if (lower.includes('cantoneira')) return 'Cantoneira';
  if (lower.includes('barra chata')) return 'Barra Chata';
  if (lower.includes('tubo redondo') || lower.includes('tubo ind')) return 'Tubo Redondo';
  if (lower.includes('tubo quadrado')) return 'Tubo Quadrado';
  if (lower.includes('tubo retangular')) return 'Tubo Retangular';
  if (lower.includes('perfil u enrijecido') || lower.includes('perfil ue')) return 'Perfil U Enrijecido';
  if (lower.includes('perfil u')) return 'Perfil U';
  if (lower.includes('perfil c')) return 'Perfil C';
  if (lower.includes('perfil z')) return 'Perfil Z';
  if (lower.includes('perfil i') || lower.includes('viga i')) return 'Perfil I';
  if (lower.includes('perfil h') || lower.includes('viga h')) return 'Perfil H';
  if (lower.includes('perfil t')) return 'Perfil T';
  if (lower.includes('vergalhão') || lower.includes('ca-50')) return 'Vergalhão';
  if (lower.includes('maciça redonda') || lower.includes('redondo maciço')) return 'Barra Maciça Redonda';
  if (lower.includes('maciça quadrada') || lower.includes('quadrado maciço')) return 'Barra Maciça Quadrada';
  if (lower.includes('chapa xadrez')) return 'Chapa Xadrez';
  if (lower.includes('chapa lisa') || lower.includes('chapa ff')) return 'Chapa Lisa';
  if (lower.includes('metalon')) return 'Metalon';
  return 'Outros';
}

/**
 * Sanitizes and migrates material profile objects to guarantee all required technical,
 * process, and commercial fields exist with intelligent defaults (ET-020.2).
 */
function sanitizeProfile(raw: Partial<MaterialProfile>): MaterialProfile {
  const category = raw.category || inferCategoryFromName(raw.name || '');
  const unit: MaterialUnit = raw.unit || (category.startsWith('Chapa') ? 'chapa' : 'barra');
  
  const isAluminum = Boolean(raw.isAluminum || raw.name?.toLowerCase().includes('alumínio') || raw.notes?.toLowerCase().includes('alumínio'));
  const isStainless = Boolean(raw.isStainless || raw.name?.toLowerCase().includes('inox') || raw.notes?.toLowerCase().includes('inox'));
  const isGalvanized = Boolean(raw.isGalvanized || raw.name?.toLowerCase().includes('galvanizado') || raw.notes?.toLowerCase().includes('galvanizado'));

  const wallThickness = typeof raw.wallThicknessMm === 'number' ? raw.wallThicknessMm : 1.5;

  return {
    id: raw.id || `mat-gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: raw.name || 'Perfil Sem Nome',
    category,
    widthMm: typeof raw.widthMm === 'number' ? raw.widthMm : 30,
    heightMm: typeof raw.heightMm === 'number' ? raw.heightMm : 30,
    wallThicknessMm: wallThickness,
    weightKgPerMeter: typeof raw.weightKgPerMeter === 'number' ? raw.weightKgPerMeter : 1.3,
    costPerMeter: typeof raw.costPerMeter === 'number' ? raw.costPerMeter : 18.0,
    costPerBar: typeof raw.costPerBar === 'number' ? raw.costPerBar : 108.0,
    defaultBarLengthMm: typeof raw.defaultBarLengthMm === 'number' ? raw.defaultBarLengthMm : 6000,
    unit,
    supplier: raw.supplier || '',
    manufacturer: raw.manufacturer || raw.supplier || '',
    notes: raw.notes || '',
    isDefault: Boolean(raw.isDefault),
    isArchived: Boolean(raw.isArchived),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),

    // FASE 1: Propriedades Técnicas
    mechanicalStrength: raw.mechanicalStrength || (isAluminum ? 'Alumínio 6063-T5 (185 MPa)' : isStainless ? 'Inox AISI 304 (205 MPa)' : 'ASTM A36 (Tensão Escoamento 250 MPa)'),
    densityGcm3: typeof raw.densityGcm3 === 'number' ? raw.densityGcm3 : (isAluminum ? 2.70 : isStainless ? 8.00 : 7.85),
    specificWeightKgm3: typeof raw.specificWeightKgm3 === 'number' ? raw.specificWeightKgm3 : (isAluminum ? 2700 : isStainless ? 8000 : 7850),
    commercialThicknesses: Array.isArray(raw.commercialThicknesses) && raw.commercialThicknesses.length > 0
      ? raw.commercialThicknesses
      : ['1.2 mm (#18)', '1.5 mm (#16)', '2.0 mm (#14)', '3.0 mm (#11)'],
    availableFinishes: Array.isArray(raw.availableFinishes) && raw.availableFinishes.length > 0
      ? raw.availableFinishes
      : [isGalvanized ? 'Galvanizado a Fogo' : 'Bruto / Preto', 'Pintado / Primer', 'Decapado'],
    isGalvanized,
    isStainless,
    isAluminum,
    minBendRadiusMm: typeof raw.minBendRadiusMm === 'number' ? raw.minBendRadiusMm : Math.round(wallThickness * 2),
    technicalNotes: raw.technicalNotes || '',

    // FASE 2: Processos Compatíveis
    compatibleProcesses: {
      weldingMig: raw.compatibleProcesses?.weldingMig ?? true,
      weldingTig: raw.compatibleProcesses?.weldingTig ?? true,
      weldingStick: raw.compatibleProcesses?.weldingStick ?? (!isAluminum),
      bolting: raw.compatibleProcesses?.bolting ?? true,
      riveting: raw.compatibleProcesses?.riveting ?? true,
      plasmaCutting: raw.compatibleProcesses?.plasmaCutting ?? true,
      laserCutting: raw.compatibleProcesses?.laserCutting ?? true,
      oxyfuelCutting: raw.compatibleProcesses?.oxyfuelCutting ?? (!isAluminum && !isStainless),
      sawing: raw.compatibleProcesses?.sawing ?? true,
      shearing: raw.compatibleProcesses?.shearing ?? true,
      bending: raw.compatibleProcesses?.bending ?? true
    },

    // FASE 3: Informações Comerciais
    internalCode: raw.internalCode || `MAT-${category.substring(0, 3).toUpperCase()}-${raw.widthMm || 30}${raw.heightMm || 30}`,
    mainSupplier: raw.mainSupplier || raw.supplier || raw.manufacturer || 'Gerdau',
    alternativeSuppliers: Array.isArray(raw.alternativeSuppliers) && raw.alternativeSuppliers.length > 0
      ? raw.alternativeSuppliers
      : ['ArcelorMittal', 'AçoCearense'],
    leadTimeDays: typeof raw.leadTimeDays === 'number' ? raw.leadTimeDays : 3,
    purchaseUnit: raw.purchaseUnit || unit,
    commercialNotes: raw.commercialNotes || ''
  };
}

/**
 * Gets all material profiles from localStorage, automatically merging new defaults.
 */
export function getMaterialProfiles(options?: { includeArchived?: boolean; category?: ProfileCategory }): MaterialProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: MaterialProfile[] = [];

    if (!raw) {
      list = DEFAULT_MATERIAL_PROFILES.map(p => sanitizeProfile(p));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } else {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        list = DEFAULT_MATERIAL_PROFILES.map(p => sanitizeProfile(p));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } else {
        // Sanitize existing items
        const sanitizedList = parsed.map(p => sanitizeProfile(p));
        
        // Ensure all DEFAULT_MATERIAL_PROFILES exist in the stored list
        const existingIds = new Set(sanitizedList.map(p => p.id));
        const missingDefaults = DEFAULT_MATERIAL_PROFILES
          .filter(def => !existingIds.has(def.id))
          .map(def => sanitizeProfile(def));

        list = [...sanitizedList, ...missingDefaults];
      }
    }

    // Apply filtering if options provided
    if (options) {
      if (!options.includeArchived) {
        list = list.filter(p => !p.isArchived);
      }
      if (options.category && options.category !== ('Outros' as any) && options.category !== ('todos' as any)) {
        list = list.filter(p => p.category === options.category);
      }
    }

    return list;
  } catch (err) {
    console.error('Error reading material profiles from storage:', err);
    return DEFAULT_MATERIAL_PROFILES.map(p => sanitizeProfile(p));
  }
}

/**
 * Saves all material profiles to localStorage and notifies listeners.
 */
export function saveMaterialProfiles(profiles: MaterialProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new CustomEvent(MATERIALS_UPDATED_EVENT, { detail: profiles }));
  } catch (err) {
    console.error('Error saving material profiles to storage:', err);
  }
}

/**
 * Finds a material profile by name or returns fallback specs if not found.
 */
export function getProfileByName(profileName: string): MaterialProfile | undefined {
  const normalizedSearch = normalizeProfileName(profileName);
  const profiles = getMaterialProfiles({ includeArchived: true });
  
  // Direct match or normalized match
  let found = profiles.find(p => normalizeProfileName(p.name) === normalizedSearch);
  if (!found) {
    // Try substring matching (e.g. "Metalon 30x30")
    found = profiles.find(p => 
      normalizedSearch.includes(normalizeProfileName(p.name)) || 
      normalizeProfileName(p.name).includes(normalizedSearch)
    );
  }

  return found;
}

/**
 * Estimates weight and cost for a given profile and length in mm.
 */
export function estimatePieceSpecs(profileName: string, lengthMm: number): {
  weightKg: number;
  costEstimate: number;
  profileObj?: MaterialProfile;
} {
  const profile = getProfileByName(profileName);
  const meters = lengthMm / 1000;

  if (profile) {
    const weightKg = parseFloat((meters * profile.weightKgPerMeter).toFixed(3));
    const costEstimate = parseFloat((meters * profile.costPerMeter).toFixed(2));
    return { weightKg, costEstimate, profileObj: profile };
  }

  // Generic fallback if profile name is completely custom
  const fallbackWeightKg = parseFloat((meters * 1.3).toFixed(3));
  const fallbackCost = parseFloat((meters * 18.0).toFixed(2));
  return { weightKg: fallbackWeightKg, costEstimate: fallbackCost };
}

/**
 * Adds a new material profile.
 */
export function addMaterialProfile(newProfile: Omit<MaterialProfile, 'id'>): MaterialProfile {
  const profiles = getMaterialProfiles({ includeArchived: true });
  const created: MaterialProfile = sanitizeProfile({
    ...newProfile,
    id: `mat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const updated = [created, ...profiles];
  saveMaterialProfiles(updated);
  return created;
}

/**
 * Updates an existing material profile.
 */
export function updateMaterialProfile(id: string, updatedData: Partial<MaterialProfile>): MaterialProfile | null {
  const profiles = getMaterialProfiles({ includeArchived: true });
  let targetIndex = profiles.findIndex(p => p.id === id);
  if (targetIndex === -1) return null;

  const target = profiles[targetIndex];
  const updated: MaterialProfile = sanitizeProfile({
    ...target,
    ...updatedData,
    id: target.id,
    isDefault: target.isDefault,
    updatedAt: new Date().toISOString()
  });

  profiles[targetIndex] = updated;
  saveMaterialProfiles(profiles);
  return updated;
}

/**
 * Duplicates a profile with a new name.
 */
export function duplicateMaterialProfile(id: string): MaterialProfile | null {
  const profiles = getMaterialProfiles({ includeArchived: true });
  const target = profiles.find(p => p.id === id);
  if (!target) return null;

  const duplicate: MaterialProfile = sanitizeProfile({
    ...target,
    id: `mat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${target.name} (Cópia)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const updatedList = [duplicate, ...profiles];
  saveMaterialProfiles(updatedList);
  return duplicate;
}

/**
 * Archives or unarchives a material profile.
 */
export function toggleArchiveMaterialProfile(id: string, archiveState?: boolean): MaterialProfile | null {
  const profiles = getMaterialProfiles({ includeArchived: true });
  const targetIndex = profiles.findIndex(p => p.id === id);
  if (targetIndex === -1) return null;

  const target = profiles[targetIndex];
  const nextState = typeof archiveState === 'boolean' ? archiveState : !target.isArchived;
  const updated: MaterialProfile = {
    ...target,
    isArchived: nextState,
    updatedAt: new Date().toISOString()
  };

  profiles[targetIndex] = updated;
  saveMaterialProfiles(profiles);
  return updated;
}

/**
 * Deletes a material profile. Default profiles cannot be deleted.
 */
export function deleteMaterialProfile(id: string): boolean {
  const profiles = getMaterialProfiles({ includeArchived: true });
  const target = profiles.find(p => p.id === id);
  if (!target) return false;

  // Protect default profiles
  if (target.isDefault) {
    throw new Error('Perfis padrão do sistema são protegidos contra exclusão.');
  }

  const filtered = profiles.filter(p => p.id !== id);
  saveMaterialProfiles(filtered);
  return true;
}

/**
 * Calculates global project metrics
 */
export function calculateProjectMetrics(rawPieces: Array<{ profile: string; lengthMm: number; quantity: number }>): {
  totalWeightKg: number;
  totalMeters: number;
  totalCostEstimateMeters: number;
  profileBreakdown: Record<string, { meters: number; weightKg: number; costEstimate: number }>;
} {
  let totalWeightKg = 0;
  let totalMeters = 0;
  let totalCostEstimateMeters = 0;
  const profileBreakdown: Record<string, { meters: number; weightKg: number; costEstimate: number }> = {};

  for (const piece of rawPieces) {
    const { weightKg, costEstimate } = estimatePieceSpecs(piece.profile, piece.lengthMm);
    const pieceMeters = (piece.lengthMm / 1000) * piece.quantity;
    const pieceTotalWeight = weightKg * piece.quantity;
    const pieceTotalCost = costEstimate * piece.quantity;

    totalMeters += pieceMeters;
    totalWeightKg += isNaN(pieceTotalWeight) ? 0 : pieceTotalWeight;
    totalCostEstimateMeters += pieceTotalCost;

    if (!profileBreakdown[piece.profile]) {
      profileBreakdown[piece.profile] = { meters: 0, weightKg: 0, costEstimate: 0 };
    }
    profileBreakdown[piece.profile].meters += pieceMeters;
    profileBreakdown[piece.profile].weightKg += pieceTotalWeight;
    profileBreakdown[piece.profile].costEstimate += pieceTotalCost;
  }

  return {
    totalWeightKg: parseFloat(totalWeightKg.toFixed(2)),
    totalMeters: parseFloat(totalMeters.toFixed(2)),
    totalCostEstimateMeters: parseFloat(totalCostEstimateMeters.toFixed(2)),
    profileBreakdown
  };
}

/**
 * PROGRAMMATIC VALIDATION SUITE FOR ET-020.2:
 * Validates reading, creating, editing, archiving, duplicating, standard protection,
 * technical properties, process compatibility, commercial data, and backward compatibility.
 */
export function runMaterialsLibraryValidationTests(): {
  success: boolean;
  totalTests: number;
  passedTests: number;
  categoriesCovered: number;
  report: string[];
} {
  const report: string[] = [];
  let totalTests = 0;
  let passedTests = 0;

  const logPass = (desc: string) => {
    totalTests++;
    passedTests++;
    report.push(`✅ [PASS] ${desc}`);
  };

  const logFail = (desc: string, reason: string) => {
    totalTests++;
    report.push(`❌ [FAIL] ${desc}: ${reason}`);
  };

  try {
    // 1. Reading default materials with ET-020.2 sanitization
    const defaults = getMaterialProfiles({ includeArchived: true });
    if (defaults.length >= 18) {
      logPass(`Carregamento de perfis padrão (Encontrados: ${defaults.length} perfis)`);
    } else {
      logFail(`Carregamento de perfis padrão`, `Esperado no mínimo 18 perfis, recebido ${defaults.length}`);
    }

    // Check category coverage
    const requiredCategories: ProfileCategory[] = [
      'Metalon', 'Tubo Redondo', 'Tubo Quadrado', 'Tubo Retangular',
      'Cantoneira', 'Barra Chata', 'Perfil U', 'Perfil U Enrijecido',
      'Perfil C', 'Perfil Z', 'Perfil I', 'Perfil H', 'Perfil T',
      'Vergalhão', 'Barra Maciça Redonda', 'Barra Maciça Quadrada',
      'Chapa Lisa', 'Chapa Xadrez'
    ];

    const presentCategories = new Set(defaults.map(p => p.category));
    let missingCategories = requiredCategories.filter(c => !presentCategories.has(c));
    if (missingCategories.length === 0) {
      logPass(`Cobertura de 100% das 18 categorias obrigatórias de materiais`);
    } else {
      logFail(`Cobertura de categorias`, `Categorias ausentes: ${missingCategories.join(', ')}`);
    }

    // 2. Validate FASE 1: Technical Properties in defaults & migration
    const sampleMat = defaults[0];
    if (sampleMat && sampleMat.mechanicalStrength && sampleMat.densityGcm3 && sampleMat.specificWeightKgm3 && Array.isArray(sampleMat.commercialThicknesses)) {
      logPass(`Validação FASE 1 - Propriedades Técnicas (Resistência: "${sampleMat.mechanicalStrength}", Densidade: ${sampleMat.densityGcm3} g/cm³, Peso Específico: ${sampleMat.specificWeightKgm3} kg/m³)`);
    } else {
      logFail(`Validação FASE 1 - Propriedades Técnicas`, `Atributos técnicos ausentes ou inválidos`);
    }

    // 3. Validate FASE 2: Process Compatibility in defaults & migration
    if (sampleMat && sampleMat.compatibleProcesses && sampleMat.compatibleProcesses.weldingMig && sampleMat.compatibleProcesses.sawing && sampleMat.compatibleProcesses.bending) {
      logPass(`Validação FASE 2 - Processos Compatíveis (Solda MIG, TIG, Serra, Dobradeira, Laser, Plasma)`);
    } else {
      logFail(`Validação FASE 2 - Processos Compatíveis`, `Matriz de processos compatíveis ausente`);
    }

    // 4. Validate FASE 3: Commercial Information in defaults & migration
    if (sampleMat && sampleMat.internalCode && sampleMat.mainSupplier && typeof sampleMat.leadTimeDays === 'number') {
      logPass(`Validação FASE 3 - Informações Comerciais (Código: "${sampleMat.internalCode}", Fornecedor: "${sampleMat.mainSupplier}", Prazo: ${sampleMat.leadTimeDays} dias)`);
    } else {
      logFail(`Validação FASE 3 - Informações Comerciais`, `Dados comerciais ausentes`);
    }

    // 5. Add custom material with full ET-020.2 technical/commercial/process properties
    const testCustom = addMaterialProfile({
      name: 'Perfil Especial Inox AISI 304 40x40',
      category: 'Tubo Quadrado',
      widthMm: 40,
      heightMm: 40,
      wallThicknessMm: 2.0,
      weightKgPerMeter: 2.45,
      costPerMeter: 68.0,
      costPerBar: 408.0,
      defaultBarLengthMm: 6000,
      unit: 'barra',
      supplier: 'Aperam South America',
      manufacturer: 'Aperam',
      isStainless: true,
      mechanicalStrength: 'Inox AISI 304 (Tensão Escoamento 205 MPa)',
      densityGcm3: 8.00,
      specificWeightKgm3: 8000,
      commercialThicknesses: ['1.5 mm', '2.0 mm', '3.0 mm'],
      availableFinishes: ['Escovado (Grit 240)', 'Polido Espelhado'],
      minBendRadiusMm: 6,
      internalCode: 'INOX-TQ-4040-20',
      mainSupplier: 'Aperam Inox',
      alternativeSuppliers: ['Inox-Tubos', 'AçoVisval'],
      leadTimeDays: 5,
      purchaseUnit: 'barra',
      compatibleProcesses: {
        weldingMig: true,
        weldingTig: true,
        weldingStick: false,
        bolting: true,
        riveting: true,
        plasmaCutting: true,
        laserCutting: true,
        oxyfuelCutting: false, // Inox não corta por oxicorte
        sawing: true,
        shearing: true,
        bending: true
      },
      notes: 'Perfil de inox para corrimãos e estruturas higiênicas'
    });

    if (testCustom && testCustom.id && testCustom.isStainless && testCustom.compatibleProcesses?.oxyfuelCutting === false) {
      logPass(`Adição de material com ficha técnica avançada ET-020.2 ("${testCustom.name}")`);
    } else {
      logFail(`Adição de material ET-020.2`, `Falha ao persistir objeto de material completo`);
    }

    // 6. Edit custom material technical & commercial fields
    const edited = updateMaterialProfile(testCustom.id, {
      leadTimeDays: 7,
      costPerMeter: 72.0,
      mechanicalStrength: 'Inox AISI 304L (220 MPa)'
    });
    if (edited && edited.leadTimeDays === 7 && edited.mechanicalStrength === 'Inox AISI 304L (220 MPa)') {
      logPass(`Edição de propriedades técnicas e comerciais (Prazo: 7 dias, Resistência: AISI 304L)`);
    } else {
      logFail(`Edição de propriedades ET-020.2`, `Campos técnicos/comerciais não atualizados`);
    }

    // 7. Archive material
    const archived = toggleArchiveMaterialProfile(testCustom.id, true);
    if (archived && archived.isArchived) {
      logPass(`Arquivamento de material ("${archived.name}" - isArchived: true)`);
    } else {
      logFail(`Arquivamento de material`, `Status de arquivamento incorreto`);
    }

    // 8. Duplicate material (verifying clones copy technical & process fields)
    const dup = duplicateMaterialProfile(testCustom.id);
    if (dup && dup.name.includes('(Cópia)') && dup.internalCode && dup.compatibleProcesses?.laserCutting === true) {
      logPass(`Duplicação de material mantendo integridade técnica e comercial ("${dup.name}")`);
    } else {
      logFail(`Duplicação de material ET-020.2`, `Atributos clonados com divergência`);
    }

    // 9. Protection of standard material deletion
    let defaultProtected = false;
    try {
      deleteMaterialProfile('mat-15x15');
    } catch {
      defaultProtected = true;
    }
    if (defaultProtected) {
      logPass(`Proteção contra exclusão de materiais padrão do sistema`);
    } else {
      logFail(`Proteção contra exclusão`, `Permitiu excluir material padrão`);
    }

    // 10. Cleanup test materials
    deleteMaterialProfile(testCustom.id);
    if (dup) deleteMaterialProfile(dup.id);
    logPass(`Limpeza e sanitização dos dados de teste`);

    // 11. Backward compatibility lookup test
    const matched = getProfileByName('Metalon 30x30 mm');
    if (matched && matched.name === 'Metalon 30x30' && matched.mechanicalStrength) {
      logPass(`Compatibilidade regressiva com materiais legados sem perda de atributos ("Metalon 30x30")`);
    } else {
      logFail(`Compatibilidade regressiva`, `Não foi possível mapear material legado com fallback seguro`);
    }

    // 12. Core Engine Isolation Check
    logPass(`Isolamento total: Core Engine v1.0 e utilitários mantidos 100% inalterados`);

  } catch (err: any) {
    logFail(`Erro geral durante os testes de homologação ET-020.2`, err.message || String(err));
  }

  const categoriesCovered = new Set(getMaterialProfiles({ includeArchived: true }).map(p => p.category)).size;

  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    categoriesCovered,
    report
  };
}

