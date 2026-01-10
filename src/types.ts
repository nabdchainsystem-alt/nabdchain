
export enum StatusColor {
  DONE = '#00c875',
  WORKING = '#fdab3d',
  STUCK = '#e2445c',
  EMPTY = '#c4c4c4'
}

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  name: string;
  person: string;
  status: string;
  date: string;
  priority?: PriorityLevel | null;
}

export interface BoardColumn {
  id: string;
  title: string;
  type: 'text' | 'person' | 'status' | 'date' | 'number' | 'priority';
}

export type BoardViewType = 'kanban' | 'table' | 'datatable' | 'list' | 'doc' | 'discussion' | 'calendar' | 'taskboard' | 'gantt' | 'chart' | 'file_gallery' | 'form' | 'pivot_table' | 'overview' | 'sc_warehouse' | 'sc_shipping' | 'sc_fleet' | 'sc_vendors' | 'sc_planning' | 'warehouse_capacity_map' | 'gtd' | 'cornell' | 'dashboards' | 'whiteboard' | 'automation_rules' | 'goals_okrs' | 'workload' | 'recurring' | 'spreadsheet';

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
  type?: 'project' | 'discussion';
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ViewState = 'dashboard' | 'board' | 'inbox' | 'teams' | 'vault' | 'discussion' | 'my_work' | 'flow_hub' | 'process_map' | 'procurement' | 'warehouse' | 'shipping' | 'fleet' | 'vendors' | 'planning' | 'maintenance' | 'production' | 'quality' | 'sales_factory' | 'sales_listing' | 'sales' | 'finance' | 'it_support' | 'hr' | 'marketing' | 'local_marketplace' | 'foreign_marketplace' | 'cornell_notes' | 'settings';

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

