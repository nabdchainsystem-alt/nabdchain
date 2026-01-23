import React, { useRef, useCallback } from 'react';
import {
    MagnifyingGlass,
    UserCircle,
    Funnel,
    ArrowsDownUp,
    EyeSlash,
    Export,
} from 'phosphor-react';
import { X, Plus, CaretDown as ChevronDown, Trash } from 'phosphor-react';
import { Column, Row, FilterRule, SortRule } from '../types';
import { getConditionsForType } from '../hooks/useTableFiltering';

interface PersonAvatarItemProps {
    person: any;
    isActive: boolean;
    onClick: () => void;
}

const PersonAvatarItem: React.FC<PersonAvatarItemProps> = ({ person, isActive, onClick }) => {
    const [imageError, setImageError] = React.useState(false);

    const displayName = person.name || person.label || person.title || (typeof person === 'string' ? person : 'Unknown');
    const initial = (typeof person === 'string' ? person.charAt(0) : (person.name ? person.name.charAt(0) : '?')).toUpperCase();

    const COLORS = ['bg-red-100 text-red-600', 'bg-orange-100 text-orange-600', 'bg-amber-100 text-amber-600', 'bg-green-100 text-green-600', 'bg-emerald-100 text-emerald-600', 'bg-teal-100 text-teal-600', 'bg-cyan-100 text-cyan-600', 'bg-blue-100 text-blue-600', 'bg-indigo-100 text-indigo-600', 'bg-violet-100 text-violet-600', 'bg-purple-100 text-purple-600', 'bg-fuchsia-100 text-fuchsia-600', 'bg-pink-100 text-pink-600', 'bg-rose-100 text-rose-600'];
    const colorIndex = Math.abs(displayName.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % COLORS.length;
    const avatarColorClass = COLORS[colorIndex];

    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors overflow-hidden relative ${isActive
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-white ring-1 ring-stone-200 dark:ring-stone-700 hover:ring-stone-300'
            }`}
            title={displayName}
        >
            {person.avatar && !imageError ? (
                <img
                    src={person.avatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${avatarColorClass}`}>
                    <span className="text-xs font-bold leading-none">{initial}</span>
                </div>
            )}
        </button>
    );
};

interface TableToolbarProps {
    columns: Column[];
    rows: Row[];

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isSearchOpen: boolean;
    setIsSearchOpen: (open: boolean) => void;

    // Person filter
    personFilter: string | null;
    setPersonFilter: (person: string | null) => void;
    isPersonFilterOpen: boolean;
    setIsPersonFilterOpen: (open: boolean) => void;

    // Advanced filters
    filters: FilterRule[];
    isFilterPanelOpen: boolean;
    setIsFilterPanelOpen: (open: boolean) => void;
    addFilter: () => void;
    updateFilter: (id: string, updates: Partial<FilterRule>) => void;
    removeFilter: (id: string) => void;

    // Sort
    sortRules: SortRule[];
    isSortPanelOpen: boolean;
    setIsSortPanelOpen: (open: boolean) => void;
    addSortRule: () => void;
    updateSortRule: (id: string, updates: Partial<SortRule>) => void;
    removeSortRule: (id: string) => void;

    // Column visibility
    hiddenColumns: Set<string>;
    isHideColumnsOpen: boolean;
    setIsHideColumnsOpen: (open: boolean) => void;
    columnSearchQuery: string;
    setColumnSearchQuery: (query: string) => void;
    toggleColumnVisibility: (colId: string) => void;

