import { useMemo } from 'react';

interface UsePopupPositionProps {
    triggerRect?: DOMRect;
    menuHeight?: number;
    menuWidth?: number;
    offset?: number;
}

interface PopupPositionStyle {
    position: 'fixed';
    top?: number;
    bottom?: number;
    left?: number;
    maxHeight?: number;
    display?: string;
}

export function usePopupPosition({
    triggerRect,
    menuHeight = 250,
    menuWidth = 256,
    offset = 4
}: UsePopupPositionProps): PopupPositionStyle {
    // Use useMemo with actual rect values as dependencies for reliable recalculation
    return useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };
        return calculatePosition(triggerRect, menuHeight, menuWidth, offset);
    }, [
        triggerRect?.top,
        triggerRect?.bottom,
        triggerRect?.left,
        triggerRect?.right,
        menuHeight,
        menuWidth,
        offset
    ]);
}

function calculatePosition(
    triggerRect: DOMRect,
    menuHeight: number,
    menuWidth: number,
    offset: number
): PopupPositionStyle {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const spaceBelow = windowHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Determine vertical position
    const openUp = spaceBelow < menuHeight && spaceAbove > menuHeight;

    // Calculate horizontal position - clamp to keep popup within viewport
    const minLeft = 10;
    const maxLeft = windowWidth - menuWidth - 10;
    const left = Math.max(minLeft, Math.min(triggerRect.left, maxLeft));

    if (openUp) {
        return {
            position: 'fixed',
            bottom: windowHeight - triggerRect.top + offset,
            left,
            maxHeight: spaceAbove - 10
        };
    }

    return {
        position: 'fixed',
        top: triggerRect.bottom + offset,
        left,
        maxHeight: spaceBelow - 10
    };
}
