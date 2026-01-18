import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, Palette, Shield, Info, Tag, Users } from 'phosphor-react';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; color: string; icon: string; metadata: any }) => void;
}

const COLORS = [
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Gray', value: '#6B7280' },
];

const ACCESS_LEVELS = [
    { id: 'private', label: 'Private', description: 'Only you can see this folder', icon: Shield },
    { id: 'team', label: 'Team', description: 'Available to your team members', icon: Users },
    { id: 'public', label: 'Public', description: 'Anyone in the organization', icon: Info },
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
    const [accessLevel, setAccessLevel] = useState('private');
    const [tags, setTags] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate({
                name: name.trim(),
                color: selectedColor,
                icon: 'folder',
                metadata: {
                    description: description.trim(),
                    accessLevel,
                    tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
                }
            });
            // Reset
            setName('');
            setSelectedColor(COLORS[0].value);
            setAccessLevel('private');
            setTags('');
            setDescription('');
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Folder size={20} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Folder</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Folder Name
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-blue/50 text-gray-900 dark:text-gray-100"
                                placeholder="e.g., Marketing Assets"
                            />
                        </div>

                        {/* Color Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <Palette size={14} /> Color Accent
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-monday-blue scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Access Level */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <Shield size={14} /> Access Level
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {ACCESS_LEVELS.map((level) => {
                                    const Icon = level.icon;
                                    return (
                                        <button
                                            key={level.id}
                                            type="button"
                                            onClick={() => setAccessLevel(level.id)}
                                            className={`flex items-start gap-3 p-3 text-left border rounded-lg transition-colors ${accessLevel === level.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}
                                        >
                                            <div className={`mt-0.5 p-1.5 rounded-md ${accessLevel === level.id ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{level.label}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{level.description}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                <Tag size={14} /> Tags
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-monday-blue/50 text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="e.g., design, 2024, confidential (comma separated)"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-6 py-2 text-sm font-medium text-white bg-monday-blue hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                        >
                            Create Folder
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
