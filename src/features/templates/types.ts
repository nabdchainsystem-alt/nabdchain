// =============================================================================
// TEMPLATES TYPES
// Status: NOT IMPLEMENTED - Placeholder for future development
// =============================================================================

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  subcategory?: string;
  thumbnail?: string;
  isPublic: boolean; // System templates vs workspace templates
  workspaceId?: string;
  content: TemplateContent;
  tags: string[];
  usageCount: number;
  rating?: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory =
  | 'project_management'
  | 'marketing'
  | 'sales'
  | 'hr'
  | 'software'
  | 'design'
  | 'operations'
  | 'education'
  | 'personal'
  | 'startup'
  | 'finance'
  | 'custom';

export interface TemplateContent {
  board: {
    name: string;
    description?: string;
    defaultView: string;
    availableViews: string[];
  };
  columns: TemplateColumn[];
  rooms: TemplateRoom[];
  automations?: TemplateAutomation[];
}

export interface TemplateColumn {
  id: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
  order: number;
}

export interface TemplateRoom {
  id: string;
  name: string;
  color: string;
  order: number;
  rows: TemplateRow[];
}

export interface TemplateRow {
  id: string;
  name: string;
  values: Record<string, unknown>;
}

export interface TemplateAutomation {
  id: string;
  name: string;
  trigger: Record<string, unknown>;
  actions: Record<string, unknown>[];
}

export interface ManagedTemplate {
  id: string;
  templateId: string;
  workspaceId: string;
  linkedBoards: ManagedTemplateBoard[];
  version: number;
  lastPushed?: Date;
  createdAt: Date;
}

export interface ManagedTemplateBoard {
  id: string;
  managedTemplateId: string;
  boardId: string;
  boardName: string;
  syncEnabled: boolean;
  lastSynced?: Date;
}
