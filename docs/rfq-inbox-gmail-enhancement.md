# RFQ Inbox Gmail-Style Enhancement

## Overview

This document defines the enhancements to transform the existing RFQ Inbox into a Gmail-style intelligent system with threaded conversations, smart labels, saved replies, and enhanced bulk actions.

---

## 1. Enhanced State Model

### 1.1 RFQ Label System

Labels are **non-exclusive tags** that can coexist. An RFQ can have multiple labels simultaneously (e.g., "Expiring" + "Negotiation").

```typescript
// New label types (can have multiple)
export type RFQLabel =
  | 'new'           // Just received, not yet opened
  | 'pending'       // Awaiting seller action
  | 'negotiation'   // Active negotiation in progress
  | 'expiring'      // Deadline approaching (auto-applied)
  | 'won'           // Quote accepted, order created
  | 'lost'          // Quote rejected or expired
  | 'starred'       // User-starred for importance
  | 'snoozed'       // Temporarily hidden
  | 'archived';     // Removed from main inbox

// Label configuration for UI
export interface LabelConfig {
  id: RFQLabel;
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  isSystem: boolean;      // System-managed vs user-applied
  isExclusive: boolean;   // Can't coexist with certain others
  excludes?: RFQLabel[];  // Labels that get removed when this is added
}

export const LABEL_CONFIGS: Record<RFQLabel, LabelConfig> = {
  new: {
    id: 'new',
    name: 'New',
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: 'EnvelopeSimple',
    isSystem: true,
    isExclusive: false,
  },
  pending: {
    id: 'pending',
    name: 'Pending',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: 'Clock',
    isSystem: true,
    isExclusive: false,
  },
  negotiation: {
    id: 'negotiation',
    name: 'Negotiation',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: 'ChatText',
    isSystem: true,
    isExclusive: false,
  },
  expiring: {
    id: 'expiring',
    name: 'Expiring',
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: 'Warning',
    isSystem: true,  // Auto-applied when deadline < 48h
    isExclusive: false,
  },
  won: {
    id: 'won',
    name: 'Won',
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
    color: '#eab308',
    bgColor: '#fefce8',
    icon: 'Star',
    isSystem: false,  // User-applied
    isExclusive: false,
  },
  snoozed: {
    id: 'snoozed',
    name: 'Snoozed',
    color: '#64748b',
    bgColor: '#f1f5f9',
    icon: 'ClockAfternoon',
    isSystem: false,
    isExclusive: false,
  },
  archived: {
    id: 'archived',
    name: 'Archived',
    color: '#9ca3af',
    bgColor: '#f9fafb',
    icon: 'Archive',
    isSystem: false,
    isExclusive: false,
  },
};
```

### 1.2 Enhanced SellerInboxRFQ Interface

```typescript
export interface SellerInboxRFQ {
  // ... existing fields ...

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
  threadId: string;           // Groups related RFQs/quotes/messages
  threadCount: number;        // Total messages in thread
  lastThreadActivity: string; // Most recent activity timestamp
  hasUnreadInThread: boolean; // Any unread messages in thread

  // NEW: Conversation Preview
  latestMessage: {
    type: 'rfq' | 'quote' | 'counter_offer' | 'message' | 'system';
    content: string;          // Truncated preview
    senderType: 'buyer' | 'seller' | 'system';
    timestamp: string;
  } | null;

  // Enhanced SLA
  slaDeadline: string;        // Computed deadline
  slaStatus: 'normal' | 'warning' | 'critical' | 'overdue';
  slaRemainingMs: number;     // Milliseconds remaining
}
```

### 1.3 Thread Model

```typescript
// Thread groups all communications for a single RFQ lifecycle
export interface RFQThread {
  id: string;
  rfqId: string;             // Original RFQ that started the thread
  sellerId: string;
  buyerId: string;

  // Thread Metadata
  subject: string;           // e.g., "RFQ-2024-0042: Industrial Pumps x500"
  itemSummary: string;       // Brief item description

  // Thread State
  status: 'active' | 'won' | 'lost' | 'archived';
  labels: RFQLabel[];

  // Participants
  participants: {
    id: string;
    type: 'buyer' | 'seller';
    name: string;
    company: string;
  }[];

  // Activity Tracking
  messageCount: number;
  unreadCount: number;
  lastActivityAt: string;
  lastActivityType: string;

  // Timeline
  createdAt: string;
  updatedAt: string;
}

// Individual thread message/event
export interface ThreadMessage {
  id: string;
  threadId: string;

  // Message Type
  type:
    | 'rfq_created'
    | 'rfq_viewed'
    | 'quote_sent'
    | 'quote_revised'
    | 'counter_offer'
    | 'message'           // Free-form message
    | 'quote_accepted'
    | 'quote_rejected'
    | 'order_created'
    | 'system';           // System notifications

  // Sender
  senderId: string;
  senderType: 'buyer' | 'seller' | 'system';
  senderName: string;

  // Content
  content: string;
  metadata: Record<string, unknown>;  // Type-specific data

  // Attachments
  attachments: {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }[];

  // Read State
  isRead: boolean;
  readAt: string | null;

  // Timestamps
  createdAt: string;
}
```

