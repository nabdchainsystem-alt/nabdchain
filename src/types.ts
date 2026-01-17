
export enum StatusColor {
  DONE = '#00c875',
  WORKING = '#fdab3d',
  STUCK = '#e2445c',
  EMPTY = '#c4c4c4'
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

// Common task statuses - can be extended
export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Working on it'
  | 'Stuck'
  | 'Done'
  | 'Pending'
  | 'Almost Done'
  | string; // Allow custom statuses

// Person/assignee type
export interface Person {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

// Base task properties
export interface TaskBase {
  id: string;
  name: string;
  person: string | Person;
  status: TaskStatus;
  date: string;
  priority?: PriorityLevel | null;
  description?: string;
  type?: 'task' | 'event';
}

// Task with dynamic column values (for table rows)
export interface Task extends TaskBase {
  // Allow additional dynamic properties for custom columns
  [key: string]: unknown;
}

export interface BoardColumn {
  id: string;
  title: string;
  type: 'text' | 'person' | 'status' | 'date' | 'number' | 'priority' | 'currency';
}

export type BoardViewType =
  | 'kanban' | 'table' | 'datatable' | 'list' | 'doc' | 'calendar' | 'gantt'
  | 'pivot_table' | 'overview' | 'warehouse_capacity_map' | 'gtd' | 'cornell'
  | 'dashboards' | 'whiteboard' | 'automation_rules' | 'goals_okrs' | 'workload'
  | 'recurring' | 'spreadsheet' | 'timeline';

export interface Board {
  id: string;
  name: string;
  description?: string;
  columns: BoardColumn[];
  tasks: Task[];
  workspaceId?: string;
  isFavorite?: boolean;
  defaultView?: BoardViewType;
  availableViews?: BoardViewType[];
  icon?: string;
  parentId?: string;
  pinnedViews?: string[];
  type?: 'project';
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ViewState = 'dashboard' | 'board' | 'inbox' | 'teams' | 'vault' | 'my_work' | 'flow_hub' | 'process_map' | 'procurement' | 'warehouse' | 'shipping' | 'fleet' | 'vendors' | 'planning' | 'maintenance' | 'production' | 'quality' | 'sales_factory' | 'sales_listing' | 'sales' | 'finance' | 'it_support' | 'hr' | 'marketing' | 'local_marketplace' | 'foreign_marketplace' | 'cornell_notes' | 'quick_notes' | 'settings' | 'test';

export interface RecentlyVisitedItem {
  id: string;
  title: string;
  type: ViewState | string;
  timestamp: number;
  metadata?: string;
  icon?: string;
  color?: string;
  boardId?: string; // Optional, for board items
}

