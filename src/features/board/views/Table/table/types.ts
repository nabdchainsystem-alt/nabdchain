import React from 'react';

export interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: Date | null;
  priority: string | null;
  assignee?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export enum ViewMode {
  List = 'List',
  Board = 'Board',
  Calendar = 'Calendar',
}

export interface SidebarItem {
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
}

export interface DropdownOption {
  id: string;
  label: string;
  color: string;
}

export interface Column {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  resizable: boolean;
  type?: string;
  options?: DropdownOption[];
  currency?: string;
  config?: Record<string, unknown>;
}
