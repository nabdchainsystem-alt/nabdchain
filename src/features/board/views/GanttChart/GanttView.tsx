import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Row } from '../Table/RoomTable';
import {
  CaretDown as ChevronDown,
  Plus,
  MagnifyingGlass as Search,
  Funnel as ListFilter,
  ArrowsDownUp as ArrowUpDown,
  Download,
  Phone,
  UserCircle,
} from 'phosphor-react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface GanttViewProps {
  roomId: string;
  boardName?: string;
  tasks: Row[];
  onUpdateTasks: (tasks: Row[]) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const GanttView: React.FC<GanttViewProps> = ({ _roomId, boardName = 'Board', tasks, onUpdateTasks }) => {
  const { language, t, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  const [viewMode, _setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGroupOpen, setIsGroupOpen] = useState(true);
  const [zoom, setZoom] = useState(1);

  // --- Helpers ---
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const addDays = (d: Date, days: number) => {
    const result = new Date(d);
    result.setDate(result.getDate() + days);
    return result;
  };

  // --- Timeline Generation ---
  const timelineStart = useMemo(() => {
    const start = getStartOfWeek(new Date(currentDate));
    start.setDate(start.getDate() - 14); // Buffer before
    return start;
  }, [currentDate]);

  const timelineEnd = useMemo(() => {
    const end = new Date(timelineStart);
    end.setDate(end.getDate() + 90); // 90 days view
    return end;
  }, [timelineStart]);

  const days = useMemo(() => {
    const d = [];
    let curr = new Date(timelineStart);
    while (curr <= timelineEnd) {
      d.push(new Date(curr));
      curr = addDays(curr, 1);
    }
    return d;
  }, [timelineStart, timelineEnd]);

  // Dimensions
  const BASE_CELL_WIDTH = viewMode === 'day' ? 40 : viewMode === 'week' ? 40 : 20;
  const CELL_WIDTH = BASE_CELL_WIDTH * zoom;
  const HEADER_HEIGHT = 60; // Taller for double row
  const _ROW_HEIGHT = 36;
  const SIDEBAR_WIDTH = 350;

  // --- Zoom Handlers ---
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.4));

  // --- Task Processing ---
  const processedTasks = useMemo(() => {
    // Use tasks prop instead of rows state
    return (tasks || []).map((row) => {
      // Safe date handling
      let end = row.dueDate ? new Date(row.dueDate) : new Date();
      let start = row.startDate ? new Date(row.startDate) : row.date ? new Date(row.date) : new Date(end); // Fallback to 'date' or end

      if (isNaN(end.getTime())) end = new Date();
      if (isNaN(start.getTime())) {
        start = new Date(end);
        // Default duration if only end date exists
        if (!row.startDate && row.dueDate) {
          start.setDate(end.getDate() - 2);
        }
      } else if (!row.startDate && row.dueDate) {
        // Logic from before: if no start date but due date, assume 2 days
        start.setDate(end.getDate() - 2);
      }

      if (start > end) {
        const temp = start;
        start = end; // Correct order
        end = temp;
      }

      return {
        ...row,
        _start: start,
        _end: end,
      };
    });
  }, [tasks]);

  const handleUpdateTask = (taskId: string, updates: Partial<Row>) => {
    // Use onUpdateTasks prop
    const updatedTasks = tasks.map((r) => (r.id === taskId ? { ...r, ...updates } : r));
    onUpdateTasks(updatedTasks);
  };

  // --- Drag Interaction (Tasks & Panning) ---
  const dragState = useRef<{
    type: 'task' | 'pan';
    taskId?: string;
    element?: HTMLElement;
    startX: number;
    scrollLeft?: number;
    initialStart?: Date;
    initialEnd?: Date;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Task Drag Start
  const handleTaskMouseDown = (e: React.MouseEvent, task: Row) => {
    e.preventDefault();
    e.stopPropagation();
    dragState.current = {
      type: 'task',
      taskId: task.id,
      element: e.currentTarget as HTMLElement,
      startX: e.clientX,
      initialStart: new Date(task._start),
      initialEnd: new Date(task._end),
    };
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Panning Drag Start
  const handlePanMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on empty space (not buttons/interactive elements handled solely largely by stopPropagation, but good to check)
    if (!containerRef.current) return;

    dragState.current = {
      type: 'pan',
      startX: e.clientX,
      scrollLeft: containerRef.current.scrollLeft,
    };
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current) return;

    if (dragState.current.type === 'task') {
      const { startX, element } = dragState.current;
      const diffX = e.clientX - startX;
      if (element) {
        element.style.transform = `translateX(${diffX}px)`;
        element.style.zIndex = '50';
        element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      }
    } else if (dragState.current.type === 'pan') {
      const { startX, scrollLeft } = dragState.current;
      if (containerRef.current && scrollLeft !== undefined) {
        const diffX = e.clientX - startX;
        containerRef.current.scrollLeft = scrollLeft - diffX;
      }
    }
  }, []);

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragState.current) return;

      if (dragState.current.type === 'task') {
        const { taskId, startX, initialStart, initialEnd, element } = dragState.current;
        const diffX = e.clientX - startX;

        // Clean up visual overrides
        if (element) {
          element.style.transform = '';
          element.style.zIndex = '';
          element.style.boxShadow = '';
        }

        // Calculate days delta
        const daysDelta = Math.round(diffX / CELL_WIDTH);

        if (daysDelta !== 0 && initialStart && initialEnd) {
          const newStart = addDays(initialStart, daysDelta);
          const newEnd = addDays(initialEnd, daysDelta);

          const updates = {
            startDate: newStart.toISOString(),
            dueDate: newEnd.toISOString(),
            date: newStart.toISOString(), // Also update the 'date' field if it exists fallback
          };

          // Use the prop function
          handleUpdateTask(taskId!, updates);
        }
      }

      dragState.current = null;
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    },
    [CELL_WIDTH, tasks],
  ); // Removed storageKeyRows dep

  const getPosition = (date: Date) => {
    const diffTime = date.getTime() - timelineStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * CELL_WIDTH;
  };

  // Helper for formatting date range string
  const getWeekRangeString = (d: Date) => {
    // e.g., "Dec 14 - 20"
    const endOfWeek = addDays(d, 6);
    return `${d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} - ${endOfWeek.getDate()}`;
  };

  // Helper to get week number
  const getWeekNumber = (d: Date) => {
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Helper for localized weekday
  const getLocalizedWeekday = (d: Date) => {
    return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2);
  };

  return (
    <div
      className="flex flex-col h-full bg-white dark:bg-monday-dark-surface text-gray-900 dark:text-gray-100 overflow-hidden font-sans"
      dir={dir}
    >
      {/* Toolbar - Matches logic and some style, refined placement */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-monday-dark-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('gantt_today')}
          </button>

          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <button className="px-2 py-1 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex items-center gap-1">
              {t('gantt_week')} <ChevronDown size={12} className="text-gray-400" />
            </button>
          </div>

          <button className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
            {t('gantt_auto_fit')}
          </button>
          <button className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
            <Download size={12} /> {t('export')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
            <Phone size={12} />
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800">
            <ArrowUpDown size={12} /> {t('sort')}
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800">
            <ListFilter size={12} /> {t('filter')}
          </button>
          <button className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800">
            <UserCircle size={12} /> {t('gantt_assignee')}{' '}
            <span className="bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ms-1">
              M
            </span>
          </button>

          <div className="relative">
            <Search size={12} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search') + '...'}
              className="ps-8 pe-3 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {/* Header Row (Sidebar Header + Timeline Header) */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-monday-dark-surface min-h-[60px]">
          {/* Sidebar Header */}
          <div
            className="flex-shrink-0 flex items-center border-e border-gray-200 dark:border-gray-800"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <div className="flex-1 px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center justify-between border-e border-gray-100 dark:border-gray-800 h-full">
              <span>{t('name')}</span>
            </div>
            <div className="w-32 px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center justify-between h-full">
              <span>{t('due_date')}</span>
              <Plus size={14} className="text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>
          </div>

          {/* Timeline Header Track */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex absolute left-0 top-0 h-full" style={{ transform: `translateX(0px)` }}>
              {/* We need to sync scroll here with body. For now, simple standard scroll sync via container. */}
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto custom-scrollbar relative cursor-grab active:cursor-grabbing"
          onMouseDown={handlePanMouseDown}
        >
          <div className="flex flex-col min-w-max">
            {/* Sticky Header Wrapper to maintain z-index context */}
            <div className="sticky top-0 z-30 flex bg-white dark:bg-monday-dark-surface shadow-sm">
              {/* Sidebar Header (Sticky Start + Sticky Top) */}
              <div
                className="sticky start-0 z-40 flex-shrink-0 flex items-center border-e border-gray-200 dark:border-gray-800 bg-white dark:bg-monday-dark-surface border-b border-gray-200 dark:border-gray-800"
                style={{ width: SIDEBAR_WIDTH, height: HEADER_HEIGHT }}
              >
                <div className="flex-1 px-4 text-xs font-medium text-gray-500 border-e border-gray-100 dark:border-gray-800 h-full flex items-center">
                  {t('name')}
                </div>
                <div className="w-32 px-4 text-xs font-medium text-gray-500 h-full flex items-center justify-between">
                  <span>{t('due_date')}</span>
                  <Plus size={16} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                </div>
              </div>

              {/* Timeline Header (Sticky Top) */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                {days.map((d, i) => {
                  // Group by weeks for the top row
                  // For simplicity in this loop, we render per-day, but visuals can simulate grouped headers or we use exact logic
                  const isMonday = d.getDay() === 1;
                  const isFirstDay = i === 0;
                  const isToday = d.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      className="flex-shrink-0 flex flex-col border-e border-gray-100 dark:border-gray-800/50 box-border"
                      style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
                    >
                      {/* Top Row (Week) - Only render on Mondays or first day */}
                      <div className="h-1/2 border-b border-gray-100 dark:border-gray-800/50 w-full relative">
                        {(isMonday || isFirstDay) && (
                          <div className="absolute start-0 top-0 w-max px-2 py-1 text-[10px] font-medium text-gray-500 whitespace-nowrap z-10 flex items-center gap-2">
                            <span className="font-bold text-gray-600 dark:text-gray-400">
                              {t('gantt_week_short')}
                              {getWeekNumber(d)}
                            </span>
                            <span className="text-gray-400">{getWeekRangeString(d)}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row (Day) */}
                      <div className="h-1/2 flex items-center justify-center gap-1 text-[10px]">
                        <span className="text-gray-400">{getLocalizedWeekday(d)}</span>
                        <span
                          className={`
                                                    font-medium w-5 h-5 flex items-center justify-center rounded-full
                                                    ${isToday ? 'bg-red-500 text-white' : 'text-gray-700 dark:text-gray-300'}
                                                `}
                        >
                          {d.getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart Body */}
            <div className="relative flex-1">
              {/* Background Grid Lines (Absolute) */}
              <div className={`absolute inset-0 z-0 ${isRTL ? 'pr-[350px]' : 'pl-[350px]'} flex pointer-events-none`}>
                {days.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={i}
                      className={`
                                                flex-shrink-0 h-full border-e border-gray-100 dark:border-gray-800/30 relative
                                            `}
                      style={{
                        width: CELL_WIDTH,
                        backgroundImage: isWeekend
                          ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.02) 5px, rgba(0,0,0,0.02) 10px)'
                          : 'none',
                      }}
                    >
                      {isToday && (
                        <div
                          className={`absolute ${isRTL ? 'right-1/2' : 'left-1/2'} top-0 bottom-0 w-[1px] bg-red-500 z-10`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Content Rows */}
              <div className="relative z-10">
                {/* Group Header Row */}
                <div className="flex h-10 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  {/* Sidebar Cell */}
                  <div
                    className="sticky start-0 z-20 flex-shrink-0 flex items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-monday-dark-surface border-e border-gray-200 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-monday-dark-elevated"
                    style={{ width: SIDEBAR_WIDTH }}
                  >
                    <div className="flex-1 px-4 flex items-center gap-2 overflow-hidden border-e border-gray-100 dark:border-gray-800 h-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGroupOpen(!isGroupOpen);
                        }}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <ChevronDown
                          size={14}
                          className={`transform transition-transform ${isGroupOpen ? '' : isRTL ? 'rotate-90' : '-rotate-90'}`}
                        />
                      </button>
                      <ListFilter size={14} className="text-gray-400" />
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {boardName}
                      </span>
                    </div>
                    <div className="w-32 px-4 flex items-center h-full">{/* Group meta can go here if needed */}</div>
                  </div>
                  {/* Timeline Empty Space for Group Row */}
                  <div className="flex-1 border-b border-gray-100 dark:border-gray-800"></div>
                </div>

                {/* Task Rows */}
                {isGroupOpen &&
                  processedTasks.map((task) => {
                    const left = getPosition(task._start);
                    const right = getPosition(addDays(task._end, 1));
                    const width = Math.max(right - left - 6, 4);

                    return (
                      <div
                        key={task.id}
                        className="flex h-9 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                      >
                        {/* Sidebar Cells */}
                        <div
                          className="sticky start-0 z-20 flex-shrink-0 flex items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-monday-dark-surface border-e border-gray-200 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-monday-dark-elevated"
                          style={{ width: SIDEBAR_WIDTH }}
                        >
                          <div className="flex-1 px-4 ps-10 flex items-center gap-2 overflow-hidden border-e border-gray-100 dark:border-gray-800 h-full">
                            <span
                              className={`w-2 h-2 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' : task.status === 'In Progress' ? 'bg-amber-500' : 'bg-gray-300'}`}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{task.name}</span>
                          </div>
                          <div className="w-32 px-4 text-xs text-gray-400 h-full flex items-center border-e border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
                              : '-'}
                          </div>
                        </div>

                        {/* Timeline Bar Area */}
                        <div className="flex-1 relative border-b border-gray-100 dark:border-gray-800/50">
                          <div
                            onMouseDown={(e) => handleTaskMouseDown(e, task)}
                            className={`
                                                        absolute top-2 h-5 rounded-sm shadow-sm border border-black/5 dark:border-white/10
                                                        text-[10px] flex items-center px-2 text-white overflow-hidden whitespace-nowrap cursor-grab active:cursor-grabbing hover:brightness-110 transition-all z-10
                                                        ${task.status === 'Done' ? 'bg-emerald-400' : task.status === 'In Progress' ? 'bg-amber-400' : 'bg-indigo-400'}
                                                    `}
                            style={{ [isRTL ? 'right' : 'left']: left + 3, width: width }}
                          >
                            <span className="drop-shadow-sm font-medium opacity-90">{task.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Add Task Row Placeholder */}
                {isGroupOpen && (
                  <div className="flex h-9 group">
                    <div
                      className="sticky start-0 z-20 flex-shrink-0 flex items-center border-b border-transparent bg-white dark:bg-monday-dark-surface border-e border-gray-200 dark:border-gray-800"
                      style={{ width: SIDEBAR_WIDTH }}
                    >
                      <div className="flex-1 px-4 ps-10 flex items-center gap-2 h-full">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm">
                          <Plus size={14} /> {t('gantt_add_task')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 end-6 z-50 flex flex-col bg-white dark:bg-monday-dark-elevated rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            title="Zoom In"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Zoom Out"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
