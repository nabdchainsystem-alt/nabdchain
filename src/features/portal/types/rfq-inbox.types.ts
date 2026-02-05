// =============================================================================
// RFQ Inbox Gmail-Style Enhancement Types
// =============================================================================
// These types extend the existing RFQ system with Gmail-style features:
// - Labels (non-exclusive tags)
// - Threaded conversations
// - Saved replies
// - Enhanced read/unread states
// - Snooze functionality

// =============================================================================
// Label System
// =============================================================================

/**
 * RFQ Labels - Non-exclusive tags that can coexist
 * An RFQ can have multiple labels simultaneously
 */
export type RFQLabel =
  | 'new'           // Just received, not yet opened (auto-removed on view)
  | 'pending'       // Awaiting seller action
  | 'negotiation'   // Active negotiation in progress
  | 'expiring'      // Deadline approaching (auto-applied by system)
  | 'won'           // Quote accepted, order created
  | 'lost'          // Quote rejected or expired
  | 'starred'       // User-starred for importance
  | 'snoozed'       // Temporarily hidden from inbox
  | 'archived';     // Removed from main inbox view

/**
 * Label configuration for UI rendering
 */
export interface LabelConfig {
  id: RFQLabel;
  name: string;
  nameKey: string;           // i18n key
  color: string;             // Text/icon color
  bgColor: string;           // Background color
  icon: string;              // Phosphor icon name
  isSystem: boolean;         // System-managed vs user-applied
  isExclusive: boolean;      // Can't coexist with certain others
  excludes?: RFQLabel[];     // Labels that get removed when this is added
}

/**
 * Default label configurations
 */
export const LABEL_CONFIGS: Record<RFQLabel, LabelConfig> = {
  new: {
    id: 'new',
    name: 'New',
    nameKey: 'rfq.labels.new',
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: 'EnvelopeSimple',
    isSystem: true,
    isExclusive: false,
  },
  pending: {
    id: 'pending',
    name: 'Pending',
    nameKey: 'rfq.labels.pending',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: 'Clock',
    isSystem: true,
    isExclusive: false,
  },
  negotiation: {
    id: 'negotiation',
    name: 'Negotiation',
    nameKey: 'rfq.labels.negotiation',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: 'ChatText',
    isSystem: true,
    isExclusive: false,
  },
  expiring: {
    id: 'expiring',
    name: 'Expiring',
    nameKey: 'rfq.labels.expiring',
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: 'Warning',
    isSystem: true,
    isExclusive: false,
  },
  won: {
    id: 'won',
    name: 'Won',
    nameKey: 'rfq.labels.won',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    icon: 'Trophy',
    isSystem: true,
    isExclusive: true,
    excludes: ['lost', 'pending', 'negotiation'],
  },
  lost: {
    id: 'lost',
    name: 'Lost',
    nameKey: 'rfq.labels.lost',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    icon: 'XCircle',
    isSystem: true,
    isExclusive: true,
    excludes: ['won', 'pending', 'negotiation'],
  },
  starred: {
    id: 'starred',
    name: 'Starred',
    nameKey: 'rfq.labels.starred',
    color: '#eab308',
    bgColor: '#fefce8',
    icon: 'Star',
    isSystem: false,
    isExclusive: false,
  },
  snoozed: {
    id: 'snoozed',
    name: 'Snoozed',
    nameKey: 'rfq.labels.snoozed',
    color: '#64748b',
    bgColor: '#f1f5f9',
    icon: 'ClockAfternoon',
    isSystem: false,
    isExclusive: false,
  },
  archived: {
    id: 'archived',
    name: 'Archived',
    nameKey: 'rfq.labels.archived',
    color: '#9ca3af',
    bgColor: '#f9fafb',
    icon: 'Archive',
    isSystem: false,
    isExclusive: false,
  },
};

/**
 * Get label config with fallback
 */
export function getLabelConfig(label: RFQLabel): LabelConfig {
  return LABEL_CONFIGS[label] || LABEL_CONFIGS.pending;
}

/**
 * Check if adding a label should remove others
 */
export function getLabelsToRemove(newLabel: RFQLabel): RFQLabel[] {
  const config = LABEL_CONFIGS[newLabel];
  return config.excludes || [];
}

// =============================================================================
// Enhanced RFQ Types
// =============================================================================

/**
 * SLA Status for visual indicators
 */
export type SLAStatus = 'normal' | 'warning' | 'critical' | 'overdue';

/**
 * Thread message types for conversation timeline
 */
export type ThreadMessageType =
  | 'rfq_created'
  | 'rfq_viewed'
  | 'quote_sent'
  | 'quote_revised'
  | 'counter_offer'
  | 'message'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'order_created'
  | 'system';

