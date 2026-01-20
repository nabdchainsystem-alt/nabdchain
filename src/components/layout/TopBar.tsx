import React from 'react';
import { Bell, MagnifyingGlass, Question, SquaresFour, DownloadSimple, Link, Moon, Sun, Play, Pause, ArrowCounterClockwise, X, SignOut, Gear, EyeClosed, User as UserIcon, Kanban, CheckSquare } from 'phosphor-react';
import { useAppContext } from '../../contexts/AppContext';
// import { useAuth } from '../../contexts/AuthContext';
import { useUser, useClerk, useAuth } from '../../auth-adapter';
import { useFocus } from '../../contexts/FocusContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { SleepOverlay } from '../features/SleepOverlay';
import { FocusMode } from '../features/FocusMode';
import { NotificationPanel } from './NotificationPanel';
import { assignmentService, Assignment } from '../../services/assignmentService';

import { NabdSmartBar } from '../ui/NabdSmartBar';
import { Board } from '../../types';

interface TopBarProps {
  onNavigate: (view: string) => void;
  boards?: Board[];
  onCreateTask?: (boardId: string, task: any) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate, boards = [], onCreateTask = () => { } }) => {
  const { theme, toggleTheme, language, toggleLanguage, t } = useAppContext();
  // const { user, logout } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  const { isActive, isSessionActive, timeLeft, toggleFocus, resetFocus, cancelFocus, formatTime } = useFocus();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('user_profile_image') || user?.imageUrl || '');
  const [isSleepMode, setIsSleepMode] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return { boards: [], tasks: [] };

    const query = searchQuery.toLowerCase();

    // Search boards
    const matchedBoards = boards.filter(board =>
      board.name.toLowerCase().includes(query) ||
      board.description?.toLowerCase().includes(query)
    ).slice(0, 5);

    // Search tasks within boards
    const matchedTasks: { task: Board['tasks'][0]; boardId: string; boardName: string }[] = [];
    boards.forEach(board => {
      board.tasks?.forEach(task => {
        if (
          task.name?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
        ) {
          matchedTasks.push({ task, boardId: board.id, boardName: board.name });
        }
      });
    });

    return { boards: matchedBoards, tasks: matchedTasks.slice(0, 10) };
  }, [searchQuery, boards]);

  const showSearchResults = isSearchFocused && searchQuery.trim() &&
    (searchResults.boards.length > 0 || searchResults.tasks.length > 0);

  const handleSearchResultClick = (boardId: string) => {
    onNavigate(`board-${boardId}`);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  useEffect(() => {
    const handleProfileUpdate = () => {
      setProfileImage(localStorage.getItem('user_profile_image') || user?.imageUrl || '');
    };
    window.addEventListener('profile-image-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-image-updated', handleProfileUpdate);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notification count on mount and periodically
  const fetchNotificationCount = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const count = await assignmentService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchNotificationCount();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  // Fetch assignments when notification panel opens
  const handleOpenNotifications = async () => {
    setIsNotificationOpen(true);
    setIsLoadingNotifications(true);
    try {
      const token = await getToken();
      if (!token) return;
      const pendingAssignments = await assignmentService.getPendingAssignments(token);
      setAssignments(pendingAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Handle viewing an assignment
  const handleViewAssignment = async (assignment: Assignment) => {
    try {
      const token = await getToken();
      if (!token) return;

      // Mark as viewed
      await assignmentService.markAsViewed(token, assignment.id);

      // Update local state
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Close panel and navigate to the "Assigned to me" board
      setIsNotificationOpen(false);

      // Navigate to assigned board view with the board ID
      if (assignment.copiedBoardId) {
        onNavigate(`board:${assignment.copiedBoardId}`);
      }
    } catch (error) {
      console.error('Failed to view assignment:', error);
    }
  };

  return (
    <>
      {isSleepMode && <SleepOverlay onCheck={() => setIsSleepMode(false)} />}
      <div className="h-12 bg-gradient-to-b from-white to-[#F7F8FA] dark:bg-monday-dark-surface flex items-center justify-between px-4 flex-shrink-0 z-20 shadow-sm transition-colors duration-200 relative">

        {/* Start: Logo Section */}
        <div className="flex items-center min-w-[200px]">
          <div className="flex items-center cursor-pointer group">
            <div className="w-8 h-8 bg-[#2b2c33] dark:bg-monday-blue rounded-md flex items-center justify-center me-2 shadow-sm transition-all group-hover:scale-105 group-hover:bg-monday-blue dark:group-hover:bg-monday-blue-hover">
              <Link size={16} weight="bold" className="text-white transform -rotate-45" />
            </div>
            <div className="flex items-baseline gap-1.5 justify-center">
              <span className="text-lg font-bold tracking-tight text-[#323338] dark:text-monday-dark-text leading-none hidden md:block">
                NABD
              </span>
              <span className="font-normal text-gray-500 dark:text-monday-dark-text-secondary text-xs leading-none hidden md:block">
                {t('chain_system')}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div ref={searchRef} className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md hidden md:block z-10">
          <div className="relative w-full group">
            <MagnifyingGlass className="absolute ms-3 top-2 text-gray-400 dark:text-monday-dark-text-secondary group-focus-within:text-monday-blue transition-colors" size={16} weight="light" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full px-10 py-1.5 rounded-md border border-gray-200 dark:border-monday-dark-border bg-[#f5f6f8] dark:bg-monday-dark-bg text-gray-800 dark:text-monday-dark-text placeholder-gray-500 dark:placeholder-monday-dark-text-secondary hover:bg-gray-100 dark:hover:bg-monday-dark-hover focus:bg-white dark:focus:bg-monday-dark-surface focus:border-monday-blue dark:focus:border-monday-blue focus:ring-1 focus:ring-monday-blue outline-none text-sm transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} weight="light" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-monday-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-monday-dark-border max-h-96 overflow-y-auto z-50">
                {/* Boards Section */}
                {searchResults.boards.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary uppercase">
                      {t('boards') || 'Boards'}
                    </div>
                    {searchResults.boards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => handleSearchResultClick(board.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-start transition-colors"
                      >
                        <Kanban size={18} className="text-monday-blue flex-shrink-0" weight="duotone" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-monday-dark-text truncate">
                            {board.name}
                          </p>
                          {board.description && (
                            <p className="text-xs text-gray-500 dark:text-monday-dark-text-secondary truncate">
                              {board.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks Section */}
                {searchResults.tasks.length > 0 && (
                  <div className="p-2 border-t border-gray-100 dark:border-monday-dark-border">
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-monday-dark-text-secondary uppercase">
                      {t('tasks') || 'Tasks'}
                    </div>
                    {searchResults.tasks.map(({ task, boardId, boardName }) => (
                      <button
                        key={task.id}
                        onClick={() => handleSearchResultClick(boardId)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-monday-dark-hover text-start transition-colors"
                      >
                        <CheckSquare size={18} className="text-green-500 flex-shrink-0" weight="duotone" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-monday-dark-text truncate">
                            {task.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-monday-dark-text-secondary truncate">
                            {boardName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {searchResults.boards.length === 0 && searchResults.tasks.length === 0 && searchQuery.trim() && (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-monday-dark-text-secondary">
                    {t('no_results') || 'No results found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* End: Icons Section */}
        <div className="flex items-center space-x-2 space-x-reverse min-w-[200px] justify-end">

          {/* Focus Mode (Expanding) */}
          <FocusMode />

          {/* Sleep Mode Toggle */}
          <button
            onClick={() => setIsSleepMode(true)}
            title={t('sleep_mode')}
            className="text-gray-500 dark:text-monday-dark-text-secondary hover:text-[#323338] dark:hover:text-monday-dark-text transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover w-8 h-8 flex items-center justify-center"
          >
            <EyeClosed size={21} weight="light" />
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-monday-dark-border mx-2 hidden md:block"></div>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleOpenNotifications}
              className="text-gray-500 dark:text-monday-dark-text-secondary hover:text-[#323338] dark:hover:text-monday-dark-text relative transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover"
            >
              <Bell size={21} weight="light" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-monday-dark-surface flex items-center justify-center text-[10px] font-bold text-white px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationPanel
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              assignments={assignments}
              onViewAssignment={handleViewAssignment}
              isLoading={isLoadingNotifications}
            />
          </div>

          {/* NABD AI Assistant */}
          <div className="relative">
            <NabdSmartBar boards={boards} onCreateTask={onCreateTask} onNavigate={onNavigate} />
          </div>

          <div className="w-px h-5 bg-gray-300 dark:bg-monday-dark-border mx-2 hidden md:block"></div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            title={t('language')}
            className="text-gray-500 dark:text-monday-dark-text-secondary hover:text-[#323338] dark:hover:text-monday-dark-text transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover w-8 h-8 flex items-center justify-center font-bold text-xs"
          >
            {language === 'en' ? 'EN' : 'AR'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? t('dark_mode') : t('light_mode')}
            className="text-gray-500 dark:text-monday-dark-text-secondary hover:text-[#323338] dark:hover:text-monday-dark-text transition-colors p-1.5 rounded hover:bg-gray-100 dark:hover:bg-monday-dark-hover w-8 h-8 flex items-center justify-center"
          >
            {theme === 'light' ? <Moon size={21} weight="light" /> : <Sun size={21} weight="light" />}
          </button>

          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs cursor-pointer hover:scale-105 hover:shadow-md transition-all ms-2 border-2 border-white dark:border-monday-dark-border overflow-hidden"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'U'
              )}
            </div>

            {isProfileOpen && (
              <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white dark:bg-monday-dark-surface rounded-xl shadow-2xl border border-gray-100 dark:border-monday-dark-border py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-monday-dark-border">
                  <p className="text-sm font-semibold text-gray-800 dark:text-monday-dark-text truncate">{user?.fullName || user?.firstName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-monday-dark-hover flex items-center gap-2 transition-colors"
                  >
                    <Gear size={14} weight="light" />
                    {t('settings')}
                  </button>
                  <button
                    onClick={async () => {
                      await signOut();
                      // Redirect to landing page after sign out
                      const hostname = window.location.hostname;
                      if (hostname.startsWith('app.') && hostname.includes('nabdchain.com')) {
                        window.location.href = 'https://nabdchain.com';
                      }
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                  >
                    <SignOut size={14} weight="light" />
                    {t('sign_out')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};