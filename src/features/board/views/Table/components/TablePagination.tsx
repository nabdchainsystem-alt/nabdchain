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
    pageSizeOptions = [5, 10, 25, 50]
}) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="sticky bottom-0 z-40 flex items-center justify-between px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm text-xs text-stone-600 dark:text-stone-400 font-sans shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
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
        </div>
    );
};
