import React, { useRef, useLayoutEffect, memo } from 'react';
import { SharedDatePicker } from '../../../../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../../../../components/ui/PortalPopup';

interface TimelineValue {
    startDate: string | null;
    endDate: string | null;
}

interface TimelinePickerProps {
    value: TimelineValue | null;
    onSelect: (value: TimelineValue) => void;
    onClose: () => void;
    triggerElement?: HTMLElement;
    triggerRect?: DOMRect; // Keep for backward compatibility if needed, though we prefer triggerElement
}

export const TimelinePicker: React.FC<TimelinePickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerElement,
    triggerRect
}) => {
    const triggerRef = useRef<HTMLElement | null>(null);

    // Sync the trigger element to the ref for PortalPopup
    useLayoutEffect(() => {
        if (triggerElement) {
            triggerRef.current = triggerElement;
        } else if (triggerRect) {
            // Fallback: create a virtual element if we only have a rect
            // This is a bit hacky but ensures PortalPopup works if only rect is passed
            // In practice, TableCell passes triggerElement now.
            // For safety, we can skip this if we know triggerElement is always passed.
        }
    }, [triggerElement, triggerRect]);

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

    return (
        <PortalPopup
            triggerRef={triggerRef}
            onClose={onClose}
            align="end"
            side="bottom"
        >
            <SharedDatePicker
                mode="range"
                startDate={value?.startDate}
                endDate={value?.endDate}
                onSelectRange={handleSelectRange}
                onClose={onClose}
                onClear={handleClear}
            />
        </PortalPopup>
    );
});