### 1.4 Saved Replies Model

```typescript
export interface SavedReply {
  id: string;
  sellerId: string;

  // Template Metadata
  name: string;              // "Standard Quote Response"
  shortcut: string;          // Keyboard shortcut, e.g., "sqr"
  category: SavedReplyCategory;

  // Template Content
  subject: string;           // Optional subject line
  content: string;           // Template body with variables

  // Variables Support
  variables: SavedReplyVariable[];

  // Usage Stats
  useCount: number;
  lastUsedAt: string | null;

  // Metadata
  isDefault: boolean;        // System-provided default
  createdAt: string;
  updatedAt: string;
}

export type SavedReplyCategory =
  | 'quote_response'
  | 'clarification'
  | 'negotiation'
  | 'decline'
  | 'follow_up'
  | 'custom';

export interface SavedReplyVariable {
  name: string;              // e.g., "{{buyer_name}}"
  description: string;
  defaultValue: string;
  isRequired: boolean;
}

// Available template variables
export const TEMPLATE_VARIABLES = {
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
```

---

## 2. State Machine Enhancements

### 2.1 Label State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                     LABEL TRANSITIONS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RFQ Created ────► [new, pending]                               │
│                                                                  │
│  Seller Opens ────► remove [new], keep [pending]                │
│                                                                  │
│  Quote Sent ────► add [negotiation], keep [pending]             │
│                                                                  │
│  Counter Offer ────► keep [negotiation, pending]                │
│                                                                  │
│  Quote Accepted ────► add [won], remove [pending, negotiation]  │
│                                                                  │
│  Quote Rejected ────► add [lost], remove [pending, negotiation] │
│                                                                  │
│  RFQ Expired ────► add [lost, expiring], remove [pending]       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                     SYSTEM AUTO-LABELS                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Deadline < 48h ────► add [expiring]                            │
│                                                                  │
│  Deadline passed ────► add [lost] if no quote sent              │
│                                                                  │
│  Snooze expires ────► remove [snoozed]                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Read/Unread State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   READ/UNREAD TRANSITIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UNREAD STATE:                                                   │
│    - New RFQ arrives                                            │
│    - New message in thread                                      │
│    - Counter offer received                                     │
│    - User marks as unread                                       │
│                                                                  │
│  READ STATE:                                                     │
│    - User opens RFQ detail                                      │
│    - User opens thread                                          │
│    - User marks as read (bulk action)                           │
│                                                                  │
│  Unread ◄────────────► Read                                     │
│    ▲                      │                                     │
│    │   Mark as Unread     │ Open / Mark as Read                 │
│    └──────────────────────┘                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Snooze State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                     SNOOZE TRANSITIONS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Active ────► User clicks Snooze ────► Snoozed                  │
│                                                                  │
│  Snoozed ────► Time expires ────► Active (returns to inbox)     │
│                                                                  │
│  Snoozed ────► User unsnoozes ────► Active                      │
│                                                                  │
│  Snoozed ────► New activity in thread ────► Active              │
│                 (urgent: counter offer, acceptance)              │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                     SNOOZE OPTIONS                               │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  • Later Today (2 hours)                                        │
│  • Tomorrow Morning (9:00 AM)                                   │
│  • Tomorrow Afternoon (2:00 PM)                                 │
│  • This Weekend (Saturday 9:00 AM)                              │
│  • Next Week (Monday 9:00 AM)                                   │
│  • Custom Date/Time                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. UI Behavior Descriptions

### 3.1 Inbox List View Enhancements

