import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Copy, Check, WhatsappLogo } from 'phosphor-react';

interface PhonePickerProps {
    value: string | null;
    onSelect: (phone: string | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

// Common country codes
const COUNTRY_CODES = [
    { code: '+1', country: 'US/CA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+966', country: 'SA', flag: '🇸🇦' },
    { code: '+20', country: 'EG', flag: '🇪🇬' },
    { code: '+49', country: 'DE', flag: '🇩🇪' },
    { code: '+33', country: 'FR', flag: '🇫🇷' },
    { code: '+91', country: 'IN', flag: '🇮🇳' },
    { code: '+86', country: 'CN', flag: '🇨🇳' },
    { code: '+81', country: 'JP', flag: '🇯🇵' },
];

export const PhonePicker: React.FC<PhonePickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect
}) => {
    const [phone, setPhone] = useState(value || '');
    const [copied, setCopied] = useState(false);
    const [showCodes, setShowCodes] = useState(false);

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = 240;
    const PADDING = 16;

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
            right = PADDING;
        } else {
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
    }, [triggerRect]);

    const handleSave = () => {
        if (phone.trim()) {
            onSelect(phone.trim());
            onClose();
        }
    };

    const handleCopy = async () => {
        if (value) {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCall = () => {
        if (value) {
            window.open(`tel:${value}`, '_blank');
        }
    };

    const handleWhatsApp = () => {
        if (value) {
            const cleanNumber = value.replace(/[^0-9+]/g, '');
            window.open(`https://wa.me/${cleanNumber.replace('+', '')}`, '_blank');
        }
    };

    const handleSelectCode = (code: string) => {
        setPhone(code + ' ');
        setShowCodes(false);
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

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
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
                        <Phone size={14} />
                        <span>Phone Number</span>
                    </div>
                </div>

                {/* Input */}
                <div className="p-3">
                    <div className="relative">
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') onClose();
                            }}
                            placeholder="+1 234 567 8900"
                            autoFocus
                            className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Country Code Quick Select */}
                    <div className="mt-2">
                        <button
                            onClick={() => setShowCodes(!showCodes)}
                            className="text-[10px] text-blue-500 hover:text-blue-600 transition-colors"
                        >
                            {showCodes ? 'Hide country codes' : 'Select country code'}
                        </button>
                        {showCodes && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {COUNTRY_CODES.map((c) => (
                                    <button
                                        key={c.code}
                                        onClick={() => handleSelectCode(c.code)}
                                        className="px-2 py-1 text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                                        title={c.country}
                                    >
                                        {c.flag} {c.code}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {value && (
                    <div className="px-3 pb-2 flex gap-2">
                        <button
                            onClick={handleCall}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <Phone size={12} />
                            Call
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        >
                            <WhatsappLogo size={12} weight="fill" />
                            WhatsApp
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        >
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!phone.trim()}
                        className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
