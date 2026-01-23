import React, { useState, useEffect } from 'react';
import { X, CalendarBlank as CalendarIcon, Clock, TextAlignLeft as AlignLeft, Flag, User, CheckCircle as CheckCircle2 } from 'phosphor-react';
import { ITask, Status, Priority } from '../../../types/boardTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../../../../contexts/LanguageContext';

interface CalendarEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<ITask>) => void;
    initialDate?: Date;
    existingTask?: ITask | null;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialDate,
    existingTask
}) => {
    const { t, dir } = useLanguage();
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<Status>(Status.ToDo);
    const [priority, setPriority] = useState<Priority>(Priority.Normal);
    const [date, setDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (existingTask) {
                setTitle(existingTask.name);
                setStatus(existingTask.status);
                setPriority(existingTask.priority);
                setDate(existingTask.dueDate ? existingTask.dueDate.split('T')[0] : '');
            } else {
                setTitle('');
                setStatus(Status.ToDo);
                setPriority(Priority.Normal);
                // Format initialDate as YYYY-MM-DD
                const d = initialDate || new Date();
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                setDate(dateStr);
            }
        }
    }, [isOpen, existingTask, initialDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: existingTask?.id,
            name: title,
            status,
            priority,
            dueDate: date ? new Date(date).toISOString() : new Date().toISOString()
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-end bg-transparent" onClick={onClose}>
                <motion.div
                    initial={{ x: "100%", opacity: 0.5 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0.5 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md h-full bg-white dark:bg-monday-dark-surface shadow-2xl border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0" dir={dir}>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {existingTask ? t('calendar_edit_event') : t('calendar_new_event_title')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto" dir={dir}>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {t('calendar_event_title')}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('calendar_event_placeholder')}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    <CalendarIcon size={12} /> {t('date')}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 dark:text-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    <Flag size={12} /> {t('priority')}
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as Priority)}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 dark:text-gray-200 appearance-none cursor-pointer"
                                >
                                    {Object.values(Priority).map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                <CheckCircle2 size={12} /> {t('status')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(Status).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${status === s
                                            ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-sm'
                                            : 'bg-white dark:bg-monday-dark-surface border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3 mt-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                {t('calendar_cancel')}
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-colors"
                            >
                                {existingTask ? t('calendar_save_changes') : t('calendar_create_event')}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
