import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { Link, ArrowSquareOut, Copy, Check, Globe } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { usePopupPosition } from '../../hooks/usePopupPosition';

// =============================================================================
// URL/LINK PICKER
// =============================================================================

export interface UrlValue {
    url: string;
    label?: string;
}

interface UrlPickerProps {
    value: UrlValue | null;
    onSelect: (value: UrlValue | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

// Validate URL format
const isValidUrl = (string: string): boolean => {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

// Extract domain from URL
const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return url;
    }
};

export const UrlPicker: React.FC<UrlPickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerRect,
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [url, setUrl] = useState(value?.url || '');
    const [label, setLabel] = useState(value?.label || '');
    const [copied, setCopied] = useState(false);

    const MENU_WIDTH = 320;
    const MENU_HEIGHT = 280;

    const positionStyle = usePopupPosition({
        triggerRect,
        menuWidth: MENU_WIDTH,
        menuHeight: MENU_HEIGHT,
        isRtl,
        align: 'start'
    });

    const isValid = url === '' || isValidUrl(url);

    const handleSave = () => {
        if (url && isValidUrl(url)) {
            onSelect({ url, label: label || undefined });
        } else if (!url) {
            onSelect(null);
        }
        onClose();
    };

    const handleCopy = async () => {
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpenUrl = () => {
        if (url && isValidUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="fixed bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 z-[9999]"
                style={{ ...positionStyle, width: MENU_WIDTH }}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <span className={`text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Globe size={14} />
                        {t('add_link')}
                    </span>
                </div>

                {/* Form */}
                <div className="p-3 space-y-4">
                    <div>
                        <label className={`block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                            URL
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                            className={`w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border ${!isValid ? 'border-red-500' : 'border-stone-200 dark:border-stone-700'} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isRtl ? 'text-right' : ''}`}
                            autoFocus
                        />
                        {!isValid && (
                            <p className={`mt-1 text-[10px] text-red-500 ${isRtl ? 'text-right' : ''}`}>{t('please_enter_valid_url')}</p>
                        )}
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1 ${isRtl ? 'text-right' : ''}`}>
                            {t('text')}
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={t('type_to_add')}
                            className={`w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isRtl ? 'text-right' : ''}`}
                        />
                    </div>

                    {/* Preview */}
                    {url && isValid && (
                        <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-100 dark:border-stone-800">
                            <div className={`text-[10px] text-stone-500 uppercase mb-1 ${isRtl ? 'text-right' : ''}`}>{t('preview')}</div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}
                                onClick={(e) => e.preventDefault()}
                            >
                                <span className="truncate">{label || extractDomain(url)}</span>
                                <ArrowSquareOut size={12} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-2 pb-2 grid grid-cols-2 gap-2">
                    <button
                        onClick={handleOpenUrl}
                        disabled={!url || !isValidUrl(url)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <ArrowSquareOut size={16} />
                        {t('open_link')}
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!url}
                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        {t('copy')}
                    </button>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex justify-between gap-2">
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

// Simple inline display component for table cells
export const UrlDisplay: React.FC<{
    value: UrlValue | null;
    onClick?: () => void;
}> = memo(({ value, onClick }) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';

    if (!value?.url) {
        return (
            <button onClick={onClick} className={`text-stone-400 hover:text-stone-600 text-sm ${isRtl ? 'text-right w-full' : ''}`}>
                + {t('add_link')}
            </button>
        );
    }

    return (
        <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px] ${isRtl ? 'flex-row-reverse' : ''}`}
            onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}
        >
            <Link size={12} className="flex-shrink-0" />
            <span className="truncate">{value.label || extractDomain(value.url)}</span>
        </a>
    );
});

export default UrlPicker;
