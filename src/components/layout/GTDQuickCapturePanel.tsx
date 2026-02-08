import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { X, Tray, Trash, ArrowRight, Lightning, CaretRight, Plus, Warning } from 'phosphor-react';
import { useGTDCapture } from '../../hooks/useGTDCapture';
import { formatTimeAgo } from '../../utils/formatters';
import { Board } from '../../types';

interface GTDQuickCapturePanelProps {
  isOpen: boolean;
  onClose: () => void;
  boards?: Board[];
  activeBoardId?: string | null;
  onNavigateToBoard?: (boardId: string, view: string) => void;
}

export const GTDQuickCapturePanel: React.FC<GTDQuickCapturePanelProps> = ({
  isOpen,
  onClose,
  boards = [],
  activeBoardId,
  onNavigateToBoard,
}) => {
  const { t, language } = useAppContext();
  const {
    inboxItems,
    captureThought,
    deleteItem,
    inboxCount,
    boardHasGTD,
    getBoardsWithGTD,
    transferToBoard,
    createGTDForBoard,
  } = useGTDCapture();
  const [inputText, setInputText] = useState('');
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    // Reset board selector when panel closes
    if (!isOpen) {
      setShowBoardSelector(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      captureThought(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showBoardSelector) {
        setShowBoardSelector(false);
      } else {
        onClose();
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return formatTimeAgo(new Date(timestamp).toISOString(), language);
  };

  // Get recent items (last 5)
  const recentItems = inboxItems.slice(0, 5);

  // Get boards with GTD
  const boardIds = boards.map((b) => b.id);
  const boardsWithGTD = getBoardsWithGTD(boardIds);
  const _activeBoard = boards.find((b) => b.id === activeBoardId);
  const activeBoardHasGTD = activeBoardId ? boardHasGTD(activeBoardId) : false;

  // Handle Open GTD click
  const handleOpenGTD = () => {
    if (inboxCount === 0) {
      // No items to transfer, just close
      onClose();
      return;
    }

    if (boards.length === 0) {
      // No boards - show message (handled in UI)
      return;
    }

    if (activeBoardHasGTD) {
      // Active board has GTD - transfer directly
      transferToBoard(activeBoardId!);
      if (onNavigateToBoard) {
        onNavigateToBoard(activeBoardId!, 'gtd');
      }
      onClose();
    } else if (boardsWithGTD.length === 1) {
      // Only one board with GTD - transfer to it
      transferToBoard(boardsWithGTD[0]);
      if (onNavigateToBoard) {
        onNavigateToBoard(boardsWithGTD[0], 'gtd');
      }
      onClose();
    } else if (boardsWithGTD.length > 1) {
      // Multiple boards with GTD - show selector
      setShowBoardSelector(true);
    } else if (activeBoardId) {
      // No boards with GTD but has active board - offer to create
      setShowBoardSelector(true);
    } else {
      // No GTD anywhere and no active board - show board selector to create
      setShowBoardSelector(true);
    }
  };

  // Handle board selection
  const handleSelectBoard = (boardId: string, hasGTD: boolean) => {
    if (hasGTD) {
      transferToBoard(boardId);
    } else {
      createGTDForBoard(boardId);
    }
    if (onNavigateToBoard) {
      onNavigateToBoard(boardId, 'gtd');
    }
    setShowBoardSelector(false);
    onClose();
  };

  // Render board selector
  const renderBoardSelector = () => {
    if (boards.length === 0) {
      return (
        <div className="p-4 text-center">
          <Warning size={32} className="mx-auto mb-2 text-amber-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {language === 'ar' ? 'لا توجد لوحات' : 'No Boards Available'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {language === 'ar' ? 'أنشئ لوحة أولاً لاستخدام GTD' : 'Create a board first to use GTD'}
          </p>
        </div>
      );
    }

    return (
      <div className="max-h-[200px] overflow-y-auto">
        {boardsWithGTD.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {language === 'ar' ? 'لوحات مع GTD' : 'Boards with GTD'}
            </div>
            {boardsWithGTD.map((boardId) => {
              const board = boards.find((b) => b.id === boardId);
              if (!board) return null;
              return (
                <button
                  key={boardId}
                  onClick={() => handleSelectBoard(boardId, true)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors text-start"
                >
                  <Tray size={16} className="text-yellow-500" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">{board.name}</span>
                  <CaretRight size={14} className="text-gray-400" />
                </button>
              );
            })}
          </>
        )}

        {/* Boards without GTD - offer to create */}
        {boards.filter((b) => !boardsWithGTD.includes(b.id)).length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-t border-gray-100 dark:border-monday-dark-border mt-1">
              {language === 'ar' ? 'إنشاء GTD في' : 'Create GTD in'}
            </div>
            {boards
              .filter((b) => !boardsWithGTD.includes(b.id))
              .slice(0, 5)
              .map((board) => (
                <button
                  key={board.id}
                  onClick={() => handleSelectBoard(board.id, false)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors text-start"
                >
                  <Plus size={16} className="text-gray-400" />
                  <span className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">{board.name}</span>
                  <CaretRight size={14} className="text-gray-400" />
                </button>
              ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl border border-gray-100 dark:border-monday-dark-border z-50 overflow-hidden animate-fadeIn flex flex-col"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 shrink-0">
        <div className="flex items-center gap-2">
          {showBoardSelector ? (
            <button
              onClick={() => setShowBoardSelector(false)}
              className="p-0.5 hover:bg-white/50 rounded transition-colors"
            >
              <CaretRight size={16} className="text-gray-500 rotate-180" />
            </button>
          ) : (
            <Lightning size={18} className="text-yellow-500" weight="duotone" />
          )}
          <h3 className="font-semibold text-gray-800 dark:text-monday-dark-text">
            {showBoardSelector
              ? language === 'ar'
                ? 'اختر اللوحة'
                : 'Select Board'
              : t('quick_capture') || 'Quick Capture'}
          </h3>
          {!showBoardSelector && inboxCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-500 text-white rounded-full">
              {inboxCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-monday-dark-hover rounded-md transition-colors"
        >
          <X size={18} className="text-gray-500 dark:text-monday-dark-text-secondary" />
        </button>
      </div>

      {showBoardSelector ? (
        renderBoardSelector()
      ) : (
        <>
          {/* Quick Capture Input */}
          <form onSubmit={handleSubmit} className="p-3 border-b border-gray-100 dark:border-monday-dark-border">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('whats_on_your_mind') || "What's on your mind?"}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-monday-dark-bg rounded-lg border border-gray-200 dark:border-monday-dark-border focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none text-sm text-gray-800 dark:text-monday-dark-text placeholder-gray-400 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 px-1">{t('press_enter_to_save') || 'Press Enter to save'}</p>
          </form>

          {/* Recent Captures */}
          <div className="flex-1 overflow-y-auto max-h-[200px]">
            {recentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-monday-dark-text-secondary">
                <Tray size={32} weight="light" className="mb-2 opacity-50" />
                <p className="text-sm">{t('inbox_empty') || 'Your inbox is empty'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-monday-dark-border">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="group px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-monday-dark-hover transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-monday-dark-text line-clamp-2">{item.title}</p>
                        <span className="text-[10px] text-gray-400 font-datetime mt-0.5 block">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title={t('delete') || 'Delete'}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Open GTD Button */}
          <div className="p-3 border-t border-gray-100 dark:border-monday-dark-border bg-gray-50 dark:bg-monday-dark-bg">
            <button
              onClick={handleOpenGTD}
              disabled={inboxCount === 0 && boards.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Tray size={18} weight="duotone" />
              {language === 'ar' ? 'فتح GTD' : 'Open GTD'}
              {inboxCount > 0 && <span className="text-yellow-200 text-xs">({inboxCount})</span>}
            </button>
            {inboxCount > 0 && (
              <p className="text-[10px] text-center text-gray-400 mt-1.5">
                {language === 'ar'
                  ? 'سيتم نقل الأفكار إلى صندوق GTD الخاص بك'
                  : 'Items will be moved to your GTD inbox'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
