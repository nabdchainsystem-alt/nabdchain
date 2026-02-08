import React, { useState } from 'react';
import { CaretLeft, CaretRight } from 'phosphor-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface SharedDatePickerProps {
  onSelectDate?: (date: Date) => void;
  onSelectRange?: (start: Date | null, end: Date | null) => void;
  onClose: () => void;
  selectedDate?: Date | string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  mode?: 'single' | 'range';
  onClear?: () => void;
}

export const SharedDatePicker: React.FC<SharedDatePickerProps> = ({
  onSelectDate,
  onSelectRange,
  onClose,
  selectedDate,
  startDate,
  endDate,
  mode = 'single',
  onClear,
}) => {
  const { t, language } = useLanguage();
  // Initialize current month based on selection or today
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (mode === 'single' && selectedDate) return new Date(selectedDate);
    if (mode === 'range' && startDate) return new Date(startDate);
    return new Date();
  });

  // Local state for range selection
  const [rangeStart, setRangeStart] = useState<Date | null>(startDate ? new Date(startDate) : null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(endDate ? new Date(endDate) : null);
  const [_hoverDate, setHoverDate] = useState<Date | null>(null);

  const _handleClose = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onClose();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const calendar = [];

    // Padding
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }

    // Days
    for (let i = 1; i <= days; i++) {
      calendar.push(i);
    }

    return calendar;
  };

  const handleDateClick = (date: Date) => {
    if (mode === 'single') {
      onSelectDate?.(date);
      onClose();
    } else {
      // Range Mode logic
      if (!rangeStart || (rangeStart && rangeEnd)) {
        // Start new range
        setRangeStart(date);
        setRangeEnd(null);
        onSelectRange?.(date, null);
      } else {
        // Complete range
        let start = rangeStart;
        let end = date;
        if (date < start) {
          start = date;
          end = rangeStart;
        }
        setRangeStart(start);
        setRangeEnd(end);
        onSelectRange?.(start, end);
        // Don't close immediately in range mode? Usually nicer to see selection.
        // But user wants quick action. Maybe close after short delay or require "Done"?
        // Let's close on "Done" button or immediately if standard behavior.
        // Given the image shows "Save" or "Done", let's wait for user to click Done.
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    return date > rangeStart && date < rangeEnd;
  };

  const isDateSelected = (date: Date) => {
    if (mode === 'single') {
      return selectedDate ? new Date(selectedDate).toDateString() === date.toDateString() : false;
    }
    return (
      (rangeStart && rangeStart.toDateString() === date.toDateString()) ||
      (rangeEnd && rangeEnd.toDateString() === date.toDateString())
    );
  };

  const handleShortcut = (type: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetStart = new Date(today);
    let targetEnd: Date | null = null;

    switch (type) {
      case 'today':
        break;
      case 'later':
        break;
      case 'tomorrow':
        targetStart.setDate(today.getDate() + 1);
        break;
      case 'nextWeek':
        // eslint-disable-next-line no-case-declarations
        const daysToMon = (8 - today.getDay()) % 7 || 7;
        targetStart.setDate(today.getDate() + daysToMon);
        break;
      case 'nextWeekend':
        // eslint-disable-next-line no-case-declarations
        const daysToSat = (6 - today.getDay() + 7) % 7 || 7;
        targetStart.setDate(today.getDate() + daysToSat);
        break;
      case '2weeks':
        targetStart.setDate(today.getDate() + 14);
        break;
      case '4weeks':
        targetStart.setDate(today.getDate() + 28);
        break;
      case '8weeks':
        targetStart.setDate(today.getDate() + 56);
        break;
      case 'oneWeek':
        targetEnd = new Date(today);
        targetEnd.setDate(today.getDate() + 7);
        break;
    }

    if (mode === 'single') {
      onSelectDate?.(targetStart);
      onClose();
    } else {
      if (targetEnd) {
        setRangeStart(targetStart);
        setRangeEnd(targetEnd);
        onSelectRange?.(targetStart, targetEnd);
      } else {
        setRangeStart(targetStart);
        setRangeEnd(null);
        onSelectRange?.(targetStart, null);
      }
    }
  };

  const getShortcutLabel = (type: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(now);
    const dayNames =
      language === 'ar'
        ? ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames =
      language === 'ar'
        ? [
            'يناير',
            'فبراير',
            'مارس',
            'أبريل',
            'مايو',
            'يونيو',
            'يوليو',
            'أغسطس',
            'سبتمبر',
            'أكتوبر',
            'نوفمبر',
            'ديسمبر',
          ]
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (type) {
      case 'today':
        return dayNames[now.getDay()];
      case 'later':
        // eslint-disable-next-line no-case-declarations
        const laterTime = new Date();
        return laterTime
          .toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .toLowerCase();
      case 'tomorrow':
        targetDate.setDate(now.getDate() + 1);
        return dayNames[targetDate.getDay()];
      case 'nextWeek':
        return language === 'ar' ? 'إثنين' : 'Mon';
      case 'nextWeekend':
        return language === 'ar' ? 'سبت' : 'Sat';
      case '2weeks':
        targetDate.setDate(now.getDate() + 14);
        return `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
      case '4weeks':
        targetDate.setDate(now.getDate() + 28);
        return `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
      case '8weeks':
        targetDate.setDate(now.getDate() + 56);
        return `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
    }
    return '';
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const goToToday = () => setCurrentMonth(new Date());
  const weekDays =
    language === 'ar' ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const shortcuts = [
    { key: 'today', label: t('shortcut_today') },
    { key: 'later', label: t('shortcut_later') },
    { key: 'tomorrow', label: t('shortcut_tomorrow') },
    { key: 'nextWeek', label: t('shortcut_next_week') },
    { key: 'nextWeekend', label: t('shortcut_next_weekend') },
    { key: '2weeks', label: t('shortcut_2_weeks') },
    { key: '4weeks', label: t('shortcut_4_weeks') },
    { key: '8weeks', label: t('shortcut_8_weeks') },
  ];

  return (
    <div
      className="bg-white dark:bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800 rounded-lg flex overflow-hidden w-[280px] text-stone-800 dark:text-stone-200 font-sans"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Shortcuts - Hidden on small calendars, shown as compact row */}
      <div className="hidden">
        {shortcuts.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleShortcut(key)}
            className="flex items-center justify-between px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <span className="font-medium">{label}</span>
            <span className="text-stone-400 dark:text-stone-500 text-[10px] ms-2">{getShortcutLabel(key)}</span>
          </button>
        ))}
      </div>

      {/* Main Calendar */}
      <div className="flex-1 p-3 bg-white dark:bg-stone-900 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-800 dark:text-stone-200 text-sm font-datetime">
            {currentMonth.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                goToToday();
              }}
              className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded transition-colors"
            >
              {t('calendar_today')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prevMonth();
              }}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              {language === 'ar' ? <CaretRight size={14} /> : <CaretLeft size={14} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextMonth();
              }}
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              {language === 'ar' ? <CaretLeft size={14} /> : <CaretRight size={14} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {weekDays.map((d) => (
            <span key={d} className="text-[10px] text-stone-400 font-medium">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {generateCalendar().map((day, idx) => {
            if (!day) return <div key={idx} className="w-8 h-8" />;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = new Date().toDateString() === date.toDateString();
            const selected = isDateSelected(date);
            const inRange = mode === 'range' && isDateInRange(date);

            let bgClass = '';
            if (selected) bgClass = 'bg-blue-500 text-white';
            else if (inRange) bgClass = 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            else if (isToday) bgClass = 'border-2 border-blue-500 text-blue-600 font-bold';
            else bgClass = 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300';

            return (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateClick(date);
                }}
                onMouseEnter={() => setHoverDate(date)}
                className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors ${bgClass}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-2 pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
              onClear?.();
              onClose();
            }}
            className="text-[11px] font-medium text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
          >
            {t('clear')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-medium px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm hover:shadow transition-all"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
};
