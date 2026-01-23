import { getPriorityClasses } from '../../../priorities/priorityUtils';

// --- Types ---

export type Priority = 'high' | 'medium' | 'low' | 'none' | 'urgent' | 'normal';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    statusId: string;
    priority: Priority;
    dueDate?: string;
    startDate?: string;
    dependencies?: string[];
    tags: string[];
    subtasks: Subtask[];
    assignee?: string;
    assigneeObj?: { id: string; name: string; avatar?: string; showUserIcon?: boolean };
}

export interface ColumnType {
    id: string;
    title: string;
    color: string;
    icon?: string;
}

export interface BoardData {
    columns: ColumnType[];
    tasks: Task[];
}

// --- Constants ---

export const INITIAL_DATA: BoardData = {
    columns: [
        { id: 'To Do', title: 'To Do', color: 'gray' },
        { id: 'In Progress', title: 'In Progress', color: 'blue' },
        { id: 'Done', title: 'Done', color: 'emerald' },
        { id: 'Rejected', title: 'Rejected', color: 'rose' },
        { id: 'Stuck', title: 'Stuck', color: 'orange' },
    ],
    tasks: []
};

const HIGH_CLASSES = getPriorityClasses('High');
const MEDIUM_CLASSES = getPriorityClasses('Medium');
const LOW_CLASSES = getPriorityClasses('Low');
const URGENT_CLASSES = getPriorityClasses('Urgent');

export const priorityConfig: Record<Priority, { color: string; label: string; dot: string }> = {
    high: { color: HIGH_CLASSES.text, dot: HIGH_CLASSES.dot, label: 'High' },
    medium: { color: MEDIUM_CLASSES.text, dot: MEDIUM_CLASSES.dot, label: 'Medium' },
    low: { color: LOW_CLASSES.text, dot: LOW_CLASSES.dot, label: 'Low' },
    none: { color: 'text-stone-400', dot: 'bg-stone-300', label: 'Clear' },
    urgent: { color: URGENT_CLASSES.text, dot: URGENT_CLASSES.dot, label: 'Urgent' },
    normal: { color: MEDIUM_CLASSES.text, dot: MEDIUM_CLASSES.dot, label: 'Medium' },
};
