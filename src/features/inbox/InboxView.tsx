import React, { useState, useRef, useEffect } from 'react';
import {
  PenSquare, Sparkles, Inbox, Archive, FileText, Send, Trash2,
  History, Ban, Folder, ChevronRight, ChevronDown, Trash,
  MailOpen, Reply, ReplyAll, Forward, Move, Copy, Tag, Pin,
  Clock, Flag, RefreshCw, AlertOctagon, Printer, MoreHorizontal,
  Search, Paperclip, CheckSquare, Globe, User, Plus,
  Mail, Star, AlertTriangle, CheckSquare as TaskIcon
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is imported if available, else use custom gen
import { useAppContext } from '../../contexts/AppContext';
import { ComposeView } from './ComposeView';
import { ConnectAccount } from './components/ConnectAccount';
import { emailService } from '../../services/emailService';
import { ConfirmModal } from '../board/components/ConfirmModal';
import { useAuth } from '@clerk/clerk-react';

interface MailItem {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  body?: string; // HTML content
  provider: 'google' | 'outlook';
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
    hasAttachment: true,
    provider: 'google'
  },
  {
    id: '2',
    sender: 'Mom',
    subject: 'Family Reunion',
    preview: 'Call Mom to wish her happy birthday. Also ask about the family reunion dates.',
    time: '10:04 PM',
    initial: 'M',
    color: 'bg-pink-500',
    isUnread: false,
    provider: 'google'
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
    hasAttachment: true,
    provider: 'outlook'
  }
];

interface InboxViewProps {
  logActivity?: (type: string, content: string, metadata?: any, workspaceId?: string, boardId?: string) => Promise<void>;
}

