import React, { useState } from 'react';
import { Eye, EyeSlash, Copy, Check, Globe, Key, DotsThree, Star, Trash, PencilSimple, ArrowSquareOut, Folder } from 'phosphor-react';
import { VaultItem } from '../types';
import { useAppContext } from '../../../contexts/AppContext';

interface LoginsTableProps {
    items: VaultItem[];
    onDelete: (itemId: string) => void;
    onToggleFavorite: (item: VaultItem) => void;
    onRename: (item: VaultItem) => void;
    onMove: (item: VaultItem) => void;
}

export const LoginsTable: React.FC<LoginsTableProps> = ({
    items,
    onDelete,
    onToggleFavorite,
    onRename,
    onMove
}) => {
    const { t } = useAppContext();
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const togglePasswordVisibility = (itemId: string) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getMetadata = (item: VaultItem) => {
        const metadata = item.metadata as { url?: string; username?: string; password?: string; notes?: string } | undefined;
        return {
            url: metadata?.url || item.previewUrl || '',
            username: metadata?.username || item.subtitle || '',
            password: metadata?.password || '',
            notes: metadata?.notes || ''
        };
    };

    const openUrl = (url: string) => {
        if (url) {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            window.open(fullUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white dark:bg-monday-dark-elevated rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
                                <Star size={14} />
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('name') || 'Name'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('username') || 'Username'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('password') || 'Password'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('website') || 'Website'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                {t('actions') || 'Actions'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {items.map(item => {
                            const { url, username, password } = getMetadata(item);
                            const isPasswordVisible = visiblePasswords.has(item.id);

                            return (
                                <tr
                                    key={item.id}
                                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    {/* Favorite */}
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => onToggleFavorite(item)}
                                            className={`p-1 rounded transition-colors ${item.isFavorite
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300 hover:text-yellow-400'
                                                }`}
                                        >
                                            <Star size={16} weight={item.isFavorite ? 'fill' : 'regular'} />
                                        </button>
                                    </td>

                                    {/* Name */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: (item.color || '#06B6D4') + '20' }}
                                            >
                                                <Key size={16} style={{ color: item.color || '#06B6D4' }} />
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {item.title}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Username */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                                                {username}
                                            </span>
                                            {username && (
                                                <button
                                                    onClick={() => handleCopy(username, `${item.id}-username`)}
                                                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Copy username"
                                                >
                                                    {copiedField === `${item.id}-username` ? (
                                                        <Check size={14} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Password */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                                                {isPasswordVisible ? password : '••••••••'}
                                            </span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => togglePasswordVisibility(item.id)}
                                                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    title={isPasswordVisible ? 'Hide password' : 'Show password'}
                                                >
                                                    {isPasswordVisible ? <EyeSlash size={14} /> : <Eye size={14} />}
                                                </button>
                                                {password && (
                                                    <button
                                                        onClick={() => handleCopy(password, `${item.id}-password`)}
                                                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title="Copy password"
                                                    >
                                                        {copiedField === `${item.id}-password` ? (
                                                            <Check size={14} className="text-green-500" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Website */}
                                    <td className="px-4 py-3">
                                        {url && (
                                            <button
                                                onClick={() => openUrl(url)}
                                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline text-sm"
                                            >
                                                <Globe size={14} />
                                                <span className="truncate max-w-[200px]">
                                                    {url.replace(/^https?:\/\//, '').split('/')[0]}
                                                </span>
                                                <ArrowSquareOut size={12} className="opacity-50" />
                                            </button>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <DotsThree size={18} weight="bold" />
                                            </button>

                                            {activeMenu === item.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1">
                                                        <button
                                                            onClick={() => { onRename(item); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <PencilSimple size={14} /> {t('rename') || 'Rename'}
                                                        </button>
                                                        <button
                                                            onClick={() => { onMove(item); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <Folder size={14} /> {t('move_to') || 'Move to'}
                                                        </button>
                                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                                                        <button
                                                            onClick={() => { onDelete(item.id); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash size={14} /> {t('delete') || 'Delete'}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="py-12 text-center">
                        <Key size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{t('no_logins_yet') || 'No logins saved yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
