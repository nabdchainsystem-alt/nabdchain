import React from 'react';
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretDown as ChevronDown } from 'phosphor-react';
import { useAppContext } from '../../../../../contexts/AppContext';

interface TablePaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
    isLoading?: boolean;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    totalItems,
    pageSize,
    currentPage,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100, 200],
    isLoading = false
}) => {
    const { t } = useAppContext();
    const isShowingAll = pageSize === -1;
    const totalPages = isShowingAll ? 1 : Math.ceil(totalItems / pageSize);
    const startItem = isShowingAll ? 1 : (currentPage - 1) * pageSize + 1;
    const endItem = isShowingAll ? totalItems : Math.min(currentPage * pageSize, totalItems);

    // Warning threshold for "All" option
    const LARGE_DATASET_WARNING = 500;
    const showAllWarning = isShowingAll && totalItems > LARGE_DATASET_WARNING;

    // Handle page size change with confirmation for large datasets
    const handlePageSizeChange = (newSize: number) => {
        if (newSize === -1 && totalItems > LARGE_DATASET_WARNING) {
            // For very large datasets, confirm before showing all
            if (!window.confirm(t('show_all_warning')?.replace('{0}', String(totalItems)) || `Loading ${totalItems} rows may be slow. Continue?`)) {
                return;
            }
        }
        onPageSizeChange(newSize);
    };

    if (totalItems === 0) return null;

    return (
        <div className={`sticky bottom-0 z-40 flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm text-xs text-stone-600 dark:text-stone-400 font-sans shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)] ${isLoading ? 'opacity-70' : ''} transition-opacity`}>
            {/* Left: Info */}
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                    {isLoading && (
                        <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {t('showing_items').replace('{0}', `${startItem}-${endItem}`).replace('{1}', String(totalItems))}
                </span>

                <div className="flex items-center gap-2">
                    <span>{t('rows_per_page')}:</span>
                    <div className="relative group">
                        <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="appearance-none bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 rounded px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                            <option value={-1}>{t('all') || 'All'}{totalItems > LARGE_DATASET_WARNING ? ` (${totalItems})` : ''}</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                    </div>
                    {showAllWarning && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                            {t('large_dataset_note') || 'Large dataset - may be slow'}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Navigation - Hide when showing all */}
            {!isShowingAll && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>

                    {/* Page Numbers - Limited to max 3 buttons near current page */}
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 3) {
                            if (currentPage <= 2) pageNum = i + 1;
                            else if (currentPage >= totalPages - 1) pageNum = totalPages - 2 + i;
                            else pageNum = currentPage - 1 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`
                                    min-w-[28px] h-[28px] flex items-center justify-center rounded-md border text-[11px] font-medium transition-colors
                                    ${currentPage === pageNum
                                        ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm'
                                        : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'}
                                `}
                            >
                                {pageNum}
                            </button>
                        )
                    })}

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
