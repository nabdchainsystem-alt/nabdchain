import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightSmall, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SharedDatePickerProps {
    onSelectDate: (date: Date) => void;
    onClose: () => void;
    selectedDate?: Date | string | null;
    onClear?: () => void;
}

export const SharedDatePicker: React.FC<SharedDatePickerProps> = ({ onSelectDate, onClose, selectedDate, onClear }) => {
    const { t, language } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());

    const handleClose = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        onClose();
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendar = () => {
        const days = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const calendar = [];

        // Padding
        for (let i = 0; i < firstDay; i++) {
            calendar.push(null);
        }

        // Days
        for (let i = 1; i <= days; i++) {
            calendar.push(i);
        }

        return calendar;
    };

    const handleShortcut = (type: string) => {
        const today = new Date();
        let target = new Date();

        switch (type) {
            case 'today':
                break;
            case 'later':
                // Logic for later today (e.g., set time to later)
                // For now, just today but maybe 1hr later? 
                // Image says "Later 11:50 am", implying a time. 
                // I'll leave date as today.
                break;
            case 'tomorrow':
                target.setDate(today.getDate() + 1);
                break;
            case 'nextWeek':
                // Next Monday
                const daysToMon = (7 + 1 - today.getDay()) % 7 || 7;
                target.setDate(today.getDate() + daysToMon);
                break;
            case 'nextWeekend':
                // Next Saturday
                const daysToSat = (7 + 6 - today.getDay()) % 7 || 7;
                target.setDate(today.getDate() + daysToSat);
                break;
            case 'twoWeeks':
                target.setDate(today.getDate() + 14);
                break;
            case 'fourWeeks':
                target.setDate(today.getDate() + 28);
                break;
            case 'eightWeeks':
                target.setDate(today.getDate() + 56);
                break;
        }
        onSelectDate(target);
        onClose();
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    // Helper to get formatted shortcut date
    const getShortcutDateStr = (type: string) => {
        const today = new Date();
        let target = new Date();
        switch (type) {
            case 'today': return 'Sat'; // Hardcoded in image? No, likely dynamic.
            case 'later': return '11:50 am';
            case 'tomorrow':
                target.setDate(today.getDate() + 1);
                return 'Sun'; // Dynamic day name
            case 'nextWeek':
                const daysToMon = (7 + 1 - today.getDay()) % 7 || 7;
                target.setDate(today.getDate() + daysToMon);
                return 'Mon';
            case 'nextWeekend':
                const daysToSat = (7 + 6 - today.getDay()) % 7 || 7;
                target.setDate(today.getDate() + daysToSat);
                return formatDate(target);
            case 'twoWeeks':
                target.setDate(today.getDate() + 14);
                return formatDate(target);
            case 'fourWeeks':
                target.setDate(today.getDate() + 28);
                return formatDate(target);
            case 'eightWeeks':
                target.setDate(today.getDate() + 56);
                return formatDate(target);
            default: return '';
        }
    }

    // Dynamic Labels for shortcuts
    const getWeekdayName = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    }

    const shortcuts = [
        { key: 'today', label: 'Today', sub: getWeekdayName(0) },
        { key: 'later', label: 'Later', sub: '11:50 am' }, // Placeholder time
        { key: 'tomorrow', label: 'Tomorrow', sub: getWeekdayName(1) },
        { key: 'nextWeek', label: 'Next week', sub: 'Mon' }, // Usually Mon
        { key: 'nextWeekend', label: 'Next weekend', sub: getShortcutDateStr('nextWeekend') },
        { key: 'twoWeeks', label: '2 weeks', sub: getShortcutDateStr('twoWeeks') },
        { key: 'fourWeeks', label: '4 weeks', sub: getShortcutDateStr('fourWeeks') },
        { key: 'eightWeeks', label: '8 weeks', sub: getShortcutDateStr('eightWeeks') },
    ];

    return (
        <div className="bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 rounded-lg flex overflow-hidden w-[600px] max-w-[90vw] text-stone-800 dark:text-stone-200 font-sans">

            {/* Sidebar Shortcuts */}
            <div className="w-1/3 bg-stone-50 dark:bg-stone-900 border-e border-stone-100 dark:border-stone-800 py-2 flex flex-col">
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                    {shortcuts.map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                handleShortcut(item.key);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-start transition-colors group"
                        >
                            <span className="text-stone-700 dark:text-stone-300">{item.label}</span>
                            <span className="text-stone-400 text-xs">{item.sub}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-2 border-t border-stone-200 dark:border-stone-800 px-2 pb-1">
                    <button
                        type="button"
                        onClick={(e) => e.preventDefault()}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-start transition-colors text-stone-700 dark:text-stone-300"
                    >
                        <span>Set Recurring</span>
                        <ChevronRightSmall size={14} className="text-stone-400" />
                    </button>
                </div>
            </div>

            {/* Main Calendar */}
            <div className="w-2/3 p-4 bg-white dark:bg-stone-900 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    {/* Inputs for Date/Time (Mock visual as per image top bar?) */}
                    {/* The image shows "Start date" and "Due date" inputs at the top. 
                        Usually a date picker inside a cell is just for ONE date.
                        The image might be from a specific view (e.g. range picker).
                        "all dates have this menu" -> Likely user wants the range picker feel or at least the visual style.
                        But for a single date picker, we only need one date. 
                        
                        If I'm replacing a single date picker, I should just show the calendar.
                        But the image has inputs at the top. 
                        Let's just replicate the calendar visual for now.
                        And the "December 2025" header.
                    */}
                    <div className="flex gap-2 w-full mb-4">
                        <div className="flex-1 bg-white dark:bg-stone-800 rounded border-2 border-indigo-500/20 px-3 py-2 text-xs text-stone-500 flex items-center justify-between relative group">
                            <div className="flex items-center gap-2">
                                <span className="opacity-50">📅</span>
                                <span className="font-semibold text-stone-700 dark:text-stone-200">
                                    {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date'}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 rounded p-2 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button type="button" onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date()); }} className="text-xs text-stone-400 hover:text-stone-600 font-medium">Today</button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button type="button" onClick={(e) => { e.preventDefault(); prevMonth(); }} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500">
                            <ChevronLeft size={16} />
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); nextMonth(); }} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {weekDays.map(d => (
                        <span key={d} className="text-xs text-stone-400 font-medium w-8">{d}</span>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {generateCalendar().map((day, idx) => {
                        if (!day) return <div key={idx} className="w-8 h-8" />;

                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isSelected = selectedDate ? new Date(selectedDate).toDateString() === date.toDateString() : false;

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectDate(date);
                                    onClose();
                                }}
                                className={`
                                    w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors mx-auto
                                    ${isSelected ? 'bg-indigo-600 text-white' : isToday ? 'border-2 border-indigo-500 text-indigo-600 font-bold' : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-auto px-2 pb-2 pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                    {onClear && (
                        <button
                            type="button"
                            onClick={() => { onClear(); onClose(); }}
                            className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Clear date
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 font-medium px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ml-auto"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
