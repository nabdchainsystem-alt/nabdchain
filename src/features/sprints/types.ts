// =============================================================================
// SPRINTS FEATURE - TYPES
// Status: NOT IMPLEMENTED - Placeholder types for future development
// =============================================================================

export interface Sprint {
  id: string;
  workspaceId: string;
  boardId: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  capacity: number; // Total story points capacity
  velocity?: number; // Actual velocity (calculated after completion)
  tasks: SprintTask[];
  createdAt: Date;
  updatedAt: Date;
}

export type SprintStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface SprintTask {
  id: string;
  sprintId: string;
  taskId: string; // Reference to board task
  storyPoints: number;
  status: 'todo' | 'in_progress' | 'done';
  assigneeId?: string;
  completedAt?: Date;
}

export interface BurndownDataPoint {
  date: Date;
  ideal: number;
  actual: number;
  remaining: number;
}

export interface VelocityData {
  sprintId: string;
  sprintName: string;
  planned: number;
  completed: number;
  velocity: number;
}

export interface SprintMetrics {
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  completionPercentage: number;
  daysRemaining: number;
  averageVelocity: number;
  predictedCompletion: Date | null;
}

export interface SprintSettings {
  defaultDuration: number; // days
  defaultCapacity: number;
  autoCreateNextSprint: boolean;
  includeWeekends: boolean;
  standupReminder: boolean;
  standupTime?: string;
}

export interface SprintEvent {
  id: string;
  sprintId: string;
  type: 'planning' | 'standup' | 'review' | 'retrospective';
  title: string;
  scheduledAt: Date;
  duration: number; // minutes
  attendees: string[];
  notes?: string;
}