/**
 * Sender type for thread messages
 */
export type ThreadSenderType = 'buyer' | 'seller' | 'system';

/**
 * Latest message preview in inbox list
 */
export interface LatestMessagePreview {
  type: ThreadMessageType;
  content: string;           // Truncated preview (max 100 chars)
  senderType: ThreadSenderType;
  timestamp: string;
}

/**
 * Enhanced SellerInboxRFQ with Gmail-style fields
 * Extends existing SellerInboxRFQ interface
 */
export interface EnhancedSellerInboxRFQ {
  // Existing fields from SellerInboxRFQ
  id: string;
  rfqNumber: string | null;
  itemId: string | null;
  buyerId: string;
  sellerId: string;
  quantity: number;
  message?: string;
  deliveryLocation?: string;
  deliveryCity?: string;
  deliveryCountry: string;
  requiredDeliveryDate?: string;
  priority: string;
  source: string;
  status: string;
  priorityLevel: string;
  priorityScore?: number;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string;
  buyerCompanyName?: string;
  item?: {
    id: string;
    name: string;
    sku: string;
    image: string | null;
  };

  // NEW: Label System
  labels: RFQLabel[];

  // NEW: Read/Unread State (separate from workflow status)
  isRead: boolean;
  readAt: string | null;
  markedUnreadAt: string | null;

  // NEW: Snooze Support
  snoozedUntil: string | null;
  snoozeReason: string | null;

  // NEW: Starred
  isStarred: boolean;
  starredAt: string | null;

  // NEW: Threading Support
  threadId: string | null;
  threadCount: number;
  lastThreadActivity: string;
  hasUnreadInThread: boolean;

  // NEW: Conversation Preview
  latestMessage: LatestMessagePreview | null;

  // NEW: Enhanced SLA
  slaDeadline: string;
  slaStatus: SLAStatus;
  slaRemainingMs: number;
}

// =============================================================================
// Thread Types
// =============================================================================

/**
 * Thread status
 */
export type ThreadStatus = 'active' | 'won' | 'lost' | 'archived';

/**
 * Thread participant
 */
export interface ThreadParticipant {
  id: string;
  type: 'buyer' | 'seller';
  name: string;
  company: string;
  avatarUrl?: string;
}

/**
 * RFQ Thread - Groups all communications for a single RFQ lifecycle
 */
export interface RFQThread {
  id: string;
  rfqId: string;
  sellerId: string;
  buyerId: string;

  // Thread Metadata
  subject: string;
  itemSummary: string | null;

  // Thread State
  status: ThreadStatus;
  labels: RFQLabel[];

  // Participants
  participants: ThreadParticipant[];

  // Activity Tracking
  messageCount: number;
  unreadCount: number;
  lastActivityAt: string;
  lastActivityType: ThreadMessageType;

  // Timeline
  createdAt: string;
  updatedAt: string;
}

/**
 * Thread message attachment
 */
export interface ThreadAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

/**
 * Individual thread message/event
 */
export interface ThreadMessage {
  id: string;
  threadId: string;

  // Message Type
  type: ThreadMessageType;

  // Sender
  senderId: string;
  senderType: ThreadSenderType;
  senderName: string;
  senderAvatarUrl?: string;

  // Content
  content: string;
  metadata: Record<string, unknown>;

  // Attachments
  attachments: ThreadAttachment[];

  // Read State
  isRead: boolean;
  readAt: string | null;

  // Timestamps
  createdAt: string;
}

// =============================================================================
// Saved Replies Types
// =============================================================================

/**
 * Saved reply categories
 */
export type SavedReplyCategory =
  | 'quote_response'
  | 'clarification'
  | 'negotiation'
  | 'decline'
  | 'follow_up'
  | 'custom';

/**
 * Template variable definition
 */
export interface SavedReplyVariable {
  name: string;              // e.g., "{{buyer_name}}"
  description: string;
  defaultValue: string;
  isRequired: boolean;
}

/**
 * Saved reply template
 */
export interface SavedReply {
  id: string;
  sellerId: string;

  // Template Metadata
  name: string;
  shortcut: string | null;   // Keyboard shortcut, e.g., "sqr"
  category: SavedReplyCategory;

  // Template Content
  subject: string | null;
  content: string;

  // Variables
  variables: SavedReplyVariable[];

  // Usage Stats
  useCount: number;
  lastUsedAt: string | null;

  // Metadata
  isDefault: boolean;        // System-provided default
  createdAt: string;
  updatedAt: string;
}

