/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
// ... imports ...

// Helper Adapter
const EnhancedDatePicker = ({ _startDate, dueDate, onUpdate, onClose }: any) => {
  // Adapter that uses SharedDatePicker but respects expected props.
  // For now, it only edits Due Date as SharedDatePicker is single-select.
  return (
    <SharedDatePicker
      selectedDate={dueDate}
      onSelectDate={(date) => onUpdate({ dueDate: date.toISOString() })}
      onClose={onClose}
      onClear={() => onUpdate({ dueDate: null })}
    />
  );
};

// ... existing code ...

import { createPortal } from 'react-dom';
import {
  MagnifyingGlass as Search,
  Columns as Columns3,
  Plus,
  CaretDown as ChevronDown,
  DotsThree as MoreHorizontal,
  Pencil,
  Gear as Settings,
  EyeSlash as EyeOff,
  Checks as CheckCheck,
  CaretDoubleUp as ChevronsUp,
  Lightning as Zap,
  CaretUp as ChevronUp,
  MagicWand as Wand2,
  Users,
  CalendarBlank as Calendar,
  Flag,
  Tag,
  ArrowBendDownLeft as CornerDownLeft,
  Circle,
  DotsSixVertical as GripVertical,
  CheckCircle as CheckCircle2,
  Link,
  Copy,
  ArrowSquareOut as ExternalLink,
  Trash as Trash2,
  X,
  ArrowsOut as Maximize2,
  ShareNetwork as Share2,
  Play,
  Clock,
  GitFork,
  FileText,
  Paperclip,
  Bell,
  Funnel as Filter,
  Smiley as Smile,
  At as AtSign,
  Microphone as Mic,
  PaperPlaneTilt as Send,
  CaretRight as ChevronRight,
  Layout,
  CalendarPlus,
  Prohibit as Ban,
  ArrowUp,
  ArrowDown,
} from 'phosphor-react';
import { SharedDatePicker } from '../../../../components/ui/SharedDatePicker'; // Import source directly
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { ColumnMenu } from '../../components/ColumnMenu';
import { generateSubtasks } from '../../../../services/geminiService';
import { PlusIcon } from '../ListBoard/ListBoardIcons';
import { ColumnContextMenu } from '../../components/ColumnContextMenu';
import { StatusCell } from '../ListBoard/components/cells/StatusCell';
import { PriorityCell } from '../ListBoard/components/cells/PriorityCell';
import { useAppContext } from '../../../../contexts/AppContext';
import { PersonCell } from '../ListBoard/components/cells/PersonCell';
import { LongTextCell } from '../ListBoard/components/cells/LongTextCell';
import { DropdownCell } from '../ListBoard/components/cells/DropdownCell';
import { boardLogger } from '../../../../utils/logger';

// ----------------------------------------------------------------------
// 1. TYPES & CONSTANTS
// ----------------------------------------------------------------------

export enum Priority {
  NONE = 'None',
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  assignees: User[];
  dueDate?: string;
  startDate?: string;
  priority: Priority;
  tags: string[];
  subtasks: Task[];
  isExpanded: boolean;
  parentId?: string;
  selected?: boolean;
  customValues?: Record<string, any>;
}

export interface CustomColumn {
  id: string;
  title: string;
  type: string;
  width: number;
  options?: { id: string; label: string; color: string }[];
  currency?: string;
}

export interface StatusColumn {
  id: string;
  title: string;
  color: string;
  isSystem?: boolean;
  isCollapsed?: boolean;
}

const MOCK_USER: User = { id: '1', name: 'Mike Dev', avatar: '', initials: 'MD', color: '#8b5cf6' };
const _MOCK_USER_2: User = { id: '2', name: 'Sarah Lee', avatar: '', initials: 'SL', color: '#10b981' };

const INITIAL_STATUSES: StatusColumn[] = [
  { id: 'To Do', title: 'To Do', color: '#94a3b8', isCollapsed: false },
  { id: 'In Progress', title: 'In Progress', color: '#3b82f6', isCollapsed: false },
  { id: 'Done', title: 'Done', color: '#22c55e', isCollapsed: false },
];

const STATUS_COLORS = ['#9ca3af', '#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#ec4899', '#f97316'];

// --- Modified Lists Component to accept roomId ---
interface ListsProps {
  roomId: string;
  viewId?: string;
}

// ----------------------------------------------------------------------
// 2. SERVICES
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 3. UI HELPER COMPONENTS
// ----------------------------------------------------------------------

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    icon: 'bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded',
  };
  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2',
  };
  const appliedSize = variant === 'icon' ? '' : sizes[size];
  return (
    <button className={`${baseStyle} ${variants[variant]} ${appliedSize} ${className}`} {...props}>
      {children}
    </button>
  );
};

const _Avatar: React.FC<{ user?: User; size?: number; className?: string }> = ({ user, size = 24, className = '' }) => {
  if (!user) {
    return (
      <div
        className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-400 ${className}`}
        style={{ width: size, height: size }}
      >
        <Users className="w-3/5 h-3/5" />
      </div>
    );
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white ${className}`}
      style={{ width: size, height: size, backgroundColor: user.color }}
      title={user.name}
    >
      {user.initials}
    </div>
  );
};

const StatusBadge: React.FC<{
  id: string;
  title: string;
  color: string;
  onUpdate: (id: string, t: string, c: string) => void;
}> = ({ id, title, color, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempColor, setTempColor] = useState(color);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, tempTitle, tempColor]);

  const handleSave = () => {
    if (tempTitle.trim()) onUpdate(id, tempTitle, tempColor);
    else setTempTitle(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        ref={containerRef}
        className="relative z-50 flex items-center gap-2 bg-white p-1 rounded shadow-lg border border-gray-200"
      >
        <div className="flex gap-1">
          {STATUS_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setTempColor(c)}
              className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${tempColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="h-4 w-px bg-gray-200 mx-1"></div>
        <input
          ref={inputRef}
          type="text"
          className="text-xs font-semibold text-gray-700 outline-none w-24"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>
    );
  }
  return (
    <div
      onClick={() => setIsEditing(true)}
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity select-none"
      style={{ backgroundColor: color }}
    >
      <span className="uppercase">{title}</span>
    </div>
  );
};

