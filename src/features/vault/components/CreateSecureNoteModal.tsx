import React, { useState } from 'react';
import { X, Note, Shield, Lock, Tag } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

interface CreateSecureNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: {
        title: string;
        content: string;
        tags?: string[];
    }) => void;
}

const PRESET_COLORS = [
    '#FCD34D', // Yellow
    '#F87171', // Red
    '#60A5FA', // Blue
    '#34D399', // Green
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#FB923C', // Orange
    '#2DD4BF', // Teal
];

export const CreateSecureNoteModal: React.FC<CreateSecureNoteModalProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const { t } = useAppContext();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onCreate({
            title: title.trim(),
            content: content.trim(),
            tags: tags.length > 0 ? tags : undefined
        });

        // Reset form
        setTitle('');
        setContent('');
        setSelectedColor(PRESET_COLORS[0]);
        setTags([]);
        setTagInput('');
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-monday-dark-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header with color accent */}
                <div
                    className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700"
                    style={{ borderTopColor: selectedColor, borderTopWidth: '4px' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                            style={{ backgroundColor: selectedColor + '20' }}
                        >
                            <Note size={20} weight="fill" style={{ color: selectedColor }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('new_secure_note') || 'New Secure Note'}
                            </h2>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Lock size={10} />
                                <span>{t('encrypted_storage') || 'Encrypted storage'}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('title') || 'Title'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('note_title_placeholder') || 'e.g., WiFi Passwords, PIN Codes'}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
                            autoFocus
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('content') || 'Content'}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('note_content_placeholder') || 'Enter your secure note content...'}
                            rows={6}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 resize-none font-mono"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('note_color') || 'Note Color'}
                        </label>
                        <div className="flex items-center gap-2">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all ${
                                        selectedColor === color
                                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                            : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('tags') || 'Tags'}
                        </label>
                        <div className="relative">
                            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={t('tags_enter_placeholder') || 'Press Enter to add tags'}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500"
                            />
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Shield size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            {t('secure_note_notice') || 'This note will be stored securely. Perfect for sensitive information like recovery codes, PINs, or private keys.'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-6 py-2 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            style={{
                                backgroundColor: selectedColor,
                                boxShadow: `0 4px 14px 0 ${selectedColor}40`
                            }}
                        >
                            {t('create_note') || 'Create Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
