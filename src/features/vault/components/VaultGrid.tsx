import { Folder, Image, FileText, Globe, MoreVertical, Trash2, ExternalLink, File } from 'lucide-react';
import { VaultItem } from '../types';
import { useState } from 'react';

interface Props {
    items: VaultItem[];
    onNavigate: (folderId: string) => void;
    onDelete: (itemId: string) => void;
    activeDragItem?: VaultItem | null;
}

export const VaultGrid: React.FC<Props> = ({ items, onNavigate, onDelete }) => {
    const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        setContextMenu({ id: itemId, x: e.clientX, y: e.clientY });
    };

    const handleItemClick = (item: VaultItem) => {
        // Placeholder for selection
    };

    const handleDoubleClick = (e: React.MouseEvent, item: VaultItem) => {
        e.stopPropagation();
        if (item.type === 'folder') {
            onNavigate(item.id);
        } else if (item.previewUrl) {
            window.open(item.previewUrl, '_blank');
        }
    };

    const getFileIcon = (item: VaultItem) => {
        const ext = item.title.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText size={32} className="text-red-500" />;
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileText size={32} className="text-green-500" />;
        if (['doc', 'docx'].includes(ext || '')) return <FileText size={32} className="text-blue-500" />;
        if (['zip', 'rar'].includes(ext || '')) return <Folder size={32} className="text-yellow-600" />;

        switch (item.type) {
            case 'folder': return <Folder size={36} className="fill-blue-500/20 text-blue-600 dark:fill-blue-400/20 dark:text-blue-400" />;
            case 'image': return <Image size={32} />;
            case 'weblink': return <Globe size={32} />;
            default: return <File size={32} className="text-gray-400" />;
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6" onClick={() => setContextMenu(null)}>
            {items.map(item => (
                <div
                    key={item.id}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                    onClick={() => handleItemClick(item)}
                    onDoubleClick={(e) => handleDoubleClick(e, item)}
                    className={`
                        group relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-[#20232b]
                        ${contextMenu?.id === item.id ? 'bg-gray-100 dark:bg-[#20232b] ring-2 ring-indigo-500/20' : ''}
                    `}
                >
                    {/* Context Menu */}
                    {contextMenu?.id === item.id && (
                        <div
                            className="absolute top-10 right-4 z-50 bg-white dark:bg-[#1f2937] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                            style={{ position: 'absolute' }} // Simplified positioning for now
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(item);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <ExternalLink size={14} /> Open
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                    setContextMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    )}

                    <div className="mb-3 relative">
                        <div className={`
                             w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110
                             ${item.type === 'folder' ? 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50' : ''}
                             ${item.type === 'document' ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' : ''}
                             ${item.type === 'image' ? 'bg-purple-100 text-purple-500 dark:bg-purple-500/20' : ''}
                             ${item.type === 'weblink' ? 'bg-cyan-100 text-cyan-500 dark:bg-cyan-500/20' : ''}
                         `}>
                            {item.previewUrl && item.type === 'image' ? (
                                <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                getFileIcon(item)
                            )}
                        </div>

                        {item.type === 'weblink' && (
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Globe size={10} className="text-cyan-500" />
                            </div>
                        )}

                        <button
                            className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, item.id);
                            }}
                        >
                            <MoreVertical size={14} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="text-center w-full">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full px-2" title={item.title}>
                            {item.title}
                        </h3>
                        <span className="text-xs text-gray-400">
                            {item.subtitle || (item.type === 'folder' ? '0 items' : '')}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};
