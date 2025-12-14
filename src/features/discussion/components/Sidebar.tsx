
import React, { useState, useRef, useEffect } from 'react';
import { Thread, Board, Priority, Language } from '../types';
import { Search, Plus, MoreHorizontal, Sparkles, FolderPlus, Trash2, Calendar, Flag, ChevronDown, CornerDownLeft } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SidebarProps {
  boards: Board[];
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: (boardId: string) => void;
  onNewBoard: () => void;
  onSelectBoard: (boardId: string) => void;

  onDeleteBoard: (boardId: string) => void;

  onCapture: () => void;
  onQuickCapture: (text: string) => void;
}

const formatDate = (date: Date, lang: Language) => {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' }).format(date);
};

const getPriorityColor = (priority?: Priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  boards,
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onNewBoard,
  onSelectBoard,
  onDeleteBoard,
  onCapture,
  onQuickCapture
}) => {
  const { t, language } = useLanguage();
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set(boards.map(b => b.id)));

  // Inline Capture State
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const captureInputRef = useRef<HTMLTextAreaElement>(null);
  const captureContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isCapturing && captureInputRef.current) {
      captureInputRef.current.focus();
    }
  }, [isCapturing]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (captureContainerRef.current && !captureContainerRef.current.contains(event.target as Node)) {
        if (!captureText.trim()) {
          setIsCapturing(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [captureText]);

  const handleQuickCaptureSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (captureText.trim()) {
      onQuickCapture(captureText);
      setCaptureText('');
      setIsCapturing(false);
    }
  };

  const toggleBoard = (boardId: string) => {
    const newExpanded = new Set(expandedBoards);
    if (newExpanded.has(boardId)) {
      newExpanded.delete(boardId);
    } else {
      newExpanded.add(boardId);
    }
    setExpandedBoards(newExpanded);
  };

  const handleBoardClick = (boardId: string) => {
    onSelectBoard(boardId);
    toggleBoard(boardId);
  };

  return (
    <div className="w-60 h-full flex flex-col bg-[#f7f9fa] dark:bg-monday-dark-secondary_background border-e border-[#d0d4e4] dark:border-monday-dark-border flex-shrink-0">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-sans font-bold text-xl text-[#323338] dark:text-gray-100">Discussion</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsCapturing(true)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors">
              <Sparkles size={16} />
            </button>
            <button onClick={onNewBoard} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors">
              <FolderPlus size={16} />
            </button>
          </div>
        </div>

        {isCapturing && (
          <div ref={captureContainerRef} className="mb-3 animate-in slide-in-from-top-2 fade-in">
            <form onSubmit={handleQuickCaptureSubmit}>
              <textarea
                ref={captureInputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickCaptureSubmit();
                  }
                }}
                className="w-full p-2 text-[13px] border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-2 focus:ring-monday-blue focus:border-transparent dark:bg-gray-800 dark:text-gray-100 resize-none font-sans"
                placeholder="Quick capture..."
                rows={2}
              />
            </form>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {boards.map((board) => {
          const isExpanded = expandedBoards.has(board.id);
          const boardThreads = threads.filter(t => t.boardId === board.id);

          return (
            <div key={board.id} className="mb-0.5">
              {/* Board Header */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-monday-dark-hover cursor-pointer group/board">
                <button
                  onClick={() => handleBoardClick(board.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-sans font-medium text-[13px] flex-1 text-start"
                >
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : 'ltr:-rotate-90 rtl:rotate-90'}`}>
                    <ChevronDown size={12} />
                  </div>
                  {board.name}
                  <span className="text-[10px] text-gray-400 font-sans font-normal ms-1">({boardThreads.length})</span>
                </button>
                <div className="flex items-center opacity-0 group-hover/board:opacity-100 transition-opacity gap-1">
                  <button
                    onClick={() => onDeleteBoard(board.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                  <button
                    onClick={() => onNewThread(board.id)}
                    className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Threads List */}
              {
                isExpanded && (
                  <div className="space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-300 origin-top">
                    {boardThreads.map((thread) => (
                      <div
                        key={thread.id}
                        onClick={() => onSelectThread(thread.id)}
                        className={`
                        group/item px-3 py-1.5 cursor-pointer transition-all duration-200 rounded-md
                        ${activeThreadId === thread.id
                            ? 'bg-[#e5f0fa] dark:bg-monday-dark-hover text-monday-blue font-medium'
                            : 'hover:bg-gray-200 dark:hover:bg-monday-dark-hover text-gray-600 dark:text-gray-400'}
                      `}
                      >
                        <div className="flex justify-between items-start mb-0.5 ps-4">
                          <h3 className={`font-sans text-[13px] truncate ${activeThreadId === thread.id ? 'text-monday-blue' : 'text-gray-600 dark:text-gray-400 group-hover/item:text-gray-700 dark:group-hover/item:text-gray-200'}`}>
                            {thread.title}
                          </h3>
                          <div className="flex items-center gap-2 ms-2">
                            {thread.dueDate && (
                              <Calendar size={10} className={`${activeThreadId === thread.id ? 'text-blue-400' : 'text-gray-400'}`} />
                            )}
                            <Flag size={10} className={getPriorityColor(thread.priority)} />
                          </div>
                        </div>
                        <div className="flex justify-between items-end ps-4">
                          <p className={`font-sans text-[11px] line-clamp-1 flex-1 ${activeThreadId === thread.id ? 'text-blue-400/80' : 'text-gray-400 dark:text-gray-500'}`}>
                            {thread.preview}
                          </p>
                          <span className={`text-[10px] font-sans whitespace-nowrap ms-2 ${activeThreadId === thread.id ? 'text-blue-400/80' : 'text-gray-400'}`}>
                            {formatDate(thread.updatedAt, language)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {boardThreads.length === 0 && (
                      <div className="ps-8 py-2">
                        <p className="text-xs text-gray-400 italic">{t('discussion.no_threads')}</p>
                        <button
                          onClick={() => onNewThread(board.id)}
                          className="text-xs font-sans text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline mt-1"
                        >
                          {t('discussion.start_writing')}
                        </button>
                      </div>
                    )}
                  </div>
                )
              }
            </div >
          );
        })}
      </div >

      {/* Footer / User Profile Stub */}
      < div className="p-3 border-t border-gray-200 dark:border-monday-dark-border flex items-center justify-between text-gray-500" >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-200">
            {language === 'ar' ? 'أ' : 'JD'}
          </div>
          <span className="text-xs font-sans">{language === 'ar' ? 'أحمد محمد' : 'John Doe'}</span>
        </div>
        <MoreHorizontal size={16} className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" />
      </div >
    </div >
  );
};
