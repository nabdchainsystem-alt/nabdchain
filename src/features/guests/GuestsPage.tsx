import React, { useState } from 'react';
import { Users, UserPlus, Link, Activity, Gear, Plus } from 'phosphor-react';
import { GuestList } from './components/GuestList';
import { GuestInviteModal } from './components/GuestInviteModal';
import { ShareLinkManager } from './components/ShareLinkManager';
import { GuestActivityLog } from './components/GuestActivityLog';
import { useGuests } from './hooks/useGuests';

// =============================================================================
// GUESTS PAGE - PLACEHOLDER
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

type GuestTab = 'guests' | 'invites' | 'links' | 'activity';

export const GuestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuestTab>('guests');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { guests, invites, shareLinks, isLoading } = useGuests();

  const tabs = [
    { id: 'guests' as const, label: 'Guests', icon: Users, count: guests.filter(g => g.status === 'active').length },
    { id: 'invites' as const, label: 'Pending Invites', icon: UserPlus, count: invites.filter(i => !i.usedAt).length },
    { id: 'links' as const, label: 'Share Links', icon: Link, count: shareLinks.filter(l => l.isActive).length },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
  ];

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Users size={24} className="text-cyan-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                Guest Access
              </h1>
              <p className="text-sm text-stone-500">
                Manage external collaborators and share links
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <Gear size={20} className="text-stone-500" />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
            >
              <Plus size={18} />
              Invite Guest
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Active Guests</p>
            <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {guests.filter(g => g.status === 'active').length}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Pending Invites</p>
            <p className="text-xl font-semibold text-amber-600">
              {invites.filter(i => !i.usedAt).length}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Active Links</p>
            <p className="text-xl font-semibold text-cyan-600">
              {shareLinks.filter(l => l.isActive).length}
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-lg">
            <p className="text-sm text-stone-500">Total Views</p>
            <p className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {shareLinks.reduce((sum, l) => sum + l.currentUses, 0)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-stone-200 dark:bg-stone-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
          </div>
        ) : (
          <>
            {activeTab === 'guests' && <GuestList guests={guests} />}
            {activeTab === 'invites' && <GuestList guests={[]} invites={invites} showInvites />}
            {activeTab === 'links' && <ShareLinkManager links={shareLinks} />}
            {activeTab === 'activity' && <GuestActivityLog />}
          </>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <GuestInviteModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
};

export default GuestsPage;
