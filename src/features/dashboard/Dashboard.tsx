import React, { useMemo, useState, useEffect } from 'react';
import { Board, RecentlyVisitedItem, ViewState, Task, Workspace } from '../../types';
import {
  Cloud, CloudRain, Snowflake, Lightning, CloudFog, Sun,
  ClockCounterClockwise, CaretLeft, CaretRight, ArrowSquareOut, Star,
  CheckCircle, Flag, WarningCircle, CalendarBlank, Folder,
  PencilSimple, ListPlus, UserPlus, MagnifyingGlass, SquaresFour,
  UploadSimple, Clock, Trash, ChatCircle, PaperPlaneRight,
  EnvelopeSimple, Archive, NotePencil, Bell, Funnel, SortAscending, ArrowsDownUp, User, X
} from 'phosphor-react';
import { NewTaskModal } from '../../components/ui/NewTaskModal';
import { CreateEventModal } from './components/CreateEventModal';
import { SaveToVaultModal } from './components/SaveToVaultModal';
import { GlobalSearchDrawer } from './components/GlobalSearchDrawer';
import { boardService } from '../../services/boardService';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../auth-adapter';

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
  const { userDisplayName } = useAppContext();
  const { getToken, isSignedIn } = useAuth();

  const [quickNote, setQuickNote] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [urgentTasksPage, setUrgentTasksPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'overdue' | 'person'>('all');
  const [recentPage, setRecentPage] = useState(0);

  // Person Filter State
  const [isPersonSearchOpen, setIsPersonSearchOpen] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const MOCK_PEOPLE = ['Max', 'Sarah', 'Mike', 'Ali', 'Emma', 'Design Team', 'Dev Team'];
  const ITEMS_PER_PAGE = 3;

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

      // Update greeting
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');
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
        console.error("Failed to fetch weather/location", e);
        // Fallback to defaults if failed
        setWeather({ temp: 24, condition: 'Sunny', city: 'New York', country: 'USA' });
      }
    };

    fetchWeather();
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (token) {
          const url = new URL('http://localhost:3001/api/activities');

          const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setActivities(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch activities", error);
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

  const stats = useMemo(() => {
    let totalTasks = 0;
    let highPriority = 0;
    let completed = 0; // Mocking this for now as we don't strictly track "completed" status across all boards easily without checking columns
    // Assuming a convention where we might verify completions later, for now we will just count total and high priority

    boards.forEach(board => {
      if (board.tasks && Array.isArray(board.tasks)) {
        totalTasks += board.tasks.length;
        board.tasks.forEach(t => {
          if (t.priority === 'High') highPriority++;
        });
      }
    });

    return { totalTasks, highPriority, completed };
  }, [boards]);

  const urgentTasks = useMemo(() => {
    const allTasks: (Task & { boardName: string })[] = [];
    boards.forEach(board => {
      if (board.tasks && Array.isArray(board.tasks)) {
        board.tasks.forEach(task => {
          if (task.priority === 'High' || task.priority === 'Medium') {
            allTasks.push({ ...task, boardName: board.name });
          }
        });
      }
    });
    // Sort by due date (ascending) - handling empty dates by putting them last
    const sortedAll = allTasks.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Apply Filters
    let filteredTasks = sortedAll;

    if (activeFilter === 'high') {
      filteredTasks = filteredTasks.filter(t => t.priority === 'High');
    } else if (activeFilter === 'overdue') {
      const now = new Date();
      filteredTasks = filteredTasks.filter(t => t.date && new Date(t.date) < now && t.status !== 'Done' && t.status !== 'Completed');
    } else if (activeFilter === 'person') {
      if (selectedPersons.length > 0) {
        filteredTasks = filteredTasks.filter(t => t.person && selectedPersons.some(p => t.person.includes(p)));
      } else if (userDisplayName) {
        // Default to current user if no specific person selected but filter is active (fallback)
        filteredTasks = filteredTasks.filter(t => t.person?.includes(userDisplayName));
      }
    }

    // Sort by due date (ascending) - handling empty dates by putting them last
    return filteredTasks.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(0, 15); // increased limit to support pagination
  }, [boards, activeFilter, userDisplayName, selectedPersons]);

  const paginatedUrgentTasks = urgentTasks.slice((urgentTasksPage - 1) * ITEMS_PER_PAGE, urgentTasksPage * ITEMS_PER_PAGE);
  const totalUrgentPages = Math.ceil(urgentTasks.length / ITEMS_PER_PAGE);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityStyles = (type: string) => {
    switch (type) {
      case 'BOARD_CREATED': return { bg: 'bg-green-100', icon: SquaresFour, color: 'text-green-600' };
      case 'BOARD_DELETED': return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
      case 'TASK_CREATED': return { bg: 'bg-blue-100', icon: ListPlus, color: 'text-blue-600' };
      case 'TASK_UPDATED': return { bg: 'bg-amber-100', icon: PencilSimple, color: 'text-amber-600' };
      case 'TASK_DELETED': return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
      case 'GROUP_CREATED': return { bg: 'bg-green-100', icon: UserPlus, color: 'text-green-600' };
      case 'GROUP_DELETED': return { bg: 'bg-red-100', icon: Trash, color: 'text-red-600' };
      case 'THREAD_CREATED': return { bg: 'bg-teal-100', icon: ChatCircle, color: 'text-teal-600' };
      case 'MESSAGE_SENT': return { bg: 'bg-indigo-100', icon: PaperPlaneRight, color: 'text-indigo-600' };
      case 'EMAIL_SENT': return { bg: 'bg-sky-100', icon: EnvelopeSimple, color: 'text-sky-600' };
      case 'EMAIL_DELETED': return { bg: 'bg-gray-100', icon: Trash, color: 'text-gray-600' };
      case 'EMAIL_ARCHIVED': return { bg: 'bg-orange-100', icon: Archive, color: 'text-orange-600' };
      default: return { bg: 'bg-gray-100', icon: Bell, color: 'text-gray-600' };
    }
  };

  const handleNextRecent = () => {
    if ((recentPage + 1) * ITEMS_PER_PAGE < recentlyVisited.length) {
      setRecentPage(prev => prev + 1);
    }
  };

  const handlePrevRecent = () => {
    if (recentPage > 0) {
      setRecentPage(prev => prev - 1);
    }
  };

  // --- Helpers for Recently Visited ---
  const getCardTheme = (title: string, type: string) => {
    const lowerTitle = title.toLowerCase();

    // Local assets for premium look
    const specificImages = {
      marketing: '/assets/covers/marketing.png',
      production: '/assets/covers/production.png',
      finance: '/assets/covers/finance.png',
      generic: '/assets/covers/generic.png'
    };

    // Pool of abstract images for variety
    const abstractPool = [
      '/assets/covers/generic.png',
      '/assets/covers/abstract_blue.png',
      '/assets/covers/abstract_orange.png',
      '/assets/covers/abstract_purple.png',
      '/assets/covers/abstract_green.png'
    ];

    // Check for specific keywords first
    if (lowerTitle.includes('market')) return specificImages.marketing;
    if (lowerTitle.includes('design') || lowerTitle.includes('creative')) return specificImages.marketing;
    if (lowerTitle.includes('product')) return specificImages.production;
    if (lowerTitle.includes('ops') || lowerTitle.includes('maint')) return specificImages.production;
    if (lowerTitle.includes('sale') || lowerTitle.includes('crm')) return specificImages.finance;
    if (lowerTitle.includes('finance') || lowerTitle.includes('money')) return specificImages.finance;

    // If no specific keyword, deterministic hash to pick an abstract image
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % abstractPool.length;

    return abstractPool[index];
  };
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

        if (location.type === 'new') {
          // Already handled by onBoardCreated but let's navigate to it
          onNavigate('board', targetBoardId);
        } else {
          onNavigate('board', targetBoardId);
        }
      }

    } catch (e) {
      console.error("Failed to create new task", e);
      alert("Failed to create task. Please try again.");
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
      console.error("Failed to create event", e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{greeting}, {userDisplayName}!</h1>
            <p className="text-gray-500 mt-1">Here's your daily overview.</p>
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
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ClockCounterClockwise size={24} weight="light" className="text-gray-400" />
              Recently Visited
            </h2>
            {/* Pagination Controls */}
            {recentlyVisited.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevRecent}
                  disabled={recentPage === 0}
                  className={`p-1 rounded-full hover:bg-gray-200 transition-colors ${recentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
                >
                  <CaretLeft size={18} weight="light" />
                </button>
                <button
                  onClick={handleNextRecent}
                  disabled={(recentPage + 1) * ITEMS_PER_PAGE >= recentlyVisited.length}
                  className={`p-1 rounded-full hover:bg-gray-200 transition-colors ${(recentPage + 1) * ITEMS_PER_PAGE >= recentlyVisited.length ? 'opacity-30 cursor-not-allowed' : 'text-gray-600'}`}
                >
                  <CaretRight size={18} weight="light" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyVisited.length > 0 ? (
              recentlyVisited
                .slice(recentPage * ITEMS_PER_PAGE, (recentPage + 1) * ITEMS_PER_PAGE)
                .map(item => {
                  const imageUrl = getCardTheme(item.title, item.type);
                  const stats = getCardStats(item.boardId);

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
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
                            {item.boardId ? 'Project Board' : 'Application Module'}
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
                            <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</span>
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
                <p className="text-sm font-medium">No recent history</p>
                <p className="text-xs mt-1 opacity-70">Pages you visit will appear here</p>
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
                      Urgent Tasks
                    </h2>

                    <div className="h-6 w-px bg-gray-200"></div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('my_work')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mr-1"
                      >
                        Show All
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Filters */}
                  <div className="flex items-center justify-end min-w-[80px]">
                    {/* Filter Toolbar */}
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                      {/* Standard Filters */}
                      <div className={`flex items-center transition-all duration-300 ease-out overflow-hidden ${isPersonSearchOpen ? 'w-0 opacity-0 p-0' : 'w-auto opacity-100'}`}>
                        <button
                          onClick={() => setActiveFilter('all')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="All Tasks"
                        >
                          <SquaresFour size={16} weight={activeFilter === 'all' ? 'fill' : 'regular'} />
                        </button>
                        <button
                          onClick={() => setActiveFilter('high')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'high' ? 'bg-white shadow-sm text-red-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="High Priority"
                        >
                          <WarningCircle size={16} weight={activeFilter === 'high' ? 'fill' : 'regular'} />
                        </button>
                        <button
                          onClick={() => setActiveFilter('overdue')}
                          className={`p-1.5 rounded-md transition-all ${activeFilter === 'overdue' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                          title="Overdue"
                        >
                          <CalendarBlank size={16} weight={activeFilter === 'overdue' ? 'fill' : 'regular'} />
                        </button>
                      </div>

                      {/* Person Search - Expandable from center */}
                      <div className={`relative flex items-center transition-all duration-300 ease-out ${isPersonSearchOpen ? 'w-[220px]' : 'w-8'}`}>
                        {isPersonSearchOpen ? (
                          <div
                            className="flex items-center w-full bg-white rounded-md shadow-sm border border-blue-100 overflow-hidden origin-right"
                          >
                            <div className="pl-2 pr-1 text-indigo-500 shrink-0">
                              <User size={14} weight="fill" />
                            </div>
                            <div className="flex-1 flex items-center overflow-hidden min-w-0">
                              {selectedPersons.length > 0 && (
                                <div className="flex items-center gap-1 px-1 shrink-0">
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {selectedPersons[0]}
                                    {selectedPersons.length > 1 && ` +${selectedPersons.length - 1}`}
                                  </span>
                                </div>
                              )}
                              <input
                                autoFocus
                                type="text"
                                className="w-full text-xs border-none focus:ring-0 p-1.5 pl-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent min-w-[50px]"
                                placeholder={selectedPersons.length === 0 ? "Search..." : ""}
                                value={personSearchQuery}
                                onChange={(e) => setPersonSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setIsPersonSearchOpen(false);
                                  }
                                }}
                              />
                            </div>
                            <button
                              onClick={() => {
                                setIsPersonSearchOpen(false);
                                setPersonSearchQuery('');
                                if (activeFilter === 'person' && selectedPersons.length === 0) setActiveFilter('all');
                              }}
                              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
                            >
                              <X size={12} />
                            </button>

                            {/* Dropdown */}
                            {personSearchQuery && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 max-h-48 overflow-y-auto">
                                {MOCK_PEOPLE.filter(p => p.toLowerCase().includes(personSearchQuery.toLowerCase()) && !selectedPersons.includes(p)).map(person => (
                                  <button
                                    key={person}
                                    onClick={() => {
                                      setSelectedPersons(prev => [...prev, person]);
                                      setPersonSearchQuery('');
                                      setActiveFilter('person');
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                      {person.charAt(0)}
                                    </div>
                                    {person}
                                  </button>
                                ))}
                                {MOCK_PEOPLE.filter(p => p.toLowerCase().includes(personSearchQuery.toLowerCase()) && !selectedPersons.includes(p)).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-gray-400 text-center">No matches</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setIsPersonSearchOpen(true);
                              setActiveFilter('person');
                            }}
                            className={`w-full h-full p-1.5 flex items-center justify-center rounded-md transition-all ${activeFilter === 'person' ? 'bg-white shadow-sm text-indigo-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                            title="Filter by Person"
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
                          <div className="flex items-center h-5">
                            <input className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" type="checkbox" />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <CalendarBlank size={12} weight="light" />
                              {task.date || 'No Date'}
                              <span className="mx-1">•</span>
                              <Folder size={12} weight="light" />
                              {task.boardName}
                            </p>
                          </div>

                          {/* Priority Badge Aligned to Right */}
                          <div className="flex-shrink-0 w-20 flex justify-center ml-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider
                                ${task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                              {task.priority}
                            </span>
                          </div>

                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors">
                              <PencilSimple size={18} weight="light" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <CheckCircle size={32} weight="light" className="text-gray-300 mb-1" />
                      <p className="text-sm text-gray-500">No urgent tasks due. You're all caught up!</p>
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
                    Quick Actions
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <ListPlus size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">New Task</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <UserPlus size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">Invite Member</span>
                  </button>
                  <button
                    onClick={() => setIsGlobalSearchOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <MagnifyingGlass size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">Search All</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <SquaresFour size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">New Board</span>
                  </button>
                  <button
                    onClick={() => setIsEventModalOpen(true)}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md">
                    <CalendarBlank size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">Events</span>
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white shadow-sm hover:shadow-md"
                  >
                    <UploadSimple size={32} weight="light" className="mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-xs font-medium whitespace-nowrap">Upload</span>
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
                    Recent Activity
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
                        <p className="text-sm">No recent activity found.</p>
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
                  Quick Notes
                </h2>
                <span className="text-xs text-gray-400">Auto-saved</span>
              </div>
              <textarea
                className="w-full h-32 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-yellow-300 resize-none"
                placeholder="Jot down something..."
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
              />
            </section>

            {/* Reminders (Row 2, Col 3) */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Bell size={24} weight="light" className="text-purple-500" />
                  Reminders
                </h2>
                <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">Clear</button>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input className="mt-1 h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" type="checkbox" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">Email update to client</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input className="mt-1 h-3.5 w-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" type="checkbox" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">Check in with Design</span>
                </label>
              </div>
            </section>



          </div>
        </div>
      </div >

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
      <GlobalSearchDrawer
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        boards={boards}
        onNavigate={onNavigate}
      />
    </div>
  );
};