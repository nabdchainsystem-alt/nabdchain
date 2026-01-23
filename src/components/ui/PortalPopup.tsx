import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalPopupProps {
    children: React.ReactNode;
    triggerRef: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    align?: 'start' | 'end' | 'center';
    side?: 'bottom' | 'top' | 'left' | 'right';
}

export const PortalPopup: React.FC<PortalPopupProps> = ({
    children,
    triggerRef,
    onClose,
    align = 'start',
    side = 'bottom'
}) => {
    const [coords, setCoords] = useState<{ top: number, left: number } | null>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (triggerRef.current) { // We can't strictly depend on contentRef appearing immediately for first render if we hide it?
            // Actually, we render children always but maybe offscreen or just assume we need double render?
            // Standard portal pattern: render, measure, position.
            // But to avoid flash, we might want to render invisible first.
            // For now, let's just use the logic. If contentRef is null, we can't measure children.
            // But this hook runs after render. So contentRef.current SHOULD be populated if we attach it.

            // We need to force a re-calc if contentRef changes or size changes.
            // ResizeObserver could be used, but simple layout effect might be enough for initial show.
        }
    });

    useLayoutEffect(() => {
        const calculatePosition = () => {
            if (!triggerRef.current || !contentRef.current) return;

            const triggerRect = triggerRef.current.getBoundingClientRect();
            const contentRect = contentRef.current.getBoundingClientRect();

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = 0;
            let left = 0;

            const GAP = 4;
            const VIEWPORT_PADDING = 12; // Increased from 10 for better visual spacing

            // Initial Position (Viewport Relative)
            if (side === 'bottom') {
                top = triggerRect.bottom + GAP;
                if (align === 'start') left = triggerRect.left;
                else if (align === 'end') left = triggerRect.right - contentRect.width;
                else left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
            } else if (side === 'top') {
                top = triggerRect.top - contentRect.height - GAP;
                if (align === 'start') left = triggerRect.left;
                else if (align === 'end') left = triggerRect.right - contentRect.width;
                else left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
            } else if (side === 'right') {
                left = triggerRect.right + GAP;
                top = triggerRect.top;
            } else if (side === 'left') {
                left = triggerRect.left - contentRect.width - GAP;
                top = triggerRect.top;
            }

            // --- Viewport Constraints (Enhanced) ---

            // 1. Horizontal - ensure content never extends beyond viewport
            const maxLeft = viewportWidth - contentRect.width - VIEWPORT_PADDING;
            const minLeft = VIEWPORT_PADDING;

            if (left > maxLeft) {
                left = maxLeft;
            }
            if (left < minLeft) {
                left = minLeft;
            }

            // 2. Vertical
            const contentHeight = contentRect.height;
            const fitsBelow = (top + contentHeight <= viewportHeight - VIEWPORT_PADDING);

            // Check flip needed
            if (side === 'bottom' && !fitsBelow) {
                // Check if it fits above
                const fitsAbove = triggerRect.top - contentHeight - GAP > VIEWPORT_PADDING;
                if (fitsAbove) {
                    top = triggerRect.top - contentHeight - GAP;
                } else {
                    // Clamp to bottom
                    top = viewportHeight - contentHeight - VIEWPORT_PADDING;
                }
            } else if (side === 'top' && top < VIEWPORT_PADDING) {
                // Check if fits below
                if (triggerRect.bottom + contentHeight + GAP <= viewportHeight - VIEWPORT_PADDING) {
                    top = triggerRect.bottom + GAP;
                } else {
                    top = VIEWPORT_PADDING; // Clamp to top
                }
            }

            // Final safety clamp for fixed positioning
            const maxTop = viewportHeight - contentHeight - VIEWPORT_PADDING;
            if (top > maxTop) top = maxTop;
            if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;

            setCoords({ top, left });
        };

        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        window.addEventListener('scroll', calculatePosition, true);

        // Add ResizeObserver to handle content size changes (e.g. date picker switching months or loading)
        let resizeObserver: ResizeObserver | null = null;
        if (contentRef.current) {
            resizeObserver = new ResizeObserver(() => {
                calculatePosition();
            });
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition, true);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [triggerRef, align, side, children]); // Add children dependency to re-measure if content changes

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9998] w-screen h-screen bg-transparent" onClick={(e) => {
                e.stopPropagation();
                onClose();
            }} />
            <div
                ref={contentRef}
                style={{
                    position: 'fixed',
                    top: coords?.top ?? 0,
                    left: coords?.left ?? 0,
                    opacity: coords ? 1 : 0,
                    visibility: coords ? 'visible' : 'hidden',
                    transition: 'opacity 0.1s ease-out',
                    zIndex: 9999
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
};
