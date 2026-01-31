import React, { useState } from 'react';
import { useAppContext } from '../../../../../contexts/AppContext';

export interface TagMenuProps {
    tags: string[];
    onUpdateTags: (tags: string[]) => void;
}

/**
 * Tag management menu for task cards
 * Allows adding, viewing, and removing tags
 */
export const TagMenu: React.FC<TagMenuProps> = ({ tags, onUpdateTags }) => {
    const { t, globalTags, addGlobalTag } = useAppContext();
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (tagToAdd: string) => {
        const trimmed = tagToAdd.trim();
        if (trimmed) {
            // Add to task tags if not present
            if (!tags.includes(trimmed)) {
                onUpdateTags([...tags, trimmed]);
            }
            // Add to global tags if not present
            addGlobalTag(trimmed);
            setTagInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tagInput);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onUpdateTags(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div className="p-2">
            <input
                autoFocus
                type="text"
                placeholder={t('search_or_add_tags')}
                className="w-full px-3 py-2 bg-gray-50 rounded-md border-none text-sm focus:ring-1 focus:ring-indigo-500 outline-none mb-2"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs flex items-center gap-1"
                        >
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-indigo-900"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>

                {/* Suggestions from global tags */}
                {globalTags.length > 0 && (
                    <div className="border-t border-gray-100 pt-2">
                        <p className="text-xs text-gray-400 mb-2 uppercase font-semibold">{t('available_tags') || 'Available'}</p>
                        <div className="flex flex-wrap gap-2">
                            {globalTags
                                .filter(t => !tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase()))
                                .map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleAddTag(tag)}
                                        className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded text-xs transition-colors text-left"
                                    >
                                        + {tag}
                                    </button>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagMenu;
