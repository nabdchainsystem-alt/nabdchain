import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarBlank as CalendarIcon, CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretUp as ChevronUp, CaretDown as ChevronDown, X } from 'phosphor-react';

interface DateCellProps {
  date: string | null;
  onChange: (date: string | null) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateCell: React.FC<DateCellProps> = ({ date, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Date picker state
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use local parsing for initial date to match how we save it
  const parseDateLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const initialDate = date ? parseDateLocal(date) : today;
  const [viewDate, setViewDate] = useState(initialDate);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setIsOpen(true);
      setViewDate(date ? parseDateLocal(date) : new Date());
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateString = formatDateLocal(selectedDate);
    onChange(dateString);
    setIsOpen(false);
  };

  // Shortcut handlers
  const handleShortcut = (type: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let targetDate = new Date(now);

    switch (type) {
      case 'today':
        // Already set to today
        break;
      case 'later':
        // Later today - set to today with a note that it's for later
        break;
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        break;
      case 'nextWeek':
        // Next Monday
        const daysToMonday = (8 - now.getDay()) % 7 || 7;
        targetDate.setDate(now.getDate() + daysToMonday);
        break;
      case 'nextWeekend':
        // Next Saturday
        const daysToSaturday = (6 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysToSaturday);
        break;
      case '2weeks':
        targetDate.setDate(now.getDate() + 14);
        break;
      case '4weeks':
        targetDate.setDate(now.getDate() + 28);
        break;
      case '8weeks':
        targetDate.setDate(now.getDate() + 56);
        break;
    }

    const dateString = formatDateLocal(targetDate);
    onChange(dateString);
    setIsOpen(false);
  };

  // Get shortcut display values
  const getShortcutInfo = (type: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let targetDate = new Date(now);

    switch (type) {
      case 'today':
        return SHORT_DAY_NAMES[now.getDay()];
      case 'later':
        const laterTime = new Date();
        return laterTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        return SHORT_DAY_NAMES[targetDate.getDay()];
      case 'nextWeek':
        const daysToMonday = (8 - now.getDay()) % 7 || 7;
        targetDate.setDate(now.getDate() + daysToMonday);
        return SHORT_DAY_NAMES[targetDate.getDay()];
      case 'nextWeekend':
        const daysToSaturday = (6 - now.getDay() + 7) % 7 || 7;
        targetDate.setDate(now.getDate() + daysToSaturday);
        return SHORT_DAY_NAMES[targetDate.getDay()];
      case '2weeks':
        targetDate.setDate(now.getDate() + 14);
        return `${targetDate.getDate()} ${MONTH_NAMES[targetDate.getMonth()].slice(0, 3)}`;
      case '4weeks':
        targetDate.setDate(now.getDate() + 28);
        return `${targetDate.getDate()} ${MONTH_NAMES[targetDate.getMonth()].slice(0, 3)}`;
      case '8weeks':
        targetDate.setDate(now.getDate() + 56);
        return `${targetDate.getDate()} ${MONTH_NAMES[targetDate.getMonth()].slice(0, 3)}`;
    }
    return '';
  };

  // Calendar generation logic
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  // Get days from previous month to fill the first row
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

  const days: (number | { day: number; isCurrentMonth: boolean })[] = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Next month days to complete the grid
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const isToday = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return false;
    return day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number, isCurrentMonth: boolean) => {
    if (!date || !isCurrentMonth) return false;
    const d = new Date(date);
    return day === d.getDate() &&
      viewDate.getMonth() === d.getMonth() &&
      viewDate.getFullYear() === d.getFullYear();
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  return (
    <>
      <div
        ref={cellRef}
        onClick={handleOpen}
        className="w-full h-full flex items-center justify-center px-3 text-xs text-gray-500 hover:bg-gray-100 cursor-pointer group relative"
      >
        {date ? (
          <span className="flex items-center gap-2 justify-center w-full font-datetime">
            <CalendarIcon className="w-3 h-3 text-gray-400" />
            {date}
          </span>
        ) : (
          <span className="text-gray-300 group-hover:text-gray-400 flex items-center gap-2 justify-center">
            <CalendarIcon className="w-3 h-3 opacity-0 group-hover:opacity-100" />
            Set Date
          </span>
        )}

        {date && (
          <div
            className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            <X className="w-3 h-3 text-gray-500" />
          </div>
        )}
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-100 font-sans overflow-hidden flex"
            style={{
              top: coords.top + 8,
              left: Math.min(coords.left - 150, window.innerWidth - 520),
              width: '480px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Sidebar - Shortcuts */}
            <div className="w-[180px] border-r border-gray-100 dark:border-gray-800 py-3 flex flex-col bg-white dark:bg-gray-900">
              <div className="flex-1 overflow-y-auto">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'later', label: 'Later' },
                  { key: 'tomorrow', label: 'Tomorrow' },
                  { key: 'nextWeek', label: 'Next week' },
                  { key: 'nextWeekend', label: 'Next weekend' },
                  { key: '2weeks', label: '2 weeks' },
                  { key: '4weeks', label: '4 weeks' },
                  { key: '8weeks', label: '8 weeks' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleShortcut(key)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{getShortcutInfo(key)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side - Calendar */}
            <div className="flex-1 p-4 bg-white dark:bg-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-base">
                  {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToToday}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
                  >
                    Today
                  </button>
                  <div className="flex flex-col">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 mb-2">
                {SHORT_DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs text-gray-400 dark:text-gray-500 font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((dayInfo, idx) => {
                  const day = typeof dayInfo === 'number' ? dayInfo : dayInfo.day;
                  const isCurrentMonth = typeof dayInfo === 'number' ? true : dayInfo.isCurrentMonth;

                  return (
                    <div key={idx} className="aspect-square flex items-center justify-center">
                      <button
                        onClick={() => isCurrentMonth && handleDateSelect(day)}
                        disabled={!isCurrentMonth}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors
                          ${isSelected(day, isCurrentMonth) ? 'bg-blue-500 text-white' : ''}
                          ${!isSelected(day, isCurrentMonth) && isToday(day, isCurrentMonth) ? 'text-blue-600 font-bold' : ''}
                          ${!isSelected(day, isCurrentMonth) && !isToday(day, isCurrentMonth) && isCurrentMonth ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                          ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600 cursor-default' : 'cursor-pointer'}
                        `}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};