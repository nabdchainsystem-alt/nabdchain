import React, { useState } from 'react';
import { Globe, X, Info } from 'phosphor-react';
import type { Webhook as WebhookType, WebhookEvent } from '../types';

// =============================================================================
// WEBHOOK FORM - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface WebhookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (webhook: Partial<WebhookType>) => void;
  webhook?: WebhookType;
  boards?: { id: string; name: string }[];
}

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'item.created', label: 'Item Created', description: 'When a new item is added' },
  { value: 'item.updated', label: 'Item Updated', description: 'When an item is modified' },
  { value: 'item.deleted', label: 'Item Deleted', description: 'When an item is removed' },
  { value: 'item.status_changed', label: 'Status Changed', description: 'When status column changes' },
  { value: 'item.assigned', label: 'Item Assigned', description: 'When assignee changes' },
  { value: 'comment.created', label: 'Comment Added', description: 'When a comment is posted' },
  { value: 'board.created', label: 'Board Created', description: 'When a new board is created' },
  { value: 'member.added', label: 'Member Added', description: 'When someone joins' },
];

export const WebhookForm: React.FC<WebhookFormProps> = ({
  isOpen,
  onClose,
  onSave,
  webhook,
  boards = [],
}) => {
  const [name, setName] = useState(webhook?.name || '');
  const [url, setUrl] = useState(webhook?.url || '');
  const [secret, setSecret] = useState(webhook?.secret || '');
  const [events, setEvents] = useState<WebhookEvent[]>(webhook?.events || []);
  const [selectedBoards, setSelectedBoards] = useState<string[]>(webhook?.boardIds || []);
  const [allBoards, setAllBoards] = useState(webhook?.boardIds.length === 0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim() || !url.trim() || events.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      name,
      url,
      secret: secret || undefined,
      events,
      boardIds: allBoards ? [] : selectedBoards,
      active: true,
    });
  };

  const toggleEvent = (event: WebhookEvent) => {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Globe size={20} />
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Webhook"
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Endpoint URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 font-mono text-sm"
            />
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
              Secret (optional)
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Used to sign payloads"
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800"
            />
            <p className="mt-1 text-xs text-stone-500 flex items-center gap-1">
              <Info size={12} />
              Payloads will be signed with HMAC-SHA256
            </p>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Events *
            </label>
            <div className="space-y-1">
              {WEBHOOK_EVENTS.map(({ value, label, description }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(value)}
                    onChange={() => toggleEvent(value)}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
                    <p className="text-xs text-stone-500">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Boards Filter */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Boards
            </label>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={allBoards}
                onChange={(e) => setAllBoards(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-stone-600 dark:text-stone-400">
                All boards
              </span>
            </label>
            {!allBoards && boards.length > 0 && (
              <div className="max-h-[150px] overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-lg">
                {boards.map((board) => (
                  <label
                    key={board.id}
                    className="flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoards.includes(board.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBoards([...selectedBoards, board.id]);
                        } else {
                          setSelectedBoards(selectedBoards.filter((id) => id !== board.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-stone-700 dark:text-stone-300">
                      {board.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            {webhook ? 'Save Changes' : 'Create Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebhookForm;
