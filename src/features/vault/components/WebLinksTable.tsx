import React, { useState } from 'react';
import { Globe, Copy, Check, DotsThree, Star, Trash, PencilSimple, ArrowSquareOut, Folder, Link } from 'phosphor-react';
import { VaultItem } from '../types';
import { useAppContext } from '../../../contexts/AppContext';

interface WebLinksTableProps {
    items: VaultItem[];
    onDelete: (itemId: string) => void;
    onToggleFavorite: (item: VaultItem) => void;
    onRename: (item: VaultItem) => void;
    onMove: (item: VaultItem) => void;
}

export const WebLinksTable: React.FC<WebLinksTableProps> = ({
    items,
    onDelete,
    onToggleFavorite,
    onRename,
    onMove
}) => {
    const { t } = useAppContext();
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const handleCopy = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getUrl = (item: VaultItem): string => {
        const metadata = item.metadata as { url?: string } | undefined;
        return metadata?.url || item.previewUrl || item.subtitle || '';
    };

    const getDomain = (url: string): string => {
        try {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            return new URL(fullUrl).hostname;
        } catch {
            return url;
        }
    };

    const openUrl = (url: string) => {
        if (url) {
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            window.open(fullUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const getFaviconUrl = (url: string): string => {
        const domain = getDomain(url);
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
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
                                {t('url') || 'URL'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('domain') || 'Domain'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('added') || 'Added'}
                            </th>
                            <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                                {t('actions') || 'Actions'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {items.map(item => {
                            const url = getUrl(item);
                            const domain = getDomain(url);

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
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={getFaviconUrl(url)}
                                                    alt=""
                                                    className="w-5 h-5"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => openUrl(url)}
                                                className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                {item.title}
                                            </button>
                                        </div>
                                    </td>

                                    {/* URL */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-[300px]" title={url}>
                                                {url}
                                            </span>
                                            {url && (
                                                <button
                                                    onClick={() => handleCopy(url, `${item.id}-url`)}
                                                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Copy URL"
                                                >
                                                    {copiedField === `${item.id}-url` ? (
                                                        <Check size={14} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Domain */}
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openUrl(url)}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            <Globe size={14} />
                                            <span>{domain}</span>
                                            <ArrowSquareOut size={12} className="opacity-50" />
                                        </button>
                                    </td>

                                    {/* Added Date */}
                                    <td className="px-4 py-3">
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                                            {item.lastModified}
                                        </span>
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
                                                            onClick={() => { openUrl(url); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <ArrowSquareOut size={14} /> {t('open_link') || 'Open Link'}
                                                        </button>
                                                        <button
                                                            onClick={() => { handleCopy(url, `${item.id}-menu`); setActiveMenu(null); }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        >
                                                            <Copy size={14} /> {t('copy_url') || 'Copy URL'}
                                                        </button>
                                                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
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
                        <Link size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">{t('no_weblinks_yet') || 'No web links saved yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