/**
 * Available template variables with descriptions
 */
export const TEMPLATE_VARIABLES: Record<string, string> = {
  '{{buyer_name}}': 'Buyer company name',
  '{{buyer_contact}}': 'Buyer contact person',
  '{{rfq_number}}': 'RFQ reference number',
  '{{item_name}}': 'Requested item name',
  '{{quantity}}': 'Requested quantity',
  '{{delivery_date}}': 'Required delivery date',
  '{{quote_price}}': 'Quoted unit price',
  '{{quote_total}}': 'Quoted total price',
  '{{lead_time}}': 'Quoted lead time',
  '{{validity_date}}': 'Quote validity date',
  '{{seller_name}}': 'Seller company name',
  '{{today}}': 'Current date',
};

/**
 * Rendered template result
 */
export interface RenderedTemplate {
  subject: string;
  content: string;
  missingVariables: string[];
}

// =============================================================================
// Snooze Types
// =============================================================================

/**
 * Predefined snooze options
 */
export type SnoozePreset =
  | 'later_today'      // 2 hours from now
  | 'tomorrow_morning' // Tomorrow 9:00 AM
  | 'tomorrow_afternoon' // Tomorrow 2:00 PM
  | 'this_weekend'     // Saturday 9:00 AM
  | 'next_week'        // Monday 9:00 AM
  | 'custom';          // User-specified datetime

/**
 * Snooze option configuration
 */
export interface SnoozeOption {
  id: SnoozePreset;
  label: string;
  labelKey: string;
  getDateTime: () => Date;
}

/**
 * Calculate snooze datetime for preset
 */
export function getSnoozeDateTime(preset: SnoozePreset): Date {
  const now = new Date();

  switch (preset) {
    case 'later_today':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);

    case 'tomorrow_morning': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    case 'tomorrow_afternoon': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      return tomorrow;
    }

    case 'this_weekend': {
      const saturday = new Date(now);
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
      saturday.setHours(9, 0, 0, 0);
      return saturday;
    }

    case 'next_week': {
      const monday = new Date(now);
      const daysUntilMonday = (1 - now.getDay() + 7) % 7 || 7;
      monday.setDate(monday.getDate() + daysUntilMonday);
      monday.setHours(9, 0, 0, 0);
      return monday;
    }

    default:
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
  }
}

/**
 * Default snooze options for UI
 */
export const SNOOZE_OPTIONS: SnoozeOption[] = [
  {
    id: 'later_today',
    label: 'Later Today (2h)',
    labelKey: 'rfq.snooze.laterToday',
    getDateTime: () => getSnoozeDateTime('later_today'),
  },
  {
    id: 'tomorrow_morning',
    label: 'Tomorrow Morning',
    labelKey: 'rfq.snooze.tomorrowMorning',
    getDateTime: () => getSnoozeDateTime('tomorrow_morning'),
  },
  {
    id: 'tomorrow_afternoon',
    label: 'Tomorrow Afternoon',
    labelKey: 'rfq.snooze.tomorrowAfternoon',
    getDateTime: () => getSnoozeDateTime('tomorrow_afternoon'),
  },
  {
    id: 'this_weekend',
    label: 'This Weekend',
    labelKey: 'rfq.snooze.thisWeekend',
    getDateTime: () => getSnoozeDateTime('this_weekend'),
  },
  {
    id: 'next_week',
    label: 'Next Week',
    labelKey: 'rfq.snooze.nextWeek',
    getDateTime: () => getSnoozeDateTime('next_week'),
  },
];

// =============================================================================
// Enhanced Inbox Filters & Stats
// =============================================================================

/**
 * Enhanced inbox filter parameters
 */
export interface EnhancedInboxFilters {
  // Existing filters
  status?: string;
  priorityLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priorityScore' | 'requiredDeliveryDate' | 'lastActivityAt';
  sortOrder?: 'asc' | 'desc';

  // NEW: Label filters
  labels?: RFQLabel[];
  excludeLabels?: RFQLabel[];

  // NEW: State filters
  isRead?: boolean;
  isStarred?: boolean;
  includeSnoozed?: boolean;

  // NEW: Thread view
  threadView?: boolean;
}

/**
 * Enhanced inbox statistics
 */
export interface EnhancedInboxStats {
  // Existing stats
  new: number;
  viewed: number;
  underReview: number;
  ignored: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;

  // NEW: Gmail-style stats
  total: number;
  unread: number;
  starred: number;
  snoozed: number;
  expiring: number;
  negotiation: number;
  won: number;
  lost: number;

  // Per-label counts
  labelCounts: Record<RFQLabel, number>;
}

