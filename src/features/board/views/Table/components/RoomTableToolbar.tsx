/**
 * RoomTableToolbar — Secondary toolbar for RoomTable
 *
 * Extracted to reduce RoomTable.tsx line count.
 * Contains: search, person filter, advanced filters, sort, hide columns,
 * clear data, group by, selection actions, export/import, custom actions.
 */

import React from 'react';
import {
  Trash,
  X,
  UploadSimple as UploadCloud,
  MagnifyingGlass,
  UserCircle,
  Funnel,
  ArrowsDownUp,
  EyeSlash,
  Stack,
  Copy,
  Export,
  Archive,
  CaretDown as ChevronDown,
} from 'phosphor-react';
import { PersonAvatarItem } from './PersonAvatarItem';
import { getConditionsForType } from '../hooks';
import { Column, Row, TableGroup, FilterRule, SortRule } from '../types';

interface RoomTableToolbarProps {
  // i18n
  t: (key: string) => string;

  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Person filter
  isPersonFilterOpen: boolean;
  setIsPersonFilterOpen: (open: boolean) => void;
  personFilter: string | null;
  setPersonFilter: (person: string | null) => void;

  // Advanced filters
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;
  filters: FilterRule[];
  setFilters: React.Dispatch<React.SetStateAction<FilterRule[]>>;

  // Sort
  isSortPanelOpen: boolean;
  setIsSortPanelOpen: (open: boolean) => void;
  sortRules: SortRule[];
  setSortRules: React.Dispatch<React.SetStateAction<SortRule[]>>;

  // Hide columns
  isHideColumnsOpen: boolean;
  setIsHideColumnsOpen: (open: boolean) => void;
  hiddenColumns: Set<string>;
  setHiddenColumns: React.Dispatch<React.SetStateAction<Set<string>>>;
  columnSearchQuery: string;
  setColumnSearchQuery: (query: string) => void;

  // Clear data
  setIsClearDataModalOpen: (open: boolean) => void;

  // Data
  columns: Column[];
  rows: Row[];
  checkedRows: Set<string>;
  filteredTableGroups: TableGroup[];

  // Actions
  handleExportTable: () => void;
  handleImportClick: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;

