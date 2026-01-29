import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SharedDatePicker } from '../../../../../../components/ui/SharedDatePicker';

interface TimelineValue {
    startDate: string | null;
    endDate: string | null;
}

interface TimelinePickerProps {
    value: TimelineValue | null;
    onSelect: (value: TimelineValue) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

export const TimelinePicker: React.FC<TimelinePickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect
}) => {
    const MENU_WIDTH = 300;
    const MENU_HEIGHT = 350;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Calculate available space in each direction
        const spaceRight = windowWidth - triggerRect.left;
        const spaceLeft = triggerRect.right;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        // Determine horizontal position
        let left: number | undefined;
        let right: number | undefined;

        if (spaceRight >= MENU_WIDTH + PADDING) {
            left = Math.max(PADDING, triggerRect.left);
        } else if (spaceLeft >= MENU_WIDTH + PADDING) {
            right = Math.max(PADDING, windowWidth - triggerRect.right);
        } else {
            left = Math.max(PADDING, (windowWidth - MENU_WIDTH) / 2);
        }

        if (left !== undefined && left + MENU_WIDTH > windowWidth - PADDING) {
            left = windowWidth - MENU_WIDTH - PADDING;
        }

        // Determine vertical position
        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
        };

        if (openUp) {
            return {
                ...baseStyle,
                bottom: windowHeight - triggerRect.top + 4,
                ...(left !== undefined ? { left } : { right }),
            };
        }

        return {
            ...baseStyle,
            top: triggerRect.bottom + 4,
            ...(left !== undefined ? { left } : { right }),
        };
    }, [triggerRect]);

    const handleSelectRange = (start: Date | null, end: Date | null) => {
        onSelect({
            startDate: start ? start.toISOString() : null,
            endDate: end ? end.toISOString() : null,
        });
    };

    const handleClear = () => {
        onSelect({ startDate: null, endDate: null });
        onClose();
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div style={positionStyle}>
                <SharedDatePicker
                    mode="range"
                    startDate={value?.startDate}
                    endDate={value?.endDate}
                    onSelectRange={handleSelectRange}
                    onClose={onClose}
                    onClear={handleClear}
                />
            </div>
        </>
    );

    return createPortal(content, document.body);
};
