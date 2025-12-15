import React, { useState } from 'react';
import { X, Folder, Tag, Users, Clock, Palette, Type, User } from 'lucide-react';
import { FolderMetadata } from '../types';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; color: string; icon: string; metadata: FolderMetadata }) => void;
}

const COLORS = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#EF4444', label: 'Red' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6B7280', label: 'Gray' },
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0].value);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [managedBy, setManagedBy] = useState('');
    const [accessLevel, setAccessLevel] = useState<'private' | 'team' | 'public'>('private');
    const [retentionPolicy, setRetentionPolicy] = useState<'none' | '1-year' | '5-years' | 'forever'>('none');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            name,
            color,
            icon: 'Folder', // Defaulting to Folder icon for now
            metadata: {
                description,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                managedBy,
                accessLevel,
                retentionPolicy,
                notes
            }
        });
        onClose();
        // Reset form
        setName('');
        setDescription('');
        setTags('');
        setManagedBy('');
        setAccessLevel('private');
        setRetentionPolicy('none');
        setNotes('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-monday-dark-surface w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-monday-dark-border bg-gray-50/50 dark:bg-monday-dark-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Folder size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Folder</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Organize your secure documents</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="create-folder-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <Type size={14} /> Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Folder Name <span className="text-red-500">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. Financial Reports 2024"
                                        className="w-full px-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="What is this folder for?"
                                        rows={2}
                                        className="w-full px-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* Visual & Organization Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <Palette size={14} /> Visual & Organization
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Label</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.value}
                                                type="button"
                                                onClick={() => setColor(c.value)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.value ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                                                style={{ backgroundColor: c.value }}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            value={tags}
                                            onChange={e => setTags(e.target.value)}
                                            placeholder="secure, hr, finance (comma separated)"
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* Governance Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <User size={14} /> Governance & Access
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Managed By</label>
                                    <input
                                        type="text"
                                        value={managedBy}
                                        onChange={e => setManagedBy(e.target.value)}
                                        placeholder="Owner name or ID"
                                        className="w-full px-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Level</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={accessLevel}
                                            onChange={e => setAccessLevel(e.target.value as any)}
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all appearance-none"
                                        >
                                            <option value="private">Private (Only Me)</option>
                                            <option value="team">Team Visible</option>
                                            <option value="public">Organization Public</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retention Policy</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={retentionPolicy}
                                            onChange={e => setRetentionPolicy(e.target.value as any)}
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all appearance-none"
                                        >
                                            <option value="none">No Policy</option>
                                            <option value="1-year">1 Year Retention</option>
                                            <option value="5-years">5 Years Retention</option>
                                            <option value="forever">Indefinite Retention</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        {/* Additional Notes */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                                <Type size={14} /> Additional Notes
                            </h3>
                            <div>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Any administrative notes..."
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-monday-dark-border bg-gray-50/50 dark:bg-monday-dark-surface/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-folder-form"
                        className="px-6 py-2 bg-monday-blue hover:bg-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Create Folder
                    </button>
                </div>
            </div>
        </div>
    );
};
