/**
 * VirtualizedList - High-performance list component using react-window
 * Use for any list with 50+ items to maintain 60fps scrolling
 */
import React, { useCallback, useRef, useMemo, memo } from 'react';
import { FixedSizeList, VariableSizeList, ListChildComponentProps, areEqual } from 'react-window';
import AutoSizer from './AutoSizer';

// ============================================================================
// Types
// ============================================================================

interface VirtualizedListProps<T> {
    /** Items to render */
    items: T[];
    /** Height of each item (for FixedSizeList) */
    itemHeight?: number;
    /** Function to get height of each item (for VariableSizeList) */
    getItemHeight?: (index: number) => number;
    /** Render function for each item */
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    /** Optional key extractor */
    keyExtractor?: (item: T, index: number) => string;
    /** Extra items to render above/below viewport */
    overscanCount?: number;
    /** Container className */
    className?: string;
    /** Optional fixed width (otherwise uses AutoSizer) */
    width?: number;
    /** Optional fixed height (otherwise uses AutoSizer) */
    height?: number;
    /** Callback when scroll */
    onScroll?: (scrollTop: number) => void;
    /** Item data to pass to rows (for memoization) */
    itemData?: Record<string, unknown>;
}

interface RowProps<T> {
    index: number;
    style: React.CSSProperties;
    data: {
        items: T[];
        renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    };
}

// ============================================================================
// Row Component (Memoized)
// ============================================================================

const Row = memo(function Row<T>({ index, style, data }: RowProps<T>) {
    const { items, renderItem } = data;
    const item = items[index];
    return <>{renderItem(item, index, style)}</>;
}, areEqual);

// ============================================================================
// AutoSizer Component (Inline to avoid extra dependency)
// ============================================================================

interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
    className?: string;
}

function AutoSizerComponent({ children, className }: AutoSizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                setSize(prev => {
                    if (prev.width === width && prev.height === height) return prev;
                    return { width, height };
                });
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
            {size.width > 0 && size.height > 0 && children(size)}
        </div>
    );
}

// ============================================================================
// VirtualizedList Component
// ============================================================================

function VirtualizedListInner<T>({
    items,
    itemHeight = 40,
    getItemHeight,
    renderItem,
    overscanCount = 5,
    className = '',
    width: fixedWidth,
    height: fixedHeight,
    onScroll,
    itemData,
}: VirtualizedListProps<T>) {
    const listRef = useRef<FixedSizeList | VariableSizeList>(null);

    // Memoize item data to prevent unnecessary re-renders
    const data = useMemo(
        () => ({
            items,
            renderItem,
            ...itemData,
        }),
        [items, renderItem, itemData]
    );

    const handleScroll = useCallback(
        ({ scrollOffset }: { scrollOffset: number }) => {
            onScroll?.(scrollOffset);
        },
        [onScroll]
    );

    // Use VariableSizeList if getItemHeight is provided
    const ListComponent = getItemHeight ? VariableSizeList : FixedSizeList;

    const renderList = useCallback(
        (width: number, height: number) => {
            const listProps = {
                ref: listRef,
                width,
                height,
                itemCount: items.length,
                itemData: data,
                overscanCount,
                onScroll: handleScroll,
                className: 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
            };

            if (getItemHeight) {
                return (
                    <VariableSizeList
                        {...listProps}
                        itemSize={getItemHeight}
                        estimatedItemSize={itemHeight}
                    >
                        {Row as React.ComponentType<ListChildComponentProps>}
                    </VariableSizeList>
                );
            }

            return (
                <FixedSizeList {...listProps} itemSize={itemHeight}>
                    {Row as React.ComponentType<ListChildComponentProps>}
                </FixedSizeList>
            );
        },
        [items.length, data, overscanCount, handleScroll, getItemHeight, itemHeight]
    );

    // If fixed dimensions provided, use them directly
    if (fixedWidth && fixedHeight) {
        return (
            <div className={className}>
                {renderList(fixedWidth, fixedHeight)}
            </div>
        );
    }

    // Otherwise use AutoSizer
    return (
        <AutoSizerComponent className={className}>
            {({ width, height }) => renderList(width, height)}
        </AutoSizerComponent>
    );
}

// Export memoized version
export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

// ============================================================================
// VirtualizedGrid Component
// ============================================================================

interface VirtualizedGridProps<T> {
    items: T[];
    columnCount: number;
    rowHeight: number;
    renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
    className?: string;
    gap?: number;
}

function VirtualizedGridInner<T>({
    items,
    columnCount,
    rowHeight,
    renderItem,
    className = '',
    gap = 0,
}: VirtualizedGridProps<T>) {
    const rowCount = Math.ceil(items.length / columnCount);

    const renderRow = useCallback(
        (rowIndex: number, style: React.CSSProperties) => {
            const startIndex = rowIndex * columnCount;
            const rowItems = items.slice(startIndex, startIndex + columnCount);

            return (
                <div style={style} className="flex" key={rowIndex}>
                    {rowItems.map((item, colIndex) => {
                        const index = startIndex + colIndex;
                        const itemStyle: React.CSSProperties = {
                            flex: `0 0 calc(${100 / columnCount}% - ${gap}px)`,
                            marginRight: colIndex < rowItems.length - 1 ? gap : 0,
                        };
                        return (
                            <div key={index} style={itemStyle}>
                                {renderItem(item, index, {})}
                            </div>
                        );
                    })}
                </div>
            );
        },
        [items, columnCount, gap, renderItem]
    );

    return (
        <VirtualizedList
            items={Array.from({ length: rowCount }, (_, i) => i)}
            itemHeight={rowHeight + gap}
            renderItem={(rowIndex, _, style) => renderRow(rowIndex, style)}
            className={className}
        />
    );
}

export const VirtualizedGrid = memo(VirtualizedGridInner) as typeof VirtualizedGridInner;

// ============================================================================
// Utility: useVirtualScroll hook
// ============================================================================

interface UseVirtualScrollOptions {
    itemCount: number;
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
}

interface VirtualScrollState {
    startIndex: number;
    endIndex: number;
    offsetY: number;
    visibleItems: number;
}

export function useVirtualScroll({
    itemCount,
    itemHeight,
    containerHeight,
    overscan = 3,
}: UseVirtualScrollOptions): [VirtualScrollState, (scrollTop: number) => void] {
    const [scrollTop, setScrollTop] = React.useState(0);

    const state = useMemo((): VirtualScrollState => {
        const visibleItems = Math.ceil(containerHeight / itemHeight);
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            itemCount,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );
        const offsetY = startIndex * itemHeight;

        return { startIndex, endIndex, offsetY, visibleItems };
    }, [scrollTop, itemCount, itemHeight, containerHeight, overscan]);

    return [state, setScrollTop];
}

export default VirtualizedList;
