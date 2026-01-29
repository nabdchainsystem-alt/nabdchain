# NABD Feature Implementation Plan

> Complete roadmap to achieve feature parity with Monday.com and ClickUp

---

## Table of Contents

1. [Phase 1: Core PM Features](#phase-1-core-pm-features)
2. [Phase 2: Collaboration & Communication](#phase-2-collaboration--communication)
3. [Phase 3: Integrations & API](#phase-3-integrations--api)
4. [Phase 4: Advanced Project Management](#phase-4-advanced-project-management)
5. [Phase 5: AI & Intelligence](#phase-5-ai--intelligence)
6. [Phase 6: Enterprise Security](#phase-6-enterprise-security)
7. [Phase 7: Mobile & Offline](#phase-7-mobile--offline)
8. [Phase 8: Templates & Onboarding](#phase-8-templates--onboarding)
9. [Phase 9: Advanced Reporting](#phase-9-advanced-reporting)
10. [Phase 10: Polish & Extras](#phase-10-polish--extras)

---

## Phase 1: Core PM Features
**Priority: CRITICAL | Complexity: Medium-High**

These are table-stakes features that users expect from any project management tool.

### 1.1 Time Tracking System

#### Overview
Built-in time tracking with timer, manual entry, and reporting capabilities.

#### New Files to Create
```
src/features/board/views/Table/components/pickers/TimeTrackingPicker.tsx
src/features/board/views/Table/components/TimeTracker.tsx
src/features/timetracking/
├── TimeTrackingPage.tsx
├── components/
│   ├── Timer.tsx
│   ├── TimerButton.tsx
│   ├── TimeEntryModal.tsx
│   ├── TimeEntryList.tsx
│   ├── TimesheetView.tsx
│   ├── TimeReportChart.tsx
│   └── BillableToggle.tsx
├── hooks/
│   ├── useTimer.ts
│   ├── useTimeEntries.ts
│   └── useTimeReports.ts
├── services/
│   └── timeTrackingService.ts
└── types.ts
```

#### Database Schema (Prisma)
```prisma
model TimeEntry {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  taskId      String?
  rowId       String?
  boardId     String
  board       Board    @relation(fields: [boardId], references: [id])
  description String?
  startTime   DateTime
  endTime     DateTime?
  duration    Int      // in seconds
  billable    Boolean  @default(false)
  hourlyRate  Float?
  tags        String[] // JSON array
  source      String   @default("manual") // manual, timer, import
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TimeTrackingSettings {
  id                String  @id @default(cuid())
  workspaceId       String  @unique
  workspace         Workspace @relation(fields: [workspaceId], references: [id])
  defaultBillable   Boolean @default(false)
  defaultHourlyRate Float?
  roundingRule      String  @default("none") // none, 15min, 30min, 1hour
  requireDescription Boolean @default(false)
}
```

#### API Endpoints
```
POST   /api/time-entries              - Create time entry
GET    /api/time-entries              - List time entries (with filters)
GET    /api/time-entries/:id          - Get single entry
PATCH  /api/time-entries/:id          - Update entry
DELETE /api/time-entries/:id          - Delete entry
POST   /api/time-entries/start        - Start timer
POST   /api/time-entries/stop         - Stop timer
GET    /api/time-entries/running      - Get running timer
GET    /api/time-reports/summary      - Aggregated reports
GET    /api/time-reports/by-user      - Time by user
GET    /api/time-reports/by-project   - Time by project
GET    /api/time-reports/by-task      - Time by task
```

#### Column Type Implementation
```typescript
// New column type for boards
interface TimeTrackingColumn {
  type: 'time_tracking';
  config: {
    showBillable: boolean;
    showTimer: boolean;
    allowManualEntry: boolean;
  };
}

// Cell value structure
interface TimeTrackingCellValue {
  totalTime: number; // seconds
  entries: TimeEntryReference[];
  runningTimer?: {
    startTime: string;
    userId: string;
  };
}
```

#### UI Components Specification

**TimerButton.tsx**
- Play/Pause toggle button
- Shows elapsed time when running
- Click to start/stop
- Long press to add manual entry

**TimeEntryModal.tsx**
- Date picker for entry date
- Start time / End time inputs
- Duration calculator (auto-calculate from times)
- Description field
- Billable checkbox
- Tag selector
- Project/Task selector

**TimesheetView.tsx**
- Weekly view grid (days as columns)
- Rows grouped by project/task
- Daily totals row
- Weekly total column
- Edit inline capability
- Bulk actions

**TimeReportChart.tsx**
- Bar chart for daily/weekly/monthly totals
- Pie chart for time by project
- Line chart for trends
- Filter by date range, user, project

---

### 1.2 Task Dependencies

#### Overview
Link tasks with dependency relationships for proper project sequencing.

#### New Files to Create
```
src/features/board/components/dependencies/
├── DependencyManager.tsx
├── DependencyLine.tsx
├── DependencyModal.tsx
├── DependencyBadge.tsx
├── DependencyGraph.tsx
└── CriticalPath.tsx
src/features/board/hooks/
├── useDependencies.ts
└── useCriticalPath.ts
src/services/dependencyService.ts
```

#### Database Schema
```prisma
model TaskDependency {
  id              String   @id @default(cuid())
  boardId         String
  board           Board    @relation(fields: [boardId], references: [id])
  predecessorId   String   // The task that must complete first
  successorId     String   // The task that depends on predecessor
  dependencyType  String   @default("finish_to_start")
  // Types: finish_to_start, start_to_start, finish_to_finish, start_to_finish
  lagDays         Int      @default(0) // Delay between tasks
  createdAt       DateTime @default(now())
  createdBy       String

  @@unique([predecessorId, successorId])
}

model Milestone {
  id          String   @id @default(cuid())
  boardId     String
  board       Board    @relation(fields: [boardId], references: [id])
  rowId       String   @unique
  name        String
  dueDate     DateTime
  completed   Boolean  @default(false)
  completedAt DateTime?
  color       String   @default("#6366f1")
  createdAt   DateTime @default(now())
}
```

#### API Endpoints
```
POST   /api/dependencies                    - Create dependency
GET    /api/dependencies/board/:boardId     - Get all dependencies for board
DELETE /api/dependencies/:id                - Remove dependency
GET    /api/dependencies/check-circular     - Validate no circular deps
GET    /api/critical-path/:boardId          - Calculate critical path
POST   /api/milestones                      - Create milestone
GET    /api/milestones/board/:boardId       - Get milestones
PATCH  /api/milestones/:id                  - Update milestone
```

#### Dependency Types
```typescript
enum DependencyType {
  FINISH_TO_START = 'finish_to_start',   // Task B starts when Task A finishes
  START_TO_START = 'start_to_start',     // Task B starts when Task A starts
  FINISH_TO_FINISH = 'finish_to_finish', // Task B finishes when Task A finishes
  START_TO_FINISH = 'start_to_finish',   // Task B finishes when Task A starts
}

interface Dependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagDays: number;
}
```

#### Gantt Chart Integration
- Draw SVG lines between dependent tasks
- Arrow indicators showing direction
- Highlight critical path in red
- Drag to adjust dates (respecting dependencies)
- Warning when dependencies are violated

#### UI Components

**DependencyModal.tsx**
- Search/select predecessor task
- Dependency type dropdown
- Lag days input
- Preview of resulting dates
- Circular dependency warning

**DependencyLine.tsx (SVG)**
- Bezier curve connection
- Arrow head at successor
- Color coding by type
- Hover to highlight related tasks
- Click to edit/delete

**CriticalPath.tsx**
- Toggle to show/hide critical path
- Highlights longest path through project
- Shows total project duration
- Slack time for non-critical tasks

---

### 1.3 Formula Fields

#### Overview
Calculated columns that compute values based on other columns.

#### New Files
```
src/features/board/views/Table/components/pickers/FormulaPicker.tsx
src/features/board/formula/
├── FormulaEditor.tsx
├── FormulaParser.ts
├── FormulaEvaluator.ts
├── FormulaFunctions.ts
├── FormulaSuggestions.tsx
└── types.ts
```

#### Formula Functions to Support
```typescript
// Math Functions
SUM(column)           // Sum of column values
AVG(column)           // Average
MIN(column)           // Minimum value
MAX(column)           // Maximum value
COUNT(column)         // Count non-empty
ROUND(value, decimals)
ABS(value)
FLOOR(value)
CEIL(value)

// Text Functions
CONCAT(val1, val2, ...)
LEFT(text, count)
RIGHT(text, count)
MID(text, start, count)
LEN(text)
UPPER(text)
LOWER(text)
TRIM(text)
SUBSTITUTE(text, old, new)

// Date Functions
TODAY()
NOW()
DAYS(date1, date2)
WORKDAYS(date1, date2)
DATEADD(date, days)
MONTH(date)
YEAR(date)
WEEKDAY(date)

// Logic Functions
IF(condition, true_val, false_val)
AND(cond1, cond2, ...)
OR(cond1, cond2, ...)
NOT(condition)
SWITCH(value, case1, result1, case2, result2, ..., default)
ISBLANK(value)

// Lookup Functions
LOOKUP(value, column)
COUNTIF(column, condition)
SUMIF(column, condition)

// Special Functions
{column_name}         // Reference another column
{Status}              // Returns status value
ROLLUP(relation, column, function)
```

#### Formula Parser Implementation
```typescript
// Tokenizer
type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'COLUMN_REF'; value: string }
  | { type: 'FUNCTION'; value: string }
  | { type: 'OPERATOR'; value: string }
  | { type: 'PAREN'; value: '(' | ')' }
  | { type: 'COMMA' };

// AST Node
type ASTNode =
  | { type: 'Literal'; value: number | string | boolean }
  | { type: 'ColumnRef'; columnId: string }
  | { type: 'FunctionCall'; name: string; args: ASTNode[] }
  | { type: 'BinaryOp'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'UnaryOp'; operator: string; operand: ASTNode };

// Evaluator context
interface EvaluationContext {
  row: Row;
  board: Board;
  allRows: Row[];
  columns: Column[];
}
```

#### UI Components

**FormulaEditor.tsx**
- Monaco editor with syntax highlighting
- Autocomplete for functions and columns
- Real-time preview of result
- Error highlighting
- Function documentation on hover

**FormulaSuggestions.tsx**
- Dropdown of available functions
- Column references with types
- Recently used formulas
- Template formulas

---

### 1.4 Rollup Fields

#### Overview
Aggregate data from linked items or subtasks.

#### Implementation
```typescript
interface RollupColumn {
  type: 'rollup';
  config: {
    sourceRelation: string;      // Related column/board
    sourceColumn: string;        // Column to aggregate
    aggregation: RollupAggregation;
  };
}

type RollupAggregation =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'count_unique'
  | 'percent_complete'
  | 'earliest_date'
  | 'latest_date'
  | 'concat';
```

---

### 1.5 Progress Bar Field

#### New Files
```
src/features/board/views/Table/components/pickers/ProgressPicker.tsx
```

#### Implementation
```typescript
interface ProgressColumn {
  type: 'progress';
  config: {
    mode: 'manual' | 'auto';
    autoSource?: {
      type: 'subtasks' | 'checklist' | 'column';
      columnId?: string;
    };
    showPercentage: boolean;
    color: string;
  };
}

// ProgressPicker.tsx
const ProgressPicker: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm text-gray-600">{value}%</span>
    </div>
  );
};
```

---

### 1.6 Checkbox Field

#### New Files
```
src/features/board/views/Table/components/pickers/CheckboxPicker.tsx
```

#### Implementation
```typescript
interface CheckboxColumn {
  type: 'checkbox';
  config: {
    defaultValue: boolean;
    label?: string;
  };
}
```

---

### 1.7 URL/Link Field

#### New Files
```
src/features/board/views/Table/components/pickers/LinkPicker.tsx
```

#### Implementation
```typescript
interface LinkColumn {
  type: 'link';
  config: {
    showPreview: boolean;
    openInNewTab: boolean;
  };
}

interface LinkValue {
  url: string;
  label?: string;
}
```

---

### 1.8 Auto-Number Field

#### New Files
```
src/features/board/views/Table/components/pickers/AutoNumberPicker.tsx
```

#### Implementation
```typescript
interface AutoNumberColumn {
  type: 'auto_number';
  config: {
    prefix?: string;        // e.g., "TASK-"
    suffix?: string;
    startFrom: number;
    increment: number;
    padLength?: number;     // e.g., 4 for "0001"
  };
}

// Auto-generated on row creation, read-only
```

---

### 1.9 Button Field

#### New Files
```
src/features/board/views/Table/components/pickers/ButtonPicker.tsx
src/features/board/components/ButtonActionModal.tsx
```

#### Implementation
```typescript
interface ButtonColumn {
  type: 'button';
  config: {
    label: string;
    icon?: string;
    color: string;
    action: ButtonAction;
  };
}

type ButtonAction =
  | { type: 'open_url'; url: string }
  | { type: 'run_automation'; automationId: string }
  | { type: 'update_status'; statusValue: string }
  | { type: 'send_notification'; template: string }
  | { type: 'create_item'; boardId: string; template: object }
  | { type: 'custom_webhook'; url: string; payload: object };
```

---

### 1.10 Location/Address Field

#### New Files
```
src/features/board/views/Table/components/pickers/LocationPicker.tsx
src/features/board/components/MapView.tsx
```

#### Implementation
```typescript
interface LocationColumn {
  type: 'location';
  config: {
    showMap: boolean;
    defaultZoom: number;
  };
}

interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}
```

---

## Phase 2: Collaboration & Communication
**Priority: HIGH | Complexity: Medium**

### 2.1 @Mentions System

#### Overview
Tag users in comments and descriptions with notifications.

#### New Files
```
src/features/mentions/
├── MentionInput.tsx
├── MentionSuggestions.tsx
├── MentionHighlight.tsx
├── hooks/
│   └── useMentions.ts
└── services/
    └── mentionService.ts
src/features/notifications/
├── NotificationCenter.tsx
├── NotificationItem.tsx
├── NotificationBell.tsx
├── hooks/
│   └── useNotifications.ts
└── services/
    └── notificationService.ts
```

#### Database Schema
```prisma
model Mention {
  id          String   @id @default(cuid())
  userId      String   // User being mentioned
  user        User     @relation(fields: [userId], references: [id])
  mentionedBy String   // User who mentioned
  entityType  String   // comment, description, doc
  entityId    String
  boardId     String?
  text        String   // Context around mention
  read        Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // mention, assignment, due_date, comment, etc.
  title       String
  body        String?
  entityType  String?
  entityId    String?
  boardId     String?
  read        Boolean  @default(false)
  emailSent   Boolean  @default(false)
  pushSent    Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model NotificationPreferences {
  id                String  @id @default(cuid())
  userId            String  @unique
  user              User    @relation(fields: [userId], references: [id])
  emailMentions     Boolean @default(true)
  emailAssignments  Boolean @default(true)
  emailDueDates     Boolean @default(true)
  emailComments     Boolean @default(false)
  pushEnabled       Boolean @default(true)
  pushMentions      Boolean @default(true)
  pushAssignments   Boolean @default(true)
  quietHoursStart   String? // "22:00"
  quietHoursEnd     String? // "08:00"
}
```

#### MentionInput Component
```typescript
interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention: (userId: string) => void;
  placeholder?: string;
}

// Trigger suggestions on @ character
// Filter users as user types
// Insert mention as special token: @[User Name](user_id)
// Parse mentions on save and create Mention records
```

#### Real-time Notifications (WebSocket)
```typescript
// Notification events
socket.on('notification:new', (notification) => {
  // Add to notification center
  // Show toast if enabled
  // Update badge count
});

socket.on('notification:read', (notificationId) => {
  // Mark as read in UI
});
```

---

### 2.2 Threaded Comments

#### New Files
```
src/features/comments/
├── CommentSection.tsx
├── CommentThread.tsx
├── CommentItem.tsx
├── CommentInput.tsx
├── CommentReactions.tsx
└── hooks/
    └── useComments.ts
```

#### Database Schema
```prisma
model Comment {
  id          String    @id @default(cuid())
  content     String
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  entityType  String    // row, board, doc, etc.
  entityId    String
  parentId    String?   // For threading
  parent      Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies     Comment[] @relation("CommentReplies")
  reactions   CommentReaction[]
  attachments String[]  // File URLs
  edited      Boolean   @default(false)
  editedAt    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model CommentReaction {
  id        String  @id @default(cuid())
  commentId String
  comment   Comment @relation(fields: [commentId], references: [id])
  userId    String
  emoji     String  // 👍, ❤️, etc.

  @@unique([commentId, userId, emoji])
}
```

---

### 2.3 Proofing & Annotations

#### Overview
Comment directly on images and documents with visual markers.

#### New Files
```
src/features/proofing/
├── ProofingView.tsx
├── AnnotationLayer.tsx
├── AnnotationMarker.tsx
├── AnnotationThread.tsx
├── ProofingToolbar.tsx
└── hooks/
    └── useAnnotations.ts
```

#### Database Schema
```prisma
model Annotation {
  id          String   @id @default(cuid())
  fileId      String
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  x           Float    // Percentage position
  y           Float
  width       Float?   // For rectangle annotations
  height      Float?
  type        String   // point, rectangle, arrow
  page        Int      @default(1) // For multi-page docs
  status      String   @default("open") // open, resolved
  comments    AnnotationComment[]
  createdAt   DateTime @default(now())
}
```

---

### 2.4 Guest Access

#### Overview
Invite external users with limited permissions.

#### New Files
```
src/features/guests/
├── GuestInviteModal.tsx
├── GuestManagement.tsx
├── GuestPermissions.tsx
└── services/
    └── guestService.ts
```

#### Database Schema
```prisma
model Guest {
  id            String   @id @default(cuid())
  email         String
  name          String?
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  invitedBy     String
  accessLevel   String   @default("view") // view, comment, edit
  boards        GuestBoardAccess[]
  expiresAt     DateTime?
  lastAccess    DateTime?
  createdAt     DateTime @default(now())

  @@unique([email, workspaceId])
}

model GuestBoardAccess {
  id          String @id @default(cuid())
  guestId     String
  guest       Guest  @relation(fields: [guestId], references: [id])
  boardId     String
  board       Board  @relation(fields: [boardId], references: [id])
  accessLevel String @default("view")

  @@unique([guestId, boardId])
}
```

---

### 2.5 Public Board Sharing

#### New Files
```
src/features/sharing/
├── ShareModal.tsx
├── ShareSettings.tsx
├── PublicBoardView.tsx
├── EmbedGenerator.tsx
└── services/
    └── sharingService.ts
```

#### Database Schema
```prisma
model BoardShare {
  id            String   @id @default(cuid())
  boardId       String
  board         Board    @relation(fields: [boardId], references: [id])
  shareToken    String   @unique @default(cuid())
  isPublic      Boolean  @default(false)
  allowComments Boolean  @default(false)
  password      String?  // Hashed
  expiresAt     DateTime?
  viewCount     Int      @default(0)
  createdBy     String
  createdAt     DateTime @default(now())
}
```

#### Public URL Structure
```
https://app.nabd.com/public/board/{shareToken}
https://app.nabd.com/embed/board/{shareToken}
```

---

### 2.6 Email Notifications

#### New Files
```
src/features/notifications/email/
├── EmailTemplates.tsx
├── EmailPreferences.tsx
└── services/
    └── emailNotificationService.ts
server/src/services/
├── emailService.ts (enhance existing)
└── templates/
    ├── mention.html
    ├── assignment.html
    ├── due-date.html
    ├── comment.html
    └── digest.html
```

#### Email Types
```typescript
type EmailNotificationType =
  | 'mention'           // Someone mentioned you
  | 'assignment'        // Task assigned to you
  | 'due_date_reminder' // Task due soon
  | 'due_date_passed'   // Task overdue
  | 'comment'           // New comment on your task
  | 'status_change'     // Status changed on your task
  | 'daily_digest'      // Daily summary
  | 'weekly_digest';    // Weekly summary
```

---

## Phase 3: Integrations & API
**Priority: HIGH | Complexity: High**

### 3.1 Slack Integration

#### New Files
```
src/features/integrations/slack/
├── SlackConnectButton.tsx
├── SlackSettings.tsx
├── SlackChannelPicker.tsx
└── services/
    └── slackService.ts
server/src/routes/integrations/
├── slack.ts
server/src/services/integrations/
├── slackService.ts
```

#### Features
- Connect Slack workspace (OAuth)
- Post to channels on board events
- Create tasks from Slack messages
- Slack slash commands (/nabd create, /nabd status)
- Interactive message buttons
- Thread sync between Slack and NABD

#### Database Schema
```prisma
model SlackIntegration {
  id              String @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  slackTeamId     String
  slackTeamName   String
  accessToken     String // Encrypted
  botUserId       String
  installedBy     String
  channels        SlackChannelMapping[]
  createdAt       DateTime @default(now())

  @@unique([workspaceId, slackTeamId])
}

model SlackChannelMapping {
  id              String @id @default(cuid())
  integrationId   String
  integration     SlackIntegration @relation(fields: [integrationId], references: [id])
  boardId         String
  slackChannelId  String
  slackChannelName String
  notifyOn        String[] // ["create", "status_change", "comment", "due_date"]
}
```

#### Slack App Manifest
```yaml
display_information:
  name: NABD
  description: Project management integration
features:
  bot_user:
    display_name: NABD Bot
  slash_commands:
    - command: /nabd
      description: Interact with NABD
oauth_config:
  scopes:
    bot:
      - chat:write
      - commands
      - channels:read
      - users:read
```

---

### 3.2 Microsoft Teams Integration

#### Similar structure to Slack
```
src/features/integrations/teams/
├── TeamsConnectButton.tsx
├── TeamsSettings.tsx
└── services/
    └── teamsService.ts
```

---

### 3.3 GitHub Integration

#### New Files
```
src/features/integrations/github/
├── GitHubConnectButton.tsx
├── GitHubSettings.tsx
├── GitHubRepoSelector.tsx
├── GitHubPRList.tsx
├── GitHubIssueSync.tsx
└── services/
    └── githubService.ts
server/src/routes/integrations/
├── github.ts
server/src/services/integrations/
├── githubService.ts
```

#### Features
- Connect GitHub repos
- Sync issues ↔ tasks (bidirectional)
- Link PRs to tasks
- Show PR status on tasks
- Auto-update task status on PR merge
- Create branches from tasks

#### Database Schema
```prisma
model GitHubIntegration {
  id              String @id @default(cuid())
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  installationId  Int
  accountLogin    String
  accountType     String // user, organization
  accessToken     String // Encrypted
  repos           GitHubRepoMapping[]
  createdAt       DateTime @default(now())
}

model GitHubRepoMapping {
  id              String @id @default(cuid())
  integrationId   String
  integration     GitHubIntegration @relation(fields: [integrationId], references: [id])
  boardId         String
  repoFullName    String // "owner/repo"
  syncIssues      Boolean @default(true)
  syncPRs         Boolean @default(true)
  autoCreateBranch Boolean @default(false)
}

model GitHubLink {
  id          String @id @default(cuid())
  rowId       String
  type        String // issue, pr, branch
  githubId    Int
  url         String
  title       String
  state       String
  number      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

### 3.4 Google Drive Integration

#### New Files
```
src/features/integrations/google-drive/
├── GoogleDriveConnectButton.tsx
├── GoogleDrivePicker.tsx
├── GoogleDrivePreview.tsx
└── services/
    └── googleDriveService.ts
```

#### Features
- Connect Google Drive
- Attach files from Drive
- Preview Drive files inline
- Create Drive files from NABD
- Sync folder contents

---

### 3.5 Zapier Integration

#### New Files
```
server/src/routes/integrations/
├── zapier.ts
server/src/services/integrations/
├── zapierService.ts
```

#### Features
- Zapier triggers (new task, status change, etc.)
- Zapier actions (create task, update task, etc.)
- Webhook-based architecture

#### Zapier Triggers
```typescript
const zapierTriggers = [
  'new_item',
  'item_updated',
  'status_changed',
  'item_assigned',
  'due_date_approaching',
  'item_completed',
  'new_comment',
  'new_board',
];
```

#### Zapier Actions
```typescript
const zapierActions = [
  'create_item',
  'update_item',
  'delete_item',
  'add_comment',
  'assign_user',
  'change_status',
  'create_board',
];
```

---

### 3.6 Webhooks System

#### New Files
```
src/features/webhooks/
├── WebhookManager.tsx
├── WebhookForm.tsx
├── WebhookLogs.tsx
└── services/
    └── webhookService.ts
server/src/services/
├── webhookService.ts
```

#### Database Schema
```prisma
model Webhook {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  url         String
  secret      String?  // For signature verification
  events      String[] // Events to trigger on
  boardIds    String[] // Specific boards or empty for all
  active      Boolean  @default(true)
  logs        WebhookLog[]
  createdBy   String
  createdAt   DateTime @default(now())
}

model WebhookLog {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook  @relation(fields: [webhookId], references: [id])
  event       String
  payload     Json
  response    Json?
  statusCode  Int?
  duration    Int?     // ms
  success     Boolean
  createdAt   DateTime @default(now())
}
```

#### Webhook Events
```typescript
const webhookEvents = [
  'item.created',
  'item.updated',
  'item.deleted',
  'item.status_changed',
  'item.assigned',
  'board.created',
  'board.updated',
  'board.deleted',
  'comment.created',
  'member.added',
  'member.removed',
];
```

#### Webhook Payload
```typescript
interface WebhookPayload {
  event: string;
  timestamp: string;
  workspace: {
    id: string;
    name: string;
  };
  board?: {
    id: string;
    name: string;
  };
  item?: {
    id: string;
    name: string;
    // ... full item data
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
```

---

### 3.7 Public API Enhancement

#### New Files
```
server/src/routes/api/v1/
├── index.ts
├── auth.ts
├── boards.ts
├── items.ts
├── columns.ts
├── users.ts
├── workspaces.ts
├── comments.ts
├── files.ts
└── webhooks.ts
src/features/api/
├── ApiKeysManager.tsx
├── ApiDocs.tsx
└── services/
    └── apiKeyService.ts
```

#### Database Schema
```prisma
model ApiKey {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  key         String   @unique // Hashed
  keyPrefix   String   // First 8 chars for display
  scopes      String[] // read, write, admin
  lastUsed    DateTime?
  expiresAt   DateTime?
  createdBy   String
  createdAt   DateTime @default(now())
}

model ApiLog {
  id          String   @id @default(cuid())
  apiKeyId    String
  endpoint    String
  method      String
  statusCode  Int
  duration    Int
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())
}
```

#### API Rate Limiting
```typescript
const rateLimits = {
  free: { requests: 1000, period: 'day' },
  pro: { requests: 10000, period: 'day' },
  enterprise: { requests: 100000, period: 'day' },
};
```

---

## Phase 4: Advanced Project Management
**Priority: HIGH | Complexity: High**

### 4.1 Sprint Management

#### New Files
```
src/features/sprints/
├── SprintBoard.tsx
├── SprintPlanning.tsx
├── SprintBacklog.tsx
├── SprintReview.tsx
├── SprintSettings.tsx
├── components/
│   ├── SprintCard.tsx
│   ├── SprintProgress.tsx
│   ├── StoryPointsBadge.tsx
│   ├── BurndownChart.tsx
│   ├── BurnupChart.tsx
│   ├── VelocityChart.tsx
│   ├── SprintGoal.tsx
│   └── SprintCapacity.tsx
├── hooks/
│   ├── useSprints.ts
│   ├── useSprintMetrics.ts
│   └── useVelocity.ts
└── services/
    └── sprintService.ts
```

#### Database Schema
```prisma
model Sprint {
  id          String   @id @default(cuid())
  boardId     String
  board       Board    @relation(fields: [boardId], references: [id])
  name        String
  goal        String?
  startDate   DateTime
  endDate     DateTime
  status      String   @default("planning") // planning, active, completed
  items       SprintItem[]
  capacity    SprintCapacity[]
  createdBy   String
  createdAt   DateTime @default(now())
  completedAt DateTime?
}

model SprintItem {
  id          String @id @default(cuid())
  sprintId    String
  sprint      Sprint @relation(fields: [sprintId], references: [id])
  rowId       String
  storyPoints Int?
  addedAt     DateTime @default(now())
  completedAt DateTime?
}

model SprintCapacity {
  id          String @id @default(cuid())
  sprintId    String
  sprint      Sprint @relation(fields: [sprintId], references: [id])
  userId      String
  hoursPerDay Float  @default(8)
  daysOff     Int    @default(0)
}

model SprintSettings {
  id              String @id @default(cuid())
  boardId         String @unique
  board           Board  @relation(fields: [boardId], references: [id])
  defaultDuration Int    @default(14) // days
  autoRollover    Boolean @default(true)
  pointScale      String  @default("fibonacci") // fibonacci, linear, tshirt
}
```

#### Burndown Chart Implementation
```typescript
interface BurndownData {
  date: string;
  ideal: number;      // Ideal remaining points
  actual: number;     // Actual remaining points
  completed: number;  // Points completed that day
}

// Calculate daily burndown
function calculateBurndown(sprint: Sprint): BurndownData[] {
  const totalPoints = sprint.items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  const days = differenceInDays(sprint.endDate, sprint.startDate);
  const dailyBurn = totalPoints / days;

  // ... calculate actual vs ideal
}
```

---

### 4.2 Resource Planner

#### New Files
```
src/features/resources/
├── ResourcePlanner.tsx
├── ResourceDirectory.tsx
├── CapacityManager.tsx
├── UtilizationView.tsx
├── components/
│   ├── ResourceCard.tsx
│   ├── ResourceTimeline.tsx
│   ├── CapacityBar.tsx
│   ├── AllocationModal.tsx
│   └── AvailabilityCalendar.tsx
├── hooks/
│   ├── useResources.ts
│   └── useUtilization.ts
└── services/
    └── resourceService.ts
```

#### Database Schema
```prisma
model Resource {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String?  // Null for non-human resources
  user        User?    @relation(fields: [userId], references: [id])
  name        String
  type        String   // person, equipment, room, vehicle
  department  String?
  skills      String[]
  hourlyRate  Float?
  availability ResourceAvailability[]
  allocations ResourceAllocation[]
  createdAt   DateTime @default(now())
}

model ResourceAvailability {
  id          String   @id @default(cuid())
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id])
  dayOfWeek   Int?     // 0-6, null for specific date
  date        DateTime? // Specific date override
  startTime   String   // "09:00"
  endTime     String   // "17:00"
  available   Boolean  @default(true)
}

model ResourceAllocation {
  id          String   @id @default(cuid())
  resourceId  String
  resource    Resource @relation(fields: [resourceId], references: [id])
  projectId   String?  // Board ID
  taskId      String?  // Row ID
  startDate   DateTime
  endDate     DateTime
  hoursPerDay Float
  status      String   @default("planned") // planned, confirmed, tentative
  createdBy   String
  createdAt   DateTime @default(now())
}
```

---

### 4.3 Portfolio View

#### New Files
```
src/features/portfolio/
├── PortfolioView.tsx
├── PortfolioTimeline.tsx
├── PortfolioHealth.tsx
├── ProjectCard.tsx
└── services/
    └── portfolioService.ts
```

#### Features
- View multiple boards/projects in one view
- Aggregate status across projects
- Portfolio-level timeline
- Resource allocation across projects
- Budget tracking across projects

---

## Phase 5: AI & Intelligence
**Priority: MEDIUM | Complexity: High**

### 5.1 AI Assistant (NABD Brain)

#### New Files
```
src/features/ai/
├── AIAssistant.tsx
├── AIChat.tsx
├── AISuggestions.tsx
├── AIWritingAssistant.tsx
├── components/
│   ├── AIPromptInput.tsx
│   ├── AIResponseCard.tsx
│   ├── AISuggestionChip.tsx
│   └── AILoadingIndicator.tsx
├── hooks/
│   ├── useAI.ts
│   └── useAIChat.ts
└── services/
    └── aiService.ts (enhance existing)
```

#### AI Features
```typescript
const aiFeatures = {
  // Content Generation
  generateTaskDescription: true,
  generateProjectPlan: true,
  generateMeetingAgenda: true,
  generateStatusReport: true,
  generateReleaseNotes: true,

  // Summarization
  summarizeBoard: true,
  summarizeComments: true,
  summarizeDocument: true,

  // Analysis
  analyzePriorities: true,
  analyzeWorkload: true,
  analyzeRisks: true,
  suggestAssignee: true,
  suggestDueDate: true,

  // Automation
  suggestAutomations: true,
  createAutomationFromDescription: true,

  // Search
  semanticSearch: true,
  naturalLanguageQuery: true,
};
```

#### AI Prompts Templates
```typescript
const aiPrompts = {
  taskDescription: `Generate a detailed task description for: {title}
    Context: {boardName}, {columnValues}
    Include: acceptance criteria, steps, and notes`,

  statusReport: `Generate a status report for board: {boardName}
    Completed this week: {completedTasks}
    In progress: {inProgressTasks}
    Blocked: {blockedTasks}
    Include: highlights, risks, and next steps`,

  suggestAssignee: `Based on team workload and skills, suggest the best assignee:
    Task: {taskTitle}
    Skills needed: {skills}
    Team members: {teamMembers}`,
};
```

---

### 5.2 AI Standup Generator

#### New Files
```
src/features/ai/standups/
├── StandupGenerator.tsx
├── StandupPreview.tsx
├── StandupHistory.tsx
└── services/
    └── standupService.ts
```

#### Features
- Generate daily standup from task activity
- "What I did yesterday"
- "What I'm doing today"
- "Blockers"
- Post to Slack/Teams

---

### 5.3 AI Search

#### New Files
```
src/features/search/
├── AISearch.tsx
├── SearchResults.tsx
├── SearchFilters.tsx
└── services/
    └── searchService.ts
```

#### Features
- Natural language queries: "Show me overdue tasks assigned to John"
- Semantic search across all content
- Search suggestions
- Saved searches

---

## Phase 6: Enterprise Security
**Priority: MEDIUM-HIGH | Complexity: High**

### 6.1 SSO (SAML/OIDC)

#### New Files
```
src/features/admin/sso/
├── SSOSettings.tsx
├── SSOProviders.tsx
├── SAMLConfig.tsx
├── OIDCConfig.tsx
└── services/
    └── ssoService.ts
server/src/routes/
├── saml.ts
├── oidc.ts
server/src/services/
├── samlService.ts
├── oidcService.ts
```

#### Database Schema
```prisma
model SSOConfig {
  id              String @id @default(cuid())
  workspaceId     String @unique
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  provider        String // okta, azure, google, custom
  protocol        String // saml, oidc
  enabled         Boolean @default(false)

  // SAML
  entityId        String?
  ssoUrl          String?
  certificate     String?

  // OIDC
  clientId        String?
  clientSecret    String?
  authorizationUrl String?
  tokenUrl        String?
  userInfoUrl     String?

  // Common
  domains         String[] // Auto-redirect for these domains
  defaultRole     String @default("member")
  jitProvisioning Boolean @default(true) // Just-in-time user creation

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

### 6.2 SCIM Provisioning

#### New Files
```
server/src/routes/
├── scim.ts
server/src/services/
├── scimService.ts
```

#### SCIM Endpoints
```
GET    /scim/v2/Users
POST   /scim/v2/Users
GET    /scim/v2/Users/:id
PUT    /scim/v2/Users/:id
PATCH  /scim/v2/Users/:id
DELETE /scim/v2/Users/:id
GET    /scim/v2/Groups
POST   /scim/v2/Groups
GET    /scim/v2/Groups/:id
PUT    /scim/v2/Groups/:id
PATCH  /scim/v2/Groups/:id
DELETE /scim/v2/Groups/:id
```

---

### 6.3 Advanced Permissions

#### New Files
```
src/features/admin/permissions/
├── PermissionsManager.tsx
├── RoleEditor.tsx
├── ItemPermissions.tsx
├── ColumnPermissions.tsx
└── services/
    └── permissionsService.ts
```

#### Database Schema
```prisma
model Role {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  description String?
  permissions Json     // Detailed permissions object
  isSystem    Boolean  @default(false) // admin, member, viewer
  members     UserRole[]
  createdAt   DateTime @default(now())
}

model UserRole {
  id          String @id @default(cuid())
  userId      String
  user        User   @relation(fields: [userId], references: [id])
  roleId      String
  role        Role   @relation(fields: [roleId], references: [id])
  boardId     String? // Null for workspace-level

  @@unique([userId, roleId, boardId])
}

model ItemPermission {
  id          String @id @default(cuid())
  rowId       String
  userId      String?
  roleId      String?
  permission  String // view, comment, edit, admin

  @@unique([rowId, userId])
  @@unique([rowId, roleId])
}

model ColumnPermission {
  id          String @id @default(cuid())
  boardId     String
  columnId    String
  roleId      String
  canView     Boolean @default(true)
  canEdit     Boolean @default(true)

  @@unique([boardId, columnId, roleId])
}
```

#### Permissions Object Structure
```typescript
interface Permissions {
  workspace: {
    manage: boolean;
    invite: boolean;
    billing: boolean;
  };
  boards: {
    create: boolean;
    delete: boolean;
    managePermissions: boolean;
  };
  items: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
    comment: boolean;
  };
  automations: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  integrations: {
    manage: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
}
```

---

### 6.4 Audit Logs

#### New Files
```
src/features/admin/audit/
├── AuditLogViewer.tsx
├── AuditLogFilters.tsx
├── AuditLogExport.tsx
└── services/
    └── auditService.ts
```

#### Database Schema
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // create, update, delete, login, etc.
  entityType  String   // board, item, user, workspace, etc.
  entityId    String?
  entityName  String?
  changes     Json?    // Before/after for updates
  metadata    Json?    // IP, user agent, etc.
  createdAt   DateTime @default(now())

  @@index([workspaceId, createdAt])
  @@index([userId, createdAt])
  @@index([entityType, entityId])
}
```

#### Audit Events
```typescript
const auditEvents = [
  // Authentication
  'user.login',
  'user.logout',
  'user.login_failed',
  'user.password_changed',
  'user.2fa_enabled',

  // Users
  'user.created',
  'user.updated',
  'user.deleted',
  'user.invited',
  'user.role_changed',

  // Boards
  'board.created',
  'board.updated',
  'board.deleted',
  'board.shared',
  'board.permission_changed',

  // Items
  'item.created',
  'item.updated',
  'item.deleted',
  'item.moved',

  // Settings
  'workspace.settings_changed',
  'integration.connected',
  'integration.disconnected',
  'api_key.created',
  'api_key.revoked',
];
```

---

### 6.5 Data Residency

#### Implementation
- Deploy to multiple regions (US, EU, APAC)
- Route requests based on workspace setting
- Ensure data stays in selected region
- Cross-region backup options

#### Database Schema
```prisma
model Workspace {
  // ... existing fields
  dataRegion String @default("us") // us, eu, apac
}
```

---

### 6.6 Session Management

#### New Files
```
src/features/admin/security/
├── SessionManager.tsx
├── ActiveSessions.tsx
├── SecuritySettings.tsx
└── services/
    └── sessionService.ts
```

#### Database Schema
```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  device      String?
  browser     String?
  os          String?
  ip          String?
  location    String?
  lastActive  DateTime @default(now())
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}

model SecuritySettings {
  id              String @id @default(cuid())
  workspaceId     String @unique
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  sessionTimeout  Int    @default(24) // hours
  maxSessions     Int    @default(5)
  requireMfa      Boolean @default(false)
  allowedIps      String[]
  passwordPolicy  Json
}
```

---

## Phase 7: Mobile & Offline
**Priority: MEDIUM | Complexity: Very High**

### 7.1 Native Mobile Apps

#### Technology Stack
- React Native or Flutter
- Shared business logic with web
- Native UI components
- Push notification support

#### New Repository Structure
```
nabd-mobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── BoardScreen.tsx
│   │   ├── TaskScreen.tsx
│   │   ├── InboxScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── TaskCard.tsx
│   │   ├── BoardCard.tsx
│   │   ├── QuickAdd.tsx
│   │   └── TimerWidget.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── sync.ts
│   │   └── notifications.ts
│   ├── stores/
│   │   ├── boardStore.ts
│   │   ├── taskStore.ts
│   │   └── offlineStore.ts
│   └── utils/
├── ios/
├── android/
└── package.json
```

#### Key Mobile Features
- Home dashboard
- Board views (List, Kanban)
- Task detail & editing
- Time tracking with widget
- Push notifications
- Quick task creation
- Camera for attachments
- Offline mode
- Biometric login

---

### 7.2 Offline Mode

#### Implementation Strategy
```typescript
// Offline-first architecture
interface OfflineStore {
  // Cached data
  boards: Board[];
  tasks: Task[];
  users: User[];

  // Pending changes
  pendingChanges: PendingChange[];

  // Sync status
  lastSyncAt: Date;
  isSyncing: boolean;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'comment' | 'time_entry';
  data: any;
  createdAt: Date;
  retryCount: number;
}

// Sync strategy
const syncStrategy = {
  // When online, sync immediately
  onlineSync: true,

  // Background sync interval
  backgroundSyncInterval: 5 * 60 * 1000, // 5 minutes

  // Conflict resolution
  conflictResolution: 'server-wins', // or 'client-wins', 'manual'

  // What to cache offline
  cacheStrategy: {
    boards: 'recent', // Cache recently accessed
    tasks: 'assigned', // Cache assigned to user
    comments: 'recent',
    files: 'none', // Don't cache files
  },
};
```

---

### 7.3 Push Notifications

#### Server Implementation
```typescript
// Firebase Cloud Messaging for cross-platform
interface PushNotification {
  token: string;
  title: string;
  body: string;
  data: {
    type: string;
    entityId: string;
    boardId?: string;
  };
  priority: 'high' | 'normal';
}

// Notification types
const pushNotificationTypes = [
  'task_assigned',
  'task_due_soon',
  'task_overdue',
  'mentioned',
  'comment_added',
  'status_changed',
  'timer_reminder',
];
```

#### Database Schema
```prisma
model PushToken {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  platform    String   // ios, android, web
  deviceName  String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Phase 8: Templates & Onboarding
**Priority: MEDIUM | Complexity: Medium**

### 8.1 Template Center

#### New Files
```
src/features/templates/
├── TemplateCenter.tsx
├── TemplateGallery.tsx
├── TemplatePreview.tsx
├── TemplateCategories.tsx
├── TemplateCard.tsx
├── CreateFromTemplate.tsx
├── SaveAsTemplate.tsx
└── services/
    └── templateService.ts
```

#### Database Schema
```prisma
model Template {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String   // project_management, marketing, hr, etc.
  subcategory String?
  thumbnail   String?
  isPublic    Boolean  @default(false) // System templates
  workspaceId String?  // Null for system templates
  workspace   Workspace? @relation(fields: [workspaceId], references: [id])
  content     Json     // Board structure, columns, sample data
  tags        String[]
  usageCount  Int      @default(0)
  rating      Float?
  createdBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TemplateCategory {
  id          String @id @default(cuid())
  name        String @unique
  displayName String
  description String?
  icon        String?
  order       Int    @default(0)
}
```

#### Template Content Structure
```typescript
interface TemplateContent {
  board: {
    name: string;
    description?: string;
    defaultView: string;
    availableViews: string[];
  };
  columns: {
    name: string;
    type: string;
    config: any;
    order: number;
  }[];
  rooms: {
    name: string;
    color: string;
    order: number;
    rows: {
      name: string;
      values: Record<string, any>;
    }[];
  }[];
  automations?: {
    name: string;
    trigger: any;
    actions: any[];
  }[];
}
```

#### Template Categories
```typescript
const templateCategories = [
  { id: 'project_management', name: 'Project Management', icon: 'Kanban' },
  { id: 'marketing', name: 'Marketing', icon: 'Megaphone' },
  { id: 'sales', name: 'Sales & CRM', icon: 'TrendUp' },
  { id: 'hr', name: 'HR & Recruiting', icon: 'Users' },
  { id: 'software', name: 'Software Development', icon: 'Code' },
  { id: 'design', name: 'Design', icon: 'PaintBrush' },
  { id: 'operations', name: 'Operations', icon: 'Gear' },
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'personal', name: 'Personal', icon: 'User' },
  { id: 'startup', name: 'Startup', icon: 'Rocket' },
];
```

#### Pre-built Templates (50+ to create)
```typescript
const systemTemplates = [
  // Project Management
  'basic_project',
  'agile_sprint',
  'waterfall_project',
  'product_launch',
  'event_planning',

  // Marketing
  'content_calendar',
  'campaign_tracker',
  'social_media_planner',
  'seo_tracker',

  // Sales
  'crm_pipeline',
  'lead_tracker',
  'customer_onboarding',
  'account_management',

  // HR
  'recruitment_pipeline',
  'employee_onboarding',
  'performance_reviews',
  'time_off_tracker',

  // Software
  'bug_tracker',
  'feature_requests',
  'release_planning',
  'sprint_board',
  'roadmap',

  // Design
  'design_requests',
  'brand_assets',
  'creative_briefs',

  // Operations
  'inventory_tracker',
  'vendor_management',
  'facility_management',

  // More...
];
```

---

### 8.2 Managed Templates

#### New Files
```
src/features/templates/managed/
├── ManagedTemplateEditor.tsx
├── TemplateSync.tsx
├── TemplateVersions.tsx
└── services/
    └── managedTemplateService.ts
```

#### Features
- Create "master" template
- Boards created from template stay linked
- Push updates to all linked boards
- Version history
- Selective sync (structure only, or with data)

#### Database Schema
```prisma
model ManagedTemplate {
  id          String   @id @default(cuid())
  templateId  String
  template    Template @relation(fields: [templateId], references: [id])
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  linkedBoards ManagedTemplateBoard[]
  version     Int      @default(1)
  lastPushed  DateTime?
  createdAt   DateTime @default(now())
}

model ManagedTemplateBoard {
  id              String @id @default(cuid())
  managedTemplateId String
  managedTemplate ManagedTemplate @relation(fields: [managedTemplateId], references: [id])
  boardId         String @unique
  board           Board  @relation(fields: [boardId], references: [id])
  syncEnabled     Boolean @default(true)
  lastSynced      DateTime?
}
```

---

## Phase 9: Advanced Reporting
**Priority: MEDIUM | Complexity: Medium**

### 9.1 Custom Report Builder

#### New Files
```
src/features/reports/
├── ReportBuilder.tsx
├── ReportViewer.tsx
├── ReportList.tsx
├── components/
│   ├── ReportCanvas.tsx
│   ├── DataSourcePicker.tsx
│   ├── ChartBuilder.tsx
│   ├── FilterBuilder.tsx
│   ├── ReportWidget.tsx
│   └── WidgetLibrary.tsx
├── widgets/
│   ├── TableWidget.tsx
│   ├── BarChartWidget.tsx
│   ├── LineChartWidget.tsx
│   ├── PieChartWidget.tsx
│   ├── NumberWidget.tsx
│   ├── GaugeWidget.tsx
│   └── TimelineWidget.tsx
├── hooks/
│   ├── useReportData.ts
│   └── useReportBuilder.ts
└── services/
    └── reportService.ts
```

#### Database Schema
```prisma
model Report {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  name        String
  description String?
  config      Json     // Report configuration
  isPublic    Boolean  @default(false)
  schedule    ReportSchedule?
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ReportSchedule {
  id          String   @id @default(cuid())
  reportId    String   @unique
  report      Report   @relation(fields: [reportId], references: [id])
  frequency   String   // daily, weekly, monthly
  dayOfWeek   Int?     // 0-6 for weekly
  dayOfMonth  Int?     // 1-31 for monthly
  time        String   // "09:00"
  timezone    String
  recipients  String[] // Email addresses
  format      String   @default("pdf") // pdf, excel, csv
  active      Boolean  @default(true)
  lastSent    DateTime?
}
```

#### Report Configuration Structure
```typescript
interface ReportConfig {
  dataSources: DataSource[];
  widgets: ReportWidget[];
  filters: ReportFilter[];
  layout: {
    type: 'grid' | 'freeform';
    columns?: number;
  };
  theme: {
    primaryColor: string;
    fontFamily: string;
  };
}

interface DataSource {
  id: string;
  type: 'board' | 'timeEntries' | 'users' | 'custom';
  boardIds?: string[];
  filters?: any[];
  aggregations?: any[];
}

interface ReportWidget {
  id: string;
  type: 'table' | 'bar' | 'line' | 'pie' | 'number' | 'gauge' | 'timeline';
  dataSourceId: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}
```

---

### 9.2 Export Features

#### New Files
```
src/features/export/
├── ExportModal.tsx
├── ExportOptions.tsx
├── PDFExport.tsx
├── ExcelExport.tsx
└── services/
    └── exportService.ts
server/src/services/
├── pdfService.ts
├── excelService.ts
```

#### Export Options
```typescript
interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  scope: 'board' | 'view' | 'selected' | 'report';
  includeAttachments: boolean;
  includeComments: boolean;
  includeActivity: boolean;
  dateRange?: { start: Date; end: Date };
  columns?: string[]; // Specific columns
  groupBy?: string;
}
```

#### PDF Generation (using Puppeteer or similar)
```typescript
// Server-side PDF generation
async function generatePDF(options: ExportOptions): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Render export template
  await page.setContent(generateExportHTML(options));

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
  });

  await browser.close();
  return pdf;
}
```

---

### 9.3 Scheduled Reports

#### Implementation
- Cron job for scheduled report generation
- Email delivery with PDF/Excel attachment
- Dashboard for managing schedules

---

## Phase 10: Polish & Extras
**Priority: LOW | Complexity: Varies**

### 10.1 Additional Views

#### Map View
```
src/features/board/views/Map/
├── MapView.tsx
├── MapMarker.tsx
├── MapCluster.tsx
└── MapSidebar.tsx
```

#### Mind Map View
```
src/features/board/views/MindMap/
├── MindMapView.tsx
├── MindMapNode.tsx
├── MindMapConnector.tsx
└── MindMapToolbar.tsx
```

#### Org Chart View
```
src/features/board/views/OrgChart/
├── OrgChartView.tsx
├── OrgChartNode.tsx
└── OrgChartConnector.tsx
```

---

### 10.2 Whiteboard Enhancements

#### New Features
- More shape types
- Sticky notes
- Arrows and connectors
- Images and media
- Convert to tasks
- Templates
- Real-time cursors

---

### 10.3 Document Enhancements

#### Features
- Nested pages / wiki structure
- Version history
- Templates
- Export to PDF/Word
- Embed boards, videos
- Comments on specific text
- Table of contents

---

### 10.4 Screen Recording (Clips)

#### New Files
```
src/features/clips/
├── ClipRecorder.tsx
├── ClipPlayer.tsx
├── ClipLibrary.tsx
└── services/
    └── clipService.ts
```

#### Features
- Record screen with audio
- Attach to tasks
- Trimming and annotations
- Auto-transcription

---

## Implementation Priority Matrix

| Phase | Priority | Complexity | Business Impact | Recommended Order |
|-------|----------|------------|-----------------|-------------------|
| Phase 1 (Core PM) | CRITICAL | Medium-High | Very High | 1st |
| Phase 2 (Collaboration) | HIGH | Medium | High | 2nd |
| Phase 3 (Integrations) | HIGH | High | Very High | 3rd |
| Phase 4 (Advanced PM) | HIGH | High | High | 4th |
| Phase 5 (AI) | MEDIUM | High | Medium-High | 5th |
| Phase 6 (Security) | MEDIUM-HIGH | High | High (Enterprise) | 6th |
| Phase 7 (Mobile) | MEDIUM | Very High | High | 7th |
| Phase 8 (Templates) | MEDIUM | Medium | Medium | 8th |
| Phase 9 (Reporting) | MEDIUM | Medium | Medium | 9th |
| Phase 10 (Polish) | LOW | Varies | Low-Medium | 10th |

---

## Quick Wins (Can be done in 1-2 days each)

1. ✅ Checkbox field
2. ✅ URL/Link field
3. ✅ Auto-number field
4. ✅ Progress bar field
5. ✅ @Mentions (basic)
6. ✅ Email notifications (basic)
7. ✅ Public board sharing
8. ✅ Export to CSV
9. ✅ 10 basic templates

---

## Summary

**Total New Features: 77**
**Total New Files: ~300+**
**Estimated New Database Tables: 35+**
**Estimated New API Endpoints: 100+**

This plan transforms NABD from a strong foundation into a complete enterprise-grade project management platform competitive with Monday.com and ClickUp.
