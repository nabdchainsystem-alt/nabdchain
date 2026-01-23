// Core Types for RoomTable
export interface Column {
    id: string;
    label: string;
    type: string;
    width: number;
    minWidth: number;
    resizable: boolean;
    pinned?: boolean;
    options?: { id: string; label: string; color: string }[];
    color?: string;
    headerColor?: string;
    backgroundColor?: string;
    currency?: {
        code: string;
        symbol: string;
    };
}

export interface Row {
    id: string;
    groupId?: string;
    _styles?: Record<string, { color?: string }>;
    [key: string]: any;
}

export interface GroupColor {
    bg: string;
    text: string;
}

export interface TableGroup {
    id: string;
    name: string;
    rows: Row[];
    isCollapsed: boolean;
    isPinned?: boolean;
    color: GroupColor;
}

export interface FilterRule {
    id: string;
    column: string;
    condition: string;
    value: string;
}

export interface SortRule {
    id: string;
    column: string;
    direction: 'asc' | 'desc';
}

export interface StatusOption {
    id: string;
    title: string;
    color: string;
}

// Color palette for table groups
export const GROUP_COLORS: GroupColor[] = [
    { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
    { bg: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
    { bg: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
    { bg: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400' },
    { bg: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400' },
    { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
];

export const getGroupColor = (index: number): GroupColor => GROUP_COLORS[index % GROUP_COLORS.length];

// Default columns configuration
export const DEFAULT_COLUMNS: Column[] = [
    { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true },
    { id: 'name', label: 'Name', type: 'text', width: 320, minWidth: 200, resizable: true, pinned: true },
    { id: 'people', label: 'People', type: 'people', width: 120, minWidth: 100, resizable: true },
    { id: 'status', label: 'Status', type: 'status', width: 140, minWidth: 100, resizable: true },
    { id: 'priority', label: 'Priority', type: 'priority', width: 140, minWidth: 100, resizable: true },
    { id: 'date', label: 'Date', type: 'date', width: 140, minWidth: 120, resizable: true },
    { id: 'dueDate', label: 'Due Date', type: 'date', width: 140, minWidth: 120, resizable: true },
];

// Status styles
export const STATUS_STYLES: Record<string, string> = {
    'Done': 'bg-emerald-600 text-white',
    'Working on it': 'bg-amber-500 text-white',
    'In Progress': 'bg-blue-600 text-white',
    'Stuck': 'bg-orange-500 text-white',
    'To Do': 'bg-gray-100 text-gray-700',
    'Rejected': 'bg-rose-600 text-white',
};

// Priority styles
export const PRIORITY_STYLES: Record<string, string> = {
    'Urgent': 'bg-[#EF4444] text-white',
    'High': 'bg-[#F59E0B] text-white',
    'Medium': 'bg-[#3B82F6] text-white',
    'Low': 'bg-[#10B981] text-white',
};

// Generic fallback colors
export const GENERIC_COLORS = [
    'bg-[#A855F7] text-white',
    'bg-[#EC4899] text-white',
    'bg-[#F97316] text-white',
    'bg-[#14B8A6] text-white',
];

// Default statuses
export const DEFAULT_STATUSES: StatusOption[] = [
    { id: 'To Do', title: 'To Do', color: 'gray' },
    { id: 'In Progress', title: 'In Progress', color: 'blue' },
    { id: 'Done', title: 'Done', color: 'emerald' },
    { id: 'Stuck', title: 'Stuck', color: 'orange' },
    { id: 'Rejected', title: 'Rejected', color: 'rose' }
];

// Helper functions
export const isDoneStatus = (status: any): boolean => {
    if (!status || typeof status !== 'string') return false;
    const normalized = status.trim().toLowerCase();
    return normalized === 'done' || normalized === 'completed';
};

export const sortRowsWithDoneAtBottom = (rows: Row[]): Row[] => {
    const nonDone = rows.filter(r => !isDoneStatus(r.status));
    const done = rows.filter(r => isDoneStatus(r.status));
    return [...nonDone, ...done];
};

export const formatDate = (date: string | null, locale?: string): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        // Use provided locale or browser default
        const loc = locale || navigator.language || 'en-GB';
        const datePart = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }).format(d);
        const timePart = new Intl.DateTimeFormat(loc, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
        return `${datePart} - ${timePart}`;
    } catch {
        return date || '';
    }
};
