import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Check } from 'lucide-react';

interface PeoplePickerProps {
    onSelect: (person: { id: string; name: string; avatar?: string } | null) => void;
    onClose: () => void;
    current: { id: string; name: string } | null;
    triggerRect?: DOMRect;
}

// Mock Data
export const MOCK_PEOPLE = [
    { id: '1', name: 'Max Mustermann', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: '3', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: '4', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?u=4' },
];

export const PeoplePicker: React.FC<PeoplePickerProps> = ({ onSelect, onClose, current, triggerRect }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [positionStyle, setPositionStyle] = useState<React.CSSProperties>(() => {
        if (triggerRect) {
            const menuHeight = 250;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            if (openUp) {
                return {
                    bottom: window.innerHeight - triggerRect.top - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                };
            } else {
                return {
                    top: triggerRect.bottom - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                };
            }
        }
        return { display: 'none' };
    });

    useLayoutEffect(() => {
        if (triggerRect) {
            const menuHeight = 250;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const openUp = spaceBelow < menuHeight && triggerRect.top > menuHeight;

            if (openUp) {
                setPositionStyle({
                    bottom: window.innerHeight - triggerRect.top - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                });
            } else {
                setPositionStyle({
                    top: triggerRect.bottom - 4,
                    left: triggerRect.left,
                    position: 'fixed'
                });
            }
        }
    }, [triggerRect]);

    const content = (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl overflow-hidden w-64 p-1 animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                <div className="px-3 py-2 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-100 dark:border-stone-800 mb-1">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-400">Assign To</span>
                </div>

                <div className="max-h-60 overflow-y-auto">
                    {MOCK_PEOPLE.map(person => {
                        const isSelected = current?.id === person.id;
                        return (
                            <button
                                key={person.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // console.log('PeoplePicker: Clicked person', person.name); 
                                    onSelect(person);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-start rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                            >
                                <img src={person.avatar} alt={person.name} className="w-6 h-6 rounded-full bg-stone-200 object-cover" />
                                <span className="flex-1 truncate text-stone-700 dark:text-stone-200">{person.name}</span>
                                {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
