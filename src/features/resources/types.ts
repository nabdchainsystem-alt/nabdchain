// =============================================================================
// RESOURCES FEATURE - TYPES
// Status: NOT IMPLEMENTED - Placeholder types for future development
// =============================================================================

export interface Resource {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
  capacity: number; // hours per week
  skills: string[];
  hourlyRate?: number;
  status: ResourceStatus;
}

export type ResourceStatus = 'active' | 'away' | 'unavailable';

export interface Allocation {
  id: string;
  resourceId: string;
  projectId: string;
  taskId?: string;
  startDate: Date;
  endDate: Date;
  hoursPerDay: number;
  percentage: number; // 0-100
  type: AllocationType;
  status: AllocationStatus;
}

export type AllocationType = 'project' | 'task' | 'meeting' | 'vacation' | 'sick' | 'other';
export type AllocationStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled';

export interface WorkloadData {
  resourceId: string;
  date: Date;
  allocatedHours: number;
  availableHours: number;
  utilizationPercent: number;
  allocations: Allocation[];
}

export interface CapacityPlan {
  id: string;
  workspaceId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  resources: string[];
  allocations: Allocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceMetrics {
  totalResources: number;
  activeResources: number;
  averageUtilization: number;
  overallocatedCount: number;
  underallocatedCount: number;
  totalCapacityHours: number;
  allocatedHours: number;
}

export interface TimeOffRequest {
  id: string;
  resourceId: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string;
  createdAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ResourceFilter {
  skills?: string[];
  departments?: string[];
  availability?: 'available' | 'partial' | 'unavailable';
  minCapacity?: number;
}
