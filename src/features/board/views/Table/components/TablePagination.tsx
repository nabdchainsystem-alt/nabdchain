import React from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface TablePaginationProps {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    pageSizeOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
    totalItems,
    pageSize,
    currentPage,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 25, 50, 100]
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-600 dark:text-stone-400 font-sans">
            {/* Left: Info */}
            <div className="flex items-center gap-4">
                <span>
                    Showing <span className="font-semibold text-stone-900 dark:text-stone-200">{startItem}-{endItem}</span> of <span className="font-semibold text-stone-900 dark:text-stone-200">{totalItems}</span>
                </span>

                <div className="flex items-center gap-2">
                    <span>Rows per page:</span>
                    <div className="relative group">
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="appearance-none bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 rounded px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" />
                    </div>
                </div>
            </div>

            {/* Right: Navigation */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={14} />
                </button>

                {/* Page Numbers - Simplified for now: just Show max 5 page buttons around current */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to center current page
                    let p = i + 1;
                    if (totalPages > 5) {
                        if (currentPage > 3) p = currentPage - 2 + i;
                        if (p > totalPages) p = totalPages - 4 + i;
                    }

                    // Simple clamp if near end
                    if (currentPage > totalPages - 2) {
                        // handled by shifting window
                    }

                    // Actually, let's keep it simple: just show generic range logic or just all if small
                    // Re-implementing a simple sliding window
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                        if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
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
        </div>
    );
};
