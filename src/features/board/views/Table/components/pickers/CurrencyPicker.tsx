import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowsLeftRight, MagnifyingGlass } from 'phosphor-react';

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
];

// Exchange rates relative to USD (approximate rates for demo)
// In production, these would come from a live API
const EXCHANGE_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SAR: 3.75,
    AED: 3.67,
    JPY: 149.50,
    CNY: 7.24,
    INR: 83.12,
    KRW: 1320.50,
    BRL: 4.97,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    EGP: 30.90,
    TRY: 32.15,
};

interface CurrencyPickerProps {
    value: number | null;
    baseCurrency: { code: string; symbol: string };
    onSelect: (value: number, currency: { code: string; symbol: string }) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

export const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
    value,
    baseCurrency,
    onSelect,
    onClose,
    triggerRect
}) => {
    const [amount, setAmount] = useState<string>(value?.toString() || '');
    const [targetCurrency, setTargetCurrency] = useState(CURRENCIES.find(c => c.code !== baseCurrency.code) || CURRENCIES[1]);
    const [search, setSearch] = useState('');
    const [showCurrencyList, setShowCurrencyList] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const MENU_WIDTH = 320;
    const MENU_HEIGHT = 380;
    const PADDING = 16; // Padding from viewport edges

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

        // Prefer aligning to trigger's left edge, but flip if not enough space
        if (spaceRight >= MENU_WIDTH + PADDING) {
            // Enough space to the right - align to trigger's left
            left = Math.max(PADDING, triggerRect.left);
        } else if (spaceLeft >= MENU_WIDTH + PADDING) {
            // Not enough space right, but enough left - align to trigger's right edge
            right = Math.max(PADDING, windowWidth - triggerRect.right);
        } else {
            // Not enough space on either side - center horizontally with padding
            left = Math.max(PADDING, (windowWidth - MENU_WIDTH) / 2);
        }

        // Ensure we don't overflow on the right
        if (left !== undefined && left + MENU_WIDTH > windowWidth - PADDING) {
            left = windowWidth - MENU_WIDTH - PADDING;
        }

        // Determine vertical position
        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        // Calculate max height to ensure menu fits in viewport
        const maxHeight = openUp
            ? Math.min(MENU_HEIGHT, spaceAbove - PADDING)
            : Math.min(MENU_HEIGHT, spaceBelow - PADDING);

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            maxHeight: maxHeight > 200 ? maxHeight : undefined, // Only constrain if reasonable
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

    const numericValue = parseFloat(amount) || 0;

    // Convert from base currency to target
    const convertCurrency = (val: number, from: string, to: string): number => {
        const fromRate = EXCHANGE_RATES[from] || 1;
        const toRate = EXCHANGE_RATES[to] || 1;
        // Convert to USD first, then to target
        const usdValue = val / fromRate;
        return usdValue * toRate;
    };

    const convertedValue = convertCurrency(numericValue, baseCurrency.code, targetCurrency.code);

    const filteredCurrencies = CURRENCIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = () => {
        onSelect(numericValue, baseCurrency);
        onClose();
    };

    const handleApplyConverted = () => {
        onSelect(convertedValue, targetCurrency);
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const content = (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 w-[320px] max-w-[calc(100vw-32px)]"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
                    <span className="text-[11px] font-bold font-sans uppercase tracking-wider text-stone-400">
                        Currency Converter
                    </span>
                </div>

                {/* Amount Input */}
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex-shrink-0">
                    <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                        Amount ({baseCurrency.code})
                    </label>
                    <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-lg px-3 py-2">
                        <span className="text-lg font-medium text-stone-600 dark:text-stone-300">{baseCurrency.symbol}</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-stone-800 dark:text-stone-200"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Conversion Section */}
                <div className="p-4 flex-1 overflow-y-auto min-h-0">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowsLeftRight size={16} className="text-blue-500" />
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Convert to</span>
                    </div>

                    {/* Target Currency Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCurrencyList(!showCurrencyList)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        >
                            <span className="text-lg">{targetCurrency.flag}</span>
                            <span className="font-medium text-stone-700 dark:text-stone-200">{targetCurrency.symbol}</span>
                            <span className="text-sm text-stone-500 dark:text-stone-400 flex-1 text-start">{targetCurrency.name}</span>
                            <span className="text-xs text-stone-400">{targetCurrency.code}</span>
                        </button>

                        {showCurrencyList && (
                            <div className="absolute top-full inset-x-0 mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10 max-h-[200px] overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-stone-100 dark:border-stone-700">
                                    <div className="relative">
                                        <MagnifyingGlass size={14} className="absolute start-2 top-1/2 -translate-y-1/2 text-stone-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full ps-7 pe-2 py-1.5 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {filteredCurrencies.map(currency => (
                                        <button
                                            key={currency.code}
                                            onClick={() => {
                                                setTargetCurrency(currency);
                                                setShowCurrencyList(false);
                                                setSearch('');
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${targetCurrency.code === currency.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        >
                                            <span>{currency.flag}</span>
                                            <span className="text-sm font-medium text-stone-700 dark:text-stone-200 w-6">{currency.symbol}</span>
                                            <span className="text-sm text-stone-600 dark:text-stone-300 flex-1 text-start truncate">{currency.name}</span>
                                            <span className="text-xs text-stone-400">{currency.code}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Converted Value */}
                    {numericValue > 0 && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-600 dark:text-stone-300">
                                    {baseCurrency.symbol} {numericValue.toLocaleString()} =
                                </span>
                                <span className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                    {targetCurrency.symbol} {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="text-xs text-stone-400 mt-1">
                                Rate: 1 {baseCurrency.code} = {(convertCurrency(1, baseCurrency.code, targetCurrency.code)).toFixed(4)} {targetCurrency.code}
                            </div>
                        </div>
                    )}

                    {/* Quick Conversions */}
                    {numericValue > 0 && (
                        <div className="mt-3 space-y-1">
                            <span className="text-xs text-stone-400">Quick view:</span>
                            <div className="flex flex-wrap gap-1">
                                {['USD', 'EUR', 'GBP', 'SAR'].filter(c => c !== baseCurrency.code && c !== targetCurrency.code).slice(0, 3).map(code => {
                                    const curr = CURRENCIES.find(c => c.code === code);
                                    if (!curr) return null;
                                    const converted = convertCurrency(numericValue, baseCurrency.code, code);
                                    return (
                                        <span key={code} className="text-xs px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-stone-600 dark:text-stone-300">
                                            {curr.symbol} {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 p-3 border-t border-stone-100 dark:border-stone-800 flex-shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-3 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
                        >
                            Save {baseCurrency.code}
                        </button>
                    </div>
                    {numericValue > 0 && targetCurrency.code !== baseCurrency.code && (
                        <button
                            onClick={handleApplyConverted}
                            className="w-full px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                        >
                            Use {targetCurrency.code} ({targetCurrency.symbol} {convertedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
