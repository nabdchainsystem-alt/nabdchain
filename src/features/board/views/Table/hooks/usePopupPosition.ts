import { useMemo } from 'react';

interface UsePopupPositionProps {
    triggerRect?: DOMRect;
    menuHeight?: number;
    menuWidth?: number;
    offset?: number;
    side?: 'bottom' | 'top' | 'left' | 'right';
    align?: 'start' | 'end' | 'center';
    isRtl?: boolean;
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
    offset = 4,
    side = 'bottom',
    align = 'start',
    isRtl = false
}: UsePopupPositionProps): PopupPositionStyle {
    // Use useMemo with actual rect values as dependencies for reliable recalculation
    return useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };
        return calculatePosition(triggerRect, menuHeight, menuWidth, offset, side, align, isRtl);
    }, [
        triggerRect?.top,
        triggerRect?.bottom,
        triggerRect?.left,
        triggerRect?.right,
        menuHeight,
        menuWidth,
        offset,
        side,
        align,
        isRtl
    ]);
}

function calculatePosition(
    triggerRect: DOMRect,
    menuHeight: number,
    menuWidth: number,
    offset: number,
    side: 'bottom' | 'top' | 'left' | 'right' = 'bottom',
    align: 'start' | 'end' | 'center' = 'start',
    isRtl: boolean = false
): PopupPositionStyle {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const spaceBelow = windowHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const spaceRight = windowWidth - triggerRect.right;
    const spaceLeft = triggerRect.left;

    let finalSide = side;

    // --- Side Flip Logic ---
    if (side === 'bottom' && spaceBelow < menuHeight && spaceAbove > menuHeight) {
        finalSide = 'top';
    } else if (side === 'top' && spaceAbove < offset && spaceBelow > menuHeight) {
        finalSide = 'bottom';
    } else if (side === 'right') {
        if (spaceRight < menuWidth && spaceLeft > menuWidth) {
            finalSide = 'left';
        }
    } else if (side === 'left') {
        if (spaceLeft < menuWidth && spaceRight > menuWidth) {
            finalSide = 'right';
        }
    }

    // --- Calculate Coordinates based on Final Side ---

    if (finalSide === 'right') {
        let top = triggerRect.top;
        // Adjust vertical alignment if needed (align='start' implies top aligned)
        // If it goes off bottom, push it up
        if (top + menuHeight > windowHeight - 10) {
            top = Math.max(10, windowHeight - menuHeight - 10);
        }

        return {
            position: 'fixed',
            top,
            left: triggerRect.right + offset,
            maxHeight: windowHeight - 20
        };
    }

    if (finalSide === 'left') {
        let top = triggerRect.top;
        if (top + menuHeight > windowHeight - 10) {
            top = Math.max(10, windowHeight - menuHeight - 10);
        }

        return {
            position: 'fixed',
            top,
            left: triggerRect.left - menuWidth - offset,
            maxHeight: windowHeight - 20
        };
    }

    // Vertical Positioning (Bottom/Top)
    // Horizontal Alignment
    let left = triggerRect.left;
    const effectiveAlign = isRtl
        ? (align === 'start' ? 'end' : align === 'end' ? 'start' : 'center')
        : align;

    if (effectiveAlign === 'center') {
        left = triggerRect.left + (triggerRect.width / 2) - (menuWidth / 2);
    } else if (effectiveAlign === 'end') {
        left = triggerRect.right - menuWidth;
    } else {
        // align === 'start'
        left = triggerRect.left;
    }

    // Horizontal Clamp
    const minLeft = 10;
    const maxLeft = windowWidth - menuWidth - 10;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    if (finalSide === 'top') {
        return {
            position: 'fixed',
            bottom: windowHeight - triggerRect.top + offset,
            left,
            maxHeight: spaceAbove - 10
        };
    }

    // Default to bottom
    return {
        position: 'fixed',
        top: triggerRect.bottom + offset,
        left,
        maxHeight: spaceBelow - 10
    };
}
