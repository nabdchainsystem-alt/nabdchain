import React, { useState } from 'react';
import { Link, Copy, Trash, Eye, Clock, Plus, CheckCircle, Lock } from 'phosphor-react';
import type { ShareLink } from '../types';

// =============================================================================
// SHARE LINK MANAGER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface ShareLinkManagerProps {
  links: ShareLink[];
  onCreateLink?: () => void;
  onDeleteLink?: (linkId: string) => void;
  onToggleLink?: (linkId: string, active: boolean) => void;
}

export const ShareLinkManager: React.FC<ShareLinkManagerProps> = ({
  links,
  onCreateLink,
  onDeleteLink,
  onToggleLink,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (link: ShareLink) => {
    await navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-12">
        <Link size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
        <p className="text-stone-500 mb-2">No share links yet</p>
        <p className="text-sm text-stone-400 mb-4">
          Create shareable links to let guests access specific content
        </p>
        <button
          onClick={onCreateLink}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
        >
          <Plus size={16} className="inline mr-1" />
          Create Share Link
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800 dark:text-stone-200">
          Share Links
        </h3>
        <button
          onClick={onCreateLink}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
        >
          <Plus size={16} />
          Create Link
        </button>
      </div>

      <div className="space-y-3">
        {links.map((link) => (
          <div
            key={link.id}
            className={`p-4 bg-white dark:bg-stone-900 rounded-xl border ${
              link.isActive
                ? 'border-stone-200 dark:border-stone-700'
                : 'border-stone-200 dark:border-stone-700 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  link.isActive
                    ? 'bg-cyan-100 dark:bg-cyan-900/30'
                    : 'bg-stone-100 dark:bg-stone-800'
                }`}>
                  <Link size={20} className={link.isActive ? 'text-cyan-600' : 'text-stone-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {link.resourceType.charAt(0).toUpperCase() + link.resourceType.slice(1)} Link
                    </p>
                    {link.password && (
                      <span title="Password protected"><Lock size={14} className="text-amber-500" /></span>
                    )}
                    {!link.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {link.currentUses} views
                      {link.maxUses && ` / ${link.maxUses} max`}
                    </span>
                    {link.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Expires {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(link)}
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                  title="Copy link"
                >
                  {copiedId === link.id ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} className="text-stone-500" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteLink?.(link.id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Delete link"
                >
                  <Trash size={16} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* URL Display */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-600 dark:text-stone-400"
              />
              <button
                onClick={() => handleCopy(link)}
                className="px-3 py-2 text-sm bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-lg"
              >
                {copiedId === link.id ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Toggle Active */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span className="text-sm text-stone-500">Link active</span>
              <button
                onClick={() => onToggleLink?.(link.id, !link.isActive)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  link.isActive ? 'bg-cyan-500' : 'bg-stone-300 dark:bg-stone-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    link.isActive ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-center">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Share Link Manager - Full functionality coming soon
        </p>
      </div>
    </div>
  );
};

export default ShareLinkManager;
