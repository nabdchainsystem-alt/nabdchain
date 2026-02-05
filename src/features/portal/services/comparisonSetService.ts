// =============================================================================
// Comparison Set Service - Save and Load Comparison Sets
// =============================================================================

import { ManualCompareColumn, ManualCompareRow } from './comparisonExportService';
import { ScoringWeights, DEFAULT_WEIGHTS } from './compareScoringService';

// =============================================================================
// Types
// =============================================================================

export interface ComparisonSetMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isFavorite: boolean;
}

export interface SavedComparisonSet extends ComparisonSetMetadata {
  // Comparison data
  columns: ManualCompareColumn[];
  rows: ManualCompareRow[];

  // Scoring configuration
  weights: ScoringWeights;
  presetUsed?: string;

  // Results snapshot (optional - for historical reference)
  bestPickColumnId?: string | null;
  resultSnapshot?: {
    columnScores: Record<string, number>;
    calculatedAt: string;
  };

  // Source information
  source: 'manual' | 'marketplace' | 'import';

  // Optional notes
  notes?: string;
}

export interface ComparisonSetFilters {
  search?: string;
  tags?: string[];
  source?: 'manual' | 'marketplace' | 'import';
  favoritesOnly?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ComparisonSetSummary {
  total: number;
  favorites: number;
  bySource: {
    manual: number;
    marketplace: number;
    import: number;
  };
  recentSets: ComparisonSetMetadata[];
}

// =============================================================================
// Storage Keys
// =============================================================================

const STORAGE_KEY = 'nabd_comparison_sets';
const MAX_SETS = 50; // Limit stored comparison sets

// =============================================================================
// Helper Functions
// =============================================================================

const generateId = (): string => {
  return `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getStoredSets = (): SavedComparisonSet[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load comparison sets:', error);
    return [];
  }
};

const saveSets = (sets: SavedComparisonSet[]): boolean => {
  try {
    // Enforce max limit by removing oldest non-favorite sets
    if (sets.length > MAX_SETS) {
      const favorites = sets.filter(s => s.isFavorite);
      const nonFavorites = sets.filter(s => !s.isFavorite).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      sets = [...favorites, ...nonFavorites.slice(0, MAX_SETS - favorites.length)];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    return true;
  } catch (error) {
    console.error('Failed to save comparison sets:', error);
    return false;
  }
};

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Save a new comparison set
 */
export const saveComparisonSet = (
  data: Omit<SavedComparisonSet, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>
): SavedComparisonSet | null => {
  const sets = getStoredSets();

  const newSet: SavedComparisonSet = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
  };

  sets.unshift(newSet); // Add to beginning

  if (saveSets(sets)) {
    return newSet;
  }
  return null;
};

/**
 * Update an existing comparison set
 */
export const updateComparisonSet = (
  id: string,
  updates: Partial<Omit<SavedComparisonSet, 'id' | 'createdAt'>>
): SavedComparisonSet | null => {
  const sets = getStoredSets();
  const index = sets.findIndex(s => s.id === id);

  if (index === -1) return null;

  const updatedSet: SavedComparisonSet = {
    ...sets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  sets[index] = updatedSet;

  if (saveSets(sets)) {
    return updatedSet;
  }
  return null;
};

/**
 * Get a single comparison set by ID
 */
export const getComparisonSet = (id: string): SavedComparisonSet | null => {
  const sets = getStoredSets();
  return sets.find(s => s.id === id) || null;
};

/**
 * Get all comparison sets with optional filtering
 */
export const getComparisonSets = (filters?: ComparisonSetFilters): SavedComparisonSet[] => {
  let sets = getStoredSets();

  if (filters) {
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      sets = sets.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      sets = sets.filter(s =>
        filters.tags!.some(tag => s.tags?.includes(tag))
      );
    }

    // Filter by source
    if (filters.source) {
      sets = sets.filter(s => s.source === filters.source);
    }

    // Filter favorites only
    if (filters.favoritesOnly) {
      sets = sets.filter(s => s.isFavorite);
    }

    // Sort
    const sortBy = filters.sortBy || 'updatedAt';
    const sortOrder = filters.sortOrder || 'desc';

    sets.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  return sets;
};

/**
 * Delete a comparison set
 */
export const deleteComparisonSet = (id: string): boolean => {
  const sets = getStoredSets();
  const filtered = sets.filter(s => s.id !== id);

  if (filtered.length === sets.length) return false; // Not found

  return saveSets(filtered);
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = (id: string): SavedComparisonSet | null => {
  const sets = getStoredSets();
  const index = sets.findIndex(s => s.id === id);

  if (index === -1) return null;

  sets[index] = {
    ...sets[index],
    isFavorite: !sets[index].isFavorite,
    updatedAt: new Date().toISOString(),
  };

  if (saveSets(sets)) {
    return sets[index];
  }
  return null;
};

/**
 * Duplicate a comparison set
 */
export const duplicateComparisonSet = (id: string, newName?: string): SavedComparisonSet | null => {
  const original = getComparisonSet(id);
  if (!original) return null;

  const duplicate: Omit<SavedComparisonSet, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> = {
    name: newName || `${original.name} (Copy)`,
    description: original.description,
    tags: original.tags ? [...original.tags] : undefined,
    columns: original.columns.map(c => ({ ...c, id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` })),
    rows: original.rows.map(r => ({
      ...r,
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      values: { ...r.values },
    })),
    weights: { ...original.weights },
    presetUsed: original.presetUsed,
    source: original.source,
    notes: original.notes,
  };

  return saveComparisonSet(duplicate);
};

