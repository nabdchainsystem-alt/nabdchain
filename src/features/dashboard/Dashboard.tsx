import React, { useMemo, useState, useEffect } from 'react';
import { Board, RecentlyVisitedItem, ViewState, Task, Workspace } from '../../types';
import {
  Cloud, CloudRain, Snowflake, Lightning, CloudFog, Sun,
  ClockCounterClockwise, CaretLeft, CaretRight, ArrowSquareOut, Star,
  CheckCircle, Flag, WarningCircle, CalendarBlank, Folder,
  PencilSimple, ListPlus, UserPlus, MagnifyingGlass, SquaresFour,
  UploadSimple, Clock, Trash, ChatCircle, PaperPlaneRight,
  EnvelopeSimple, Archive, NotePencil, Bell, Funnel, SortAscending, ArrowsDownUp, User, X,
  Receipt, Package
} from 'phosphor-react';
import { NewTaskModal } from '../../components/ui/NewTaskModal';
import { CreateEventModal } from './components/CreateEventModal';
import { NewEmailModal } from './components/NewEmailModal';
import { SaveToVaultModal } from './components/SaveToVaultModal';
import { GlobalSearchDrawer } from './components/GlobalSearchDrawer';
import { boardService } from '../../services/boardService';
import { useAppContext } from '../../contexts/AppContext';
import { MOCK_MEMBERS } from '../teams/data';
import { useAuth } from '../../auth-adapter';
import { normalizePriority } from '../priorities/priorityUtils';
import { useToast } from '../marketplace/components/Toast';
import { appLogger, boardLogger } from '../../utils/logger';
import { formatTimeAgo, getPersonName, formatDate } from '../../utils/formatters';
import { getActivityStyles, getCardTheme } from '../../utils/dashboardHelpers';
import { API_URL } from '../../config/api';

interface Activity {
  id: string;
  type: string;
  content: string;
  metadata?: string;
  createdAt: string;
}

