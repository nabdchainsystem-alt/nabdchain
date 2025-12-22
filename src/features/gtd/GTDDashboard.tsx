import React, { useState, useEffect } from 'react';
import { Info, ArrowLeft } from 'lucide-react';
import { Board } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { GTDTabs, GTDPhase } from './components/GTDTabs';
import { GTDInboxColumn } from './components/GTDInboxColumn';
import { GTDClarifyView } from './components/GTDClarifyView';
import { GTDOrganizeView } from './components/GTDOrganizeView';
import { GTDReflectView } from './components/GTDReflectView';
import { GTDEngageView } from './components/GTDEngageView';
import { AnimatePresence, motion } from 'framer-motion';

interface DashboardProps {
  boardId: string;
  onBoardCreated: (board: Board) => void;
}

export const GTDDashboard: React.FC<DashboardProps> = ({ boardId, onBoardCreated }) => {
  interface InboxItem {
    id: string;
    title: string;
    createdAt: number;
    scheduledAt?: number;
  }

  const storageKey = `gtd-data-v1-${boardId}`;

  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load GTD data', e);
      return null;
    }
  };

  const savedData = loadSavedData();

  const [activePhase, setActivePhase] = useState<GTDPhase>(savedData?.activePhase || 'capture');
  const [inputText, setInputText] = useState('');
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(savedData?.inboxItems || []);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(savedData?.selectedItemId || null);

  // Organize Lists State
  const [projects, setProjects] = useState<InboxItem[]>(savedData?.projects || []);
  const [nextActions, setNextActions] = useState<InboxItem[]>(savedData?.nextActions || []);
  const [waitingFor, setWaitingFor] = useState<InboxItem[]>(savedData?.waitingFor || []);
  const [scheduled, setScheduled] = useState<InboxItem[]>(savedData?.scheduled || []);
  const [someday, setSomeday] = useState<InboxItem[]>(savedData?.someday || []);
  const [reference, setReference] = useState<InboxItem[]>(savedData?.reference || []);
  const [completed, setCompleted] = useState<InboxItem[]>(savedData?.completed || []);

  // Persist State Changes
  useEffect(() => {
    const dataToSave = {
      inboxItems,
      projects,
      nextActions,
      waitingFor,
      scheduled,
      someday,
      reference,
      completed,
      activePhase,
      selectedItemId
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  }, [inboxItems, projects, nextActions, waitingFor, scheduled, someday, reference, completed, activePhase, selectedItemId, storageKey]);

  const { t } = useAppContext();

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newItem: InboxItem = {
      id: Date.now().toString(),
      title: inputText,
      createdAt: Date.now()
    };
    setInboxItems([newItem, ...inboxItems]);
    setInputText('');
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setActivePhase('clarify');
  };

  const handleProcess = (id: string, action: 'trash' | 'reference' | 'someday' | 'next' | 'project' | 'delegate' | 'scheduled' | 'done', date?: number) => {
    const itemToMove = inboxItems.find(item => item.id === id);
    if (!itemToMove) return;

    // Remove from Inbox
    setInboxItems(prev => prev.filter(item => item.id !== id));

    // Add to Target List
    switch (action) {
      case 'project':
        setProjects(prev => [itemToMove, ...prev]);
        break;
      case 'next':
        setNextActions(prev => [itemToMove, ...prev]);
        break;
      case 'delegate':
        setWaitingFor(prev => [itemToMove, ...prev]);
        break;
      case 'someday':
        setSomeday(prev => [itemToMove, ...prev]);
        break;
      case 'reference':
        setReference(prev => [itemToMove, ...prev]);
        break;
      case 'scheduled':
        const scheduledItem = date ? { ...itemToMove, scheduledAt: date } : itemToMove;
        setScheduled(prev => [scheduledItem, ...prev]);
        setActivePhase('organize');
        break;
      case 'done':
        setCompleted(prev => [itemToMove, ...prev]);
        break;
      case 'trash':
        break;
    }

    // If we are currently clarifying this item, clearing selection is handled by the state change naturally,
    // but we might want to ensure we don't try to clarify a deleted item.
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleComplete = (id: string) => {
    const item = nextActions.find(i => i.id === id);
    if (item) {
      setNextActions(prev => prev.filter(i => i.id !== id));
      setCompleted(prev => [item, ...prev]);
    }
  };

  // Logic: Today -> Yesterday -> Pending
  const now = new Date();
  const todayItems = inboxItems.filter(item => {
    const itemDate = new Date(item.createdAt);
    return itemDate.toDateString() === now.toDateString();
  });

  const yesterdayItems = inboxItems.filter(item => {
    const itemDate = new Date(item.createdAt);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return itemDate.toDateString() === yesterday.toDateString();
  });

  const pendingItems = inboxItems.filter(item => {
    const itemDate = new Date(item.createdAt);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return itemDate < yesterday && itemDate.toDateString() !== yesterday.toDateString();
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = (id: string) => {
    // Remove from any/all lists where it might exist
    setInboxItems(prev => prev.filter(i => i.id !== id));
    setProjects(prev => prev.filter(i => i.id !== id));
    setNextActions(prev => prev.filter(i => i.id !== id));
    setWaitingFor(prev => prev.filter(i => i.id !== id));
    setScheduled(prev => prev.filter(i => i.id !== id));
    setSomeday(prev => prev.filter(i => i.id !== id));
    setReference(prev => prev.filter(i => i.id !== id));
    setCompleted(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="flex-1 bg-white dark:bg-[#050505] h-full overflow-hidden font-serif text-[#1A1A1A] dark:text-white transition-colors duration-300">
      <div className="max-w-5xl mx-auto h-full flex flex-col items-center pt-6">

        {/* 1. Header */}
        <div className="flex-none w-full relative flex items-center justify-center mb-8 px-8 opacity-60 hover:opacity-100 transition-opacity">
          {activePhase !== 'capture' && (
            <button
              onClick={() => setActivePhase('capture')}
              className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="flex items-center gap-2 cursor-help">
            <h1 className="text-xl font-serif italic tracking-wide">Getting Things Done</h1>
            <Info size={14} className="text-gray-400" />
          </div>
        </div>

        {/* 2. Navigation */}
        <div className="flex-none relative w-full max-w-5xl flex items-center justify-center py-6 mb-8 px-8">
          <GTDTabs activePhase={activePhase} onChange={setActivePhase} />
        </div>

        {/* 3. Main Content Area (Scrollable) */}
        <div className="flex-1 w-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center relative">
          <AnimatePresence mode="wait">
            {activePhase === 'capture' && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-5xl flex flex-col items-center"
              >
                <h2 className="text-2xl font-black tracking-widest uppercase mb-6">Capture</h2>

                {/* Minimalist Input */}
                <form onSubmit={handleCapture} className="relative w-full max-w-2xl mb-16 group">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length === 1) {
                        setInputText(val.toUpperCase());
                      } else {
                        setInputText(val);
                      }
                    }}
                    placeholder="Write it down..."
                    className="w-full bg-transparent border-b-2 border-gray-200 dark:border-white/10 py-3 text-center text-lg font-serif italic placeholder-gray-200 dark:placeholder-gray-700 focus:outline-none focus:border-black dark:focus:border-white transition-colors duration-300"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest uppercase text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-black dark:hover:text-white"
                  >
                    Enter
                  </button>
                </form>

                {/* 3-Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pb-8">
                  {/* YESTERDAY */}
                  <GTDInboxColumn title="Yesterday" subtitle="Review" count={yesterdayItems.length} delay={0.1}>
                    {yesterdayItems.length > 0 && (
                      <div className="w-full space-y-4 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4">
                        {yesterdayItems.map(item => (
                          <div key={item.id} onClick={() => handleItemClick(item.id)} className="text-left group cursor-pointer hover:opacity-80">
                            <div className="text-base font-serif italic text-gray-800 dark:text-gray-200">{item.title}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider">{formatTime(item.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GTDInboxColumn>

                  {/* TODAY */}
                  <GTDInboxColumn title="Today" subtitle="Inbox" count={todayItems.length} delay={0.2}>
                    {todayItems.length > 0 && (
                      <div className="w-full space-y-6 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-6 py-2">
                        {todayItems.map(item => (
                          <div key={item.id} onClick={() => handleItemClick(item.id)} className="text-left group cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="text-base font-serif italic text-[#1A1A1A] dark:text-white mb-0.5">{item.title}</div>
                            <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{formatTime(item.createdAt)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GTDInboxColumn>

                  {/* PENDING */}
                  <GTDInboxColumn title="Pending" subtitle="Backlog" count={pendingItems.length} delay={0.3}>
                    {pendingItems.length > 0 && (
                      <div className="w-full space-y-4 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4">
                        {pendingItems.map(item => (
                          <div key={item.id} onClick={() => handleItemClick(item.id)} className="text-left group cursor-pointer hover:opacity-80">
                            <div className="text-base font-serif italic text-gray-500">{item.title}</div>
                            <div className="text-[10px] text-gray-600 uppercase tracking-wider">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </GTDInboxColumn>
                </div>

              </motion.div>
            )}

            {activePhase === 'clarify' && (
              <motion.div
                key="clarify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full"
              >
                <GTDClarifyView
                  items={inboxItems}
                  initialItemId={selectedItemId}
                  onProcess={handleProcess}
                />
              </motion.div>
            )}

            {activePhase === 'organize' && (
              <motion.div
                key="organize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <GTDOrganizeView
                  projects={projects}
                  nextActions={nextActions}
                  waitingFor={waitingFor}
                  scheduled={scheduled}
                  someday={someday}
                  reference={reference}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}

            {activePhase === 'reflect' && (
              <motion.div
                key="reflect"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <GTDReflectView
                  lists={{
                    inbox: inboxItems,
                    nextActions: nextActions,
                    waitingFor: waitingFor,
                    projects: projects,
                    someday: someday,
                    completed: completed
                  }}
                />
              </motion.div>
            )}

            {activePhase === 'engage' && (
              <motion.div
                key="engage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full"
              >
                <GTDEngageView
                  nextActions={nextActions}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
            {activePhase !== 'capture' && activePhase !== 'clarify' && activePhase !== 'organize' && activePhase !== 'reflect' && activePhase !== 'engage' && (
              <motion.div
                key="other"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-64 text-gray-300 italics"
              >
                Phase content coming soon...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};