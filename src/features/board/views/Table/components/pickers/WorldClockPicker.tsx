import React, { useState, useMemo, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Globe, MagnifyingGlass, Clock } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

interface WorldClockPickerProps {
    value: string | null; // timezone ID like 'America/New_York'
    onSelect: (timezone: string | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

// Common timezones with display info
const TIMEZONES = [
    { id: 'UTC', label: 'UTC', city: 'Coordinated Universal Time', offset: '+00:00' },
    { id: 'America/New_York', label: 'Eastern Time', city: 'New York', offset: '-05:00' },
    { id: 'America/Chicago', label: 'Central Time', city: 'Chicago', offset: '-06:00' },
    { id: 'America/Denver', label: 'Mountain Time', city: 'Denver', offset: '-07:00' },
    { id: 'America/Los_Angeles', label: 'Pacific Time', city: 'Los Angeles', offset: '-08:00' },
    { id: 'America/Sao_Paulo', label: 'Brasilia Time', city: 'São Paulo', offset: '-03:00' },
    { id: 'Europe/London', label: 'GMT', city: 'London', offset: '+00:00' },
    { id: 'Europe/Paris', label: 'Central European', city: 'Paris', offset: '+01:00' },
    { id: 'Europe/Berlin', label: 'Central European', city: 'Berlin', offset: '+01:00' },
    { id: 'Europe/Moscow', label: 'Moscow Time', city: 'Moscow', offset: '+03:00' },
    { id: 'Asia/Dubai', label: 'Gulf Standard', city: 'Dubai', offset: '+04:00' },
    { id: 'Asia/Riyadh', label: 'Arabia Standard', city: 'Riyadh', offset: '+03:00' },
    { id: 'Asia/Kolkata', label: 'India Standard', city: 'Mumbai', offset: '+05:30' },
    { id: 'Asia/Singapore', label: 'Singapore Time', city: 'Singapore', offset: '+08:00' },
    { id: 'Asia/Hong_Kong', label: 'Hong Kong Time', city: 'Hong Kong', offset: '+08:00' },
    { id: 'Asia/Shanghai', label: 'China Standard', city: 'Shanghai', offset: '+08:00' },
    { id: 'Asia/Tokyo', label: 'Japan Standard', city: 'Tokyo', offset: '+09:00' },
    { id: 'Asia/Seoul', label: 'Korea Standard', city: 'Seoul', offset: '+09:00' },
    { id: 'Australia/Sydney', label: 'Australian Eastern', city: 'Sydney', offset: '+11:00' },
    { id: 'Pacific/Auckland', label: 'New Zealand', city: 'Auckland', offset: '+13:00' },
    { id: 'Africa/Cairo', label: 'Eastern European', city: 'Cairo', offset: '+02:00' },
    { id: 'Africa/Johannesburg', label: 'South Africa', city: 'Johannesburg', offset: '+02:00' },
];

const getTimeInTimezone = (timezone: string): string => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date());
    } catch {
        return '--:--';
    }
};

export const WorldClockPicker: React.FC<WorldClockPickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerRect
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [searchTerm, setSearchTerm] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    const MENU_WIDTH = 300;
    const MENU_HEIGHT = 360;
    const PADDING = 16;

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        // Calculate if menu would overflow on the right
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            // Align to right edge of viewport
            right = PADDING;
        } else {
            // Align to trigger left, but ensure minimum padding
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
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
    }, [triggerRect, isRtl]);

    const filteredTimezones = useMemo(() => {
        if (!searchTerm) return TIMEZONES;
        const term = searchTerm.toLowerCase();
        return TIMEZONES.filter(
            tz =>
                tz.city.toLowerCase().includes(term) ||
                tz.label.toLowerCase().includes(term) ||
                tz.id.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const handleSelect = (timezoneId: string) => {
        onSelect(timezoneId);
        onClose();
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

    const selectedTimezone = value ? TIMEZONES.find(tz => tz.id === value) : null;

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className={`flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Globe size={14} />
                        <span>{t('world_clock')}</span>
                    </div>
                </div>

                {/* Current Selection */}
                {selectedTimezone && (
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className={isRtl ? 'text-right' : ''}>
                                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {selectedTimezone.city}
                                </div>
                                <div className="text-[10px] text-blue-500 dark:text-blue-400">
                                    {selectedTimezone.label} ({selectedTimezone.offset})
                                </div>
                            </div>
                            <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                                {getTimeInTimezone(selectedTimezone.id)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <MagnifyingGlass size={14} className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('search_timezones')}
                            autoFocus
                            className={`w-full ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'} py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
                        />
                    </div>
                </div>

                {/* Timezone List */}
                <div className="flex-1 overflow-y-auto max-h-[200px] p-1 custom-scrollbar">
                    {filteredTimezones.length === 0 ? (
                        <div className={`py-4 text-center text-xs text-stone-400 ${isRtl ? 'text-right' : ''}`}>
                            {t('no_timezones_found')}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredTimezones.map(tz => (
                                <button
                                    key={tz.id}
                                    onClick={() => handleSelect(tz.id)}
                                    className={`w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 group transition-colors ${isRtl ? 'flex-row-reverse' : ''
                                        } ${value === tz.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                >
                                    <div className={`flex items-center gap-2 min-w-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <Clock size={14} className="text-stone-400 shrink-0" />
                                        <div className={`min-w-0 ${isRtl ? 'text-right' : ''}`}>
                                            <div className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
                                                {tz.city}
                                            </div>
                                            <div className="text-[10px] text-stone-400 truncate">
                                                {tz.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-2 shrink-0 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[10px] text-stone-400">
                                            {tz.offset}
                                        </span>
                                        <span className="text-xs font-mono text-stone-600 dark:text-stone-400">
                                            {getTimeInTimezone(tz.id)}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Clear Button */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={handleClear}
                        className="w-full py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear_timezone')}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

// Helper to get display info for a timezone
export const getTimezoneDisplay = (timezoneId: string): { city: string; time: string; offset: string } | null => {
    const tz = TIMEZONES.find(t => t.id === timezoneId);
    if (!tz) return null;
    return {
        city: tz.city,
        time: getTimeInTimezone(tz.id),
        offset: tz.offset,
    };
};
