import React, { useMemo, useState, useEffect } from 'react';
import { Board, RecentlyVisitedItem, ViewState, Task } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '@clerk/clerk-react';

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
}

export const Dashboard: React.FC<DashboardProps> = ({ onBoardCreated, recentlyVisited, onNavigate, boards, activeWorkspaceId }) => {
  const { userDisplayName } = useAppContext();
  const { getToken, isSignedIn } = useAuth();
  const [quickNote, setQuickNote] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);

  // Loads quick note from local storage on mount
  useEffect(() => {
    const savedNote = localStorage.getItem('dashboard_quick_note');
    if (savedNote) setQuickNote(savedNote);
  }, []);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        if (token) {
          const url = new URL('http://localhost:3001/api/activities');
          if (activeWorkspaceId) {
            url.searchParams.append('workspaceId', activeWorkspaceId);
          }
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
    return allTasks.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }).slice(0, 5); // Limit to 5
  }, [boards]);

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
      case 'BOARD_CREATED': return { bg: 'bg-green-100', icon: 'dashboard', color: 'text-green-600' };
      case 'BOARD_DELETED': return { bg: 'bg-red-100', icon: 'delete', color: 'text-red-600' };
      case 'TASK_CREATED': return { bg: 'bg-blue-100', icon: 'add_task', color: 'text-blue-600' };
      case 'TASK_UPDATED': return { bg: 'bg-amber-100', icon: 'edit', color: 'text-amber-600' };
      case 'TASK_DELETED': return { bg: 'bg-red-100', icon: 'delete_outline', color: 'text-red-600' };
      case 'GROUP_CREATED': return { bg: 'bg-green-100', icon: 'group_add', color: 'text-green-600' };
      case 'GROUP_DELETED': return { bg: 'bg-red-100', icon: 'delete_sweep', color: 'text-red-600' };
      case 'THREAD_CREATED': return { bg: 'bg-teal-100', icon: 'forum', color: 'text-teal-600' };
      case 'MESSAGE_SENT': return { bg: 'bg-indigo-100', icon: 'send', color: 'text-indigo-600' };
      case 'EMAIL_SENT': return { bg: 'bg-sky-100', icon: 'mail', color: 'text-sky-600' };
      case 'EMAIL_DELETED': return { bg: 'bg-gray-100', icon: 'auto_delete', color: 'text-gray-600' };
      case 'EMAIL_ARCHIVED': return { bg: 'bg-orange-100', icon: 'archive', color: 'text-orange-600' };
      default: return { bg: 'bg-gray-100', icon: 'notification_important', color: 'text-gray-600' };
    }
  };

  // --- Helpers for Recently Visited ---
  const getCardTheme = (title: string, type: string) => {
    const lowerTitle = title.toLowerCase();

    // Define premium themes
    const themes = {
      marketing: { from: 'from-pink-500', to: 'to-rose-500', icon: 'campaign', pattern: 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]' },
      production: { from: 'from-blue-600', to: 'to-cyan-500', icon: 'precision_manufacturing', pattern: 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]' },
      sales: { from: 'from-emerald-500', to: 'to-teal-400', icon: 'point_of_sale', pattern: 'bg-[url("https://www.transparenttextures.com/patterns/diamond-upholstery.png")]' },
      finance: { from: 'from-indigo-600', to: 'to-violet-600', icon: 'payments', pattern: 'bg-[url("https://www.transparenttextures.com/patterns/hexellence.png")]' },
      operations: { from: 'from-amber-500', to: 'to-orange-500', icon: 'engineering', pattern: 'bg-[url("https://www.transparenttextures.com/patterns/diagmonds-light.png")]' },
      default: { from: 'from-slate-500', to: 'to-slate-600', icon: 'grid_view', pattern: '' }
    };

    if (lowerTitle.includes('market')) return themes.marketing;
    if (lowerTitle.includes('product')) return themes.production;
    if (lowerTitle.includes('sale') || lowerTitle.includes('crm')) return themes.sales;
    if (lowerTitle.includes('finance') || lowerTitle.includes('money')) return themes.finance;
    if (lowerTitle.includes('ops') || lowerTitle.includes('maint')) return themes.operations;

    return themes.default;
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

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Good morning, {userDisplayName}!</h1>
            <p className="text-gray-500 mt-1">Here's your daily overview.</p>
          </div>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>



        {/* Recently Visited */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">history</span>
              Recently Visited
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyVisited.length > 0 ? (
              recentlyVisited.slice(0, 4).map(item => {
                const theme = getCardTheme(item.title, item.type);
                const stats = getCardStats(item.boardId);

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Cover Image */}
                    <div
                      className={`h-28 bg-gradient-to-br ${theme.from} ${theme.to} relative cursor-pointer group-hover:brightness-110 transition-all`}
                      onClick={() => onNavigate(item.type, item.boardId)}
                    >
                      <div className={`absolute inset-0 opacity-20 ${theme.pattern}`}></div>
                      <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/30 text-white shadow-sm">
                        <span className="material-symbols-outlined text-lg block">{theme.icon}</span>
                      </div>

                      {/* Quick Actions (On Hover) */}
                      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <button
                          className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-lg shadow-sm backdrop-blur-sm border border-white/50 transition-colors"
                          title="Open"
                          onClick={(e) => { e.stopPropagation(); onNavigate(item.type, item.boardId); }}
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                        </button>
                        <button
                          className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-lg shadow-sm backdrop-blur-sm border border-white/50 transition-colors"
                          title="Favorite"
                          onClick={(e) => { e.stopPropagation(); /* TODO: Implement Favorite */ }}
                        >
                          <span className="material-symbols-outlined text-sm">star</span>
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 cursor-pointer" onClick={() => onNavigate(item.type, item.boardId)}>
                      <h3 className="font-bold text-gray-900 mb-1 truncate text-base leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                      <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        {item.boardId ? 'Project Board' : 'Application Module'}
                      </p>

                      {/* Stats / Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        {stats ? (
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1" title="Active Tasks">
                              <span className="material-symbols-outlined text-[10px] text-gray-400">check_circle</span>
                              {stats.total}
                            </span>
                            <span className="flex items-center gap-1" title="High Priority">
                              <span className="material-symbols-outlined text-[10px] text-red-400">flag</span>
                              {stats.highPriority}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">View details</div>
                        )}
                        <span className="text-[10px] text-gray-300 font-medium">{formatTimeAgo(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-20">history</span>
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
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">priority_high</span>
                    Urgent Tasks
                  </h2>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <div className="space-y-4 flex-1 flex flex-col">
                  {urgentTasks.length > 0 ? (
                    urgentTasks.map(task => (
                      <div key={task.id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center h-5">
                          <input className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" type="checkbox" />
                        </div>
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                  ${task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">event</span>
                            {task.date || 'No Date'}
                            <span className="mx-1">•</span>
                            <span className="material-symbols-outlined text-[10px]">folder</span>
                            {task.boardName}
                          </p>
                        </div>
                        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-600 transition-colors">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <span className="material-symbols-outlined text-gray-300 text-3xl mb-1">check_circle</span>
                      <p className="text-sm text-gray-500">No urgent tasks due. You're all caught up!</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">bolt</span>
                    Quick Actions
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white">
                    <span className="material-symbols-outlined text-2xl mb-1 text-gray-400 group-hover:text-blue-500">add_task</span>
                    <span className="text-xs font-medium">New Task</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white">
                    <span className="material-symbols-outlined text-2xl mb-1 text-gray-400 group-hover:text-blue-500">group_add</span>
                    <span className="text-xs font-medium">Invite</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white">
                    <span className="material-symbols-outlined text-2xl mb-1 text-gray-400 group-hover:text-blue-500">calendar_today</span>
                    <span className="text-xs font-medium">Events</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all group bg-white">
                    <span className="material-symbols-outlined text-2xl mb-1 text-gray-400 group-hover:text-blue-500">upload_file</span>
                    <span className="text-xs font-medium">Upload</span>
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Row 2: Recent Activity & Other Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Recent Activity */}
            <div className="lg:col-span-2 h-full">
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500">update</span>
                    Recent Activity
                  </h2>
                </div>
                <div className="flow-root flex-1">
                  <ul className="-mb-8" role="list">
                    {activities.length > 0 ? (
                      activities.map((activity, idx) => (
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
                                      <span className={`material-symbols-outlined text-sm ${styles.color}`}>
                                        {styles.icon}
                                      </span>
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
                        <span className="material-symbols-outlined text-3xl mb-1 opacity-20">update</span>
                        <p className="text-sm">No recent activity found.</p>
                      </div>
                    )}
                  </ul>
                </div>
              </section>
            </div>

            {/* Right Column Stack */}
            <div className="lg:col-span-1 space-y-6">

              {/* Quick Notes (New) */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500">edit_note</span>
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

              {/* Reminders */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-500">notifications</span>
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

              {/* Help Card */}
              <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined">support_agent</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1">Need help?</h3>
                  <p className="text-blue-100 text-sm mb-4">Check our help details.</p>
                  <button className="w-full bg-white text-blue-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-blue-50 transition-colors shadow-sm">
                    Visit Help Center
                  </button>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};