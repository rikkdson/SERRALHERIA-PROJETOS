import { MaterialProfile, DEFAULT_MATERIAL_PROFILES } from '../types';

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
 * Gets all material profiles from localStorage, defaulting to system defaults if empty.
 */
export function getMaterialProfiles(): MaterialProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize localStorage with default profiles
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATERIAL_PROFILES));
      return DEFAULT_MATERIAL_PROFILES;
    }
    const parsed: MaterialProfile[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MATERIAL_PROFILES));
      return DEFAULT_MATERIAL_PROFILES;
    }
    return parsed;
  } catch (err) {
    console.error('Error reading material profiles from storage:', err);
    return DEFAULT_MATERIAL_PROFILES;
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
  const profiles = getMaterialProfiles();
  
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

  // Generic fallback if profile name is completely custom (e.g. 1.2 kg/m, R$ 18/m)
  const fallbackWeightKg = parseFloat((meters * 1.3).toFixed(3));
  const fallbackCost = parseFloat((meters * 18.0).toFixed(2));
  return { weightKg: fallbackWeightKg, costEstimate: fallbackCost };
}

/**
 * Adds a new material profile.
 */
export function addMaterialProfile(newProfile: Omit<MaterialProfile, 'id'>): MaterialProfile {
  const profiles = getMaterialProfiles();
  const created: MaterialProfile = {
    ...newProfile,
    id: `mat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const updated = [created, ...profiles];
  saveMaterialProfiles(updated);
  return created;
}

/**
 * Updates an existing material profile.
 */
export function updateMaterialProfile(id: string, updatedData: Partial<MaterialProfile>): MaterialProfile | null {
  const profiles = getMaterialProfiles();
  let targetIndex = profiles.findIndex(p => p.id === id);
  if (targetIndex === -1) return null;

  const target = profiles[targetIndex];
  const updated: MaterialProfile = {
    ...target,
    ...updatedData,
    // Preserve default flag & id
    id: target.id,
    isDefault: target.isDefault,
    updatedAt: new Date().toISOString()
  };

  profiles[targetIndex] = updated;
  saveMaterialProfiles(profiles);
  return updated;
}

/**
 * Duplicates a profile with a new name.
 */
export function duplicateMaterialProfile(id: string): MaterialProfile | null {
  const profiles = getMaterialProfiles();
  const target = profiles.find(p => p.id === id);
  if (!target) return null;

  const duplicate: MaterialProfile = {
    ...target,
    id: `mat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${target.name} (Cópia)`,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedList = [duplicate, ...profiles];
  saveMaterialProfiles(updatedList);
  return duplicate;
}

/**
 * Deletes a material profile. Default profiles cannot be deleted.
 */
export function deleteMaterialProfile(id: string): boolean {
  const profiles = getMaterialProfiles();
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
 * Calculates global project metrics for future readiness:
 * - Total weight (kg)
 * - Estimated total cost by meters
 * - Total length of metal cut (meters)
 * - Profile breakdown
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
    totalWeightKg += pieceTotalTotalWeight(pieceTotalWeight);
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

function pieceTotalTotalWeight(weight: number): number {
  return isNaN(weight) ? 0 : weight;
}
