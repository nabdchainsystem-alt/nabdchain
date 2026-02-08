/**
 * useToolbarState — Manages search, filter, sort, and hide-columns toolbar state
 *
 * Consolidates the 12+ toolbar-related useState declarations from RoomTable
 * into a single hook with a clean API.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { FilterRule, SortRule } from '../types';

export function useToolbarState() {
  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Person filter
  const [isPersonFilterOpen, setIsPersonFilterOpen] = useState(false);
  const [personFilter, setPersonFilter] = useState<string | null>(null);

  // Advanced filters
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<FilterRule[]>([]);

  // Sort
  const [isSortPanelOpen, setIsSortPanelOpen] = useState(false);
  const [sortRules, setSortRules] = useState<SortRule[]>([]);

  // Hide columns
  const [isHideColumnsOpen, setIsHideColumnsOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnSearchQuery, setColumnSearchQuery] = useState('');

  // Body visibility toggle
  const [isBodyVisible, setIsBodyVisible] = useState(true);

  // Clear data modal
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  // Close all panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.toolbar-panel') && !target.closest('.toolbar-trigger')) {
        setIsFilterPanelOpen(false);
        setIsSortPanelOpen(false);
        setIsHideColumnsOpen(false);
        setIsPersonFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => {
      if (!prev) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery('');
      }
      return !prev;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters([]);
    setSortRules([]);
    setPersonFilter(null);
    setSearchQuery('');
    setIsSearchOpen(false);
    setHiddenColumns(new Set());
  }, []);

  return {
    // Search
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    searchInputRef,
    toggleSearch,

    // Person filter
    isPersonFilterOpen,
    setIsPersonFilterOpen,
    personFilter,
    setPersonFilter,

    // Advanced filters
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    filters,
    setFilters,

    // Sort
    isSortPanelOpen,
    setIsSortPanelOpen,
    sortRules,
    setSortRules,

    // Hide columns
    isHideColumnsOpen,
    setIsHideColumnsOpen,
    hiddenColumns,
    setHiddenColumns,
    columnSearchQuery,
    setColumnSearchQuery,

    // Body visibility
    isBodyVisible,
    setIsBodyVisible,

    // Clear data
    isClearDataModalOpen,
    setIsClearDataModalOpen,

    // Bulk clear
    clearAllFilters,
  };
}
