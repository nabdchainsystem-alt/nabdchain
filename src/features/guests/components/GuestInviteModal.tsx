import React, { useState } from 'react';
import { X, EnvelopeSimple, Eye, ChatCircle, Pencil, Calendar, Info } from 'phosphor-react';
import { featureLogger } from '@/utils/logger';

// =============================================================================
// GUEST INVITE MODAL - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface GuestInviteModalProps {
  onClose: () => void;
  onInvite?: (email: string, accessLevel: string) => void;
}

export const GuestInviteModal: React.FC<GuestInviteModalProps> = ({
  onClose,
  onInvite,
}) => {
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'comment' | 'edit'>('view');
  const [message, setMessage] = useState('');
  const [expiration, setExpiration] = useState<'never' | '7days' | '30days' | '90days'>('never');
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);

  const accessLevels = [
    {
      id: 'view' as const,
      label: 'View Only',
      description: 'Can view content but cannot make changes',
      icon: Eye,
    },
    {
      id: 'comment' as const,
      label: 'Comment',
      description: 'Can view and add comments',
      icon: ChatCircle,
    },
    {
      id: 'edit' as const,
      label: 'Edit',
      description: 'Can view, comment, and edit content',
      icon: Pencil,
    },
  ];

  const handleSubmit = () => {
    featureLogger.debug('[GuestInviteModal] Invite - NOT IMPLEMENTED', {
      email,
      accessLevel,
      message,
      expiration,
      selectedBoards,
    });
    onInvite?.(email, accessLevel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <EnvelopeSimple size={20} className="text-cyan-600" />
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              Invite Guest
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded"
          >
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Access Level
            </label>
            <div className="space-y-2">
              {accessLevels.map((level) => (
                <label
                  key={level.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    accessLevel === level.id
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessLevel"
                    value={level.id}
                    checked={accessLevel === level.id}
                    onChange={() => setAccessLevel(level.id)}
                    className="sr-only"
                  />
                  <level.icon
                    size={20}
                    className={accessLevel === level.id ? 'text-cyan-600' : 'text-stone-400'}
                  />
                  <div>
                    <p className={`font-medium ${
                      accessLevel === level.id
                        ? 'text-cyan-700 dark:text-cyan-300'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}>
                      {level.label}
                    </p>
                    <p className="text-sm text-stone-500">{level.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Access Expiration
            </label>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-stone-400" />
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as typeof expiration)}
                className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
              >
                <option value="never">Never expires</option>
                <option value="7days">7 days</option>
                <option value="30days">30 days</option>
                <option value="90days">90 days</option>
              </select>
            </div>
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Personal Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to your invitation..."
              rows={3}
              className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-2 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <Info size={18} className="text-stone-400 mt-0.5" />
            <p className="text-sm text-stone-500">
              Guests will receive an email invitation with a unique link to access the workspace.
              You can revoke access at any time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestInviteModal;
