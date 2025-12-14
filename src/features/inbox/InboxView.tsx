import React, { useState, useRef } from 'react';
import {
  PenSquare, Sparkles, Inbox, Archive, FileText, Send, Trash2,
  History, Ban, Folder, ChevronRight, ChevronDown, Trash,
  MailOpen, Reply, ReplyAll, Forward, Move, Copy, Tag, Pin,
  Clock, Flag, RefreshCw, AlertOctagon, Printer, MoreHorizontal,
  Search, Paperclip, CheckSquare, Globe, User
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { ComposeView } from './ComposeView';

interface MailItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  initial: string;
  color: string;
  isUnread?: boolean;
  hasAttachment?: boolean;
}

const MOCK_MAILS: MailItem[] = [
  {
    id: '1',
    sender: 'Alice Finance',
    subject: 'Financial Update',
    preview: 'Review the quarterly budget proposal from finance team. We need to finalize the allocation...',
    time: '10:44 PM',
    initial: 'A',
    color: 'bg-purple-500',
    isUnread: true,
    hasAttachment: true
  },
  {
    id: '2',
    sender: 'Mom',
    subject: 'Family Reunion',
    preview: 'Call Mom to wish her happy birthday. Also ask about the family reunion dates.',
    time: '10:04 PM',
    initial: 'M',
    color: 'bg-pink-500',
    isUnread: false
  },
  {
    id: '3',
    sender: 'Bob Project Lead',
    subject: 'Project Phoenix',
    preview: 'Draft the initial concept for the "Project Phoenix" redesign. The client is waiting.',
    time: '10:49 PM',
    initial: 'B',
    color: 'bg-blue-500',
    isUnread: false,
    hasAttachment: true
  }
];