/**
 * Enhanced inbox response
 */
export interface EnhancedInboxResponse {
  rfqs: EnhancedSellerInboxRFQ[];
  threads?: RFQThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: EnhancedInboxStats;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

// Label Management
export interface AddLabelsRequest {
  labels: RFQLabel[];
}

export interface AddLabelsResponse {
  rfq: EnhancedSellerInboxRFQ;
  addedLabels: RFQLabel[];
  removedLabels: RFQLabel[];
}

export interface RemoveLabelsRequest {
  labels: RFQLabel[];
}

export interface BulkLabelsRequest {
  rfqIds: string[];
  addLabels?: RFQLabel[];
  removeLabels?: RFQLabel[];
}

export interface BulkLabelsResponse {
  updated: number;
  failed: string[];
}

// Read/Unread
export interface BulkReadRequest {
  rfqIds: string[];
}

export interface BulkReadResponse {
  updated: number;
}

// Snooze
export interface SnoozeRequest {
  until: string;
  reason?: string;
}

export interface SnoozeResponse {
  rfq: EnhancedSellerInboxRFQ;
  snoozedUntil: string;
}

export interface BulkSnoozeRequest {
  rfqIds: string[];
  until: string;
}

// Star
export interface BulkStarRequest {
  rfqIds: string[];
  starred: boolean;
}

// Thread
export interface ThreadResponse {
  thread: RFQThread;
  messages: ThreadMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface AddThreadMessageRequest {
  content: string;
  type: 'message' | 'counter_offer';
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export interface AddThreadMessageResponse {
  message: ThreadMessage;
  thread: RFQThread;
}

// Saved Replies
export interface CreateSavedReplyRequest {
  name: string;
  shortcut?: string;
  category: SavedReplyCategory;
  subject?: string;
  content: string;
}

export interface UpdateSavedReplyRequest {
  name?: string;
  shortcut?: string;
  category?: SavedReplyCategory;
  subject?: string;
  content?: string;
}

export interface RenderTemplateRequest {
  rfqId: string;
  customVariables?: Record<string, string>;
}

export interface RenderTemplateResponse {
  subject: string;
  content: string;
  missingVariables: string[];
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate SLA status based on deadline
 */
export function calculateSLAStatus(deadline: string | Date): {
  status: SLAStatus;
  remainingMs: number;
  displayText: string;
} {
  const deadlineMs = new Date(deadline).getTime();
  const nowMs = Date.now();
  const remainingMs = deadlineMs - nowMs;

  const hours = Math.floor(Math.abs(remainingMs) / (60 * 60 * 1000));
  const minutes = Math.floor((Math.abs(remainingMs) % (60 * 60 * 1000)) / (60 * 1000));

  if (remainingMs <= 0) {
    return {
      status: 'overdue',
      remainingMs,
      displayText: `${hours}h overdue`,
    };
  }

  if (remainingMs <= 2 * 60 * 60 * 1000) {
    return {
      status: 'critical',
      remainingMs,
      displayText: `Reply in ${hours}h ${minutes}m`,
    };
  }

  if (remainingMs <= 6 * 60 * 60 * 1000) {
    return {
      status: 'warning',
      remainingMs,
      displayText: `Reply in ${hours}h`,
    };
  }

  return {
    status: 'normal',
    remainingMs,
    displayText: `${hours}h left`,
  };
}

/**
 * Format snooze time for display
 */
export function formatSnoozeTime(snoozedUntil: string): string {
  const until = new Date(snoozedUntil);
  const now = new Date();
  const diffMs = until.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Waking up...';
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    return `Snoozed for ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return 'Snoozed until tomorrow';
  }

  return `Snoozed for ${days} days`;
}

/**
 * Check if an RFQ matches filter criteria
 */
export function matchesFilters(
  rfq: EnhancedSellerInboxRFQ,
  filters: EnhancedInboxFilters
): boolean {
  // Label filter
  if (filters.labels?.length) {
    if (!filters.labels.some(l => rfq.labels.includes(l))) {
      return false;
    }
  }

  // Exclude label filter
  if (filters.excludeLabels?.length) {
    if (filters.excludeLabels.some(l => rfq.labels.includes(l))) {
      return false;
    }
  }

  // Read filter
  if (filters.isRead !== undefined && rfq.isRead !== filters.isRead) {
    return false;
  }

  // Starred filter
  if (filters.isStarred !== undefined && rfq.isStarred !== filters.isStarred) {
    return false;
  }

  // Snoozed filter (exclude snoozed by default)
  if (!filters.includeSnoozed && rfq.snoozedUntil) {
    return false;
  }

  return true;
}