const PriorityPicker: React.FC<{ priority: Priority; onSelect: (p: Priority) => void; onClose: () => void }> = ({
  priority,
  onSelect,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const options = [
    { value: Priority.URGENT, label: 'Urgent', color: 'text-red-500', icon: Flag },
    { value: Priority.HIGH, label: 'High', color: 'text-yellow-500', icon: Flag },
    { value: Priority.NORMAL, label: 'Normal', color: 'text-blue-500', icon: Flag },
    { value: Priority.LOW, label: 'Low', color: 'text-gray-400', icon: Flag },
    { value: Priority.NONE, label: 'Clear', color: 'text-gray-400', icon: Ban },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 z-[100] w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right rtl:origin-top-left"
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">Task Priority</div>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="w-full text-start px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm transition-colors"
        >
          <opt.icon className={`w-4 h-4 ${opt.color} fill-current`} />
          <span className="text-gray-700">{opt.label}</span>
          {priority === opt.value && <CheckCheck className="w-3.5 h-3.5 ml-auto text-blue-600" />}
        </button>
      ))}
    </div>
  );
};

const TagPicker: React.FC<{ tags: string[]; onUpdate: (tags: string[]) => void; onClose: () => void }> = ({
  tags,
  onUpdate,
  onClose,
}) => {
  const { t } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      if (!tags.includes(inputValue.trim())) {
        onUpdate([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onUpdate(tags.filter((t) => t !== tag));
    } else {
      onUpdate([...tags, tag]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-1 z-[100] w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-2 origin-top-right rtl:origin-top-left"
    >
      <div className="px-3">
        <input
          autoFocus
          type="text"
          placeholder={t('search_or_create_tag')}
          className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-purple-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {tags.length > 0 && (
        <div className="px-3 border-t border-gray-100 pt-2">
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Selected</div>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded gap-1"
              >
                <span>{tag}</span>
                <button onClick={() => toggleTag(tag)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NewStatusInput: React.FC<{ onAdd: (t: string, c: string) => void; onCancel: () => void }> = ({
  onAdd,
  onCancel,
}) => {
  const { t } = useAppContext();
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-6 h-6 rounded-md shadow-sm border border-gray-200 transition-transform active:scale-95"
          style={{ backgroundColor: selectedColor }}
        ></button>
        {showColorPicker && (
          <div className="absolute top-8 left-0 z-50 bg-white p-2 rounded-lg shadow-xl border border-gray-200 grid grid-cols-5 gap-1 w-[120px]">
            {STATUS_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSelectedColor(c);
                  setShowColorPicker(false);
                }}
                className="w-4 h-4 rounded hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="relative flex-1">
        <input
          autoFocus
          type="text"
          className="w-full h-8 px-3 rounded-md border-2 border-purple-500 shadow-sm focus:outline-none text-sm"
          placeholder={t('status_name')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) onAdd(title, selectedColor);
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-2">
        {t('cancel')}
      </button>
      <button
        onClick={() => title.trim() && onAdd(title, selectedColor)}
        disabled={!title.trim()}
        className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        {t('save')}
      </button>
    </div>
  );
};

const TaskInput: React.FC<{
  parentId?: string;
  onSave: (title: string, subtasks?: string[]) => void;
  onCancel: () => void;
  isSubtask?: boolean;
  className?: string;
  statusColor?: string;
}> = ({ onSave, onCancel, className = '', statusColor = '#d1d5db' }) => {
  const { t } = useAppContext();
  const [title, setTitle] = useState('');
  const [_isGenerating, _setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      <div className="shrink-0 pl-1 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full border-[3px]" style={{ borderColor: statusColor }}></div>
      </div>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400 h-8 bg-transparent"
        placeholder={t('task_name_or_commands')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (title.trim()) {
              onSave(title);
              setTitle('');
            }
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div> Task
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-1">
          <Button variant="icon" size="sm">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="icon" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
          <Button variant="icon" size="sm">
            <Flag className="w-4 h-4" />
          </Button>
          <Button variant="icon" size="sm">
            <Tag className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100 sm:border-none sm:pl-0">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (title.trim()) {
                onSave(title);
                setTitle('');
              }
            }}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7b68ee] hover:bg-[#6c5ce7] text-white text-sm font-medium rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskRow: React.FC<{
  task: Task;
  level: number;
  statusColor?: string;
  onToggleExpand: (id: string) => void;
  onAddSubtask: (id: string) => void;
  onGenerateSubtasks: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
  onTaskClick: (task: Task) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  dragOverPosition: 'top' | 'bottom' | null;
}> = ({
  task,
  level,
  _statusColor = '#d1d5db',
  onToggleExpand,
  onAddSubtask,
  onGenerateSubtasks,
  onDelete,
  onSelect,
  onTaskClick,
  onUpdate,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverPosition,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const [showTagPicker, setShowTagPicker] = useState(false);
  const [activeDateCol, setActiveDateCol] = useState<string | null>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const customDateRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const paddingLeft = (level + 1) * 24;
  const isCompleted = task.status === 'done';

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.URGENT:
        return 'text-red-500 fill-red-500';
      case Priority.HIGH:
        return 'text-yellow-500 fill-yellow-500';
      case Priority.NORMAL:
        return 'text-blue-500 fill-blue-500';
      case Priority.LOW:
        return 'text-gray-400 fill-gray-400';
      default:
        return 'text-gray-300';
    }
  };

  const formatDateRange = () => {
    if (!task.startDate && !task.dueDate) return null;
    const start = task.startDate ? new Date(task.startDate) : null;
    const due = task.dueDate ? new Date(task.dueDate) : null;

    if (start && due) {
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    if (due) return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (start) return `Start: ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    return null;
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDrop={(e) => onDrop(e, task.id)}
      className="group flex items-center min-h-[40px] border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm relative cursor-default"
    >
      {dragOverPosition && (
        <div
          className={`absolute left-0 right-0 h-[2px] bg-black z-50 pointer-events-none ${dragOverPosition === 'top' ? 'top-0' : 'bottom-0'}`}
        >
          <div className="absolute left-0 w-1.5 h-1.5 bg-black rounded-full -translate-x-1/2 -translate-y-[1px]"></div>
        </div>
      )}
      <div
        className="flex items-center shrink-0 h-full relative"
        style={{ paddingLeft: `${paddingLeft}px`, width: `${paddingLeft + 30}px` }}
      >
        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6">
          <div
            className={`opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 ${task.selected ? 'hidden' : ''}`}
          >
            <GripVertical className="w-3 h-3" />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(task.id);
            }}
            className={`absolute inset-0 flex items-center justify-center cursor-pointer ${task.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 bg-white/80'}`}
          >
            <div
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${task.selected ? 'bg-purple-600 border-purple-600' : 'border-gray-400 hover:border-gray-600'}`}
            >
              {task.selected && <div className="w-2 h-0.5 bg-white"></div>}
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggleExpand(task.id)}
          className={`p-0.5 rounded hover:bg-gray-200 text-gray-400 transition-opacity ml-auto ${hasSubtasks ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {task.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>
      <div className="flex items-center flex-1 py-2 pr-4">
        <div className="shrink-0 flex items-center justify-center w-6 mr-2 cursor-pointer text-gray-300 hover:text-green-500 transition-colors">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-50" />
          ) : (
            <Circle className="w-4 h-4 text-gray-300 hover:text-green-500" strokeWidth={2} />
          )}
        </div>
        <div className="flex-1 flex items-center min-w-0 mr-4">
          <span
            onClick={() => onTaskClick(task)}
            className={`truncate font-normal cursor-pointer ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}
          >
            {task.title}
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
            <button
              onClick={() => onAddSubtask(task.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded px-1.5 py-0.5 whitespace-nowrap"
            >
              <Plus className="w-3 h-3" /> Subtask
            </button>
            <button
              onClick={() => onGenerateSubtasks(task.id)}
              className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-white border border-purple-200 rounded px-1.5 py-0.5 whitespace-nowrap"
            >
              <Wand2 className="w-3 h-3" /> AI Subtasks
            </button>
          </div>
        </div>
      </div>

      <div className="w-24 shrink-0 flex items-center pl-2 group/tags relative">
        <button
          onClick={() => setShowTagPicker(!showTagPicker)}
          className="flex items-center gap-1 group-hover/tags:bg-gray-100 p-1 rounded transition-colors overflow-hidden"
        >
          {task.tags.length > 0 ? (
            <div className="flex gap-1 overflow-hidden">
              {task.tags.slice(0, 2).map((tag, i) => (
                <div
                  key={i}
                  className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap"
                >
                  {tag}
                </div>
              ))}
              {task.tags.length > 2 && (
                <div className="bg-gray-100 text-gray-500 text-[10px] px-1 py-0.5 rounded font-medium">
                  +{task.tags.length - 2}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-300 group-hover/tags:text-gray-500 transition-colors">
              <Tag className="w-4 h-4" />
            </div>
          )}
        </button>
        {showTagPicker && (
          <TagPicker
            tags={task.tags}
            onUpdate={(newTags) => {
              onUpdate(task.id, { tags: newTags });
            }}
            onClose={() => setShowTagPicker(false)}
          />
        )}
      </div>

      <div className="w-36 shrink-0 flex items-center pl-2 group/date relative">
        <button
          ref={dateBtnRef}
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`hover:bg-gray-100 p-1 rounded transition-colors flex items-center gap-2 text-xs ${task.dueDate || task.startDate ? 'text-gray-600' : 'text-gray-300 group-hover/date:text-gray-500'}`}
        >
          <CalendarPlus className={`w-4 h-4 ${task.dueDate || task.startDate ? 'text-gray-500' : ''}`} />
          {formatDateRange() && <span className="font-datetime">{formatDateRange()}</span>}
        </button>
        {showDatePicker && (
          <PortalPopup triggerRef={dateBtnRef} onClose={() => setShowDatePicker(false)}>
            <EnhancedDatePicker
              startDate={task.startDate}
              dueDate={task.dueDate}
              onUpdate={(updates) => onUpdate(task.id, updates)}
              onClose={() => setShowDatePicker(false)}
            />
          </PortalPopup>
        )}
      </div>
      <div className="w-24 shrink-0 flex items-center pl-2 group/priority relative">
        <button
          onClick={() => setShowPriorityPicker(!showPriorityPicker)}
          className={`hover:bg-gray-100 p-1 rounded transition-colors ${getPriorityColor(task.priority)} ${task.priority === Priority.NONE ? 'group-hover/priority:text-gray-500' : ''}`}
        >
          <Flag className="w-4 h-4" />
        </button>
        {showPriorityPicker && (
          <PriorityPicker
            priority={task.priority}
            onSelect={(p) => {
              onUpdate(task.id, { priority: p });
              setShowPriorityPicker(false);
            }}
            onClose={() => setShowPriorityPicker(false)}
          />
        )}
      </div>

      {/* Dynamic Custom Columns Cells */}
      {(window as any).extraColumns &&
        (window as any).extraColumns.map((col: CustomColumn) => {
          const val = task.customValues?.[col.id];
          const updateVal = (v: any) => onUpdate(task.id, { customValues: { ...task.customValues, [col.id]: v } });

          return (
            <div
              key={col.id}
              className="shrink-0 flex items-center justify-center border-l border-gray-100 h-full"
              style={{ width: `${col.width}px` }}
            >
              <div className="w-full h-full">
                {(() => {
                  switch (col.type) {
                    case 'status':
                      return <StatusCell status={val} onChange={updateVal} />;
                    case 'priority':
                      return <PriorityCell priority={val} onChange={updateVal} />;
                    case 'people':
                      return <PersonCell personId={val} onChange={updateVal} />;
                    case 'select':
                    case 'dropdown':
                      return <DropdownCell options={col.options} value={val} onChange={updateVal} />;
                    case 'text':
                    case 'number':
                      return <LongTextCell value={val} onChange={updateVal} />;
                    case 'date':
                      return (
                        <div className="relative w-full h-full flex items-center pl-2 group/date-custom">
                          <button
                            ref={(el) => {
                              if (el) customDateRefs.current[col.id] = el;
                            }}
                            onClick={() => setActiveDateCol(activeDateCol === col.id ? null : col.id)}
                            className={`hover:bg-gray-100 p-1 rounded transition-colors flex items-center gap-2 text-xs w-full ${val ? 'text-gray-600' : 'text-gray-300 group-hover/date-custom:text-gray-500'}`}
                          >
                            <CalendarPlus className={`w-3.5 h-3.5 ${val ? 'text-gray-500' : ''}`} />
                            <span className="font-datetime">
                              {val
                                ? new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                : ''}
                            </span>
                          </button>
                          {activeDateCol === col.id && (
                            <PortalPopup
                              triggerRef={{ current: customDateRefs.current[col.id] }}
                              onClose={() => setActiveDateCol(null)}
                            >
                              <EnhancedDatePicker
                                dueDate={val}
                                onUpdate={(updates) => {
                                  if (updates.dueDate) updateVal(updates.dueDate);
                                  // if startDate handling needed, add here. Custom date usually single value.
                                }}
                                onClose={() => setActiveDateCol(null)}
                              />
                            </PortalPopup>
                          )}
                        </div>
                      );
                    default:
                      return (
                        <div className="px-2 text-xs truncate text-gray-400 w-full text-center py-2">{val || '-'}</div>
                      );
                  }
                })()}
              </div>
            </div>
          );
        })}

      <div className="w-8 shrink-0 flex justify-center relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 ${menuOpen ? 'bg-gray-100 text-gray-600' : ''}`}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)}></div>
            <div className="absolute right-0 rtl:right-auto rtl:left-0 top-8 z-[100] w-64 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col text-gray-700 animate-in fade-in zoom-in-95 duration-100 text-start">
              <div className="flex items-center p-2 border-b border-gray-100 gap-1">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 hover:bg-gray-50 rounded text-xs font-medium border border-transparent hover:border-gray-200">
                  <Link className="w-3.5 h-3.5" /> Copy link
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 hover:bg-gray-50 rounded text-xs font-medium border border-transparent hover:border-gray-200">
                  <Copy className="w-3.5 h-3.5" /> Copy ID
                </button>
                <button
                  className="flex-none flex items-center justify-center w-8 h-8 hover:bg-gray-50 rounded text-gray-500 border border-transparent hover:border-gray-200"
                  title="New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <div className="py-2 flex flex-col gap-0.5 max-h-[360px] overflow-y-auto">
                <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                  <Columns3 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Add a column</span>
                </div>
                <div className="my-1 border-t border-gray-100"></div>
                <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
                  <Pencil className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Rename</span>
                </div>
                <div
                  onClick={() => onDelete(task.id)}
                  className="px-3 py-2 flex items-center gap-3 hover:bg-red-50 cursor-pointer text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </div>
              </div>
              <div className="p-2 border-t border-gray-100">
                <button className="w-full bg-[#7b68ee] hover:bg-[#6c5ce7] text-white py-2 rounded-md text-sm font-medium transition-colors">
                  Sharing & Permissions
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TaskDetailModal: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const { t } = useAppContext();
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full h-full max-w-[1400px] max-h-[95vh] rounded-xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* LEFT COLUMN - Task Details */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Layout className="w-4 h-4" />
              <span className="hover:underline cursor-pointer">maxxx</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="hover:underline cursor-pointer">List</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-900 font-medium">{task.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">86evtwr7k</span>
              <div className="h-4 w-px bg-gray-200 mx-1"></div>
              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-8 py-6 pb-20">
            <div className="mb-6 group">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-gray-100 text-gray-500 border-gray-200 flex items-center gap-1 cursor-pointer hover:bg-gray-200`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full bg-gray-400`}></div> TO DO{' '}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 leading-tight outline-none focus:ring-2 focus:ring-blue-100 rounded px-1 -ml-1">
                {task.title}
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 max-w-4xl">
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-gray-400"></div>
                  </div>{' '}
                  Status
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e2e8f0] text-gray-600 text-xs font-semibold rounded uppercase tracking-wide cursor-pointer hover:opacity-80">
                    TO DO <Play className="w-2 h-2 ml-1 fill-current" />
                  </div>
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Users className="w-4 h-4" />
                  </div>{' '}
                  Assignees
                </div>
                <div className="flex-1 text-sm text-gray-400 italic hover:text-gray-600 cursor-pointer flex items-center gap-2 group/field">
                  Empty <Plus className="w-3 h-3 opacity-0 group-hover/field:opacity-100" />
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>{' '}
                  Dates
                </div>
                <div className="flex-1 flex items-center gap-2 text-sm text-gray-400 group/field cursor-pointer">
                  <span className="hover:text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Start
                  </span>
                  <span className="text-gray-300">→</span>
                  <span className="hover:text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due
                  </span>
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Flag className="w-4 h-4" />
                  </div>{' '}
                  Priority
                </div>
                <div className="flex-1 text-sm text-gray-400 italic hover:text-gray-600 cursor-pointer flex items-center gap-2 group/field">
                  Empty <Flag className="w-3 h-3 opacity-0 group-hover/field:opacity-100" />
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Clock className="w-4 h-4" />
                  </div>{' '}
                  Time Estimate
                </div>
                <div className="flex-1 text-sm text-gray-400 italic hover:text-gray-600 cursor-pointer flex items-center gap-2 group/field">
                  Empty
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Clock className="w-4 h-4" />
                  </div>{' '}
                  Track Time
                </div>
                <div className="flex-1 text-sm text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1 group/field">
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[8px]">
                    ▶
                  </div>{' '}
                  Add time
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <Tag className="w-4 h-4" />
                  </div>{' '}
                  Tags
                </div>
                <div className="flex-1 text-sm text-gray-400 italic hover:text-gray-600 cursor-pointer flex items-center gap-2 group/field">
                  Empty
                </div>
              </div>
              <div className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-4 flex justify-center">
                    <GitFork className="w-4 h-4" />
                  </div>{' '}
                  Relationships
                </div>
                <div className="flex-1 text-sm text-gray-400 italic hover:text-gray-600 cursor-pointer flex items-center gap-2 group/field">
                  Empty <Plus className="w-3 h-3 opacity-0 group-hover/field:opacity-100" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-6 cursor-pointer hover:text-gray-600 w-fit">
              <ChevronDown className="w-3 h-3 rotate-180" /> Hide empty properties
            </div>
            <div className="border-b border-gray-200 mb-6">
              <div className="flex items-center gap-6">
                <button className="px-1 py-3 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
                  Details
                </button>
                <button className="px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-800">Subtasks</button>
                <button className="px-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-800">
                  Action Items
                </button>
              </div>
            </div>
            <div className="group mb-8">
              <div className="flex items-center gap-2 mb-2 text-gray-500 group-hover:text-gray-700 transition-colors cursor-text">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Add description</span>
              </div>
              <div className="pl-6 text-sm text-gray-400 italic">Click to add a description...</div>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Custom Fields</h3>
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:bg-gray-50 px-3 py-2 rounded border border-gray-200 hover:border-gray-300 w-full justify-start transition-all">
                <Plus className="w-4 h-4" /> Create a field in this List
              </button>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
              <div className="border border-gray-200 rounded-lg h-24 flex items-center justify-center text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer border-dashed">
                Drop your files here to <span className="underline ml-1">upload</span>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN - Activity Sidebar */}
        <div className="w-[400px] border-l border-gray-200 bg-[#fafafa] flex flex-col">
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
            <h2 className="font-semibold text-gray-800 text-base">Activity</h2>
            <div className="flex items-start gap-5 pt-1">
              <button className="text-gray-400 hover:text-gray-600 transition-colors pt-0.5">
                <Search className="w-5 h-5" strokeWidth={2} />
              </button>
              <div className="flex flex-col items-center cursor-pointer group -mt-0.5">
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" strokeWidth={2} />
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm font-bold text-blue-600 leading-none mt-0.5">1</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors pt-0.5">
                <Filter className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2"></div>
                <div className="w-px h-full bg-gray-200 my-1"></div>
              </div>
              <div className="pb-4">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-900">You</span> created this task
                </p>
                <span className="text-[10px] text-gray-400">1 hour ago</span>
              </div>
            </div>
            <div className="h-full"></div>
          </div>
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="border border-gray-200 rounded-xl shadow-sm bg-white focus-within:ring-2 focus-within:ring-purple-100 transition-shadow">
              <div className="px-3 py-2">
                <input
                  type="text"
                  placeholder={t('write_comment')}
                  className="w-full text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                <div className="flex items-center gap-0.5">
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded">
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded text-xs font-medium">Comment</button>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded">
                    <AtSign className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded">
                    <Smile className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <button className="p-1.5 text-gray-300 hover:text-purple-600 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. MAIN COMPONENT (TaskFlow)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// 4. MAIN COMPONENT (TaskFlow)
// ----------------------------------------------------------------------

const _STORAGE_KEY_TASKS = 'lists-view-tasks-v2';
const _STORAGE_KEY_STATUSES = 'lists-view-statuses';
const STORAGE_KEY_COLUMNS = 'lists-view-columns';

const _INITIAL_TASKS: Task[] = [];

// ----------------------------------------------------------------------
// 2. SERVICES
// ----------------------------------------------------------------------

interface ListsProps {
  roomId: string;
  viewId?: string;
  tasks: any[];
  onUpdateTasks: (tasks: any[]) => void;
}

export default React.memo(function Lists({ roomId, viewId, tasks: externalTasks, onUpdateTasks }: ListsProps) {
  const { t, dir } = useAppContext();
  const isRTL = dir === 'rtl';
  // Shared Storage Keys
  const isSharedView = !viewId || viewId === 'list-main' || viewId === 'list';
  const storageKeyStatuses = `board-statuses-${roomId}`;
  const getStorageKey = (base: string) => (!isSharedView ? `${base}-${roomId}-${viewId}` : `${base}-${roomId}`);

  // ----------------------------------------------------------------------
  // STATE: TASKS
  // ----------------------------------------------------------------------
  // ----------------------------------------------------------------------
  // STATE: TASKS
  // ----------------------------------------------------------------------
  const tasks = React.useMemo(() => {
    if (!externalTasks || !Array.isArray(externalTasks)) return [];
    return externalTasks.map((row: any) => ({
      id: row.id,
      title: row.name || row.title || 'Untitled',
      status: row.statusId || row.status || 'To Do',
      assignees: row.assignees || [],
      dueDate: row.dueDate || undefined,
      startDate: row.startDate,
      priority: (row.priority as Priority) || Priority.NONE,
      tags: row.tags || [],
      subtasks: row.subtasks || [],
      isExpanded: false,
      selected: false,
      customValues: row.customValues || {},
    }));
  }, [externalTasks]);

  // Helper to propagate changes back to parent
  const updateParent = (newTasks: Task[]) => {
    const mappedTasks = newTasks.map((t) => ({
      id: t.id,
      name: t.title,
      title: t.title,
      status: t.status,
      statusId: t.status,
      groupId: t.status, // CRITICAL: Include groupId to prevent task orphaning when syncing between views
      assignees: t.assignees,
      dueDate: t.dueDate,
      startDate: t.startDate,
      priority: t.priority,
      tags: t.tags,
      subtasks: t.subtasks,
      customValues: t.customValues,
    }));
    onUpdateTasks(mappedTasks);
  };

  // ----------------------------------------------------------------------
  // STATE: STATUSES
  // ----------------------------------------------------------------------
  const [statuses, setStatuses] = useState<StatusColumn[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyStatuses);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // REPAIR/FIX: Enforce Capitalized IDs for system statuses
          // 'done' -> 'Done' to match RoomTable expectations
          const fixSystemId = (id: string, title?: string) => {
            if (!id) return title || '';
            const lowerId = id.toLowerCase();
            const lowerTitle = (title || '').toLowerCase();

            // Check for Done/Complete
            if (lowerId === 'done' || lowerId === 'complete' || lowerTitle === 'done') return 'Done';
            // Check for To Do
            if (lowerId === 'to-do' || lowerId === 'todo' || lowerTitle === 'to do') return 'To Do';
            // Check for In Progress
            if (lowerId === 'in-progress' || lowerId === 'inprogress' || lowerTitle === 'in progress')
              return 'In Progress';

            return id;
          };

          if (typeof parsed[0] === 'string') {
            return parsed.map((s: string) => {
              const lower = s.toLowerCase();
              let color = '#94a3b8';
              if (lower.includes('done') || lower.includes('complete')) color = '#22c55e';
              else if (lower.includes('progress') || lower.includes('working')) color = '#3b82f6';
              // FIX: Do NOT lowercase the ID. Use Title Case logic.
              return { id: fixSystemId(s), title: s, color: color, isCollapsed: false };
            });
          } else {
            return parsed.map((s: any) => {
              const rawId = s.id || s.label || s.title;
              return {
                id: fixSystemId(rawId, s.title || s.label),
                title: s.label || s.title || rawId,
                color: s.color || '#94a3b8',
                isCollapsed: s.isCollapsed || false,
              };
            });
          }
        }
      }
      return INITIAL_STATUSES;
    } catch (e) {
      boardLogger.warn('Failed to parse statuses', e);
      return INITIAL_STATUSES;
    }
  });

  useEffect(() => {
    try {
      const sharedFormat = statuses.map((s) => ({
        id: s.id, // Keep ID for stability
        title: s.title,
        color: s.color,
        isCollapsed: s.isCollapsed,
      }));
      localStorage.setItem(storageKeyStatuses, JSON.stringify(sharedFormat));
    } catch (e) {
      boardLogger.error('Failed to save shared statuses', e);
    }
  }, [statuses, storageKeyStatuses]);

  // ----------------------------------------------------------------------
  // STATE: COLUMNS
  // ----------------------------------------------------------------------
  const [extraColumns, setExtraColumns] = useState<CustomColumn[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(STORAGE_KEY_COLUMNS));
      return saved ? JSON.parse(saved) : [];
    } catch (_e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(getStorageKey(STORAGE_KEY_COLUMNS), JSON.stringify(extraColumns));
  }, [extraColumns, roomId, viewId]); // Depends on getStorageKey which depends on roomId/viewId

  // Make extraColumns available to TaskRow (hacky but effective)
  (window as any).extraColumns = extraColumns;

  const [addingTaskToGroup, setAddingTaskToGroup] = useState<string | null>(null);
  const [addingTaskToGroupBottom, setAddingTaskToGroupBottom] = useState<string | null>(null);
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);
  const [activeGroupMenu, setActiveGroupMenu] = useState<string | null>(null);
  const [activeColumnMenu, setActiveColumnMenu] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [columnContextMenu, setColumnContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [openedTask, setOpenedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTask, setDragOverTask] = useState<{ id: string; position: 'top' | 'bottom' } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const toggleExpand = (id: string) => {
    const toggleRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((t) => {
        if (t.id === id) return { ...t, isExpanded: !t.isExpanded };
        if (t.subtasks.length > 0) return { ...t, subtasks: toggleRecursive(t.subtasks) };
        return t;
      });
    };
    // Expansion state is ideally local, but for now syncing it to keep structure simple
    updateParent(toggleRecursive(tasks));
  };

  const toggleSelection = (id: string) => {
    const toggleRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((t) => {
        if (t.id === id) return { ...t, selected: !t.selected };
        if (t.subtasks.length > 0) return { ...t, subtasks: toggleRecursive(t.subtasks) };
        return t;
      });
    };
    updateParent(toggleRecursive(tasks));
  };

  const addTask = (
    title: string,
    statusId: string,
    subtasksToAdd: string[] = [],
    position: 'top' | 'bottom' = 'top',
  ) => {
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title,
      status: statusId,
      assignees: [MOCK_USER],
      priority: Priority.NONE,
      tags: [],
      subtasks: subtasksToAdd.map((st, i) => ({
        id: `t-${Date.now()}-${i}`,
        title: st,
        status: statusId,
        assignees: [],
        priority: Priority.NONE,
        tags: [],
        subtasks: [],
        isExpanded: false,
        selected: false,
      })),
      isExpanded: subtasksToAdd.length > 0,
      selected: false,
    };
    if (position === 'top') {
      updateParent([newTask, ...tasks]);
      setAddingTaskToGroup(null);
    } else {
      updateParent([...tasks, newTask]);
      setAddingTaskToGroupBottom(null);
    }
  };

  const addSubtask = (parentId: string, title: string, subtasksToAdd: string[] = []) => {
    const findParentStatus = (list: Task[]): string => {
      for (const t of list) {
        if (t.id === parentId) return t.status;
        const sub = findParentStatus(t.subtasks);
        if (sub) return sub;
      }
      return 'todo';
    };
    const parentStatus = findParentStatus(tasks);
    const newSubtask: Task = {
      id: `t-${Date.now()}`,
      title,
      status: parentStatus,
      assignees: [],
      priority: Priority.NONE,
      tags: [],
      subtasks: subtasksToAdd.map((st, i) => ({
        id: `t-${Date.now()}-${i}`,
        title: st,
        status: parentStatus,
        assignees: [],
        priority: Priority.NONE,
        tags: [],
        subtasks: [],
        isExpanded: false,
        selected: false,
      })),
      isExpanded: subtasksToAdd.length > 0,
      parentId,
      selected: false,
    };
    const addRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((t) => {
        if (t.id === parentId) return { ...t, subtasks: [...t.subtasks, newSubtask], isExpanded: true };
        if (t.subtasks.length > 0) return { ...t, subtasks: addRecursive(t.subtasks) };
        return t;
      });
    };
    updateParent(addRecursive(tasks));
    setAddingSubtaskTo(null);
  };

  const deleteTask = (id: string) => {
    const deleteRecursive = (taskList: Task[]): Task[] =>
      taskList.filter((t) => t.id !== id).map((t) => ({ ...t, subtasks: deleteRecursive(t.subtasks) }));
    updateParent(deleteRecursive(tasks));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updateRecursive = (taskList: Task[]): Task[] => {
      return taskList.map((t) => {
        if (t.id === id) return { ...t, ...updates };
        if (t.subtasks.length > 0) return { ...t, subtasks: updateRecursive(t.subtasks) };
        return t;
      });
    };
    updateParent(updateRecursive(tasks));
  };

  const addStatus = (title: string, color: string) => {
    const newId = title.toLowerCase().replace(/\s+/g, '-');
    if (statuses.some((s) => s.id === newId)) return;
    setStatuses([...statuses, { id: newId, title, color, isCollapsed: false }]);
    setIsCreatingStatus(false);
  };

  const updateStatus = (id: string, newTitle: string, newColor: string) => {
    const newStatuses = statuses.map((s) => (s.id === id ? { ...s, title: newTitle, color: newColor } : s));
    setStatuses(newStatuses);
    // Persist statuses? Yes, we have a useEffect for that now.
  };

  const _deleteStatus = (id: string) => {
    // Move tasks from deleted status to 'To Do' or similar?
    // For now just delete status.
    setStatuses(statuses.filter((s) => s.id !== id));
  };

  const toggleStatusCollapse = (id: string) => {
    setStatuses(statuses.map((s) => (s.id === id ? { ...s, isCollapsed: !s.isCollapsed } : s)));
    setActiveGroupMenu(null);
  };

  const collapseAllGroups = () => {
    setStatuses(statuses.map((s) => ({ ...s, isCollapsed: true })));
    setActiveGroupMenu(null);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedTaskId === targetId) return;
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'top' : 'bottom';
    setDragOverTask({ id: targetId, position });
  };

  const handleGroupDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTask(null);
  };

  const moveTask = (
    sourceId: string,
    targetId: string | null,
    position: 'top' | 'bottom' | null,
    targetStatusId?: string,
  ) => {
    let taskToMove: Task | null = null;
    const removeRecursive = (list: Task[]): Task[] => {
      const result: Task[] = [];
      for (const t of list) {
        if (t.id === sourceId) taskToMove = t;
        else result.push({ ...t, subtasks: removeRecursive(t.subtasks) });
      }
      return result;
    };
    const treeWithoutSource = removeRecursive(tasks);
    if (!taskToMove) return;

    if (targetId && position) {
      const insertRecursive = (list: Task[]): Task[] => {
        const result: Task[] = [];
        for (const t of list) {
          if (t.id === targetId) {
            if (position === 'top') {
              result.push({ ...taskToMove!, status: t.status, parentId: t.parentId });
              result.push(t);
            } else {
              result.push(t);
              result.push({ ...taskToMove!, status: t.status, parentId: t.parentId });
            }
          } else result.push({ ...t, subtasks: insertRecursive(t.subtasks) });
        }
        return result;
      };
      updateParent(insertRecursive(treeWithoutSource));
    } else if (targetStatusId) {
      updateParent([{ ...(taskToMove as Task), status: targetStatusId, parentId: undefined }, ...treeWithoutSource]);
    }
  };

  const handleTaskDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTaskId || !dragOverTask) return;
    moveTask(draggedTaskId, targetId, dragOverTask.position);
    setDraggedTaskId(null);
    setDragOverTask(null);
  };

  const handleGroupDrop = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    moveTask(draggedTaskId, null, null, targetStatusId);
    setDraggedTaskId(null);
    setDragOverTask(null);
  };

  const handleGenerateSubtasks = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Optimistic UI or loading state could be added here
    try {
      const generatedTitles = await generateSubtasks(task.title);
      if (generatedTitles && generatedTitles.length > 0) {
        const newSubtasks: Task[] = generatedTitles.map((title) => ({
          id: crypto.randomUUID(),
          title: title,
          status: 'To Do',
          assignees: [],
          priority: Priority.NORMAL,
          tags: [],
          subtasks: [],
          isExpanded: false,
          selected: false,
          parentId: taskId,
        }));

        // Update task with new subtasks and expand it
        updateTask(taskId, {
          subtasks: [...(task.subtasks || []), ...newSubtasks],
          isExpanded: true,
        });
      }
    } catch (error) {
      boardLogger.error('Failed to generate subtasks', error);
    }
  };

  const renderTaskTree = (taskList: Task[], level: number = 0, groupColor: string) => {
    return taskList.map((task) => (
      <React.Fragment key={task.id}>
        <TaskRow
          task={task}
          level={level}
          statusColor={groupColor}
          onToggleExpand={toggleExpand}
          onAddSubtask={(id) => setAddingSubtaskTo(id)}
          onGenerateSubtasks={handleGenerateSubtasks}
          onDelete={deleteTask}
          onSelect={toggleSelection}
          onTaskClick={(t) => setOpenedTask(t)}
          onUpdate={updateTask}
          onDragStart={handleDragStart}
          onDragOver={handleTaskDragOver}
          onDrop={handleTaskDrop}
          dragOverPosition={dragOverTask?.id === task.id ? dragOverTask.position : null}
        />
        {task.isExpanded && task.subtasks.length > 0 && renderTaskTree(task.subtasks, level + 1, groupColor)}
        {addingSubtaskTo === task.id && (
          <div style={{ paddingLeft: `${(level + 1) * 24}px` }}>
            <TaskInput
              isSubtask={true}
              onSave={(title, generated) => addSubtask(task.id, title, generated)}
              onCancel={() => setAddingSubtaskTo(null)}
              statusColor={groupColor}
            />
          </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="h-full bg-white dark:bg-stone-950 text-gray-900 dark:text-stone-100 flex flex-col font-sans relative -mt-px">
      {openedTask && <TaskDetailModal task={openedTask} onClose={() => setOpenedTask(null)} />}
      {openedTask && <TaskDetailModal task={openedTask} onClose={() => setOpenedTask(null)} />}
      {/* Header removed as per user request */}
      <main className="flex-1 overflow-auto flex flex-col">
        <div className="p-6 pt-2">
          {statuses.map((status) => {
            let groupTasks = tasks.filter((t) => t.status === status.id);
            if (sortConfig) {
              groupTasks = [...groupTasks].sort((a, b) => {
                const valA = (a as any)[sortConfig.key] ?? a.customValues?.[sortConfig.key] ?? '';
                const valB = (b as any)[sortConfig.key] ?? b.customValues?.[sortConfig.key] ?? '';
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
              });
            }
            return (
              <div
                key={status.id}
                className="mb-8 group/status-section"
                onDragOver={handleGroupDragOver}
                onDrop={(e) => handleGroupDrop(e, status.id)}
              >
                <div className="flex items-center gap-3 mb-1 py-2">
                  <button
                    onClick={() => toggleStatusCollapse(status.id)}
                    className="text-gray-400 hover:bg-gray-100 p-1 rounded transition-colors"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${status.isCollapsed ? '-rotate-90' : ''}`}
                    />
                  </button>
                  <StatusBadge id={status.id} title={status.title} color={status.color} onUpdate={updateStatus} />
                  <span className="text-xs text-gray-400 font-medium ml-1">{groupTasks.length}</span>
                  <div className="relative">
                    <button
                      onClick={() => setActiveGroupMenu(activeGroupMenu === status.id ? null : status.id)}
                      className={`text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 ml-1 ${activeGroupMenu === status.id ? 'bg-gray-100 text-gray-600' : ''}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {activeGroupMenu === status.id && (
                      <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setActiveGroupMenu(null)}></div>
                        <div className="absolute left-0 top-6 z-[100] w-56 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col text-gray-700 animate-in fade-in zoom-in-95 duration-100 origin-top-left py-1">
                          <div className="px-3 py-2 text-xs text-gray-400 font-semibold">Group options</div>
                          <button
                            className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm"
                            onClick={() => setActiveGroupMenu(null)}
                          >
                            <Pencil className="w-4 h-4 text-gray-400" /> Rename
                          </button>
                          <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm">
                            <Plus className="w-4 h-4 text-gray-400" /> New status
                          </button>
                          <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm">
                            <Settings className="w-4 h-4 text-gray-400" /> Edit statuses
                          </button>
                          <div className="my-1 border-t border-gray-100"></div>
                          <button
                            onClick={() => toggleStatusCollapse(status.id)}
                            className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm"
                          >
                            <ChevronUp className="w-4 h-4 text-gray-400" /> Collapse group
                          </button>
                          <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm">
                            <EyeOff className="w-4 h-4 text-gray-400" /> Hide status
                          </button>

                          {/* Delete Option for Non-Default Statuses */}
                          {!['To Do', 'In Progress', 'Done'].includes(status.title) &&
                            !['To Do', 'In Progress', 'Done', 'to-do', 'in-progress', 'done'].includes(status.id) && (
                              <>
                                <div className="my-1 border-t border-gray-100"></div>
                                <button
                                  onClick={() => {
                                    setStatuses(statuses.filter((s) => s.id !== status.id));
                                    setActiveGroupMenu(null);
                                  }}
                                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 text-sm text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete status
                                </button>
                              </>
                            )}

                          <div className="my-1 border-t border-gray-100"></div>
                          <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm">
                            <CheckCheck className="w-4 h-4 text-gray-400" /> Select all
                          </button>
                          <button
                            onClick={collapseAllGroups}
                            className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm"
                          >
                            <ChevronsUp className="w-4 h-4 text-gray-400" /> Collapse all groups
                          </button>
                          <div className="my-1 border-t border-gray-100"></div>
                          <button className="px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-sm">
                            <Zap className="w-4 h-4 text-gray-400 fill-gray-400" /> Automate status
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {!status.isCollapsed && (
                    <button
                      onClick={() => setAddingTaskToGroup(status.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="flex-1"></div>
                </div>
                {!status.isCollapsed && (
                  <div className="flex flex-col min-h-[10px]">
                    <div className="flex items-center px-0 py-2 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <div className="shrink-0 relative" style={{ width: '54px' }}>
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6">
                          <div className="w-3.5 h-3.5 rounded border border-gray-300"></div>
                        </div>
                      </div>
                      <div className="shrink-0 w-8"></div>
                      <div className="flex-1">Name</div>
                      <div className="w-24 text-left pl-2 text-gray-400 font-medium">Tags</div>
                      <div className="w-36 text-left pl-2 text-gray-400 font-medium">Dates</div>
                      <div className="w-24 text-left pl-2 text-gray-400 font-medium">Priority</div>

                      {extraColumns.map((col) => (
                        <div
                          key={col.id}
                          className="group shrink-0 flex items-center justify-center border-l border-gray-100 px-2 text-gray-400 font-medium truncate cursor-context-menu hover:bg-gray-50 hover:text-gray-700"
                          style={{ width: `${col.width}px` }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setColumnContextMenu({ id: col.id, x: e.clientX, y: e.clientY });
                          }}
                        >
                          <span className="truncate">{col.title}</span>
                          <div className="flex flex-col ml-1.5 gap-0.5">
                            <ArrowUp
                              className={`w-2 h-2 cursor-pointer ${sortConfig?.key === col.id && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortConfig({ key: col.id, direction: 'asc' });
                              }}
                            />
                            <ArrowDown
                              className={`w-2 h-2 cursor-pointer ${sortConfig?.key === col.id && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortConfig({ key: col.id, direction: 'desc' });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-center relative group bg-gray-50/80 px-2">
                        <div
                          className={
                            'cursor-pointer w-6 h-6 rounded flex items-center justify-center transition-all duration-200 ' +
                            (activeColumnMenu?.id === status.id
                              ? 'bg-gray-200 text-gray-900'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200/50')
                          }
                          onClick={(e) => {
                            e.stopPropagation(); // prevent collapsing group
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveColumnMenu(
                              activeColumnMenu?.id === status.id ? null : { id: status.id, rect: rect },
                            );
                          }}
                          title={t('add_column')}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    {addingTaskToGroup === status.id && (
                      <div className="pl-[45px] pr-4 py-1">
                        <TaskInput
                          onSave={(title, gen) => addTask(title, status.id, gen, 'top')}
                          onCancel={() => setAddingTaskToGroup(null)}
                          statusColor={status.color}
                        />
                      </div>
                    )}
                    {groupTasks.length === 0 &&
                      addingTaskToGroup !== status.id &&
                      addingTaskToGroupBottom !== status.id && <div className="hidden"></div>}
                    {renderTaskTree(groupTasks, 0, status.color)}
                    {addingTaskToGroupBottom !== status.id ? (
                      <button
                        onClick={() => setAddingTaskToGroupBottom(status.id)}
                        className="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-700 mt-1 pl-[58px] py-1.5 transition-colors group/add-btn w-full text-left"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task</span>
                      </button>
                    ) : (
                      <div className="pl-[45px] pr-4 py-1 mt-1">
                        <TaskInput
                          onSave={(title, gen) => addTask(title, status.id, gen, 'bottom')}
                          onCancel={() => setAddingTaskToGroupBottom(null)}
                          statusColor={status.color}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-4 pl-2">
            {!isCreatingStatus ? (
              <button
                onClick={() => setIsCreatingStatus(true)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> New status
              </button>
            ) : (
              <NewStatusInput
                onAdd={(title, color) => addStatus(title, color)}
                onCancel={() => setIsCreatingStatus(false)}
              />
            )}
          </div>
        </div>
      </main>
      {/* Portal Column Menu */}
      {activeColumnMenu &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998] bg-transparent" onClick={() => setActiveColumnMenu(null)} />
            <div
              className={`fixed top-[100px] bottom-0 z-[10005] ${isRTL ? 'left-0' : 'right-0'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <ColumnMenu
                onClose={() => setActiveColumnMenu(null)}
                onSelect={(type, label, options, currency) => {
                  const newCol: CustomColumn = {
                    id: crypto.randomUUID(),
                    title: label,
                    type,
                    width: 120,
                    options,
                    currency,
                  };
                  setExtraColumns([...extraColumns, newCol]);
                  setActiveColumnMenu(null);
                }}
              />
            </div>
          </>,
          document.body,
        )}
      {/* Column Context Menu (Delete etc) */}
      {columnContextMenu && (
        <ColumnContextMenu
          x={columnContextMenu.x}
          y={columnContextMenu.y}
          onClose={() => setColumnContextMenu(null)}
          onAction={(action) => {
            if (action === 'delete') {
              setExtraColumns((prev) => prev.filter((c) => c.id !== columnContextMenu.id));
            }
            setColumnContextMenu(null);
          }}
        />
      )}
    </div>
  );
});
