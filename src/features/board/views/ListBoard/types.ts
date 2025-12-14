// Status is now dynamic, so we use string.
export type Status = string;

export interface StatusOption {
  id: string;
  label: string;
  color: string;
}

export interface TaskItem {
  id: string;
  name: string;
  person: string | null; // URL to avatar or null
  status: Status;
  date: string | null;
  selected: boolean;
}

export interface GroupData {
  id: string;
  title: string;
  color: string;
  items: TaskItem[];
}

export interface ColumnWidths {
  person: number;
  status: number;
  date: number;
}