  // Selection actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setDeleteConfig: (config: any) => void;
  onDeleteTask?: (groupId: string, taskId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateTasks?: (tasks: any[]) => void;
  setRows: React.Dispatch<React.SetStateAction<Row[]>>;

  // Custom actions
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  setIsChartModalOpen: (open: boolean) => void;
  setIsAIReportModalOpen: (open: boolean) => void;
  renderCustomActions?: (props: {
    setRows: React.Dispatch<React.SetStateAction<Row[]>>;
    setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
    setIsChartModalOpen: (open: boolean) => void;
    setIsAIReportModalOpen: (open: boolean) => void;
  }) => React.ReactNode;
}

export const RoomTableToolbar: React.FC<RoomTableToolbarProps> = ({
  t,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  isPersonFilterOpen,
  setIsPersonFilterOpen,
  personFilter,
  setPersonFilter,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  filters,
  setFilters,
  isSortPanelOpen,
  setIsSortPanelOpen,
  sortRules,
  setSortRules,
  isHideColumnsOpen,
  setIsHideColumnsOpen,
  hiddenColumns,
  setHiddenColumns,
  columnSearchQuery,
  setColumnSearchQuery,
  setIsClearDataModalOpen,
  columns,
  rows,
  checkedRows,
  filteredTableGroups,
  handleExportTable,
  handleImportClick,
  handleImport,
  fileInputRef,
  setDeleteConfig,
  onDeleteTask,
  onUpdateTasks,
  setRows,
  setColumns,
  setIsChartModalOpen,
  setIsAIReportModalOpen,
  renderCustomActions,
}) => (
  <div className="flex items-center min-h-[52px] border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-monday-dark-surface px-4 shrink-0 transition-colors z-20 gap-2">
    {/* Left: Action Icons */}
    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 relative flex-wrap">
      {/* Search - Expandable */}
      <div className="relative">
        <div
          className={`flex items-center gap-1.5 cursor-pointer transition-all duration-300 ease-out ${isSearchOpen ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700' : 'hover:text-blue-500'}`}
          onClick={() => {
            if (!isSearchOpen) {
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
                placeholder={t('search_this_board')}
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
              <span className="text-[13px] font-medium">{t('search')}</span>
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
              setIsFilterPanelOpen(false);
              setIsSortPanelOpen(false);
              setIsHideColumnsOpen(false);
              setIsSearchOpen(false);
            }
            setIsPersonFilterOpen(!isPersonFilterOpen);
          }}
        >
          <UserCircle size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('person')}</span>
        </div>
        {isPersonFilterOpen && (
          <div
            data-toolbar-panel
            className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]"
          >
            <div className="mb-3">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t('filter_by_person')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const allPeople = rows.flatMap((r) => {
                  const p = r.people;
                  if (Array.isArray(p)) return p;
                  if (p) return [p];
                  return [];
                });

                const uniquePeopleMap = new Map();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                allPeople.forEach((p: any) => {
                  const id = p.id || p.name || (typeof p === 'string' ? p : null);
                  if (id && !uniquePeopleMap.has(id)) {
                    uniquePeopleMap.set(id, p);
                  }
                });

                const uniquePeople = Array.from(uniquePeopleMap.values());

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return uniquePeople.map((person: any) => {
                  const isActive = personFilter === (person.name || person);

                  return (
                    <PersonAvatarItem
                      key={person.id || person.name || person}
                      person={person}
                      isActive={isActive}
                      onClick={() => {
                        setPersonFilter(isActive ? null : person.name || person);
                        setIsPersonFilterOpen(false);
                      }}
                    />
                  );
                });
              })()}

              {rows.every((r) => !r.people) && (
                <div
                  className="w-10 h-10 rounded-full border-2 border-stone-200 dark:border-stone-600 flex items-center justify-center"
                  title={t('no_assigned_users')}
                >
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
              setIsPersonFilterOpen(false);
              setIsSortPanelOpen(false);
              setIsHideColumnsOpen(false);
              setIsSearchOpen(false);
            }
            setIsFilterPanelOpen(!isFilterPanelOpen);
          }}
        >
          <Funnel size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('filter')}</span>
          <ChevronDown
            size={12}
            weight="regular"
            className={`opacity-50 transition-transform ${isFilterPanelOpen ? 'rotate-180' : ''}`}
          />
        </div>
        {isFilterPanelOpen && (
          <div
            data-toolbar-panel
            className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[600px]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {t('advanced_filters')}
                </span>
                <span className="text-xs text-stone-400">
                  {t('showing_items')
                    .replace('{0}', String(filteredTableGroups.reduce((acc, g) => acc + g.rows.length, 0)))
                    .replace('{1}', String(rows.length))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {filters.length > 0 && (
                  <button
                    onClick={() => setFilters([])}
                    className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 flex items-center gap-1"
                  >
                    {t('clear_all')}
                  </button>
                )}
                <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                  {t('save_as_new_view')}
                </button>
              </div>
            </div>

            {/* Filter Rules */}
            <div className="space-y-2 mb-3">
              {filters.map((filter, idx) => (
                <div key={filter.id} className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 w-12">{idx === 0 ? t('where') : t('and_condition')}</span>
                  <select
                    value={filter.column}
                    onChange={(e) => {
                      setFilters((prev) =>
                        prev.map((f) =>
                          f.id === filter.id ? { ...f, column: e.target.value, condition: '', value: '' } : f,
                        ),
                      );
                    }}
                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                  >
                    <option value="">{t('column_label')}</option>
                    {columns
                      .filter((c) => c.id !== 'select')
                      .map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                  </select>
                  <select
                    value={filter.condition}
                    onChange={(e) => {
                      setFilters((prev) =>
                        prev.map((f) => (f.id === filter.id ? { ...f, condition: e.target.value } : f)),
                      );
                    }}
                    className="w-40 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                  >
                    <option value="">{t('condition_label')}</option>
                    {filter.column &&
                      getConditionsForType(columns.find((c) => c.id === filter.column)?.type || 'text').map((cond) => (
                        <option key={cond.value} value={cond.value}>
                          {cond.label}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    placeholder={t('value_label')}
                    value={filter.value}
                    onChange={(e) => {
                      setFilters((prev) => prev.map((f) => (f.id === filter.id ? { ...f, value: e.target.value } : f)));
                    }}
                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                  />
                  <button
                    onClick={() => setFilters((prev) => prev.filter((f) => f.id !== filter.id))}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {filters.length === 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 w-12">{t('where')}</span>
                  <select className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                    <option>{t('column_label')}</option>
                  </select>
                  <select className="w-40 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                    <option>{t('condition_label')}</option>
                  </select>
                  <input
                    placeholder={t('value_label')}
                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700"
                    readOnly
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setFilters((prev) => [...prev, { id: `filter-${Date.now()}`, column: '', condition: '', value: '' }])
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('new_filter')}
              </button>
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
              setIsPersonFilterOpen(false);
              setIsFilterPanelOpen(false);
              setIsHideColumnsOpen(false);
              setIsSearchOpen(false);
            }
            setIsSortPanelOpen(!isSortPanelOpen);
          }}
        >
          <ArrowsDownUp size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('sort')}</span>
        </div>
        {isSortPanelOpen && (
          <div
            data-toolbar-panel
            className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[400px]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                {t('sort_by')}
                <span className="w-4 h-4 rounded-full border border-stone-300 text-[10px] flex items-center justify-center text-stone-400">
                  ?
                </span>
              </span>
              <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                {t('save_as_new_view')}
              </button>
            </div>

            <div className="space-y-2 mb-3">
              {sortRules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2">
                  <div className="text-stone-400 cursor-grab">⋮⋮</div>
                  <select
                    value={rule.column}
                    onChange={(e) => {
                      setSortRules((prev) =>
                        prev.map((r) => (r.id === rule.id ? { ...r, column: e.target.value } : r)),
                      );
                    }}
                    className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                  >
                    <option value="">{t('choose_column')}</option>
                    {columns
                      .filter((c) => c.id !== 'select')
                      .map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                  </select>
                  <select
                    value={rule.direction}
                    onChange={(e) => {
                      setSortRules((prev) =>
                        prev.map((r) => (r.id === rule.id ? { ...r, direction: e.target.value as 'asc' | 'desc' } : r)),
                      );
                    }}
                    className="w-36 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200"
                  >
                    <option value="asc">{t('ascending')}</option>
                    <option value="desc">{t('descending')}</option>
                  </select>
                  <button
                    onClick={() => setSortRules((prev) => prev.filter((r) => r.id !== rule.id))}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {sortRules.length === 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-stone-300">⋮⋮</div>
                  <select className="flex-1 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                    <option>{t('choose_column')}</option>
                  </select>
                  <select className="w-36 h-9 px-3 text-sm border border-stone-200 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-400">
                    <option>{t('ascending')}</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setSortRules((prev) => [...prev, { id: `sort-${Date.now()}`, column: '', direction: 'asc' }])
              }
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              {t('new_sort')}
            </button>
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
              setIsPersonFilterOpen(false);
              setIsFilterPanelOpen(false);
              setIsSortPanelOpen(false);
              setIsSearchOpen(false);
            }
            setIsHideColumnsOpen(!isHideColumnsOpen);
          }}
        >
          <EyeSlash size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('hide')}</span>
        </div>
        {isHideColumnsOpen && (
          <div
            data-toolbar-panel
            className="absolute top-full start-0 mt-3 bg-white dark:bg-stone-800 rounded-xl shadow-2xl border border-stone-100 dark:border-stone-700 p-5 z-50 min-w-[320px]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('display_columns')}</span>
              <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border border-stone-200 dark:border-stone-600 px-2 py-1 rounded">
                {t('save_as_new_view')}
              </button>
            </div>

            <div className="relative mb-3">
              <MagnifyingGlass size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder={t('find_columns')}
                value={columnSearchQuery}
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                className="w-full h-9 ps-8 pe-3 text-sm border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="space-y-1">
              {/* All columns toggle */}
              <label className="flex items-center gap-3 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hiddenColumns.size === 0}
                  onChange={() => {
                    if (hiddenColumns.size === 0) {
                      setHiddenColumns(
                        new Set(columns.filter((c) => c.id !== 'select' && c.id !== 'name').map((c) => c.id)),
                      );
                    } else {
                      setHiddenColumns(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{t('all_columns')}</span>
                <span className="text-xs text-stone-400 ml-auto">
                  {t('x_selected').replace(
                    '{0}',
                    String(columns.filter((c) => c.id !== 'select' && !hiddenColumns.has(c.id)).length),
                  )}
                </span>
              </label>

              {/* Individual columns */}
              {columns
                .filter((c) => c.id !== 'select')
                .filter(
                  (c) => columnSearchQuery === '' || c.label.toLowerCase().includes(columnSearchQuery.toLowerCase()),
                )
                .map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-3 py-1.5 ps-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(col.id)}
                      onChange={() => {
                        setHiddenColumns((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(col.id)) {
                            newSet.delete(col.id);
                          } else {
                            newSet.add(col.id);
                          }
                          return newSet;
                        });
                      }}
                      disabled={col.id === 'name'}
                      className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs ${
                        col.type === 'people'
                          ? 'bg-blue-500'
                          : col.type === 'status'
                            ? 'bg-emerald-500'
                            : col.type === 'date'
                              ? 'bg-amber-500'
                              : col.type === 'priority'
                                ? 'bg-purple-500'
                                : 'bg-stone-400'
                      }`}
                    >
                      {col.type === 'people'
                        ? '👤'
                        : col.type === 'status'
                          ? '▣'
                          : col.type === 'date'
                            ? '📅'
                            : col.type === 'priority'
                              ? '!'
                              : '≡'}
                    </div>
                    <span className="text-sm text-stone-700 dark:text-stone-200">{col.label}</span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Clear Data Button */}
      <div
        data-toolbar-button
        className="flex items-center gap-1.5 cursor-pointer transition-colors group hover:text-red-500"
        onClick={() => setIsClearDataModalOpen(true)}
      >
        <Trash size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
        <span className="text-[13px] font-medium">{t('clear')}</span>
      </div>

      {/* Group by */}
      <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors group">
        <Stack size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
        <span className="text-[13px] font-medium">{t('group_by')}</span>
      </div>

      {/* Selection Actions (Always Visible, Grey if disabled) */}
      <div className="flex items-center gap-2 ms-2 flex-shrink-0">
        <div className="h-5 w-px bg-stone-200 dark:bg-stone-800 mx-1" />

        <button
          disabled={checkedRows.size === 0}
          className={`flex items-center gap-1.5 transition-colors group ${
            checkedRows.size > 0
              ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
              : 'cursor-default text-stone-300 dark:text-stone-700'
          }`}
        >
          <Copy
            size={16}
            weight="regular"
            className={checkedRows.size > 0 ? 'group-hover:scale-110 transition-transform' : ''}
          />
          <span className="text-[13px] font-medium">{t('duplicate')}</span>
        </button>

        <button
          disabled={checkedRows.size === 0}
          className={`flex items-center gap-1.5 transition-colors group ${
            checkedRows.size > 0
              ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600'
              : 'cursor-default text-stone-300 dark:text-stone-700'
          }`}
        >
          <Archive
            size={16}
            weight="regular"
            className={checkedRows.size > 0 ? 'group-hover:scale-110 transition-transform' : ''}
          />
          <span className="text-[13px] font-medium">{t('archive')}</span>
        </button>

        <button
          disabled={checkedRows.size === 0}
          onClick={() => {
            if (checkedRows.size === 0) return;
            setDeleteConfig({
              isOpen: true,
              title: t('delete_x_items').replace('{0}', String(checkedRows.size)),
              description: t('this_action_cannot_be_undone'),
              onConfirm: () => {
                const rowsToDelete = rows.filter((r) => checkedRows.has(r.id));

                setRows((prev) => prev.filter((r) => !checkedRows.has(r.id)));

                if (onDeleteTask) {
                  rowsToDelete.forEach((row) => {
                    const groupId = row.groupId || row.status || 'To Do';
                    onDeleteTask(groupId, row.id);
                  });
                } else {
                  const newRows = rows.filter((r) => !checkedRows.has(r.id));
                  onUpdateTasks?.(newRows);
                }
              },
            });
          }}
          className={`flex items-center gap-1.5 transition-colors group ${
            checkedRows.size > 0
              ? 'cursor-pointer text-stone-600 dark:text-stone-300 hover:text-red-600'
              : 'cursor-default text-stone-300 dark:text-stone-700'
          }`}
        >
          <Trash
            size={16}
            weight="regular"
            className={checkedRows.size > 0 ? 'group-hover:scale-110 transition-transform' : ''}
          />
          <span className="text-[13px] font-medium">{t('delete')}</span>
        </button>

        <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />

        <button
          onClick={handleExportTable}
          className="flex items-center gap-1.5 transition-colors group cursor-pointer text-stone-600 dark:text-stone-300 hover:text-blue-600"
          title={
            checkedRows.size > 0
              ? t('export_selected_rows').replace('{0}', String(checkedRows.size))
              : t('export_all_rows')
          }
        >
          <Export size={16} weight="regular" className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('export_data')}</span>
        </button>

        <button
          onClick={handleImportClick}
          className="flex items-center gap-1.5 transition-colors group cursor-pointer text-stone-600 dark:text-stone-300 hover:text-green-600"
          title={t('import_from_file')}
        >
          <UploadCloud size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-[13px] font-medium">{t('import_data_btn')}</span>
        </button>
      </div>
    </div>

    <div className="flex-1 min-w-0" />

    {/* Right: Custom Actions */}
    <div className="flex items-center gap-4">
      {renderCustomActions &&
        renderCustomActions({
          setRows,
          setColumns,
          setIsChartModalOpen,
          setIsAIReportModalOpen,
        })}

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv, .xlsx, .xls" className="hidden" />
    </div>
  </div>
);
