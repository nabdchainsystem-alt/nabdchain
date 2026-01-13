export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';

export const PRIORITY_LEVELS: PriorityLevel[] = ['Urgent', 'High', 'Medium', 'Low'];

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

export const PRIORITY_COLORS: Record<PriorityLevel, { text: string; dot: string; badge: string }> = {
  Urgent: { text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200' },
  High: { text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200' },
  Medium: { text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' },
  Low: { text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' }
};

/**
 * Convert any incoming priority label to the canonical shape we display.
 * Older values (e.g. "urgent" or "normal") are interpreted but never mutated.
 */
export const normalizePriority = (value?: string | null): PriorityLevel | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.includes('urgent')) return 'Urgent';
  if (lower.includes('high')) return 'High';
  if (lower.includes('medium') || lower === 'normal') return 'Medium';
  if (lower.includes('low')) return 'Low';
  return null;
};

export const comparePriority = (a?: string | null, b?: string | null): number => {
  const aNorm = normalizePriority(a);
  const bNorm = normalizePriority(b);
  const aOrder = aNorm ? PRIORITY_ORDER[aNorm] : 0;
  const bOrder = bNorm ? PRIORITY_ORDER[bNorm] : 0;
  return aOrder - bOrder;
};

export const getPriorityClasses = (value?: string | null) => {
  const level = normalizePriority(value);
  if (!level) return { text: 'text-stone-400', dot: 'bg-stone-300', badge: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300' };
  return PRIORITY_COLORS[level];
};