export const InboxView: React.FC<InboxViewProps> = ({ logActivity }) => {
  const [mails, setMails] = useState<MailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]); // Folder list
  const [activeFolder, setActiveFolder] = useState<string>('INBOX'); // Currently selected folder

  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');
  const [rightPanelMode, setRightPanelMode] = useState<'view' | 'compose'>('view');
  const { t } = useAppContext();
  const { getToken } = useAuth();

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (hasAccount) {
      fetchEmails();     // Refresh emails
      fetchFolders();    // Fetch current folders
    }
  }, [hasAccount, activeFolder]);

  const checkConnection = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await emailService.getAccounts(token);
      setAccounts(data);
      if (data.length > 0) {
        setHasAccount(true);
      } else {
        setHasAccount(false);
      }
    } catch (e) {
      console.error("Failed to check connection", e);
      setHasAccount(false);
    } finally {
      if (!hasAccount) setLoading(false); // only stop loading if no account, otherwise fetchEmails handles it
    }
  };

  const fetchFolders = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await emailService.getFolders(token);
      setFolders(data);
    } catch (e) {
      console.error("Failed to fetch folders", e);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      // Pass activeFolder to filtering
      let folderId = activeFolder === 'INBOX' ? undefined : activeFolder;
      const data = await emailService.getEmails(token, folderId);
      setMails(data);
      if (data.length > 0) setSelectedMailId(data[0].id);
      else setSelectedMailId(null);
    } catch (error) {
      console.error("Failed to fetch emails", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    await checkConnection();
    await fetchEmails();
    setLoading(false);
  };

  const [replyData, setReplyData] = useState<{ to: string, subject: string, body: string } | undefined>(undefined);

  const handleDelete = async (id: string, provider: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move to Trash?',
      message: 'This email will be moved to your trash folder.',
      confirmText: 'Move to Trash',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await emailService.trash(token, id, provider);
          setMails(prev => prev.filter(m => m.id !== id));
          setSelectedMailId(null);
          if (logActivity) {
            logActivity('EMAIL_DELETED', `Moved email to trash: ${mails.find(m => m.id === id)?.subject || 'email'}`, { emailId: id });
          }
        } catch (e) {
          console.error(e);
          alert("Failed to delete");
        }
      }
    });
  };

  const handleArchive = async (id: string, provider: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      await emailService.archive(token, id, provider);
      setMails(prev => prev.filter(m => m.id !== id));
      setSelectedMailId(null);
      if (logActivity) {
        logActivity('EMAIL_ARCHIVED', `Archived email: ${mails.find(m => m.id === id)?.subject || 'email'}`, { emailId: id });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to archive");
    }
  };

  const handleMarkRead = async (id: string, provider: string, isRead: boolean) => {
    try {
      const token = await getToken();
      if (!token) return;
      // Optimistic update
      setMails(prev => prev.map(m => m.id === id ? { ...m, isUnread: !isRead } : m));

      if (isRead) {
        await emailService.markRead(token, id, provider);
      } else {
        // TODO: Implement mark unread in service/backend
        console.log("Mark unread not fully implemented yet");
      }
    } catch (e) {
      console.error("Failed to mark read/unread", e);
    }
  };

  const handleStar = (id: string) => {
    // Optimistic update
    console.log("Star clicked", id);
    // setMails(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
  };

  const handleSpam = (id: string) => {
    console.log("Spam clicked", id);
    alert("Marked as spam (simulation)");
  };

  const handleCreateTask = () => {
    if (!selectedMail) return;

    try {
      // Attempt to find the main board data in localStorage
      const keys = ['room-board-data-v2-main', 'room-board-data-v2-default-board'];
      let targetKey = '';
      let boardData: any = null;

      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          boardData = JSON.parse(data);
          targetKey = key;
          break;
        }
      }

      if (!boardData || !boardData.groups || boardData.groups.length === 0) {
        // Fallback: Create new board data if missing? Or just alert.
        alert("Could not find Main Board to add task.");
        return;
      }

      // Add task to first group
      const newTask = {
        id: uuidv4(), // Need uuid import or simple random
        name: selectedMail.subject,
        status: 'New', // Enum value string
        priority: 'Normal',
        personId: null,
        dueDate: '',
        textValues: {},
        selected: false
      };

      boardData.groups[0].tasks.push(newTask);
      localStorage.setItem(targetKey, JSON.stringify(boardData));

      if (logActivity) {
        logActivity('TASK_CREATED', `Created task from email: ${selectedMail.subject}`, { emailId: selectedMail.id, taskId: newTask.id });
      }

      alert("Task created in Main Board!");
    } catch (e) {
      console.error("Failed to create task", e);
      alert("Failed to create task");
    }
  };

  const handleSnooze = () => {
    alert("Snoozed for 1 hour (Simulation)");
  };

  const handleAIAnalysis = () => {
    alert("AI Analysis: \n- Sentiment: Positive\n- Action Items: Review contract\n- Priority: High");
  };

  const handleReply = (mail: MailItem) => {
    let quote = `\n\n\nOn ${new Date(mail.time).toLocaleString()}, <${mail.sender}> wrote:\n> ${mail.preview}`;
    const emailMatch = mail.sender.match(/<(.+)>/);
    const to = emailMatch ? emailMatch[1] : mail.sender;

    setReplyData({
      to: to,
      subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
      body: quote
    });
    setRightPanelMode('compose');
  };

  const handleDisconnect = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Disconnect Account?',
      message: 'Are you sure you want to disconnect this email account? You will stop receiving updates.',
      confirmText: 'Disconnect',
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await emailService.disconnectAccount(id, token);
          checkConnection();
        } catch (e) { alert('Failed to disconnect'); }
      }
    });
  };

  if (loading && !hasAccount) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!hasAccount) {
    return <ConnectAccount />;
  }

  const selectedMail = mails.find(m => m.id === selectedMailId);

  return (
    <div className="flex h-full w-full bg-white dark:bg-monday-dark-bg overflow-hidden font-sans text-gray-800 dark:text-monday-dark-text relative">

      {/* 1. Inner Sidebar (Folders) */}
      <div className="w-60 bg-[#f7f8fa] dark:bg-monday-dark-surface border-e border-gray-200 dark:border-monday-dark-border flex flex-col flex-shrink-0">
        <div className="p-3 space-y-2">
          <div className="mb-2 px-1">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Inbox</h1>
          </div>
          <button
            onClick={() => setRightPanelMode('compose')}
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

        {/* Connected Accounts List */}
        <div className="px-3 pb-2 space-y-1">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Connected</div>
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover group">
              <span className="truncate max-w-[140px]" title={acc.email}>{acc.email}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisconnect(acc.id);
                }}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          {/* Main Links */}
          <NavItem
            icon={<Inbox size={16} />}
            label="Inbox"
            isActive={activeFolder === 'INBOX' || !activeFolder}
            onClick={() => setActiveFolder('INBOX')}
            count={mails.filter(m => m.isUnread).length || undefined}
          />
          <NavItem
            icon={<Send size={16} />}
            label="Sent"
            isActive={activeFolder === 'SENT'}
            onClick={() => setActiveFolder('SENT')}
          />
          <NavItem
            icon={<Trash2 size={16} />}
            label="Trash"
            isActive={activeFolder === 'TRASH' || activeFolder === 'deleteditems'}
            onClick={() => setActiveFolder('TRASH')}
          />

          <div className="pt-4 pb-2 px-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-monday-dark-text-secondary uppercase tracking-wider mb-2">
              {t('folders')} <PlusIcon />
            </div>

            <div className="space-y-0.5">
              {folders
                .filter(f => !['INBOX', 'SENT', 'TRASH', 'DRAFT', 'IMPORTANT', 'STARRED', 'deleteditems', 'junk', 'sentitems'].includes(f.id.toLowerCase()))
                .map(folder => (
                  <FolderItem
                    key={folder.id}
                    label={folder.name}
                    onClick={() => setActiveFolder(folder.id)}
                    isActive={activeFolder === folder.id}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">

        {/* Top Action Toolbar */}
        <div className="h-12 border-b border-gray-200 dark:border-monday-dark-border flex items-center px-2 bg-white dark:bg-monday-dark-surface flex-shrink-0 overflow-x-auto space-x-0.5 rtl:space-x-reverse [&::-webkit-scrollbar]:hidden">
          <ToolbarAction icon={<RefreshCw size={16} />} label={t('sync')} onClick={handleSync} />
          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <ToolbarAction
            icon={<MailOpen size={16} />}
            label={t('read')}
            onClick={() => selectedMail && handleMarkRead(selectedMail.id, selectedMail.provider, true)}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Mail size={16} />}
            label={t('unread')}
            onClick={() => selectedMail && handleMarkRead(selectedMail.id, selectedMail.provider, false)}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Star size={16} />}
            label={t('star')}
            onClick={() => selectedMail && handleStar(selectedMail.id)}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<AlertTriangle size={16} />}
            label={t('spam')}
            onClick={() => selectedMail && handleSpam(selectedMail.id)}
            disabled={!selectedMail}
          />

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <ToolbarAction
            icon={<CheckSquare size={16} />}
            label="Task"
            onClick={handleCreateTask}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Clock size={16} />}
            label={t('snooze')}
            onClick={handleSnooze}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Sparkles size={16} />}
            label="AI"
            onClick={handleAIAnalysis}
            disabled={!selectedMail}
          />

          <div className="w-px h-6 bg-gray-200 mx-2"></div>

          <ToolbarAction
            icon={<Trash size={16} />}
            label={t('delete')}
            onClick={() => selectedMail && handleDelete(selectedMail.id, selectedMail.provider)}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Archive size={16} />}
            label={t('archive')}
            onClick={() => selectedMail && handleArchive(selectedMail.id, selectedMail.provider)}
            disabled={!selectedMail}
          />
          <ToolbarAction
            icon={<Reply size={16} />}
            label={t('reply')}
            onClick={() => selectedMail && handleReply(selectedMail)}
            disabled={!selectedMail}
          />
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* 2a. Mail List */}
          <div className="w-80 border-e border-gray-200 dark:border-monday-dark-border flex flex-col flex-shrink-0 bg-white dark:bg-monday-dark-surface">
            {/* Tabs */}
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
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">Syncing emails...</div>
              ) : mails.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">No emails found</div>
              ) : (
                mails.map(mail => (
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
                        {/* Parse simple time if possible, or just string */}
                        {new Date(mail.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`text-sm mb-0.5 truncate leading-tight ${mail.isUnread ? 'text-gray-800 dark:text-gray-200 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {mail.subject}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 leading-snug">
                      {mail.preview}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2b. Reading Pane */}
          {rightPanelMode === 'compose' ? (
            <div className="flex-1 bg-white dark:bg-monday-dark-bg overflow-y-auto relative">
              <ComposeView onDiscard={() => setRightPanelMode('view')} accounts={accounts} logActivity={logActivity} />
            </div>
          ) : selectedMail ? (
            <div className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-monday-dark-bg">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full ${selectedMail.color} text-white flex items-center justify-center text-lg font-medium shadow-sm`}>
                    {selectedMail.initial}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-[#323338] dark:text-monday-dark-text mb-0.5 leading-tight">{selectedMail.subject}</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-300">{selectedMail.sender}</span>
                      <span>•</span>
                      <span>{new Date(selectedMail.time).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleReply(selectedMail)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400" title="Reply"><Reply size={16} /></button>
                    <button onClick={() => handleDelete(selectedMail.id, selectedMail.provider)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400" title="Delete"><Trash2 size={16} /></button>
                    <button onClick={() => handleArchive(selectedMail.id, selectedMail.provider)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-monday-dark-hover rounded text-gray-500 dark:text-gray-400" title="Archive"><Archive size={16} /></button>
                  </div>
                </div>

                <div className="prose max-w-none text-[#323338] dark:text-monday-dark-text">
                  {selectedMail.body ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedMail.body }} />
                  ) : (
                    <p className="text-base leading-7 font-normal text-gray-800 dark:text-gray-200">
                      {selectedMail.preview} ...
                    </p>
                  )}
                </div>

                {selectedMail.hasAttachment && (
                  <div className="mt-6 border border-gray-200 dark:border-monday-dark-border rounded p-3 w-60 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-monday-dark-hover cursor-pointer transition-colors">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">Attachment.pdf</div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-monday-dark-border">
                  <button
                    onClick={() => handleReply(selectedMail)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors">
                    <Reply size={14} /> {t('reply')}
                  </button>
                </div>
              </div>

              {/* Compose View Panel Overlay */}
              <div
                className={`
                     absolute inset-0 z-30 bg-white dark:bg-stone-900 flex flex-col transition-transform duration-500 ease-in-out shadow-2xl
                     ${rightPanelMode === 'compose' ? 'translate-y-0' : 'translate-y-[110%] pointer-events-none'}
                   `}
              >
                <ComposeView
                  onDiscard={() => setRightPanelMode('view')}
                  accounts={accounts}
                  initialData={replyData}
                  logActivity={logActivity}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-monday-dark-bg">
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                Select an item to read
              </div>
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

      {/* Modal Portal - Rendered at end */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />
    </div>
  );
};

// Helper Components
const NavItem = ({ icon, label, isActive, count, onClick }: { icon: React.ReactNode, label: string, isActive?: boolean, count?: number, onClick?: () => void }) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer group ${isActive ? 'bg-[#e5f0fa] dark:bg-monday-dark-hover text-monday-blue font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-monday-dark-hover'}`}>
    <div className="flex items-center gap-2.5">
      <span className={isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'}>{icon}</span>
      <span className="text-[13px]">{label}</span>
    </div>
    {count && (
      <span className={`text-[10px] font-semibold ${isActive ? 'text-monday-blue' : 'text-gray-500 dark:text-gray-400'}`}>{count}</span>
    )}
  </div>
);

const FolderItem = ({ label, hasChildren, indent, onClick, isActive }: { label: string, hasChildren?: boolean, indent?: boolean, onClick?: () => void, isActive?: boolean, key?: string | number }) => (
  <div onClick={onClick} className={`flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-400 ${indent ? 'ps-8' : ''} ${isActive ? 'bg-gray-200 dark:bg-monday-dark-hover font-medium' : ''}`}>
    {hasChildren && <ChevronDown size={12} className="text-gray-400" />}
    {!hasChildren && <div className="w-3"></div>}
    <span className="text-[13px]">{label}</span>
  </div>
);

const ToolbarAction = ({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick?: () => void, disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center justify-center px-1.5 py-1 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 min-w-[50px] flex-shrink-0 transition-colors gap-0.5 group h-full ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''}`}
  >
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