interface DashboardProps {
  onBoardCreated: (board: Board) => void;
  recentlyVisited: RecentlyVisitedItem[];
  onNavigate: (view: ViewState | string, boardId?: string) => void;
  boards: Board[];
  activeWorkspaceId?: string;
  workspaces: Workspace[];
  onTaskCreated: (boardId: string, task: Task) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBoardCreated, recentlyVisited, onNavigate, boards, activeWorkspaceId, workspaces, onTaskCreated }) => {
  const { userDisplayName, t, language } = useAppContext();
  const { getToken, isSignedIn } = useAuth();
  const { showToast } = useToast();

  const [quickNote, setQuickNote] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [urgentTasksPage, setUrgentTasksPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'overdue' | 'person'>('all');



  // Person Filter State
  const [isPersonSearchOpen, setIsPersonSearchOpen] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ITEMS_PER_PAGE = 3;
  const personSearchRef = React.useRef<HTMLDivElement>(null);

  // Task refresh trigger - updates when localStorage changes
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);

  // Listen for storage changes and clean up orphaned task data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('board-tasks-')) {
        setTaskRefreshKey(prev => prev + 1);
      }
    };

    const handleTaskUpdate = () => {
      setTaskRefreshKey(prev => prev + 1);
    };

    // Clean up orphaned task data from deleted boards (optimized with Object.keys)
    const cleanupOrphanedTasks = () => {
      const boardIds = new Set(boards.map(b => b.id));
      const allKeys = Object.keys(localStorage);

      const keysToRemove = allKeys.filter(key => {
        // Check board-tasks-{boardId} keys
        if (key.startsWith('board-tasks-')) {
          const boardId = key.replace('board-tasks-', '');
          return !boardIds.has(boardId);
        }
        // Check room-table-groups-v1-{boardId}-* keys
        if (key.startsWith('room-table-groups-v1-')) {
          const parts = key.replace('room-table-groups-v1-', '').split('-');
          const boardId = parts[0];
          return boardId && !boardIds.has(boardId);
        }
        return false;
      });

      // Remove orphaned keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
    };

    // Clean up orphaned data when boards change
    cleanupOrphanedTasks();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tasks-updated', handleTaskUpdate);

    // Refresh periodically to catch local changes (30 seconds - rely on events for immediate updates)
    const interval = setInterval(() => {
      setTaskRefreshKey(prev => prev + 1);
    }, 30000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tasks-updated', handleTaskUpdate);
      clearInterval(interval);
    };
  }, [boards]);

  // Click outside to close person search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isPersonSearchOpen && personSearchRef.current && !personSearchRef.current.contains(e.target as Node)) {
        setIsPersonSearchOpen(false);
        setPersonSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPersonSearchOpen]);

  // Scroll Container Ref
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Build people and teams list from actual team data
  const peopleAndTeams = useMemo(() => {
    // Get all team member names
    const people = MOCK_MEMBERS.map(member => ({
      id: member.id,
      name: member.name,
      type: 'person' as const,
      initials: member.initials,
      color: member.color,
      department: member.department
    }));

    // Get unique departments as teams
    const departments = [...new Set(MOCK_MEMBERS.map(m => m.department))];
    const teams = departments.map((dept, idx) => ({
      id: `team-${idx}`,
      name: dept,
      type: 'team' as const,
      initials: dept.substring(0, 2).toUpperCase(),
      color: 'bg-indigo-500',
      department: dept
    }));

    return [...people, ...teams];
  }, []);

  // Memoized filtered people list for search dropdown (prevents re-filtering on every render)
  const filteredPeopleAndTeams = useMemo(() => {
    return peopleAndTeams.filter(item =>
      item.name.toLowerCase().includes(personSearchQuery.toLowerCase()) &&
      !selectedPersons.includes(item.name)
    );
  }, [peopleAndTeams, personSearchQuery, selectedPersons]);

  // Upload Logic
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setIsUploadModalOpen(true);
      // Reset input so same file can be selected again if cancelled
      e.target.value = '';
    }
  };

  // Loads quick note from local storage on mount
  useEffect(() => {
    const savedNote = localStorage.getItem('dashboard_quick_note');
    if (savedNote) setQuickNote(savedNote);
  }, []);

  // Time and Greeting Logic
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<{ temp: number; condition: string; city: string; country: string } | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      // Update greeting - use key for translation
      const hour = now.getHours();
      if (hour < 12) setGreeting('good_morning');
      else if (hour < 18) setGreeting('good_afternoon');
      else setGreeting('good_evening');
    };

    // Initial update
    updateTime();

    const timer = setInterval(updateTime, 60000); // Update every minute

    // Update immediately when tab becomes visible or focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateTime);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateTime);
    };
  }, []);



  // Fetch Weather & Location
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // 1. Get Location (IP-based is usually sufficient for dashboard and less intrusive than asking permission immediately)
        // Using a free IP geo service
        const locRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const locData = await locRes.json();
        const { latitude, longitude, city, country } = locData;

        // 2. Get Weather from Open-Meteo (Free, no key)
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();

        if (weatherData.current_weather) {
          const w = weatherData.current_weather;
          // Map WMO codes to text (simplified)
          let condition = 'Clear';
          const code = w.weathercode;
          if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
          else if (code >= 45 && code <= 48) condition = 'Foggy';
          else if (code >= 51 && code <= 67) condition = 'Rain';
          else if (code >= 71 && code <= 77) condition = 'Snow';
          else if (code >= 80 && code <= 99) condition = 'Storm';

          setWeather({
            temp: Math.round(w.temperature),
            condition,
            city: city || 'Unknown City',
            country: country || ''
          });
        }
      } catch (e) {
        appLogger.error("Failed to fetch weather/location", e);
        // Fallback to defaults if failed
        setWeather({ temp: 24, condition: 'Sunny', city: 'New York', country: 'USA' });
      }
    };

    fetchWeather();
  }, []);

  // Fetch activities for the current workspace
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isSignedIn || !activeWorkspaceId) return;
      try {
        const token = await getToken();
        if (token) {
          const url = new URL(`${API_URL}/activities`);
          // Filter activities by workspace to only show relevant ones
          url.searchParams.set('workspaceId', activeWorkspaceId);

          const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setActivities(data);
          }
        }
      } catch (error) {
        appLogger.error("Failed to fetch activities", error);
      }
    };
    fetchActivities();
  }, [isSignedIn, getToken, activeWorkspaceId]);

  // Saves quick note to local storage on change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('dashboard_quick_note', quickNote);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [quickNote]);

  // Load all tasks from localStorage for each board
  // Tasks are stored in room-table-groups-v1-{boardId}-{viewId} format
  const allBoardTasks = useMemo(() => {
    const tasksMap: Record<string, Task[]> = {};

    // Get all localStorage keys ONCE (O(1) instead of O(n*m))
    const allKeys = Object.keys(localStorage);
    const roomTableKeys = allKeys.filter(key => key.startsWith('room-table-groups-v1-'));
    const boardTaskKeys = allKeys.filter(key => key.startsWith('board-tasks-'));

    boards.forEach(board => {
      const allTasksForBoard: Task[] = [];
      const boardPrefix = `room-table-groups-v1-${board.id}`;

      // Filter keys for this specific board
      const keysForBoard = roomTableKeys.filter(key => key.startsWith(boardPrefix));

      keysForBoard.forEach(key => {
        try {
          const groups = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(groups)) {
            groups.forEach((group: any) => {
              if (group.rows && Array.isArray(group.rows)) {
                group.rows.forEach((row: any) => {
                  // Convert row to task format
                  // Handle both 'person' and 'people' field names (RoomTable uses 'people')
                  const personData = row.person || row.people || '';
                  allTasksForBoard.push({
                    id: row.id,
                    name: row.name || row.title || '',
                    person: personData,
                    status: row.status || '',
                    date: row.date || row.dueDate || '',
                    priority: row.priority || null,
                    ...row
                  });
                });
              }
            });
          }
        } catch (e) {
          boardLogger.error('Error parsing tasks for board', board.id, e);
        }
      });

      // Also check board-tasks-{boardId} as fallback
      if (allTasksForBoard.length === 0) {
        const boardTaskKey = `board-tasks-${board.id}`;
        if (boardTaskKeys.includes(boardTaskKey)) {
          try {
            const parsed = JSON.parse(localStorage.getItem(boardTaskKey) || '[]');
            if (Array.isArray(parsed)) {
              allTasksForBoard.push(...parsed);
            }
          } catch (e) {
            appLogger.warn('Failed to parse tasks from localStorage', e);
          }
        }
      }

      // Final fallback to board.tasks
      if (allTasksForBoard.length === 0 && board.tasks) {
        allTasksForBoard.push(...board.tasks);
      }

      tasksMap[board.id] = allTasksForBoard;
    });

    return tasksMap;
  }, [boards, taskRefreshKey]); // taskRefreshKey triggers re-read from localStorage

  const stats = useMemo(() => {
    let totalTasks = 0;
    let highPriority = 0;
    let completed = 0;

    boards.forEach(board => {
      const boardTasks = allBoardTasks[board.id] || [];
      totalTasks += boardTasks.length;
      boardTasks.forEach(t => {
        const normalizedPriority = normalizePriority(t.priority);
        if (normalizedPriority === 'High' || normalizedPriority === 'Urgent') highPriority++;
        if (t.status === 'Done' || t.status === 'Completed') completed++;
      });
    });

    return { totalTasks, highPriority, completed };
  }, [boards, allBoardTasks]);

  const urgentTasks = useMemo(() => {
    const allTasks: (Task & { boardId: string; boardName: string; normalizedPriority: string | null })[] = [];
    boards.forEach(board => {
      const boardTasks = allBoardTasks[board.id] || [];
      boardTasks.forEach(task => {
        const normalizedPriority = normalizePriority(task.priority);
        // Include Urgent, High, and Medium priority tasks
        if (normalizedPriority === 'Urgent' || normalizedPriority === 'High' || normalizedPriority === 'Medium') {
          allTasks.push({ ...task, boardId: board.id, boardName: board.name, normalizedPriority });
        }
      });
    });
    // Sort by priority first (Urgent > High > Medium), then by date
    // Tasks without dates (new tasks) appear first within each priority group
    const priorityOrder: Record<string, number> = { 'Urgent': 3, 'High': 2, 'Medium': 1 };
    const sortedAll = allTasks.sort((a, b) => {
      // First sort by priority (highest first)
      const aPriority = priorityOrder[a.normalizedPriority || ''] || 0;
      const bPriority = priorityOrder[b.normalizedPriority || ''] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Within same priority: tasks without dates first (newest), then by date ascending
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1; // New tasks (no date) appear first
      if (!b.date) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Apply Filters
    let filteredTasks = sortedAll;

    if (activeFilter === 'high') {
      filteredTasks = filteredTasks.filter(t => t.normalizedPriority === 'High' || t.normalizedPriority === 'Urgent');
    } else if (activeFilter === 'overdue') {
      const now = new Date();
      filteredTasks = filteredTasks.filter(t => t.date && new Date(t.date) < now && t.status !== 'Done' && t.status !== 'Completed');
    } else if (activeFilter === 'person') {
      if (selectedPersons.length > 0) {
        // Build list of all names to match (including team members for selected departments)
        const namesToMatch: string[] = [];

        selectedPersons.forEach(selected => {
          // Check if it's a department/team name
          const teamMembers = MOCK_MEMBERS.filter(m => m.department === selected);
          if (teamMembers.length > 0) {
            // It's a team - add all member names
            teamMembers.forEach(member => namesToMatch.push(member.name.toLowerCase()));
          } else {
            // It's an individual person
            namesToMatch.push(selected.toLowerCase());
          }
        });

        filteredTasks = filteredTasks.filter(t => {
          // Check both 'person' and 'people' fields
          const personName = getPersonName(t.person || (t as any).people).toLowerCase();
          if (!personName) return false;
          return namesToMatch.some(name => personName.includes(name));
        });
      }
      // If no persons selected, show all tasks (don't auto-filter)
    }

    // Sort by priority first (Urgent > High > Medium), then by date
    // Tasks without dates (new tasks) appear first within each priority group
    return filteredTasks.sort((a, b) => {
      const aPriority = priorityOrder[a.normalizedPriority || ''] || 0;
      const bPriority = priorityOrder[b.normalizedPriority || ''] || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(0, 15); // increased limit to support pagination
  }, [boards, allBoardTasks, activeFilter, userDisplayName, selectedPersons]);

  const paginatedUrgentTasks = urgentTasks.slice((urgentTasksPage - 1) * ITEMS_PER_PAGE, urgentTasksPage * ITEMS_PER_PAGE);
  const totalUrgentPages = Math.ceil(urgentTasks.length / ITEMS_PER_PAGE);

  const getCardStats = (boardId?: string) => {
    if (!boardId) return null;
    const board = boards.find(b => b.id === boardId);
    if (!board || !board.tasks) return null;

    const total = board.tasks.length;
    const done = board.tasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
    const highPriority = board.tasks.filter(t => t.priority === 'High').length;

    return { total, done, highPriority };
  };

  const handleNewTaskSave = async (taskData: { name: string; priority: string; date: string }, location: { type: 'existing' | 'new'; boardId?: string; workspaceId?: string; newBoardName?: string }) => {
    try {
      const token = await getToken();
      if (!token) return;

      let targetBoardId = location.boardId;

      // If creating a new board first
      if (location.type === 'new' && location.newBoardName && location.workspaceId) {
        const newBoard: Board = {
          id: Date.now().toString(), // Temp ID, server will assign real one
          name: location.newBoardName,
          workspaceId: location.workspaceId,
          columns: [
            { id: 'name', title: 'Name', type: 'text' },
            { id: 'status', title: 'Status', type: 'status' },
            { id: 'dueDate', title: 'Due date', type: 'date' },
            { id: 'priority', title: 'Priority', type: 'priority' }
          ],
          tasks: [],
          defaultView: 'overview',
          availableViews: ['overview', 'table'],
          icon: 'assignment'
        };

        // Create the board
        const createdBoard = await boardService.createBoard(token, newBoard);
        targetBoardId = createdBoard.id;

        // Notify parent to update boards state
        onBoardCreated(createdBoard);
      }

      if (targetBoardId) {
        // Create the task object
        const newTask: Task = {
          id: `t-${Date.now()}`,
          name: taskData.name,
          priority: taskData.priority as 'High' | 'Medium' | 'Low',
          date: taskData.date,
          status: 'Not Started',
          person: ''
        };
        // Use the prop to update local state AND backend
        await onTaskCreated(targetBoardId, newTask);

        // Show success message instead of navigating away
        const boardName = location.type === 'new' ? location.newBoardName : boards.find((b: Board) => b.id === targetBoardId)?.name || 'board';
        showToast(`Task "${taskData.name}" created in ${boardName}`, 'success');
      }

    } catch (e) {
      boardLogger.error("Failed to create new task", e);
      showToast("Failed to create task. Please try again.", 'error');
    }
  };

  const handleEventSave = async (eventData: any, boardId: string) => {
    try {
      if (!boardId) return;

      const newTask: Task = {
        id: `e-${Date.now()}`,
        name: eventData.name,
        priority: eventData.priority as 'High' | 'Medium' | 'Low',
        date: eventData.date,
        status: 'Not Started', // Events default to this for now
        person: eventData.attendees, // Storing attendees in person field
        description: eventData.description,
        type: 'event'
      };

      await onTaskCreated(boardId, newTask);
      onNavigate('board', boardId); // Navigate to the board where event was added
    } catch (e) {
      boardLogger.error("Failed to create event", e);
    }
  };

  const handleEmailSend = (emailData: any) => {
    appLogger.info("Email Sent:", emailData);
    // Here you would typically integrate with an email API or logic
    setActivities(prev => [{
      id: `act-${Date.now()}`,
      type: 'EMAIL_SENT',
      content: `Sent email to ${emailData.to}`,
      metadata: emailData.subject,
      createdAt: new Date().toISOString()
    }, ...prev]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t(greeting)}, {userDisplayName}!</h1>
            <p className="text-gray-500 mt-1">{t('daily_overview')}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Weather Widget */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 hidden sm:flex">
              <span className="text-gray-500">
                {weather?.condition.includes('Cloud') ? <Cloud size={20} weight="light" /> :
                  weather?.condition.includes('Rain') ? <CloudRain size={20} weight="light" /> :
                    weather?.condition.includes('Snow') ? <Snowflake size={20} weight="light" /> :
                      weather?.condition.includes('Storm') ? <Lightning size={20} weight="light" /> :
                        weather?.condition.includes('Fog') ? <CloudFog size={20} weight="light" /> : <Sun size={20} weight="light" />}
              </span>
              <span className="text-sm font-semibold text-gray-700">{weather ? `${weather.temp}°C` : '--'}</span>
            </div>

            {/* Date Widget */}
            <div className="px-5 py-2 bg-white rounded-full shadow-sm border border-gray-100">
              <span className="text-sm font-medium text-gray-600">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}, {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>



        {/* Recently Visited */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClockCounterClockwise size={24} weight="light" className="text-gray-400" />
                {t('recently_visited')}
              </h2>
              {/* Scroll Controls */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={scrollLeft}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <CaretLeft size={18} weight="light" />
                </button>
                <button
                  onClick={scrollRight}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <CaretRight size={18} weight="light" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                {[
                  { icon: Receipt, label: t('payment_request') },
                  { icon: EnvelopeSimple, label: t('new_email'), onClick: () => setIsEmailModalOpen(true) },
                  { icon: UserPlus, label: t('new_customer') },
                  { icon: Package, label: t('new_product') },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    className="group flex items-center gap-0 bg-white p-1 rounded-full border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md hover:pr-4 rtl:hover:pr-1 rtl:hover:pl-4 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden"
                    onClick={() => action.onClick ? action.onClick() : appLogger.debug(`Triggered ${action.label}`)}
                  >
                    <div className="p-1.5 rounded-full bg-gray-50 text-gray-600 group-hover:bg-gray-100 group-hover:text-gray-900 transition-colors duration-500 shrink-0">
                      <action.icon size={14} weight="regular" />
                    </div>
                    <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2 rtl:group-hover:ml-0 rtl:group-hover:mr-2 transition-all duration-700 ease-out whitespace-nowrap text-[11px] font-medium text-gray-600 group-hover:text-gray-900">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto snap-x scroll-smooth pb-4 -mx-1 px-1 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recentlyVisited.length > 0 ? (
              recentlyVisited
                .map(item => {
                  const imageUrl = getCardTheme(item.title, item.type);
                  const stats = getCardStats(item.boardId);

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col min-w-[300px] sm:min-w-[340px] snap-start"
                    >
                      {/* Cover Image */}
                      <div
                        className="h-24 relative cursor-pointer bg-gray-200"
                        onClick={() => onNavigate(item.type, item.boardId)}
                      >
                        <img
                          src={imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>

                        {/* Quick Actions (On Hover) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            className="bg-white/95 text-gray-700 p-1 rounded shadow-sm hover:text-blue-600 transition-colors"
                            title="Open"
                            onClick={(e) => { e.stopPropagation(); onNavigate(item.type, item.boardId); }}
                          >
                            <ArrowSquareOut size={16} weight="light" />
                          </button>
                          <button
                            className="bg-white/95 text-gray-700 p-1 rounded shadow-sm hover:text-yellow-600 transition-colors"
                            title="Favorite"
                            onClick={(e) => { e.stopPropagation(); /* TODO: Implement Favorite */ }}
                          >
                            <Star size={16} weight="light" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 cursor-pointer flex-1 flex flex-col justify-between" onClick={() => onNavigate(item.type, item.boardId)}>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 truncate text-base group-hover:text-blue-600 transition-colors">{item.title}</h3>
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            {item.boardId ? t('project_board') : t('application_module')}
                          </p>
                        </div>

                        {/* Stats / Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                          {stats ? (
                            <div className="flex gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-0.5" title="Active Tasks">
                                <CheckCircle size={12} weight="light" className="text-gray-400" />
                                {stats.total}
                              </span>
                              <span className="flex items-center gap-0.5" title="High Priority">
                                <Flag size={12} weight="light" className="text-red-400" />
                                {stats.highPriority}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{t('open')}</span>
                          )}
                          <span className="text-[10px] text-gray-300 font-medium">{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <ClockCounterClockwise size={40} weight="light" className="text-gray-300 mb-3" />
                <p className="text-sm font-medium">{t('no_recent_history')}</p>
                <p className="text-xs mt-1 opacity-70">{t('pages_appear_here')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="space-y-8">

          {/* Row 1: Urgent Tasks & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Urgent Tasks */}
            <div className="lg:col-span-2">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">

                  {/* Left Side: Title & Controls */}
                  <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <WarningCircle size={24} weight="light" className="text-red-500" />
                      {t('urgent_tasks')}
                    </h2>

                    <div className="h-6 w-px bg-gray-200"></div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('my_work')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mr-1"
                      >
                        {t('show_all')}
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Filters */}
                  <div className="flex items-center justify-end min-w-[80px]">
                    {/* Filter Toolbar */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 relative">
                      {/* Standard Filters */}
                      <div className="flex items-center">
                        <button
                          onClick={() => setActiveFilter('all')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title={t('all_tasks')}
                        >
                          <SquaresFour size={16} weight={activeFilter === 'all' ? 'fill' : 'regular'} />
                        </button>
                        <button
                          onClick={() => setActiveFilter('high')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'high' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title={t('high_priority')}
                        >
                          <WarningCircle size={16} weight={activeFilter === 'high' ? 'fill' : 'regular'} />
                        </button>
                        <button
                          onClick={() => setActiveFilter('overdue')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'overdue' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title={t('overdue')}
                        >
                          <CalendarBlank size={16} weight={activeFilter === 'overdue' ? 'fill' : 'regular'} />
                        </button>
                      </div>

                      {/* Person Search - Fixed width container to prevent layout shift */}
                      <div ref={personSearchRef} className="relative flex items-center w-8">
                        {isPersonSearchOpen ? (
                          <div
                            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center w-[260px] bg-white rounded-md shadow-lg border border-blue-100 z-50"
                          >
                            <div className="pl-2 pr-1 text-indigo-500 shrink-0">
                              <User size={14} weight="fill" />
                            </div>
                            <div className="flex-1 flex items-center overflow-hidden min-w-0 flex-wrap gap-1 py-1">
                              {/* Selected persons as removable badges */}
                              {selectedPersons.map((person, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setSelectedPersons(prev => prev.filter((_, i) => i !== idx));
                                    if (selectedPersons.length === 1) {
                                      setActiveFilter('all');
                                    }
                                  }}
                                  className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 hover:bg-indigo-200 transition-colors"
                                  title="Click to remove"
                                >
                                  {person.length > 10 ? person.substring(0, 10) + '...' : person}
                                  <X size={10} weight="bold" />
                                </button>
                              ))}
                              <input
                                autoFocus
                                type="text"
                                className="flex-1 text-xs border-none focus:ring-0 p-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent min-w-[60px]"
                                placeholder={selectedPersons.length === 0 ? t('search_people') : t('add_more')}
                                value={personSearchQuery}
                                onChange={(e) => {
                                  setPersonSearchQuery(e.target.value);
                                  setHighlightedIndex(0);
                                }}
                                onKeyDown={(e) => {
                                  const filteredItems = peopleAndTeams.filter(item =>
                                    item.name.toLowerCase().includes(personSearchQuery.toLowerCase()) &&
                                    !selectedPersons.includes(item.name)
                                  );

                                  if (e.key === 'Escape') {
                                    setIsPersonSearchOpen(false);
                                    setPersonSearchQuery('');
                                  } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setHighlightedIndex(prev => Math.max(prev - 1, 0));
                                  } else if (e.key === 'Enter' && filteredItems.length > 0) {
                                    e.preventDefault();
                                    const selectedItem = filteredItems[highlightedIndex];
                                    if (selectedItem) {
                                      setSelectedPersons(prev => [...prev, selectedItem.name]);
                                      setPersonSearchQuery('');
                                      setActiveFilter('person');
                                      setHighlightedIndex(0);
                                    }
                                  } else if (e.key === 'Backspace' && personSearchQuery === '' && selectedPersons.length > 0) {
                                    // Remove last selected person when backspace on empty input
                                    setSelectedPersons(prev => prev.slice(0, -1));
                                    if (selectedPersons.length === 1) {
                                      setActiveFilter('all');
                                    }
                                  }
                                }}
                              />
                            </div>
                            <button
                              onClick={() => {
                                setIsPersonSearchOpen(false);
                                setPersonSearchQuery('');
                                setSelectedPersons([]);
                                setActiveFilter('all');
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
                              title={t('clear_and_close')}
                            >
                              <X size={12} />
                            </button>

                            {/* Dropdown - shows when typing or when focused with no selection */}
                            {(personSearchQuery || selectedPersons.length === 0) && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 max-h-48 overflow-y-auto">
                                {filteredPeopleAndTeams.map((item, idx) => (
                                    <button
                                      key={item.id}
                                      onClick={() => {
                                        setSelectedPersons(prev => [...prev, item.name]);
                                        setPersonSearchQuery('');
                                        setActiveFilter('person');
                                        setHighlightedIndex(0);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs text-gray-700 flex items-center gap-2 transition-colors ${
                                        idx === highlightedIndex ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded-full ${item.type === 'team' ? 'bg-indigo-500' : item.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                                        {item.initials.charAt(0)}
                                      </div>
                                      <span className="flex-1">{item.name}</span>
                                      {item.type === 'team' && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded">{t('team')}</span>
                                      )}
                                    </button>
                                  ))}
                                {filteredPeopleAndTeams.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-gray-400 text-center">{t('no_matches')}</div>
                                  )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setIsPersonSearchOpen(true);
                              setActiveFilter('person');
                              setHighlightedIndex(0);
                            }}
                            className={`w-full h-full p-1.5 flex items-center justify-center rounded-md transition-all ${activeFilter === 'person' ? 'bg-white shadow-sm text-indigo-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            title={t('filter_by_person')}
                          >
                            <User size={16} weight={activeFilter === 'person' ? 'fill' : 'regular'} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 flex-1 flex flex-col h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {paginatedUrgentTasks.length > 0 ? (
                    <>
                      {paginatedUrgentTasks.map(task => (
                        <div key={task.id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CalendarBlank size={12} weight="light" />
                              {task.date ? formatDate(task.date, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : t('no_date')}
                              <span className="mx-1">•</span>
                              <Folder size={12} weight="light" />
                              {task.boardName}
                              {getPersonName(task.person || (task as any).people) && (
                                <>
                                  <span className="mx-1">•</span>
                                  <User size={12} weight="light" />
                                  <span className="truncate max-w-[100px]">{getPersonName(task.person || (task as any).people)}</span>
                                </>
                              )}
                            </p>
                          </div>

                          {/* Priority Badge Aligned to Right */}
                          <div className="flex-shrink-0 w-20 flex justify-center ml-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                                ${task.normalizedPriority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                  task.normalizedPriority === 'High' ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'}`}>
                              {task.normalizedPriority || task.priority}
                            </span>
                          </div>

                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onNavigate('board', task.boardId)}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors"
                              title={t('open_in_board')}
                            >
                              <PencilSimple size={18} weight="light" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <CheckCircle size={32} weight="light" className="text-gray-300 mb-1" />
                      <p className="text-sm text-gray-500">{t('no_urgent_tasks')}</p>
                    </div>
                  )}
                </div>
                {/* Footer: Pagination */}
                <div className="flex items-center justify-end pt-4 mt-auto">
                  {totalUrgentPages > 1 && (
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 shadow-sm">
                      <button
                        onClick={() => setUrgentTasksPage(p => Math.max(1, p - 1))}
                        disabled={urgentTasksPage === 1}
                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <CaretLeft size={14} weight="light" />
                      </button>
                      <span className="text-[10px] font-medium text-gray-500 px-2 select-none">{urgentTasksPage}/{totalUrgentPages}</span>
                      <button
                        onClick={() => setUrgentTasksPage(p => Math.min(totalUrgentPages, p + 1))}
                        disabled={urgentTasksPage === totalUrgentPages}
                        className="p-1 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      >
                        <CaretRight size={14} weight="light" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Lightning size={24} weight="light" className="text-amber-500" />
                    {t('quick_actions')}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <ListPlus size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('new_task')}</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <UserPlus size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('invite_member')}</span>
                  </button>
                  <button
                    onClick={() => setIsGlobalSearchOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <MagnifyingGlass size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('search_all')}</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <SquaresFour size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('new_board')}</span>
                  </button>
                  <button
                    onClick={() => setIsEventModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <CalendarBlank size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('events')}</span>
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <UploadSimple size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">{t('upload')}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Row 2: Recent Activity & Other Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Recent Activity - Spans 2 Rows to match Quick Notes + Reminders */}
            <div className="lg:col-span-2 lg:row-span-2 h-full min-h-0">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={24} weight="light" className="text-blue-500" />
                    {t('recent_activity')}
                  </h2>
                </div>
                <div className="flow-root flex-1 overflow-y-auto pr-2 custom-scrollbar no-scrollbar">
                  <ul className="-mb-8" role="list">
                    {activities.length > 0 ? (
                      activities.slice(0, 5).map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx !== activities.length - 1 && (
                              <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                {(() => {
                                  const styles = getActivityStyles(activity.type);
                                  return (
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${styles.bg}`}>
                                      <styles.icon size={16} weight="light" className={styles.color} />
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    {activity.content}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatTimeAgo(new Date(activity.createdAt).getTime())}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400">
                        <Clock size={32} weight="light" className="text-gray-300 mb-1" />
                        <p className="text-sm">{t('no_recent_activity')}</p>
                      </div>
                    )}
                  </ul>
                </div>
              </section>
            </div>

            {/* Quick Notes (Row 1, Col 3) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <NotePencil size={24} weight="light" className="text-yellow-500" />
                  {t('quick_notes')}
                </h2>
                <span className="text-xs text-gray-400">{t('auto_saved')}</span>
              </div>
              <textarea
                className="w-full h-32 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-300 resize-none"
                placeholder={t('jot_down')}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
              />
            </section>

            {/* Reminders (Row 2, Col 3) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Bell size={24} weight="light" className="text-purple-500" />
                  {t('reminders')}
                </h2>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">{t('clear')}</button>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input className="mt-1 h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" type="checkbox" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{t('email_update_to_client')}</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input className="mt-1 h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" type="checkbox" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{t('check_in_with_design')}</span>
                </label>
              </div>
            </section>



          </div>
        </div>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        boards={boards}
        workspaces={workspaces}
        onSave={handleNewTaskSave}
        activeWorkspaceId={activeWorkspaceId}
      />

      <SaveToVaultModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadFile(null);
        }}
        file={uploadFile}
      />

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        boards={boards}
        workspaces={workspaces}
        onSave={handleEventSave}
        activeWorkspaceId={activeWorkspaceId}
      />

      <NewEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleEmailSend}
      />

      <GlobalSearchDrawer
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        boards={boards}
        onNavigate={onNavigate}
      />
    </div >
  );
};