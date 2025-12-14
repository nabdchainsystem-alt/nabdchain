
export enum StatusColor {
  DONE = '#00c875',
  WORKING = '#fdab3d',
  STUCK = '#e2445c',
  EMPTY = '#c4c4c4'
}

export interface Task {
  id: string;
  name: string;
  person: string;
  status: string;
  date: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  type: 'text' | 'person' | 'status' | 'date';
}

export type BoardViewType = 'kanban' | 'table' | 'list' | 'doc' | 'listboard' | 'discussion' | 'calendar' | 'taskboard' | 'gantt' | 'chart' | 'file_gallery' | 'form';

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
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ViewState = 'dashboard' | 'board' | 'inbox' | 'teams' | 'vault' | 'discussion' | 'my_work';
