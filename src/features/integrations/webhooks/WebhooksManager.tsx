import React, { useState } from 'react';
import { Globe, Plus, Play, Pause, Trash, Clock, Check, X } from 'phosphor-react';
import type { Webhook as WebhookType } from '../types';

// =============================================================================
// WEBHOOKS MANAGER - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface WebhooksManagerProps {
  webhooks?: WebhookType[];
  onAdd?: () => void;
  onEdit?: (webhook: WebhookType) => void;
  onDelete?: (webhookId: string) => void;
  onToggle?: (webhookId: string, active: boolean) => void;
}

export const WebhooksManager: React.FC<WebhooksManagerProps> = ({
  webhooks = [],
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-stone-600 dark:text-stone-400" />
          <h2 className="font-semibold text-stone-800 dark:text-stone-200">
            Webhooks
          </h2>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          <Plus size={16} />
          Add Webhook
        </button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="p-8 bg-stone-50 dark:bg-stone-800 rounded-xl text-center">
          <Globe size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
          <p className="text-stone-600 dark:text-stone-400 mb-2">
            No webhooks configured
          </p>
          <p className="text-sm text-stone-500 mb-4">
            Create webhooks to send real-time data to external services
          </p>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
          >
            Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    webhook.active
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-stone-100 dark:bg-stone-800'
                  }`}>
                    <Webhook
                      size={20}
                      className={webhook.active ? 'text-green-600' : 'text-stone-400'}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-800 dark:text-stone-200">
                      {webhook.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-mono mt-0.5 truncate max-w-[300px]">
                      {webhook.url}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {webhook.lastTriggered
                          ? `Last triggered ${new Date(webhook.lastTriggered).toLocaleDateString()}`
                          : 'Never triggered'
                        }
                      </span>
                      <span className="flex items-center gap-1">
                        {webhook.failureCount > 0 ? (
                          <X size={12} className="text-red-500" />
                        ) : (
                          <Check size={12} className="text-green-500" />
                        )}
                        {webhook.failureCount} failures
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggle?.(webhook.id, !webhook.active)}
                    className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
                    title={webhook.active ? 'Pause' : 'Activate'}
                  >
                    {webhook.active ? (
                      <Pause size={16} className="text-amber-500" />
                    ) : (
                      <Play size={16} className="text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => onEdit?.(webhook)}
                    className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete?.(webhook.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Events */}
              <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <span
                      key={event}
                      className="px-2 py-0.5 text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Coming Soon Notice */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          Webhooks feature coming soon
        </p>
      </div>
    </div>
  );
};

export default WebhooksManager;
