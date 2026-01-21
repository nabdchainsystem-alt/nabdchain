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
    right?: number;
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

    // Check if menu would overflow on the right when positioned at trigger's left edge
    const wouldOverflowRight = triggerRect.left + menuWidth > windowWidth - 10;

    // Determine vertical position
    const openUp = spaceBelow < menuHeight && spaceAbove > menuHeight;

    // Calculate horizontal position
    let left: number | undefined;
    let right: number | undefined;

    if (wouldOverflowRight) {
        // Position from the right - align popup's right edge with trigger's right edge
        // But ensure it doesn't go off the left side
        const rightOffset = windowWidth - triggerRect.right;
        if (rightOffset + menuWidth > windowWidth - 10) {
            // Menu would overflow left, just position from right edge of window
            right = 10;
        } else {
            right = rightOffset;
        }
    } else {
        left = triggerRect.left;
    }

    if (openUp) {
        return {
            position: 'fixed',
            bottom: windowHeight - triggerRect.top + offset,
            left,
            right,
            maxHeight: spaceAbove - 10
        };
    }

    return {
        position: 'fixed',
        top: triggerRect.bottom + offset,
        left,
        right,
        maxHeight: spaceBelow - 10
    };
}
