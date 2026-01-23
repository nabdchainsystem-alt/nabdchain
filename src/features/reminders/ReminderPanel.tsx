import React, { useState } from 'react';
import { Bell, Trash as Trash2 } from 'phosphor-react';
import { ReminderKind, ReminderRecord, ReminderStatus } from './reminderStore';

const ReminderStatusChip: React.FC<{ status: ReminderStatus }> = ({ status }) => {
  const tones: Record<ReminderStatus, string> = {
    scheduled: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100',
    triggered: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100',
    dismissed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
  };
  const labels: Record<ReminderStatus, string> = {
    scheduled: 'مجدول',
    triggered: 'مُشغَّل',
    dismissed: 'تم التجاهل'
  };
  return (
    <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${tones[status]}`}>
      {labels[status]}
    </span>
  );
};

interface ReminderPanelProps {
  itemId: string;
  itemTitle?: string;
  reminders: ReminderRecord[];
  onAdd: (remindAt: string, kind: ReminderKind, label?: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ReminderStatus) => void;
}

export const ReminderPanel: React.FC<ReminderPanelProps> = ({
  itemId: _itemId,
  itemTitle,
  reminders,
  onAdd,
  onDelete,
  onUpdateStatus
}) => {
  const [customDateTime, setCustomDateTime] = useState('');
  const quickRelative = [
    { label: 'بعد ساعة', minutes: 60 },
    { label: 'لاحقاً اليوم', minutes: 3 * 60 },
    { label: 'غداً', minutes: 24 * 60 },
    { label: 'الأسبوع القادم', minutes: 7 * 24 * 60 },
  ];

  const handleAddRelative = (minutes: number, label: string) => {
    const remindAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    onAdd(remindAt, 'relative', label);
  };

  const handleAddAbsolute = () => {
    if (!customDateTime) return;
    const ts = new Date(customDateTime);
    if (isNaN(ts.getTime())) return;
    onAdd(ts.toISOString(), 'absolute', undefined);
    setCustomDateTime('');
  };

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-80 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">التذكيرات</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            مُخزّنة على هذا العنصر. الإشعارات معطّلة حالياً.
          </p>
        </div>
        <Bell size={16} className="text-stone-400" />
      </div>

      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {reminders.length === 0 ? (
          <p className="text-xs text-stone-500">لا توجد تذكيرات بعد لـ "{itemTitle || 'هذا العنصر'}".</p>
        ) : reminders.map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-stone-100 dark:border-stone-800">
            <div className="min-w-0">
              <div className="text-sm text-stone-800 dark:text-stone-100 truncate font-datetime">
                {reminder.relativeLabel || formatDateTime(reminder.remindAt)}
              </div>
              <div className="text-[11px] text-stone-500 truncate font-datetime">
                {formatDateTime(reminder.remindAt)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ReminderStatusChip status={reminder.status} />
              {reminder.status !== 'dismissed' && (
                <button
                  onClick={() => onUpdateStatus(reminder.id, reminder.status === 'triggered' ? 'dismissed' : 'triggered')}
                  className="px-2 py-1 text-[11px] rounded bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                >
                  {reminder.status === 'triggered' ? 'تجاهل' : 'تشغيل الآن'}
                </button>
              )}
              <button
                onClick={() => onDelete(reminder.id)}
                className="p-1 text-stone-400 hover:text-rose-500"
                title="إزالة التذكير"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-200 dark:border-stone-800 pt-2">
        <p className="text-[11px] font-semibold text-stone-500 mb-2">تذكير سريع</p>
        <div className="flex flex-wrap gap-2">
          {quickRelative.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleAddRelative(opt.minutes, opt.label)}
              className="px-2.5 py-1 text-[12px] rounded-full border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 dark:border-stone-800 pt-2 space-y-2">
        <p className="text-[11px] font-semibold text-stone-500">وقت محدد</p>
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={customDateTime}
            onChange={(e) => setCustomDateTime(e.target.value)}
            className="flex-1 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-700 dark:text-stone-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={handleAddAbsolute}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled={!customDateTime}
          >
            حفظ
          </button>
        </div>
      </div>

      <div className="text-[11px] text-stone-500">
        التذكيرات تبقى مع هذا العنصر؛ سيتم التسليم عند تفعيل الإشعارات.
      </div>
    </div>
  );
};
