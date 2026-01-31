import React, { useState, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, X, Check } from 'phosphor-react';
import { useLanguage } from '../../../../../../contexts/LanguageContext';

interface TagsPickerProps {
    value: string[] | null;
    availableTags?: string[];
    onSelect: (tags: string[] | null) => void;
    onAddTag?: (tag: string) => void;
    onClose: () => void;
    triggerRect?: DOMRect;
}

// Default color palette for tags
const TAG_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-teal-500',
];

const getTagColor = (tag: string): string => {
    // Generate consistent color based on tag string
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

export const TagsPicker: React.FC<TagsPickerProps> = memo(({
    value,
    availableTags = [],
    onSelect,
    onAddTag,
    onClose,
    triggerRect
}) => {
    const { t, dir } = useLanguage();
    const isRtl = dir === 'rtl';
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>(value || []);

    const MENU_WIDTH = 280;
    const MENU_HEIGHT = 320;
    const PADDING = 16;

    const positionStyle = useMemo(() => {
        if (!triggerRect) return { position: 'fixed' as const, display: 'none' };

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        const openUp = spaceBelow < MENU_HEIGHT + PADDING && spaceAbove > spaceBelow;

        const baseStyle: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            width: MENU_WIDTH,
        };

        // Calculate horizontal position based on RTL
        let horizontalStyle: React.CSSProperties;
        if (isRtl) {
            // For RTL, position from right edge of trigger
            const rightPos = windowWidth - triggerRect.right;
            const wouldOverflowLeft = triggerRect.right - MENU_WIDTH < PADDING;
            if (wouldOverflowLeft) {
                horizontalStyle = { left: PADDING };
            } else {
                horizontalStyle = { right: Math.max(PADDING, rightPos) };
            }
        } else {
            // For LTR, position from left edge of trigger
            const wouldOverflowRight = triggerRect.left + MENU_WIDTH > windowWidth - PADDING;
            if (wouldOverflowRight) {
                horizontalStyle = { right: PADDING };
            } else {
                horizontalStyle = { left: Math.max(PADDING, triggerRect.left) };
            }
        }

        if (openUp) {
            return {
                ...baseStyle,
                bottom: windowHeight - triggerRect.top + 4,
                ...horizontalStyle
            };
        }

        return {
            ...baseStyle,
            top: triggerRect.bottom + 4,
            ...horizontalStyle
        };
    }, [triggerRect, isRtl]);

    // Merge available tags with currently selected (in case some selected aren't in available)
    const allTags = useMemo(() => {
        const tagSet = new Set([...availableTags, ...selectedTags]);
        return Array.from(tagSet);
    }, [availableTags, selectedTags]);

    const filteredTags = useMemo(() => {
        if (!searchTerm) return allTags;
        const term = searchTerm.toLowerCase();
        return allTags.filter(tag => tag.toLowerCase().includes(term));
    }, [searchTerm, allTags]);

    const isNewTag = searchTerm && !allTags.some(tag => tag.toLowerCase() === searchTerm.toLowerCase());

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            }
            return [...prev, tag];
        });
    };

    const handleCreateTag = () => {
        if (searchTerm.trim()) {
            const newTag = searchTerm.trim();
            if (onAddTag) onAddTag(newTag);
            setSelectedTags(prev => [...prev, newTag]);
            setSearchTerm('');
        }
    };

    const handleSave = () => {
        onSelect(selectedTags.length > 0 ? selectedTags : null);
        onClose();
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
                    <div className={`flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Tag size={14} />
                        <span>{t('tags')}</span>
                        {selectedTags.length > 0 && (
                            <span className={`${isRtl ? 'mr-auto' : 'ml-auto'} px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded`}>
                                {selectedTags.length} {t('selected')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Selected Tags Preview */}
                {selectedTags.length > 0 && (
                    <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
                        <div className={`flex flex-wrap gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {selectedTags.map(tag => (
                                <span
                                    key={tag}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white rounded-full ${getTagColor(tag)} ${isRtl ? 'flex-row-reverse' : ''}`}
                                >
                                    {tag}
                                    <button
                                        onClick={() => toggleTag(tag)}
                                        className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search / Create */}
                <div className="p-2 border-b border-stone-100 dark:border-stone-800">
                    <div className="relative">
                        <Tag size={14} className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-stone-400`} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isNewTag) {
                                    handleCreateTag();
                                }
                            }}
                            placeholder={t('search_or_create_tag')}
                            autoFocus
                            className={`w-full ${isRtl ? 'pr-8 pl-3 text-right' : 'pl-8 pr-3'} py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors`}
                        />
                    </div>
                </div>

                {/* Tags List */}
                <div className="flex-1 overflow-y-auto max-h-[160px] p-1 custom-scrollbar">
                    {/* Create New Tag Option */}
                    {isNewTag && (
                        <button
                            onClick={handleCreateTag}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-colors mb-1 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
                        >
                            <Plus size={14} className="text-blue-500" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                                {t('create') || 'Create'} "<span className="font-medium">{searchTerm}</span>"
                            </span>
                        </button>
                    )}

                    {filteredTags.length === 0 && !isNewTag ? (
                        <div className={`py-4 text-center text-xs text-stone-400 ${isRtl ? 'text-right' : ''}`}>
                            {searchTerm ? t('no_tags_found') : t('no_tags_yet')}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filteredTags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${isRtl ? 'flex-row-reverse' : ''
                                            } ${isSelected ? 'bg-stone-100 dark:bg-stone-800' : ''
                                            }`}
                                    >
                                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <span className={`w-3 h-3 rounded-full ${getTagColor(tag)}`} />
                                            <span className={`text-xs text-stone-700 dark:text-stone-300 ${isRtl ? 'text-right' : ''}`}>
                                                {tag}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <Check size={14} className="text-blue-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-3 py-2 border-t border-stone-100 dark:border-stone-800 flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={handleClear}
                        className="flex-1 py-1.5 text-xs text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        {t('clear_all')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        {t('done')}
                    </button>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
});

// Export helper for getting tag color
export { getTagColor };