export const InboxView: React.FC = () => {
  const [selectedMailId, setSelectedMailId] = useState<string>(MOCK_MAILS[0].id);
  const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');
  const [rightPanelMode, setRightPanelMode] = useState<'view' | 'compose'>('view'); // Added rightPanelMode state
  const { t } = useAppContext();

  const selectedMail = MOCK_MAILS.find(m => m.id === selectedMailId);

  return (
    <div className="flex h-full w-full bg-white dark:bg-monday-dark-bg overflow-hidden font-sans text-gray-800 dark:text-monday-dark-text">

      {/* 1. Inner Sidebar (Folders) */}
      <div className="w-60 bg-[#f7f8fa] dark:bg-monday-dark-surface border-e border-gray-200 dark:border-monday-dark-border flex flex-col flex-shrink-0">
        <div className="p-3 space-y-2">
          <div className="mb-2 px-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Inbox</h1>
          </div>
          <button
            onClick={() => setRightPanelMode('compose')} // Changed onClick handler
            className="w-full bg-monday-blue hover:bg-blue-600 text-white py-1.5 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <PenSquare size={14} />
            <span className="font-medium text-xs">{t('new_mail')}</span>
          </button>

          <button className="w-full bg-white dark:bg-transparent border border-gray-200 dark:border-monday-dark-border hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-gray-700 dark:text-monday-dark-text py-1.5 px-4 rounded shadow-sm flex items-center justify-center gap-2 transition-colors">
            <Sparkles size={14} className="text-monday-blue" />
            <span className="font-medium text-xs">{t('capture')}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          <NavItem icon={<Inbox size={16} />} label={t('inbox')} isActive count={4} />
          <NavItem icon={<Archive size={16} />} label={t('archive')} />
          <NavItem icon={<FileText size={16} />} label={t('drafts')} />
          <NavItem icon={<Send size={16} />} label={t('sent')} />
          <NavItem icon={<Trash2 size={16} />} label={t('deleted_items')} />
          <NavItem icon={<Ban size={16} />} label={t('junk_email')} />

          <div className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">
              {t('folders')} <PlusIcon />
            </div>
            <div className="space-y-0.5">
              <FolderItem label="Personal" hasChildren />
              <FolderItem label="Receipts" indent />
              <FolderItem label="Travel Plans" indent />
              <FolderItem label="Work Projects" hasChildren />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden"> {/* Added overflow-hidden */}

        {/* Top Action Toolbar */}
        <div
          className="h-12 border-b border-gray-200 dark:border-monday-dark-border flex items-center px-2 bg-white dark:bg-monday-dark-surface flex-shrink-0 overflow-x-auto space-x-0.5 rtl:space-x-reverse [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          <ToolbarAction icon={<Trash size={16} />} label={t('delete')} />
          <ToolbarAction icon={<Archive size={16} />} label={t('archive')} />
          <ToolbarAction icon={<MailOpen size={16} />} label={t('read_unread')} />
          <div className="w-px h-6 bg-gray-200 dark:bg-monday-dark-border mx-2 flex-shrink-0"></div>
          <ToolbarAction icon={<Reply size={16} />} label={t('reply')} />
          <ToolbarAction icon={<ReplyAll size={16} />} label={t('reply_all')} />
          <ToolbarAction icon={<Forward size={16} />} label={t('forward')} />
          <div className="w-px h-6 bg-gray-200 dark:bg-monday-dark-border mx-2 flex-shrink-0"></div>
          <ToolbarAction icon={<Move size={16} />} label={t('move')} />
          <ToolbarAction icon={<Copy size={16} />} label={t('copy')} />
          <ToolbarAction icon={<Tag size={16} />} label={t('categorize')} />
          <ToolbarAction icon={<Pin size={16} />} label={t('pin')} />
          <ToolbarAction icon={<Clock size={16} />} label={t('snooze')} />
          <ToolbarAction icon={<Flag size={16} />} label={t('flag')} />
          <div className="w-px h-6 bg-gray-200 dark:bg-monday-dark-border mx-2 flex-shrink-0"></div>
          <ToolbarAction icon={<RefreshCw size={16} />} label={t('sync')} />
          <ToolbarAction icon={<AlertOctagon size={16} />} label={t('report')} />
          <ToolbarAction icon={<Ban size={16} />} label={t('block')} />
          <div className="flex-1"></div>
          <ToolbarAction icon={<Globe size={16} />} label={t('translate')} />
          <ToolbarAction icon={<Printer size={16} />} label={t('print')} />
          <ToolbarAction icon={<MoreHorizontal size={16} />} label={t('more')} />
        </div>

        <div className="flex-1 flex overflow-hidden relative"> {/* Added relative */}
          {/* 2a. Mail List */}
          <div className="w-80 border-e border-gray-200 dark:border-monday-dark-border flex flex-col flex-shrink-0 bg-white dark:bg-monday-dark-surface">
            <div className="p-2 border-b border-gray-100 dark:border-monday-dark-border flex items-center justify-center bg-white dark:bg-monday-dark-surface">
              <div className="flex p-0.5 bg-gray-100 dark:bg-monday-dark-bg rounded-lg w-full">
                <button
                  onClick={() => setActiveTab('focused')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'focused' ? 'bg-white dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                  {t('focused')}
                </button>
                <button
                  onClick={() => setActiveTab('other')}
                  className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'other' ? 'bg-white dark:bg-monday-dark-hover text-monday-blue shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                  {t('other')}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
              {MOCK_MAILS.map(mail => (
                <div
                  key={mail.id}
                  onClick={() => setSelectedMailId(mail.id)}
                  className={`py-2 px-3 border-b border-gray-100 dark:border-monday-dark-border cursor-pointer transition-colors group relative ${selectedMailId === mail.id ? 'bg-blue-50/50 dark:bg-monday-dark-hover/50' : 'hover:bg-gray-50 dark:hover:bg-monday-dark-hover'}`}
                >
                  {selectedMailId === mail.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-monday-blue"></div>
                  )}
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`text-sm truncate pe-2 leading-tight ${mail.isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                      {mail.sender}
                    </span>
                    <span className={`text-xs flex-shrink-0 ${mail.isUnread ? 'text-monday-blue font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                      {mail.time}
                    </span>
                  </div>
                  <div className={`text-sm mb-0.5 truncate leading-tight ${mail.isUnread ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {mail.subject}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 leading-snug">
                    {mail.preview}
                  </div>
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity h-4">
                    <Tag size={12} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    <CheckSquare size={12} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    {mail.hasAttachment && <Paperclip size={12} className="text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2b. Reading Pane */}
          {selectedMail ? (
            <div className="flex-1 bg-white dark:bg-monday-dark-bg overflow-y-auto p-6 relative"> {/* Added relative */}
              <div className="flex items-start gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full ${selectedMail.color} text-white flex items-center justify-center text-lg font-medium shadow-sm`}>
                  {selectedMail.initial}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold text-[#323338] dark:text-monday-dark-text mb-0.5 leading-tight">{selectedMail.subject}</h1>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-300">You</span>
                    <span>•</span>
                    <span>12/12/2025, 10:44:31 PM</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400"><Reply size={16} /></button>
                  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400"><MoreHorizontal size={16} /></button>
                </div>
              </div>

              <div className="prose max-w-3xl text-[#323338] dark:text-monday-dark-text">
                <p className="text-base leading-7 font-normal text-gray-800 dark:text-gray-200">
                  {selectedMail.preview} We need to finalize the allocation for the new marketing campaign by Friday.
                </p>
                <p className="mt-4 text-base leading-7 text-gray-800 dark:text-gray-200">
                  Please check the attached document for the breakdown of expenses.
                </p>

                {selectedMail.hasAttachment && (
                  <div className="mt-6 border border-gray-200 dark:border-monday-dark-border rounded p-3 w-60 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">Budget_Q4_Final.pdf</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">2.4 MB</div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-monday-dark-border">
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors">
                    <Reply size={14} /> {t('reply')}
                  </button>
                </div>
              </div>

              {/* Compose View Panel - Sliding up */}
              <div
                className={`
                     absolute inset-0 z-30 bg-white dark:bg-stone-900 flex flex-col transition-transform duration-500 ease-in-out shadow-2xl
                     ${rightPanelMode === 'compose' ? 'translate-y-0' : 'translate-y-[110%] pointer-events-none'}
                   `}
              >
                <ComposeView onDiscard={() => setRightPanelMode('view')} />
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm relative"> {/* Added relative */}
              Select an item to read
              {/* Ensure Compose View works even if no mail selected */}
              <div
                className={`
                         absolute inset-0 z-30 bg-white dark:bg-stone-900 flex flex-col transition-transform duration-500 ease-in-out shadow-2xl
                         ${rightPanelMode === 'compose' ? 'translate-y-0' : 'translate-y-[110%] pointer-events-none'}
                       `}
              >
                <ComposeView onDiscard={() => setRightPanelMode('view')} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const NavItem = ({ icon, label, isActive, count }: { icon: React.ReactNode, label: string, isActive?: boolean, count?: number }) => (
  <div className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer group ${isActive ? 'bg-[#e5f0fa] dark:bg-monday-dark-hover text-monday-blue font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-monday-dark-hover'}`}>
    <div className="flex items-center gap-2.5">
      <span className={isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}>{icon}</span>
      <span className="text-[13px]">{label}</span>
    </div>
    {count && (
      <span className={`text-[10px] font-semibold ${isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400'}`}>{count}</span>
    )}
  </div>
);

const FolderItem = ({ label, hasChildren, indent }: { label: string, hasChildren?: boolean, indent?: boolean }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-400 ${indent ? 'ps-8' : ''}`}>
    {hasChildren && <ChevronDown size={12} className="text-gray-400" />}
    {!hasChildren && <div className="w-3"></div>}
    <span className="text-[13px]">{label}</span>
  </div>
);

const ToolbarAction = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="flex flex-col items-center justify-center px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-w-[50px] flex-shrink-0 transition-colors gap-0.5 group h-full">
    <div className="group-hover:scale-105 transition-transform">{icon}</div>
    <span className="text-[9px] font-medium whitespace-nowrap opacity-80 group-hover:opacity-100">{label}</span>
  </button>
);

const PlusIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);