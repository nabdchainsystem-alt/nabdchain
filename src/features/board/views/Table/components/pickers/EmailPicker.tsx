import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { EnvelopeSimple, PaperPlaneTilt, Copy, Check } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';
import { usePopupPosition } from '../../hooks/usePopupPosition';

interface EmailPickerProps {
    value: string | null;
    onSelect: (email: string | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

export const EmailPicker: React.FC<EmailPickerProps> = memo(({
    value,
    onSelect,
    onClose,
    triggerRect
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [email, setEmail] = useState(value || '');
    const [copied, setCopied] = useState(false);

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = 180;

    const positionStyle = usePopupPosition({
        triggerRect,
        menuWidth: MENU_WIDTH,
        menuHeight: MENU_HEIGHT,
        isRtl,
        align: 'start'
    });

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSave = () => {
        if (email.trim() && isValidEmail(email.trim())) {
            onSelect(email.trim());
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

    const handleSendEmail = () => {
        if (value) {
            window.open(`mailto:${value}`, '_blank');
        }
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
                className="fixed z-[9999] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={{ ...positionStyle, width: MENU_WIDTH }}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className={`flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <EnvelopeSimple size={14} />
                        <span>{t('email')}</span>
                    </div>
                </div>

                {/* Input */}
                <div className="p-3">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') onClose();
                        }}
                        placeholder="name@example.com"
                        autoFocus
                        className={`w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${isRtl ? 'text-right' : 'text-left'
                            } ${email && !isValidEmail(email)
                                ? 'border-red-300 dark:border-red-700 focus:ring-red-500/20'
                                : 'border-stone-200 dark:border-stone-700 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                    />
                    {email && !isValidEmail(email) && (
                        <p className={`mt-1 text-[10px] text-red-500 ${isRtl ? 'text-right' : ''}`}>{t('please_enter_valid_email')}</p>
                    )}
                </div>

                {/* Actions */}
                {value && (
                    <div className={`px-3 pb-2 flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={handleSendEmail}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                            <PaperPlaneTilt size={12} />
                            {t('send_email') || 'Send Email'}
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            {copied ? t('copied') : t('copy')}
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className={`px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={handleClear}
                        className="flex-1 py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!email.trim() || !isValidEmail(email.trim())}
                        className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});
