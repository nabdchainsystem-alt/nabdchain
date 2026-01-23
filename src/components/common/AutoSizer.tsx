/**
 * AutoSizer - Automatically detects parent container size
 * Used for virtualized lists that need dynamic dimensions
 */
import React, { useRef, useState, useEffect, memo } from 'react';

interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    /** Minimum width */
    minWidth?: number;
    /** Minimum height */
    minHeight?: number;
    /** Debounce resize events (ms) */
    debounce?: number;
}

function AutoSizerInner({
    children,
    className = '',
    style,
    minWidth = 0,
    minHeight = 0,
    debounce = 0,
}: AutoSizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const { clientWidth, clientHeight } = container;
            const width = Math.max(clientWidth, minWidth);
            const height = Math.max(clientHeight, minHeight);

            setSize(prev => {
                if (prev.width === width && prev.height === height) return prev;
                return { width, height };
            });
        };

        // Initial size
        updateSize();

        // Use ResizeObserver for efficient resize detection
        const observer = new ResizeObserver(() => {
            if (debounce > 0) {
                if (debounceRef.current) {
                    clearTimeout(debounceRef.current);
                }
                debounceRef.current = setTimeout(updateSize, debounce);
            } else {
                updateSize();
            }
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [minWidth, minHeight, debounce]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                ...style,
            }}
        >
            {size.width > 0 && size.height > 0 && children(size)}
        </div>
    );
}

export const AutoSizer = memo(AutoSizerInner);
export default AutoSizer;
