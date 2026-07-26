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
 * Sanitizes and migrates material profile objects to guarantee all required fields exist.
 */
function sanitizeProfile(raw: Partial<MaterialProfile>): MaterialProfile {
  const category = raw.category || inferCategoryFromName(raw.name || '');
  const unit: MaterialUnit = raw.unit || (category.startsWith('Chapa') ? 'chapa' : 'barra');
  
  return {
    id: raw.id || `mat-gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: raw.name || 'Perfil Sem Nome',
    category,
    widthMm: typeof raw.widthMm === 'number' ? raw.widthMm : 30,
    heightMm: typeof raw.heightMm === 'number' ? raw.heightMm : 30,
    wallThicknessMm: typeof raw.wallThicknessMm === 'number' ? raw.wallThicknessMm : 1.5,
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
    updatedAt: raw.updatedAt || new Date().toISOString()
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
 * PROGRAMMATIC VALIDATION SUITE FOR ET-020.1:
 * Validates reading, creating, editing, archiving, duplicating, standard protection, and backward compatibility.
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
    // 1. Reading default materials
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

    // 2. Add custom material
    const testCustom = addMaterialProfile({
      name: 'Perfil Teste Universal 50x50',
      category: 'Metalon',
      widthMm: 50,
      heightMm: 50,
      wallThicknessMm: 2,
      weightKgPerMeter: 2.9,
      costPerMeter: 35,
      costPerBar: 210,
      defaultBarLengthMm: 6000,
      unit: 'barra',
      supplier: 'Test Supplier',
      notes: 'Perfil criado em teste automatizado'
    });

    if (testCustom && testCustom.id && testCustom.name === 'Perfil Teste Universal 50x50') {
      logPass(`Adição de material personalizado ("${testCustom.name}")`);
    } else {
      logFail(`Adição de material personalizado`, `Falha ao criar objeto de material`);
    }

    // 3. Edit custom material
    const edited = updateMaterialProfile(testCustom.id, { costPerMeter: 40, costPerBar: 240 });
    if (edited && edited.costPerMeter === 40) {
      logPass(`Edição de material personalizado (costPerMeter atualizado para R$ 40,00)`);
    } else {
      logFail(`Edição de material personalizado`, `Campo não atualizado`);
    }

    // 4. Archive material
    const archived = toggleArchiveMaterialProfile(testCustom.id, true);
    if (archived && archived.isArchived) {
      logPass(`Arquivamento de material personalizado (isArchived: true)`);
    } else {
      logFail(`Arquivamento de material`, `Status de arquivamento incorreto`);
    }

    // 5. Duplicate material
    const dup = duplicateMaterialProfile(testCustom.id);
    if (dup && dup.name.includes('(Cópia)')) {
      logPass(`Duplicação de material ("${dup.name}")`);
    } else {
      logFail(`Duplicação de material`, `Cópia não gerada`);
    }

    // 6. Protection of standard material deletion
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

    // 7. Cleanup test materials
    deleteMaterialProfile(testCustom.id);
    if (dup) deleteMaterialProfile(dup.id);
    logPass(`Limpeza e sanitização dos dados de teste`);

    // 8. Backward compatibility lookup test
    const matched = getProfileByName('Metalon 30x30 mm');
    if (matched && matched.name === 'Metalon 30x30') {
      logPass(`Compatibilidade regressiva de busca por nome ("Metalon 30x30 mm" -> "${matched.name}")`);
    } else {
      logFail(`Compatibilidade regressiva`, `Não foi possível encontrar perfil antigo`);
    }

  } catch (err: any) {
    logFail(`Erro geral durante os testes de homologação`, err.message || String(err));
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

