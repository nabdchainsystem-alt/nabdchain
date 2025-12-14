import React, { useState } from 'react';
import { Task, Note, TaskStatus } from '../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { CheckCircle2, Circle, Clock, Plus, PenLine, ListTodo, StickyNote, Trash2, Calendar, GripVertical } from 'lucide-react';
import { SharedDatePicker } from '../../../components/ui/SharedDatePicker';
import { PortalPopup } from '../../../components/ui/PortalPopup';

interface RightSidebarProps {
  isOpen: boolean;
  tasks: Task[];
  note: Note;
  onUpdateNote: (content: string) => void;
  onAddTask: (content: string) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskDueDate: (taskId: string, date: Date) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  tasks,
  note,
  onUpdateNote,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onUpdateTaskDueDate,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [openDatePicker, setOpenDatePicker] = useState<{ id: string, el: HTMLElement } | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskInput.trim()) {
      onAddTask(newTaskInput);
      setNewTaskInput('');
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'done': return (
        <div className="relative flex items-center justify-center">
          {/* Ambient soft glow */}
          <div className="absolute inset-0 bg-green-400/20 dark:bg-green-500/20 rounded-full blur-[6px]"></div>
          {/* Sharp Icon with high-def drop shadow */}
          <CheckCircle2
            size={16}
            strokeWidth={2.5}
            className="text-green-600 dark:text-green-400 relative z-10 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]"
          />
        </div>
      );
      case 'in_progress': return <Clock size={16} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors" />;
      default: return <Circle size={16} className="text-stone-300 hover:text-stone-500 dark:hover:text-stone-400 transition-colors" />;
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image hack or styling
    e.currentTarget.classList.add('opacity-50');
  };

  const onDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedTaskId(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Essential to allow dropping
  };

  const onDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      onUpdateTaskStatus(draggedTaskId, targetStatus);
    }
  };

  return (
    <div
      className={`
        bg-[#f7f8fa] dark:bg-monday-dark-surface border-s border-gray-200 dark:border-monday-dark-border transition-all duration-300 ease-in-out flex flex-col relative z-30
        ${isOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}
      `}
    >
      {/* Tabs */}
      <div className="flex items-center p-2 gap-2 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium font-sans flex items-center justify-center gap-2 transition-all
            ${activeTab === 'notes'
              ? 'bg-white dark:bg-monday-dark-bg text-monday-blue shadow-sm border border-gray-200 dark:border-monday-dark-border'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover'}
          `}
        >
          <StickyNote size={14} />
          {t('discussion.tabs.notes')}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium font-sans flex items-center justify-center gap-2 transition-all
            ${activeTab === 'tasks'
              ? 'bg-white dark:bg-monday-dark-bg text-monday-blue shadow-sm border border-gray-200 dark:border-monday-dark-border'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-monday-dark-hover'}
          `}
        >
          <ListTodo size={14} />
          {t('discussion.tabs.tasks')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 min-w-[20rem]">
        {activeTab === 'notes' ? (
          <div className="h-full flex flex-col">
            <textarea
              value={note.content}
              onChange={(e) => onUpdateNote(e.target.value)}
              placeholder={t('discussion.start_writing')}
              className="flex-1 w-full bg-transparent border-none focus:ring-0 font-serif text-sm leading-relaxed text-stone-700 dark:text-stone-300 placeholder:text-stone-400/50 resize-none p-0"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Task */}
            <form onSubmit={handleAddTask} className="relative group">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder={t('discussion.tasks.add_task')}
                className="w-full bg-stone-100 dark:bg-stone-800 border-none rounded-lg py-2 ps-3 pe-8 text-sm font-sans focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400 dark:text-stone-200 transition-all"
              />
              <button
                type="submit"
                disabled={!newTaskInput.trim()}
                className="absolute end-1.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-0 transition-all"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Task Lists */}
            {(['todo', 'in_progress', 'done'] as const).map(status => {
              const statusTasks = tasks.filter(t => t.status === status);
              const labelKey = status === 'in_progress' ? 'inProgress' : status;

              return (
                <div
                  key={status}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, status)}
                  className="min-h-[50px] transition-colors rounded-lg"
                >
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 font-sans sticky top-0 bg-[#f7f8fa] dark:bg-monday-dark-surface py-1 z-10">
                    {t(`discussion.tasks.${status}`)} <span className="text-stone-300 font-normal ms-1 text-[10px]">{statusTasks.length}</span>
                  </h3>
                  <div className="space-y-2 pb-4">
                    {statusTasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, task.id)}
                        onDragEnd={onDragEnd}
                        className="group relative flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-all shadow-sm cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => {
                              const next = status === 'todo' ? 'in_progress' : status === 'in_progress' ? 'done' : 'todo';
                              onUpdateTaskStatus(task.id, next);
                            }}
                            className="mt-0.5 hover:scale-110 transition-transform relative z-10"
                          >
                            {getStatusIcon(status)}
                          </button>
                          <span className={`text-sm font-serif text-stone-700 dark:text-stone-300 flex-1 leading-snug ${status === 'done' ? 'line-through text-stone-400 dark:text-stone-600' : ''}`}>
                            {task.content}
                          </span>
                        </div>

                        {/* Task Metadata / Actions */}
                        <div className="flex items-center justify-between ps-7 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span className={`text-[10px] font-sans flex items-center gap-1 ${task.dueDate < new Date() && status !== 'done' ? 'text-red-500' : 'text-stone-400'}`}>
                                <Calendar size={10} />
                                {task.dueDate.toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <button
                                onClick={(e) => setOpenDatePicker(openDatePicker?.id === task.id ? null : { id: task.id, el: e.currentTarget })}
                                className="p-1 text-stone-300 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                                title="Set Due Date"
                              >
                                <Calendar size={12} />
                              </button>
                              {openDatePicker?.id === task.id && (
                                <PortalPopup
                                  triggerRef={{ current: openDatePicker.el } as any}
                                  onClose={() => setOpenDatePicker(null)}
                                  side="left"
                                  align="start"
                                >
                                  <SharedDatePicker
                                    selectedDate={task.dueDate}
                                    onSelectDate={(date) => {
                                      onUpdateTaskDueDate(task.id, date);
                                      setOpenDatePicker(null);
                                    }}
                                    onClose={() => setOpenDatePicker(null)}
                                  />
                                </PortalPopup>
                              )}
                            </div>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {statusTasks.length === 0 && (
                      <div className="text-xs text-stone-300 dark:text-stone-700 italic px-2 py-4 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};