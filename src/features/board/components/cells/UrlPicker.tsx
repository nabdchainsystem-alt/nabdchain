import React, { useState } from 'react';
import { usePopupPosition } from '../../views/Table/hooks/usePopupPosition';
import { createPortal } from 'react-dom';
import { Link, TextT as Type } from 'phosphor-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface UrlPickerProps {
    current: { url: string; text?: string } | null;
    onSelect: (value: { url: string; text: string } | null) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
    title?: string;
    urlLabel?: string;
    saveLabel?: string;
}

export const UrlPicker: React.FC<UrlPickerProps> = ({
    current,
    onSelect,
    onClose,
    triggerRect,
    title,
    urlLabel,
    saveLabel
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [url, setUrl] = useState(current?.url || '');
    const [text, setText] = useState(current?.text || '');

    const MENU_WIDTH = 320;
    const MENU_HEIGHT = 280;

    const positionStyle = usePopupPosition({
        triggerRect,
        menuWidth: MENU_WIDTH,
        menuHeight: MENU_HEIGHT,
        align: 'start',
        isRtl
    });

    const handleSave = () => {
        if (!url) {
            onSelect(null);
        } else {
            onSelect({ url, text: text || url });
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const content = (
        <>
            <div className="fixed inset-0 z-[9998]" onClick={onClose} />
            <div
                onClick={(e) => e.stopPropagation()}
                className="fixed bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 z-[9999]"
                style={{ ...positionStyle, width: MENU_WIDTH }}
                dir={dir}
            >
                <div className={`flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wider p-4 pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Link size={12} />
                    {title || t('edit_link')}
                </div>

                <div className="p-4 pt-0 space-y-4">
                    <div>
                        <label className={`block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5 ${isRtl ? 'text-right' : ''}`}>
                            {urlLabel || t('url_address')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                autoFocus
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="https://example.com"
                                className={`w-full ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'} py-2 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans`}
                            />
                            <Link size={14} className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5 ${isRtl ? 'text-right' : ''}`}>
                            {t('display_text')} ({t('optional')})
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('short_name')}
                                className={`w-full ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'} py-2 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans`}
                            />
                            <Type size={14} className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
                        </div>
                    </div>

                    <div className={`flex justify-end gap-2 pt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                        >
                            {saveLabel || t('save_link')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
};
