import React from 'react';
import { User, Clock, Eye, Pencil, ChatCircle, DotsThree, Trash, EnvelopeSimple } from 'phosphor-react';
import type { Guest, GuestInvite } from '../types';

// =============================================================================
// GUEST LIST - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

interface GuestListProps {
  guests: Guest[];
  invites?: GuestInvite[];
  showInvites?: boolean;
  onRemoveGuest?: (guestId: string) => void;
  onResendInvite?: (inviteId: string) => void;
  onCancelInvite?: (inviteId: string) => void;
}

export const GuestList: React.FC<GuestListProps> = ({
  guests,
  invites = [],
  showInvites = false,
  onRemoveGuest,
  onResendInvite,
  onCancelInvite,
}) => {
  const accessLevelColors = {
    view: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    comment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    edit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const accessLevelIcons = {
    view: Eye,
    comment: ChatCircle,
    edit: Pencil,
  };

  if (showInvites && invites.length === 0) {
    return (
      <div className="text-center py-12">
        <EnvelopeSimple size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
        <p className="text-stone-500 mb-2">No pending invites</p>
        <p className="text-sm text-stone-400">
          Invite guests to collaborate on your workspace
        </p>
      </div>
    );
  }

  if (!showInvites && guests.length === 0) {
    return (
      <div className="text-center py-12">
        <User size={48} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
        <p className="text-stone-500 mb-2">No guests yet</p>
        <p className="text-sm text-stone-400">
          Invite external collaborators to work with your team
        </p>
      </div>
    );
  }

  if (showInvites) {
    return (
      <div className="space-y-3">
        {invites.map((invite) => {
          const Icon = accessLevelIcons[invite.accessLevel];
          return (
            <div
              key={invite.id}
              className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <EnvelopeSimple size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {invite.email}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <span>Sent {new Date(invite.createdAt).toLocaleDateString()}</span>
                      {invite.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${accessLevelColors[invite.accessLevel]}`}>
                    <Icon size={12} />
                    {invite.accessLevel}
                  </span>
                  <button
                    onClick={() => onResendInvite?.(invite.id)}
                    className="px-3 py-1.5 text-sm text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => onCancelInvite?.(invite.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              {invite.boards.length > 0 && (
                <div className="mt-2 text-xs text-stone-500">
                  Access to {invite.boards.length} board(s)
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {guests.map((guest) => {
        const Icon = accessLevelIcons[guest.accessLevel];
        const statusColors = {
          pending: 'text-amber-500',
          active: 'text-green-500',
          expired: 'text-stone-400',
          revoked: 'text-red-500',
        };

        return (
          <div
            key={guest.id}
            className="p-4 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {guest.avatar ? (
                  <img
                    src={guest.avatar}
                    alt={guest.name || guest.email}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                    <User size={20} className="text-cyan-600" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-800 dark:text-stone-200">
                      {guest.name || guest.email}
                    </p>
                    <span className={`w-2 h-2 rounded-full ${statusColors[guest.status]} ${guest.status === 'active' ? 'animate-pulse' : ''}`} />
                  </div>
                  <p className="text-sm text-stone-500">{guest.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${accessLevelColors[guest.accessLevel]}`}>
                  <Icon size={12} />
                  {guest.accessLevel}
                </span>
                {guest.lastActiveAt && (
                  <span className="flex items-center gap-1 text-xs text-stone-500">
                    <Clock size={12} />
                    {new Date(guest.lastActiveAt).toLocaleDateString()}
                  </span>
                )}
                <button className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">
                  <DotsThree size={18} className="text-stone-500" />
                </button>
              </div>
            </div>
            {guest.permissions.accessibleBoards.length > 0 && (
              <div className="mt-2 text-xs text-stone-500">
                Access to {guest.permissions.accessibleBoards.length} board(s)
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GuestList;