/**
 * Get summary statistics
 */
export const getComparisonSetSummary = (): ComparisonSetSummary => {
  const sets = getStoredSets();

  return {
    total: sets.length,
    favorites: sets.filter(s => s.isFavorite).length,
    bySource: {
      manual: sets.filter(s => s.source === 'manual').length,
      marketplace: sets.filter(s => s.source === 'marketplace').length,
      import: sets.filter(s => s.source === 'import').length,
    },
    recentSets: sets
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        tags: s.tags,
        isFavorite: s.isFavorite,
      })),
  };
};

/**
 * Get all unique tags across all sets
 */
export const getAllTags = (): string[] => {
  const sets = getStoredSets();
  const tagSet = new Set<string>();

  sets.forEach(s => {
    s.tags?.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
};

/**
 * Export comparison set to JSON
 */
export const exportComparisonSetToJSON = (id: string): string | null => {
  const set = getComparisonSet(id);
  if (!set) return null;

  return JSON.stringify(set, null, 2);
};

/**
 * Import comparison set from JSON
 */
export const importComparisonSetFromJSON = (jsonString: string): SavedComparisonSet | null => {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.name || !parsed.columns || !parsed.rows) {
      throw new Error('Invalid comparison set format');
    }

    // Create new set from imported data (generates new IDs)
    return saveComparisonSet({
      name: parsed.name,
      description: parsed.description,
      tags: parsed.tags,
      columns: parsed.columns.map((c: ManualCompareColumn) => ({
        ...c,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      })),
      rows: parsed.rows.map((r: ManualCompareRow) => ({
        ...r,
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        values: { ...r.values },
      })),
      weights: parsed.weights || DEFAULT_WEIGHTS,
      presetUsed: parsed.presetUsed,
      source: parsed.source || 'import',
      notes: parsed.notes,
    });
  } catch (error) {
    console.error('Failed to import comparison set:', error);
    return null;
  }
};

/**
 * Clear all comparison sets
 */
export const clearAllComparisonSets = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear comparison sets:', error);
    return false;
  }
};

// =============================================================================
// Default Export
// =============================================================================

export default {
  saveComparisonSet,
  updateComparisonSet,
  getComparisonSet,
  getComparisonSets,
  deleteComparisonSet,
  toggleFavorite,
  duplicateComparisonSet,
  getComparisonSetSummary,
  getAllTags,
  exportComparisonSetToJSON,
  importComparisonSetFromJSON,
  clearAllComparisonSets,
};
