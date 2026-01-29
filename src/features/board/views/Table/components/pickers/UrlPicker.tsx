import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, ArrowSquareOut, Copy, Check, Globe } from 'phosphor-react';

// =============================================================================
// URL/LINK PICKER - PLACEHOLDER COMPONENT
// Status: NOT IMPLEMENTED - Placeholder for future development
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

export const UrlPicker: React.FC<UrlPickerProps> = ({
    value,
    onSelect,
    onClose,
    triggerRect,
}) => {
    const [url, setUrl] = useState(value?.url || '');
    const [label, setLabel] = useState(value?.label || '');
    const [copied, setCopied] = useState(false);

    const MENU_WIDTH = 320;
    const MENU_HEIGHT = 280;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - triggerRect.bottom;
        const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;

        let left: number | undefined;
        let right: number | undefined;

        if (wouldOverflowRight) {
            right = PADDING;
        } else {
            left = Math.max(PADDING, triggerRect.left);
        }

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && triggerRect.top > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        if (openUp) {
            return { ...baseStyle, bottom: windowHeight - triggerRect.top + 4, ...(left !== undefined ? { left } : { right }) };
        }
        return { ...baseStyle, top: triggerRect.bottom + 4, ...(left !== undefined ? { left } : { right }) };
    }, [triggerRect]);

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
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={positionStyle}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                        <Link size={14} />
                        Link / URL
                    </span>
                </div>

                {/* URL Input */}
                <div className="p-3 space-y-3">
                    <div>
                        <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                            URL
                        </label>
                        <div className="relative">
                            <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg bg-white dark:bg-stone-800 ${
                                    !isValid
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500'
                                        : 'border-stone-200 dark:border-stone-700 focus:ring-blue-500'
                                } focus:ring-2 focus:border-transparent`}
                            />
                        </div>
                        {!isValid && (
                            <p className="mt-1 text-[10px] text-red-500">Please enter a valid URL</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[10px] font-medium text-stone-500 uppercase mb-1">
                            Display Text (Optional)
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="Click here"
                            className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Preview */}
                    {url && isValid && (
                        <div className="p-2 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                            <div className="text-[10px] text-stone-500 uppercase mb-1">Preview</div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1"
                                onClick={(e) => e.preventDefault()}
                            >
                                {label || extractDomain(url)}
                                <ArrowSquareOut size={12} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                    {url && isValid && (
                        <>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                            >
                                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={handleOpenUrl}
                                className="flex items-center gap-1 px-2 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                            >
                                <ArrowSquareOut size={12} />
                                Open
                            </button>
                        </>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={() => { onSelect(null); onClose(); }}
                        className="px-2 py-1.5 text-xs text-stone-500 hover:text-red-500 rounded transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={url !== '' && !isValid}
                        className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-stone-300 text-white rounded transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};

// Inline display component for table cells
export const UrlDisplay: React.FC<{
    value: UrlValue | null;
    onClick?: () => void;
}> = ({ value, onClick }) => {
    if (!value?.url) {
        return (
            <button onClick={onClick} className="text-stone-400 hover:text-stone-600 text-sm">
                + Add link
            </button>
        );
    }

    return (
        <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
            onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }}
        >
            <Link size={12} className="flex-shrink-0" />
            <span className="truncate">{value.label || extractDomain(value.url)}</span>
        </a>
    );
};

export default UrlPicker;
