import React, { useState } from 'react';
import { X, Globe, Link as LinkIcon, User, Key, Lock } from 'lucide-react';

interface CreateLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { title: string; url: string; username?: string; password?: string }) => void;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({ title, url, username, password });
        onClose();
        setTitle('');
        setUrl('');
        setUsername('');
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-monday-dark-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-scale-in border border-gray-100 dark:border-monday-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-monday-dark-border bg-gray-50/50 dark:bg-monday-dark-surface/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Globe size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Add Web Link</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Save a bookmark or login</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Corporate Portal"
                            className="w-full px-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                required
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Optional Credentials</h4>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username / Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="user@example.com"
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-monday-dark-hover border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-monday-blue focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-monday-blue hover:bg-blue-600 text-white rounded-lg font-medium shadow-md transition-all hover:-translate-y-0.5"
                        >
                            Add Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
