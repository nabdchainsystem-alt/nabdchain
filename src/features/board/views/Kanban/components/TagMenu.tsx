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
    const { t } = useAppContext();
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagInput.trim()) {
            onUpdateTags([...tags, tagInput.trim()]);
            setTagInput('');
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
            />
            <div className="max-h-48 overflow-y-auto">
                {tags.length === 0 && !tagInput ? (
                    <div className="text-center py-6 text-gray-400 text-sm italic">
                        {t('no_tags_created')}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
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
                )}
            </div>
        </div>
    );
};

export default TagMenu;