#### Row Appearance
```
┌────────────────────────────────────────────────────────────────────────┐
│ ☐ ★ │ RFQ-2024-0042        │ Acme Corp   │ Industrial │ ⏰ 6h  │ ••• │
│      │ [NEW] [EXPIRING]     │ 3 messages  │ Pumps x500 │ left   │     │
│      │ "We need urgent..." │             │            │        │     │
└────────────────────────────────────────────────────────────────────────┘
  │ │    │         │              │            │           │        │
  │ │    │         │              │            │           │        └─ Quick actions
  │ │    │         │              │            │           └─ SLA countdown
  │ │    │         │              │            └─ Item summary
  │ │    │         │              └─ Thread message count
  │ │    │         └─ Labels (colored chips)
  │ │    └─ RFQ Number (bold if unread)
  │ └─ Star toggle
  └─ Checkbox for bulk selection
```

#### Visual States
- **Unread**: Bold text, left border accent, subtle background tint
- **Read**: Normal weight, no accent
- **Snoozed**: Dimmed, clock icon, shows "Snoozed until..."
- **Starred**: Yellow star icon filled
- **Has Activity**: Blue dot indicator
- **Expiring**: Red pulsing indicator on SLA

#### Smart Tab Behavior
| Tab | Filter Logic | Count Source |
|-----|--------------|--------------|
| All | `!archived && !snoozed` | Total active |
| Unread | `!isRead && !archived` | Unread count |
| Starred | `isStarred && !archived` | Starred count |
| Negotiation | `labels.includes('negotiation')` | In negotiation |
| Expiring | `labels.includes('expiring')` | Expiring soon |
| Snoozed | `snoozedUntil != null` | Snoozed count |

### 3.2 Thread View (Slide-over Panel)

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    RFQ-2024-0042: Industrial Pumps    [★] [⋮]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📨 RFQ Created                        Jan 15, 10:30 AM  │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Acme Corp requested a quote for:                        │   │
│  │ • Industrial Pumps (Model XR-500) x 500 units          │   │
│  │ • Delivery: Riyadh, by Feb 15                          │   │
│  │ • Message: "We need these urgently for our new..."     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📤 Quote Sent (v1)                    Jan 15, 2:45 PM   │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ You quoted:                                             │   │
│  │ • Unit Price: SAR 450 → Total: SAR 225,000             │   │
│  │ • Lead Time: 14 days                                   │   │
│  │ • Valid until: Jan 25                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💬 Counter Offer                      Jan 16, 9:15 AM   │   │
│  │ ─────────────────────────────────────────────────────── │   │
│  │ Acme Corp:                                              │   │
│  │ "Can you do SAR 420 per unit? We have a competing..."  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [💬 Reply] [📋 Templates ▼] [📎 Attach]                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Type your message...                                    │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [Send Quote] [Send Message]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Saved Replies Behavior

#### Quick Insert Flow
1. User clicks "Templates" dropdown or presses `/` in message box
2. Shows categorized list of saved replies
3. User selects template
4. Variables auto-filled from RFQ context
5. User can edit before sending

#### Saved Reply Picker UI
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search templates...                                  │
├─────────────────────────────────────────────────────────┤
│ QUOTE RESPONSES                                         │
│   ├─ Standard Quote              [sqr]                  │
│   ├─ Urgent Quote                [uqr]                  │
│   └─ Bulk Discount Quote         [bdq]                  │
│                                                         │
│ CLARIFICATION                                           │
│   ├─ Request Specs               [rsp]                  │
│   └─ Confirm Quantity            [cqt]                  │
│                                                         │
│ NEGOTIATION                                             │
│   ├─ Counter Offer Accept        [coa]                  │
│   └─ Best & Final                [bnf]                  │
│                                                         │
│ DECLINE                                                 │
│   ├─ Out of Stock                [oos]                  │
│   └─ Cannot Meet Timeline        [cmt]                  │
├─────────────────────────────────────────────────────────┤
│ [+ Create New Template]                                 │
└─────────────────────────────────────────────────────────┘
```

### 3.4 Bulk Actions Enhancement

#### Selection Mode Actions
| Action | Shortcut | Description |
|--------|----------|-------------|
| Mark as Read | `Shift+I` | Remove unread state |
| Mark as Unread | `Shift+U` | Add unread state |
| Star | `S` | Toggle star on selected |
| Add Label | `L` | Open label picker |
| Remove Label | `Shift+L` | Remove specific label |
| Snooze | `Z` | Open snooze picker |
| Archive | `E` | Move to archive |
| Delete | `#` | Permanently delete |

