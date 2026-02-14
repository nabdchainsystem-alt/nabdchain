import React, { useState, useRef, useEffect } from 'react';
import { CaretLeft, CaretRight, CalendarBlank } from 'phosphor-react';
import { usePortal } from '../context/PortalContext';

interface PortalDatePickerProps {
  value?: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

export const PortalDatePicker: React.FC<PortalDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  minDate,
  maxDate,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { styles, direction, t } = usePortal();
  const isRtl = direction === 'rtl';
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const calendar: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      calendar.push(null);
    }
    for (let i = 1; i <= days; i++) {
      calendar.push(i);
    }
    return calendar;
  };

  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isoDate = toLocalDateStr(date);

    // Check min/max constraints
    if (minDate && isoDate < minDate) return;
    if (maxDate && isoDate > maxDate) return;

    onChange(isoDate);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isoDate = toLocalDateStr(date);
    if (minDate && isoDate < minDate) return true;
    if (maxDate && isoDate > maxDate) return true;
    return false;
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const weekDays = isRtl ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthNames = isRtl
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-lg border text-sm outline-none flex items-center gap-2 w-full transition-colors"
        style={{
          borderColor: isOpen ? styles.info : styles.border,
          backgroundColor: styles.bgPrimary,
          color: value ? styles.textPrimary : styles.textMuted,
        }}
      >
        <CalendarBlank size={16} style={{ color: styles.textMuted }} />
        <span className="flex-1 text-left">{value ? formatDisplayDate(value) : placeholder}</span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 rounded-xl border shadow-lg overflow-hidden"
          style={{
            backgroundColor: styles.bgCard,
            borderColor: styles.border,
            width: '280px',
            [isRtl ? 'right' : 'left']: 0,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: styles.border }}>
            <button
              type="button"
              onClick={isRtl ? nextMonth : prevMonth}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <span className="font-medium text-sm" style={{ color: styles.textPrimary }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={isRtl ? prevMonth : nextMonth}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.bgHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium"
                  style={{ color: styles.textMuted }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendar().map((day, idx) => {
                if (!day) {
                  return <div key={idx} className="h-8" />;
                }

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isoDate = toLocalDateStr(date);
                const isSelected = value === isoDate;
                const isToday = date.toDateString() === today.toDateString();
                const disabled = isDateDisabled(day);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !disabled && handleDateClick(day)}
                    disabled={disabled}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-sm transition-all"
                    style={{
                      backgroundColor: isSelected ? styles.info : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : disabled
                          ? styles.textMuted
                          : isToday
                            ? styles.info
                            : styles.textPrimary,
                      fontWeight: isToday || isSelected ? 600 : 400,
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: isToday && !isSelected ? `2px solid ${styles.info}` : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !disabled) {
                        e.currentTarget.style.backgroundColor = styles.bgHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !disabled) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: styles.border }}>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(new Date());
              }}
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{ color: styles.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.bgHover;
                e.currentTarget.style.color = styles.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = styles.textMuted;
              }}
            >
              {isRtl ? 'اليوم' : 'Today'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-medium px-2 py-1 rounded transition-colors"
                style={{ color: styles.error }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {isRtl ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalDatePicker;