    // Export
    onExport?: () => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
    columns,
    rows,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    personFilter,
    setPersonFilter,
    isPersonFilterOpen,
    setIsPersonFilterOpen,
    filters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    addFilter,
    updateFilter,
    removeFilter,
    sortRules,
    isSortPanelOpen,
    setIsSortPanelOpen,
    addSortRule,
    updateSortRule,
    removeSortRule,
    hiddenColumns,
    isHideColumnsOpen,
    setIsHideColumnsOpen,
    columnSearchQuery,
    setColumnSearchQuery,
    toggleColumnVisibility,
    onExport,
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);

    const closeAllPanels = useCallback(() => {
        setIsPersonFilterOpen(false);
        setIsFilterPanelOpen(false);
        setIsSortPanelOpen(false);
        setIsHideColumnsOpen(false);
        setIsSearchOpen(false);
    }, [setIsPersonFilterOpen, setIsFilterPanelOpen, setIsSortPanelOpen, setIsHideColumnsOpen, setIsSearchOpen]);

    // Extract unique people from rows
    const uniquePeople = React.useMemo(() => {
        const allPeople = rows.flatMap(r => {
            const p = r.people;
            if (Array.isArray(p)) return p;
            if (p) return [p];
            return [];
        });

        const uniquePeopleMap = new Map();
        allPeople.forEach((p: any) => {
            const id = p.id || p.name || (typeof p === 'string' ? p : null);
            if (id && !uniquePeopleMap.has(id)) {
                uniquePeopleMap.set(id, p);
            }
        });

        return Array.from(uniquePeopleMap.values());
    }, [rows]);

    // Filterable columns (exclude select)
    const filterableColumns = columns.filter(c => c.id !== 'select' && c.type !== 'select');

    return (
        <div className="flex items-center h-[52px] border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-monday-dark-surface pl-[24px] pr-[20px] shrink-0 transition-colors z-20 gap-4">
            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 relative">
                {/* Search - Expandable */}
                <div className="relative flex items-center">
                    <div
                        className={`flex items-center gap-1.5 cursor-pointer transition-all duration-300 ease-out ${isSearchOpen ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700' : 'hover:text-blue-500'}`}
                        onClick={() => {
                            if (!isSearchOpen) {
                                closeAllPanels();
                                setIsSearchOpen(true);
                                setTimeout(() => searchInputRef.current?.focus(), 100);
                            }
                        }}
                    >
                        <MagnifyingGlass size={16} weight="regular" className="flex-shrink-0" />
                        <div className={`overflow-hidden transition-all duration-300 ease-out ${isSearchOpen ? 'w-48' : 'w-auto'}`}>
                            {isSearchOpen ? (
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search this board"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsSearchOpen(false);
                                            setSearchQuery('');
                                        }
                                    }}
                                    className="w-full bg-transparent border-none outline-none text-[13px] text-stone-700 dark:text-stone-200 placeholder:text-stone-400"
                                />
                            ) : (
                                <span className="text-[13px] font-medium">Search</span>
                            )}
                        </div>
                        {isSearchOpen && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Person Filter */}
                <div className="relative">
                    <div
                        data-toolbar-button
                        className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isPersonFilterOpen || personFilter ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                        onClick={() => {
                            if (!isPersonFilterOpen) {
                                closeAllPanels();
                            }
                            setIsPersonFilterOpen(!isPersonFilterOpen);
                        }}
                    >
                        <UserCircle size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-medium">Person</span>
                    </div>
                    {isPersonFilterOpen && (
                        <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                            <div className="mb-3">
                                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                                    Filter by person
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {uniquePeople.map((person: any) => (
                                    <PersonAvatarItem
                                        key={person.id || person.name || person}
                                        person={person}
                                        isActive={personFilter === (person.name || person)}
                                        onClick={() => {
                                            const isActive = personFilter === (person.name || person);
                                            setPersonFilter(isActive ? null : (person.name || person));
                                            setIsPersonFilterOpen(false);
                                        }}
                                    />
                                ))}
                                {uniquePeople.length === 0 && (
                                    <div className="w-10 h-10 rounded-full border-2 border-stone-200 dark:border-stone-600 flex items-center justify-center" title="No assigned users found">
                                        <UserCircle size={24} weight="regular" className="text-stone-300" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter Panel */}
                <div className="relative">
                    <div
                        data-toolbar-button
                        className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isFilterPanelOpen || filters.length > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                        onClick={() => {
                            if (!isFilterPanelOpen) {
                                closeAllPanels();
                            }
                            setIsFilterPanelOpen(!isFilterPanelOpen);
                        }}
                    >
                        <Funnel size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-medium">Filter</span>
                        {filters.length > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{filters.length}</span>
                        )}
                    </div>
                    {isFilterPanelOpen && (
                        <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[600px]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                                    Advanced Filters
                                </span>
                                <button
                                    onClick={addFilter}
                                    className="text-blue-500 hover:text-blue-600 text-[13px] font-medium flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add filter
                                </button>
                            </div>
                            <div className="space-y-3">
                                {filters.map((filter, idx) => (
                                    <div key={filter.id} className="flex items-center gap-2">
                                        <select
                                            value={filter.column}
                                            onChange={(e) => updateFilter(filter.id, { column: e.target.value })}
                                            className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                        >
                                            {filterableColumns.map(col => (
                                                <option key={col.id} value={col.id}>{col.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filter.condition}
                                            onChange={(e) => updateFilter(filter.id, { condition: e.target.value })}
                                            className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                        >
                                            {getConditionsForType(columns.find(c => c.id === filter.column)?.type || 'text').map(cond => (
                                                <option key={cond.value} value={cond.value}>{cond.label}</option>
                                            ))}
                                        </select>
                                        {!['is_empty', 'is_not_empty'].includes(filter.condition) && (
                                            <input
                                                type="text"
                                                value={filter.value}
                                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                                placeholder="Value"
                                                className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                            />
                                        )}
                                        <button
                                            onClick={() => removeFilter(filter.id)}
                                            className="text-stone-400 hover:text-red-500 p-1"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                ))}
                                {filters.length === 0 && (
                                    <p className="text-stone-400 text-sm text-center py-4">No filters applied</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sort Panel */}
                <div className="relative">
                    <div
                        data-toolbar-button
                        className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isSortPanelOpen || sortRules.length > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                        onClick={() => {
                            if (!isSortPanelOpen) {
                                closeAllPanels();
                            }
                            setIsSortPanelOpen(!isSortPanelOpen);
                        }}
                    >
                        <ArrowsDownUp size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-medium">Sort</span>
                        {sortRules.length > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{sortRules.length}</span>
                        )}
                    </div>
                    {isSortPanelOpen && (
                        <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[400px]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">Sort by</span>
                                <button
                                    onClick={addSortRule}
                                    className="text-blue-500 hover:text-blue-600 text-[13px] font-medium flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add sort
                                </button>
                            </div>
                            <div className="space-y-3">
                                {sortRules.map((rule) => (
                                    <div key={rule.id} className="flex items-center gap-2">
                                        <select
                                            value={rule.column}
                                            onChange={(e) => updateSortRule(rule.id, { column: e.target.value })}
                                            className="flex-1 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                        >
                                            {filterableColumns.map(col => (
                                                <option key={col.id} value={col.id}>{col.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={rule.direction}
                                            onChange={(e) => updateSortRule(rule.id, { direction: e.target.value as 'asc' | 'desc' })}
                                            className="bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                        <button
                                            onClick={() => removeSortRule(rule.id)}
                                            className="text-stone-400 hover:text-red-500 p-1"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                ))}
                                {sortRules.length === 0 && (
                                    <p className="text-stone-400 text-sm text-center py-4">No sorting applied</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hide Columns */}
                <div className="relative">
                    <div
                        data-toolbar-button
                        className={`flex items-center gap-1.5 cursor-pointer transition-colors group ${isHideColumnsOpen || hiddenColumns.size > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-md' : 'hover:text-blue-500'}`}
                        onClick={() => {
                            if (!isHideColumnsOpen) {
                                closeAllPanels();
                            }
                            setIsHideColumnsOpen(!isHideColumnsOpen);
                        }}
                    >
                        <EyeSlash size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
                        <span className="text-[13px] font-medium">Hide</span>
                        {hiddenColumns.size > 0 && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{hiddenColumns.size}</span>
                        )}
                    </div>
                    {isHideColumnsOpen && (
                        <div data-toolbar-panel className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]">
                            <div className="mb-3">
                                <input
                                    type="text"
                                    placeholder="Search columns..."
                                    value={columnSearchQuery}
                                    onChange={(e) => setColumnSearchQuery(e.target.value)}
                                    className="w-full bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filterableColumns
                                    .filter(col => col.label.toLowerCase().includes(columnSearchQuery.toLowerCase()))
                                    .map(col => (
                                        <label key={col.id} className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700 p-2 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={!hiddenColumns.has(col.id)}
                                                onChange={() => toggleColumnVisibility(col.id)}
                                                className="rounded border-stone-300 text-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-stone-700 dark:text-stone-300">{col.label}</span>
                                        </label>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Export */}
                {onExport && (
                    <button
                        onClick={onExport}
                        className="flex items-center gap-1.5 cursor-pointer transition-colors hover:text-blue-500"
                    >
                        <Export size={16} weight="regular" />
                        <span className="text-[13px] font-medium">Export</span>
                    </button>
                )}
            </div>
        </div>
    );
};
