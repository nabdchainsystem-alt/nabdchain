/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Star,
  File as FileIcon,
  Key,
  CreditCard,
  Note as StickyNote,
  Folder,
  Trash as Trash2,
  ArrowSquareOut as ExternalLink,
  PencilSimple as Edit2,
  ArrowCounterClockwise as Restore,
} from 'phosphor-react';
import { VaultItem } from '../types';

interface VaultListProps {
  items: VaultItem[];
  onNavigate: (folderId: string) => void;
  onDelete: (itemId: string) => void;
  onToggleFavorite: (item: VaultItem) => void;
  onRename: (item: VaultItem) => void;
  onMove: (item: VaultItem) => void;
  onRestore?: (item: VaultItem) => void;
}

const getItemIcon = (type: string, title: string = '') => {
  switch (type) {
    case 'folder':
      return <Folder size={16} className="fill-blue-500 text-blue-600 dark:text-blue-400" />;
    case 'login':
      return <Key size={16} />;
    case 'card':
      return <CreditCard size={16} />;
    case 'note':
      return <StickyNote size={16} />;
    case 'document':
    case 'image':
      // eslint-disable-next-line no-case-declarations
      const ext = title.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return <FileIcon size={16} className="text-red-500" />;
      if (['xls', 'xlsx'].includes(ext || '')) return <FileIcon size={16} className="text-green-500" />;
      return <FileIcon size={16} className="text-blue-500" />;
    case 'weblink':
      return <ExternalLink size={16} className="text-cyan-500" />;
    default:
      return <FileIcon size={16} />;
  }
};

export const VaultList: React.FC<VaultListProps> = ({
  items,
  onNavigate,
  onDelete,
  onToggleFavorite,
  onRename,
  onMove,
  onRestore,
}) => {
  const handleItemClick = (_item: VaultItem) => {
    // Placeholder selection
  };

  const handleDoubleClick = (e: React.MouseEvent, item: VaultItem) => {
    e.stopPropagation();
    if (item.type === 'folder') {
      onNavigate(item.id);
    } else if (item.previewUrl) {
      window.open(item.previewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white dark:bg-monday-dark-surface rounded-lg border border-gray-200 dark:border-monday-dark-border mx-6 my-6 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 dark:bg-monday-dark-bg border-b border-gray-200 dark:border-monday-dark-border">
          <tr>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10"></th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Modified</th>
            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-monday-dark-border">
          {items.map((item) => (
            <tr
              key={item.id}
              onClick={() => handleItemClick(item)}
              onDoubleClick={(e) => handleDoubleClick(e, item)}
              className="hover:bg-blue-50 dark:hover:bg-monday-dark-hover cursor-pointer group transition-colors"
            >
              <td className="py-3 px-4 text-center">
                <span
                  className="inline-flex w-8 h-8 items-center justify-center rounded-md text-white shadow-sm"
                  style={{ backgroundColor: item.color || '#ccc' }}
                >
                  {getItemIcon(item.type, item.title)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">{item.title}</div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {item.type === 'weblink' ? (
                  <a
                    href={(item.metadata as any)?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(item.metadata as any)?.url}
                  </a>
                ) : item.type === 'image' || item.type === 'document' ? (
                  <span className="font-mono text-xs">{(item.metadata as any)?.size || 'Unknown Size'}</span>
                ) : (
                  item.subtitle || '-'
                )}
              </td>
              <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{item.lastModified}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.isDeleted ? (
                    // Trash item actions
                    <>
                      {onRestore && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestore(item);
                          }}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-gray-500 hover:text-green-600"
                          title="Restore"
                        >
                          <Restore size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-500 hover:text-red-500"
                        title="Delete Permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    // Normal item actions
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        className={`p-1 rounded transition-colors ${item.isFavorite ? 'text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        title={item.isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star size={16} className={item.isFavorite ? 'fill-current' : ''} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRename(item);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-monday-blue"
                        title="Rename"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMove(item);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-500 hover:text-monday-blue"
                        title="Move to Folder"
                      >
                        <Folder size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-gray-500 hover:text-red-500"
                        title="Move to Trash"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