#### Bulk Action Bar (appears when items selected)
```
┌─────────────────────────────────────────────────────────────────┐
│ ☑ 5 selected  [Clear]     [Mark Read] [★] [🏷️] [⏰] [📁] [🗑️] │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 SLA Countdown Display

#### Visual States
| Time Remaining | Display | Color | Animation |
|----------------|---------|-------|-----------|
| > 12 hours | "23h 45m left" | Green | None |
| 6-12 hours | "8h 30m left" | Yellow | None |
| 2-6 hours | "Reply in 4h" | Orange | Subtle pulse |
| < 2 hours | "Reply in 1h 15m" | Red | Pulse |
| Overdue | "3h overdue" | Red | Strong pulse |

#### SLA Badge Component
```typescript
interface SLABadgeProps {
  deadline: string;
  status: 'normal' | 'warning' | 'critical' | 'overdue';
  compact?: boolean;  // For list view vs detail view
}
```

---

## 4. Backend API Additions

### 4.1 Label Management APIs

```typescript
// POST /api/rfq/inbox/:id/labels
// Add labels to an RFQ
interface AddLabelsRequest {
  labels: RFQLabel[];
}
interface AddLabelsResponse {
  rfq: SellerInboxRFQ;
  addedLabels: RFQLabel[];
  removedLabels: RFQLabel[];  // Auto-removed due to exclusion rules
}

// DELETE /api/rfq/inbox/:id/labels
// Remove labels from an RFQ
interface RemoveLabelsRequest {
  labels: RFQLabel[];
}
interface RemoveLabelsResponse {
  rfq: SellerInboxRFQ;
  removedLabels: RFQLabel[];
}

// POST /api/rfq/inbox/bulk/labels
// Bulk label management
interface BulkLabelsRequest {
  rfqIds: string[];
  addLabels?: RFQLabel[];
  removeLabels?: RFQLabel[];
}
interface BulkLabelsResponse {
  updated: number;
  failed: string[];
}
```

### 4.2 Read/Unread APIs

```typescript
// POST /api/rfq/inbox/:id/read
// Mark as read (no body needed)
interface MarkReadResponse {
  rfq: SellerInboxRFQ;
}

// POST /api/rfq/inbox/:id/unread
// Mark as unread (no body needed)
interface MarkUnreadResponse {
  rfq: SellerInboxRFQ;
}

// POST /api/rfq/inbox/bulk/read
// Bulk mark as read
interface BulkMarkReadRequest {
  rfqIds: string[];
}

// POST /api/rfq/inbox/bulk/unread
// Bulk mark as unread
interface BulkMarkUnreadRequest {
  rfqIds: string[];
}
```

### 4.3 Snooze APIs

```typescript
// POST /api/rfq/inbox/:id/snooze
interface SnoozeRequest {
  until: string;           // ISO datetime
  reason?: string;         // Optional note
}
interface SnoozeResponse {
  rfq: SellerInboxRFQ;
  snoozedUntil: string;
}

// DELETE /api/rfq/inbox/:id/snooze
// Unsnooze an RFQ (no body needed)
interface UnsnoozeResponse {
  rfq: SellerInboxRFQ;
}

// POST /api/rfq/inbox/bulk/snooze
interface BulkSnoozeRequest {
  rfqIds: string[];
  until: string;
}

// GET /api/rfq/inbox/snoozed
// Get all snoozed RFQs with their wake times
interface SnoozedListResponse {
  rfqs: SellerInboxRFQ[];
  total: number;
}
```

### 4.4 Star APIs

```typescript
// POST /api/rfq/inbox/:id/star
// Star an RFQ (no body needed)

// DELETE /api/rfq/inbox/:id/star
// Unstar an RFQ (no body needed)

