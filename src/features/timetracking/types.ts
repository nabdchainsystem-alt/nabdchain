// =============================================================================
// TIME TRACKING TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface TimeEntry {
  id: string;
  userId: string;
  taskId?: string;
  rowId?: string;
  boardId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  billable: boolean;
  hourlyRate?: number;
  tags: string[];
  source: 'manual' | 'timer' | 'import';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeTrackingSettings {
  id: string;
  workspaceId: string;
  defaultBillable: boolean;
  defaultHourlyRate?: number;
  roundingRule: 'none' | '15min' | '30min' | '1hour';
  requireDescription: boolean;
}

export interface TimerState {
  isRunning: boolean;
  startTime?: Date;
  currentTaskId?: string;
  currentBoardId?: string;
  description?: string;
  elapsedSeconds: number;
}

export interface TimeReport {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  entriesCount: number;
  byProject: {
    projectId: string;
    projectName: string;
    hours: number;
    amount: number;
  }[];
  byUser: {
    userId: string;
    userName: string;
    hours: number;
  }[];
  byDay: {
    date: string;
    hours: number;
  }[];
}

export interface TimesheetEntry {
  userId: string;
  date: string;
  entries: TimeEntry[];
  totalHours: number;
}
