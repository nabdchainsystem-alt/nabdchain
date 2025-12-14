
export type Language = 'en' | 'ar';

export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  initials: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Thread {
  id: string;
  boardId: string;
  title: string;
  preview: string;
  updatedAt: Date;
  messages: Message[];
  participants?: User[];
  unread?: boolean;
  priority?: Priority;
  dueDate?: Date;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  members?: string[];
  theme?: string;
  defaultView?: 'table' | 'data_table' | 'kanban' | 'list' | 'list_board';
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  dueDate?: Date;
}

export interface Note {
  content: string;
}

export enum ViewMode {
  Split = 'SPLIT',
  MobileList = 'MOBILE_LIST',
  MobileChat = 'MOBILE_CHAT'
}

export interface UserSettings {
  darkMode: boolean;
  sidebarWidth: number;
}