// POST /api/rfq/inbox/bulk/star
interface BulkStarRequest {
  rfqIds: string[];
  starred: boolean;  // true to star, false to unstar
}
```

### 4.5 Thread APIs

```typescript
// GET /api/rfq/inbox/:id/thread
// Get full thread for an RFQ
interface ThreadResponse {
  thread: RFQThread;
  messages: ThreadMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// POST /api/rfq/inbox/:id/thread/messages
// Add a message to thread
interface AddThreadMessageRequest {
  content: string;
  type: 'message' | 'counter_offer';
  attachments?: string[];  // File IDs
  metadata?: Record<string, unknown>;
}
interface AddThreadMessageResponse {
  message: ThreadMessage;
  thread: RFQThread;
}

// POST /api/rfq/inbox/:id/thread/mark-read
// Mark all thread messages as read
interface MarkThreadReadResponse {
  markedCount: number;
  thread: RFQThread;
}
```

### 4.6 Saved Replies APIs

```typescript
// GET /api/seller/saved-replies
// List all saved replies
interface SavedRepliesListResponse {
  replies: SavedReply[];
  categories: SavedReplyCategory[];
}

// POST /api/seller/saved-replies
// Create saved reply
interface CreateSavedReplyRequest {
  name: string;
  shortcut?: string;
  category: SavedReplyCategory;
  subject?: string;
  content: string;
}
interface CreateSavedReplyResponse {
  reply: SavedReply;
}

// PATCH /api/seller/saved-replies/:id
// Update saved reply
interface UpdateSavedReplyRequest {
  name?: string;
  shortcut?: string;
  category?: SavedReplyCategory;
  subject?: string;
  content?: string;
}

// DELETE /api/seller/saved-replies/:id
// Delete saved reply

// POST /api/seller/saved-replies/:id/render
// Render template with RFQ context
interface RenderTemplateRequest {
  rfqId: string;
  customVariables?: Record<string, string>;
}
interface RenderTemplateResponse {
  subject: string;
  content: string;
  missingVariables: string[];
}

// POST /api/seller/saved-replies/:id/use
// Record template usage (for stats)
interface RecordUsageRequest {
  rfqId: string;
}
```

### 4.7 Enhanced Inbox API

```typescript
// GET /api/rfq/inbox (enhanced)
interface EnhancedInboxFilters extends InboxFilters {
  labels?: RFQLabel[];           // Filter by labels
  excludeLabels?: RFQLabel[];    // Exclude labels
  isRead?: boolean;              // Read/unread filter
  isStarred?: boolean;           // Starred filter
  hasSnoozed?: boolean;          // Include/exclude snoozed
  threadView?: boolean;          // Group by thread
}

interface EnhancedInboxResponse {
  rfqs: SellerInboxRFQ[];
  threads?: RFQThread[];         // If threadView=true
  pagination: Pagination;
  stats: EnhancedInboxStats;
}

interface EnhancedInboxStats extends InboxStats {
  unread: number;
  starred: number;
  snoozed: number;
  expiring: number;
  negotiation: number;
  won: number;
  lost: number;
  labelCounts: Record<RFQLabel, number>;
}
```

---

## 5. Database Schema Changes

### 5.1 ItemRFQ Table Additions

```prisma
model ItemRFQ {
  // ... existing fields ...

  // NEW: Label System (JSON array of label strings)
  labels           String[]  @default([])

  // NEW: Read/Unread State
  isRead           Boolean   @default(false)
  readAt           DateTime?
  markedUnreadAt   DateTime?

  // NEW: Snooze Support
  snoozedUntil     DateTime?
  snoozeReason     String?

  // NEW: Star
  isStarred        Boolean   @default(false)
  starredAt        DateTime?

  // NEW: Threading
  threadId         String?

  // Relations
  thread           RFQThread?  @relation(fields: [threadId], references: [id])

  @@index([sellerId, isRead])
  @@index([sellerId, isStarred])
  @@index([sellerId, snoozedUntil])
  @@index([threadId])
}
```

### 5.2 New RFQThread Table

```prisma
model RFQThread {
  id              String    @id @default(uuid())
  sellerId        String
  buyerId         String

  // Thread Metadata
  subject         String
  itemSummary     String?

  // Thread State
  status          String    @default("active")  // active, won, lost, archived

  // Activity Tracking
  messageCount    Int       @default(1)
  unreadCount     Int       @default(1)
  lastActivityAt  DateTime  @default(now())
  lastActivityType String   @default("rfq_created")

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  rfqs            ItemRFQ[]
  messages        ThreadMessage[]

  @@index([sellerId])
  @@index([buyerId])
  @@index([sellerId, status])
  @@index([lastActivityAt])
}
```

### 5.3 New ThreadMessage Table

```prisma
model ThreadMessage {
  id          String    @id @default(uuid())
  threadId    String

  // Message Type
  type        String    // rfq_created, quote_sent, counter_offer, message, etc.

  // Sender
  senderId    String
  senderType  String    // buyer, seller, system
  senderName  String

  // Content
  content     String
  metadata    String?   // JSON

  // Read State
  isRead      Boolean   @default(false)
  readAt      DateTime?

  // Timestamps
  createdAt   DateTime  @default(now())

  // Relations
  thread      RFQThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  @@index([threadId])
  @@index([threadId, createdAt])
  @@index([threadId, isRead])
}
```

### 5.4 New SavedReply Table

```prisma
model SavedReply {
  id          String    @id @default(uuid())
  sellerId    String

  // Template Metadata
  name        String
  shortcut    String?
  category    String    @default("custom")

  // Template Content
  subject     String?
  content     String

  // Usage Stats
  useCount    Int       @default(0)
  lastUsedAt  DateTime?

  // Metadata
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([sellerId, shortcut])
  @@index([sellerId])
  @@index([sellerId, category])
}
```

---

## 6. Background Jobs

### 6.1 SLA Warning Job

```typescript
// Runs every 15 minutes
async function checkExpiringRFQs() {
  const expiringThreshold = 48 * 60 * 60 * 1000; // 48 hours

  // Find RFQs approaching deadline without 'expiring' label
  const rfqs = await prisma.itemRFQ.findMany({
    where: {
      status: { in: ['new', 'viewed', 'under_review'] },
      NOT: { labels: { has: 'expiring' } },
      OR: [
        { requiredDeliveryDate: { lte: addMs(now(), expiringThreshold) } },
        { expiresAt: { lte: addMs(now(), expiringThreshold) } },
      ],
    },
  });

  for (const rfq of rfqs) {
    await addLabel(rfq.id, 'expiring');
    await sendNotification(rfq.sellerId, 'rfq_expiring', rfq);
  }
}
```

### 6.2 Snooze Expiration Job

```typescript
// Runs every minute
async function processExpiredSnoozes() {
  const expiredSnoozes = await prisma.itemRFQ.findMany({
    where: {
      snoozedUntil: { lte: new Date() },
    },
  });

  for (const rfq of expiredSnoozes) {
    await prisma.itemRFQ.update({
      where: { id: rfq.id },
      data: {
        snoozedUntil: null,
        snoozeReason: null,
        labels: rfq.labels.filter(l => l !== 'snoozed'),
      },
    });

    await logEvent(rfq.id, 'SNOOZE_EXPIRED', {
      originalSnoozeUntil: rfq.snoozedUntil,
    });
  }
}
```

### 6.3 Auto-Lost Job

```typescript
// Runs every hour
async function markExpiredAsLost() {
  const expiredRFQs = await prisma.itemRFQ.findMany({
    where: {
      status: { in: ['new', 'viewed'] },  // Never responded
      expiresAt: { lte: new Date() },
      NOT: { labels: { has: 'lost' } },
    },
  });

  for (const rfq of expiredRFQs) {
    await prisma.itemRFQ.update({
      where: { id: rfq.id },
      data: {
        status: 'expired',
        labels: [...rfq.labels.filter(l => !['pending', 'negotiation'].includes(l)), 'lost'],
      },
    });

    await logEvent(rfq.id, 'RFQ_EXPIRED_AUTO_LOST', {});
  }
}
```

---

## 7. Migration Path

### Phase 1: Database Schema
1. Add new columns with defaults
2. Create new tables (RFQThread, ThreadMessage, SavedReply)
3. Backfill existing RFQs:
   - Set `isRead = true` for viewed RFQs
   - Set `labels = ['new']` for status='new'
   - Create threads for existing RFQs

### Phase 2: Backend APIs
1. Add label management endpoints
2. Add read/unread endpoints
3. Add snooze endpoints
4. Add thread endpoints
5. Add saved replies endpoints
6. Enhance inbox listing endpoint

### Phase 3: Background Jobs
1. Deploy SLA warning job
2. Deploy snooze expiration job
3. Deploy auto-lost job

### Phase 4: Frontend
1. Update type definitions
2. Enhance inbox list component
3. Add label chips and filtering
4. Add thread view panel
5. Add saved replies picker
6. Enhance bulk actions bar
7. Add keyboard shortcuts

---

## 8. Keyboard Shortcuts Reference

| Shortcut | Action | Context |
|----------|--------|---------|
| `j` | Next item | List |
| `k` | Previous item | List |
| `Enter` | Open item | List |
| `x` | Toggle selection | List |
| `Shift+A` | Select all | List |
| `Escape` | Clear selection / Close panel | Any |
| `r` | Quick reply | List / Detail |
| `/` | Insert saved reply | Composer |
| `s` | Toggle star | List / Detail |
| `l` | Open label picker | List / Detail |
| `z` | Snooze | List / Detail |
| `e` | Archive | List / Detail |
| `Shift+I` | Mark as read | List |
| `Shift+U` | Mark as unread | List |
| `?` | Show shortcuts help | Any |
| `g` then `i` | Go to inbox | Any |
| `g` then `s` | Go to starred | Any |
| `g` then `z` | Go to snoozed | Any |
