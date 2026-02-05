# Notification System Design

> Complete specification for NABD's in-app + email notification system.

## Design Principles

1. **Business-Critical Only** - No spam, every notification has clear action value
2. **Respect User Time** - Smart deduplication, batching, quiet hours
3. **Actionable** - Every notification leads to a clear next step
4. **Tiered Urgency** - Critical vs informational separation

---

## 1. Event Catalog

### 1.1 RFQ Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `rfq_received` | Buyer submits RFQ | Matched Sellers | **high** | rfq | ✅ Immediate |
| `rfq_quote_received` | Seller submits quote | Buyer | **high** | rfq | ✅ Immediate |
| `rfq_expiring_soon` | RFQ expires in 24h | Seller (no quote yet) | normal | rfq | ✅ Digest |
| `rfq_expired` | RFQ deadline passed | Buyer + Sellers | low | rfq | ❌ |
| `rfq_awarded` | Buyer selects winner | Winning Seller | **critical** | rfq | ✅ Immediate |
| `rfq_lost` | Buyer selects different seller | Losing Sellers | low | rfq | ❌ |
| `rfq_cancelled` | Buyer cancels RFQ | Quoted Sellers | normal | rfq | ✅ Digest |

### 1.2 Quote Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `quote_accepted` | Buyer accepts quote | Seller | **critical** | order | ✅ Immediate |
| `quote_rejected` | Buyer rejects quote | Seller | normal | rfq | ❌ |
| `quote_revision_requested` | Buyer requests changes | Seller | **high** | rfq | ✅ Immediate |
| `quote_expired` | Quote validity ended | Buyer | normal | rfq | ✅ Digest |
| `quote_counter_received` | Seller sends counter | Buyer | **high** | rfq | ✅ Immediate |

### 1.3 Order Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `order_created` | Order placed | Seller | **critical** | order | ✅ Immediate |
| `order_confirmed` | Seller confirms | Buyer | **high** | order | ✅ Immediate |
| `order_processing` | Seller starts prep | Buyer | normal | order | ❌ |
| `order_shipped` | Shipment dispatched | Buyer | **high** | order | ✅ Immediate |
| `order_out_for_delivery` | Last mile started | Buyer | normal | order | ❌ |
| `order_delivered` | Delivery confirmed | Buyer + Seller | normal | order | ✅ Digest |
| `order_cancelled` | Order cancelled | Both parties | **high** | order | ✅ Immediate |
| `order_modified` | Order terms changed | Both parties | **high** | order | ✅ Immediate |

### 1.4 SLA Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `sla_warning` | SLA at 75% of deadline | Seller | **high** | order | ✅ Immediate |
| `sla_breach_imminent` | SLA at 90% of deadline | Seller | **critical** | order | ✅ Immediate |
| `sla_breached` | SLA deadline passed | Buyer + Seller | **critical** | order | ✅ Immediate |
| `sla_recovered` | Late order completed | Both parties | normal | order | ❌ |

### 1.5 Invoice Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `invoice_issued` | Seller generates invoice | Buyer | **high** | invoice | ✅ Immediate |
| `invoice_reminder` | Invoice due in 3 days | Buyer | normal | invoice | ✅ Digest |
| `invoice_due_today` | Invoice due today | Buyer | **high** | invoice | ✅ Immediate |
| `invoice_overdue` | Payment past due | Buyer + Seller | **critical** | invoice | ✅ Immediate |
| `invoice_paid` | Payment received | Seller | **high** | invoice | ✅ Immediate |
| `invoice_disputed` | Buyer disputes amount | Seller | **high** | dispute | ✅ Immediate |

### 1.6 Payout Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `payout_scheduled` | Payout queued | Seller | normal | payout | ✅ Digest |
| `payout_processing` | Payout initiated | Seller | normal | payout | ❌ |
| `payout_completed` | Funds transferred | Seller | **high** | payout | ✅ Immediate |
| `payout_failed` | Transfer failed | Seller | **critical** | payout | ✅ Immediate |
| `payout_on_hold` | Payout blocked | Seller | **critical** | payout | ✅ Immediate |

### 1.7 Dispute Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `dispute_opened` | Dispute created | Opposing party | **critical** | dispute | ✅ Immediate |
| `dispute_response_required` | Response deadline approaching | Respondent | **critical** | dispute | ✅ Immediate |
| `dispute_message_received` | New message in dispute | Both parties | **high** | dispute | ✅ Immediate |
| `dispute_evidence_requested` | Admin requests docs | Party | **high** | dispute | ✅ Immediate |
| `dispute_escalated` | Escalated to admin | Both parties | **high** | dispute | ✅ Immediate |
| `dispute_resolved` | Resolution reached | Both parties | **high** | dispute | ✅ Immediate |

### 1.8 Return Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `return_requested` | Buyer requests return | Seller | **high** | order | ✅ Immediate |
| `return_approved` | Seller approves | Buyer | **high** | order | ✅ Immediate |
| `return_rejected` | Seller rejects | Buyer | **high** | order | ✅ Immediate |
| `return_received` | Item received back | Both parties | normal | order | ✅ Digest |
| `refund_processed` | Refund issued | Buyer | **high** | invoice | ✅ Immediate |

### 1.9 System Events

| Event ID | Trigger | Recipient | Priority | Category | Email? |
|----------|---------|-----------|----------|----------|--------|
| `verification_approved` | Seller verified | Seller | **high** | system | ✅ Immediate |
| `verification_rejected` | Verification failed | Seller | **critical** | system | ✅ Immediate |
| `account_warning` | Policy violation | User | **critical** | system | ✅ Immediate |
| `subscription_expiring` | Plan expires in 7 days | User | normal | system | ✅ Digest |
| `feature_unlocked` | New feature available | User | low | system | ❌ |
| `weekly_summary` | End of week | User | low | system | ✅ Weekly Digest |

---

## 2. Notification Schema

### 2.1 Database Model (Already Exists - Enhanced)

```prisma
model Notification {
  id          String   @id @default(cuid())

  // Targeting
  userId      String
  portalType  String?  // 'seller' | 'buyer' | null (both)

  // Content
  type        String   // Event ID from catalog above
  title       String
  body        String?
  priority    String   @default("normal") // critical, high, normal, low
  category    String   // rfq, order, invoice, dispute, payout, system

  // Entity Reference
  entityType  String?  // rfq, order, invoice, dispute, payout
  entityId    String?
  entityName  String?  // "RFQ #12345", "Order #67890"

  // Actor (who triggered)
  actorId     String?
  actorName   String?
  actorAvatar String?

  // State
  read        Boolean  @default(false)
  readAt      DateTime?
  archived    Boolean  @default(false)

  // Delivery Tracking
  emailSent   Boolean  @default(false)
  emailSentAt DateTime?
  pushSent    Boolean  @default(false)
  pushSentAt  DateTime?

  // Grouping & Deduplication
  groupKey    String?  // For smart grouping: "order_updates_2024-01-15"
  batchId     String?  // For digest batching

  // Navigation
  actionUrl   String?
  actionLabel String?  // "View Order", "Respond Now"

  // Metadata & Expiry
  metadata    Json?
  expiresAt   DateTime?

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes
  @@index([userId, read, createdAt])
  @@index([userId, portalType, read])
  @@index([userId, category, createdAt])
  @@index([groupKey])
  @@index([expiresAt])
}
```

### 2.2 Notification Preference Model (Already Exists - Enhanced)

```prisma
model NotificationPreference {
  id        String @id @default(cuid())
  userId    String @unique

  // === IN-APP ===
  inAppEnabled       Boolean @default(true)

  // === EMAIL CHANNELS ===
  emailEnabled       Boolean @default(true)

  // By Event Category
  emailRfq           Boolean @default(true)
  emailOrders        Boolean @default(true)
  emailInvoices      Boolean @default(true)
  emailDisputes      Boolean @default(true)
  emailPayouts       Boolean @default(true)
  emailSystem        Boolean @default(true)

  // Digest Settings
  emailDigest        String  @default("daily") // none, daily, weekly
  digestTime         String  @default("09:00") // Preferred delivery time
  digestTimezone     String  @default("UTC")

  // === PUSH (Future) ===
  pushEnabled        Boolean @default(false)
  pushCriticalOnly   Boolean @default(true)

  // === QUIET HOURS ===
  quietHoursEnabled  Boolean @default(false)
  quietHoursStart    String  @default("22:00")
  quietHoursEnd      String  @default("08:00")
  quietHoursTimezone String  @default("UTC")

  // === ANTI-SPAM ===
  maxEmailsPerDay    Int     @default(20)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2.3 Email Digest Batch Model (New)

```prisma
model NotificationDigestBatch {
  id          String   @id @default(cuid())
  userId      String
  portalType  String?

  // Batch Window
  periodStart DateTime
  periodEnd   DateTime

  // Delivery
  status      String   @default("pending") // pending, sent, failed
  sentAt      DateTime?
  failReason  String?

  // Stats
  totalCount  Int      @default(0)

  createdAt   DateTime @default(now())

  @@index([userId, status])
  @@index([periodEnd, status])
}
```

---

## 3. Notification Templates

### 3.1 Template Structure

```typescript
interface NotificationTemplate {
  type: string;
  title: (ctx: TemplateContext) => string;
  body: (ctx: TemplateContext) => string;
  emailSubject: (ctx: TemplateContext) => string;
  emailBody: (ctx: TemplateContext) => string; // HTML template
  actionLabel: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  expiresInHours: number;
}

interface TemplateContext {
  entityName: string;
  entityId: string;
  actorName?: string;
  metadata: Record<string, unknown>;
}
```

### 3.2 Example Templates

```typescript
const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // RFQ
  rfq_received: {
    type: 'rfq_received',
    title: (ctx) => `New RFQ: ${ctx.entityName}`,
    body: (ctx) => `${ctx.actorName} submitted an RFQ matching your products`,
    emailSubject: (ctx) => `[NABD] New RFQ Request: ${ctx.entityName}`,
    emailBody: (ctx) => `
      <h2>New RFQ Received</h2>
      <p>A buyer has submitted an RFQ that matches your product categories.</p>
      <div class="details">
        <strong>RFQ:</strong> ${ctx.entityName}<br/>
        <strong>Buyer:</strong> ${ctx.actorName}<br/>
        <strong>Items:</strong> ${ctx.metadata.itemCount} item(s)<br/>
        <strong>Deadline:</strong> ${ctx.metadata.deadline}
      </div>
      <a href="${ctx.metadata.actionUrl}" class="cta">View & Quote</a>
    `,
    actionLabel: 'View & Quote',
    priority: 'high',
    category: 'rfq',
    expiresInHours: 168, // 7 days
  },

  // Order
  order_created: {
    type: 'order_created',
    title: (ctx) => `New Order: ${ctx.entityName}`,
    body: (ctx) => `${ctx.actorName} placed an order for ${ctx.metadata.amount}`,
    emailSubject: (ctx) => `[NABD] New Order Received: ${ctx.entityName}`,
    emailBody: (ctx) => `
      <h2>🎉 New Order!</h2>
      <p>Great news! You've received a new order.</p>
      <div class="order-summary">
        <strong>Order:</strong> ${ctx.entityName}<br/>
        <strong>Buyer:</strong> ${ctx.actorName}<br/>
        <strong>Total:</strong> ${ctx.metadata.amount}<br/>
        <strong>Items:</strong> ${ctx.metadata.itemCount}
      </div>
      <p><strong>Action Required:</strong> Please confirm this order within 24 hours.</p>
      <a href="${ctx.metadata.actionUrl}" class="cta">Confirm Order</a>
    `,
    actionLabel: 'Confirm Order',
    priority: 'critical',
    category: 'order',
    expiresInHours: 48,
  },

  // SLA
  sla_breach_imminent: {
    type: 'sla_breach_imminent',
    title: (ctx) => `⚠️ SLA Alert: ${ctx.entityName}`,
    body: (ctx) => `Order is at 90% of SLA deadline. Ship immediately to avoid breach.`,
    emailSubject: (ctx) => `[URGENT] SLA Breach Imminent: ${ctx.entityName}`,
    emailBody: (ctx) => `
      <h2 style="color: #dc2626;">⚠️ Urgent: SLA Breach Imminent</h2>
      <p>Your order is about to breach its SLA commitment.</p>
      <div class="alert">
        <strong>Order:</strong> ${ctx.entityName}<br/>
        <strong>Time Remaining:</strong> ${ctx.metadata.timeRemaining}<br/>
        <strong>Required Action:</strong> Ship immediately
      </div>
      <p>Breaching SLA may affect your seller rating and buyer trust.</p>
      <a href="${ctx.metadata.actionUrl}" class="cta-urgent">Mark as Shipped</a>
    `,
    actionLabel: 'Mark as Shipped',
    priority: 'critical',
    category: 'order',
    expiresInHours: 24,
  },

  // Invoice
  invoice_overdue: {
    type: 'invoice_overdue',
    title: (ctx) => `Invoice Overdue: ${ctx.entityName}`,
    body: (ctx) => `Payment of ${ctx.metadata.amount} is past due`,
    emailSubject: (ctx) => `[NABD] Payment Overdue: ${ctx.entityName}`,
    emailBody: (ctx) => `
      <h2 style="color: #dc2626;">Payment Overdue</h2>
      <p>Your payment for the following invoice is past due.</p>
      <div class="invoice-details">
        <strong>Invoice:</strong> ${ctx.entityName}<br/>
        <strong>Amount Due:</strong> ${ctx.metadata.amount}<br/>
        <strong>Due Date:</strong> ${ctx.metadata.dueDate}<br/>
        <strong>Days Overdue:</strong> ${ctx.metadata.daysOverdue}
      </div>
      <p>Please settle this payment to avoid service disruption.</p>
      <a href="${ctx.metadata.actionUrl}" class="cta">Pay Now</a>
    `,
    actionLabel: 'Pay Now',
    priority: 'critical',
    category: 'invoice',
    expiresInHours: 168,
  },

  // Dispute
  dispute_opened: {
    type: 'dispute_opened',
    title: (ctx) => `Dispute Filed: ${ctx.entityName}`,
    body: (ctx) => `${ctx.actorName} has opened a dispute. Response required within 48h.`,
    emailSubject: (ctx) => `[NABD] Dispute Opened: ${ctx.entityName}`,
    emailBody: (ctx) => `
      <h2>Dispute Notification</h2>
      <p>A dispute has been filed against your order.</p>
      <div class="dispute-details">
        <strong>Order:</strong> ${ctx.entityName}<br/>
        <strong>Filed By:</strong> ${ctx.actorName}<br/>
        <strong>Reason:</strong> ${ctx.metadata.reason}<br/>
        <strong>Response Deadline:</strong> 48 hours
      </div>
      <p><strong>Important:</strong> Failure to respond may result in automatic resolution in favor of the buyer.</p>
      <a href="${ctx.metadata.actionUrl}" class="cta">Respond to Dispute</a>
    `,
    actionLabel: 'Respond',
    priority: 'critical',
    category: 'dispute',
    expiresInHours: 48,
  },

  // Payout
  payout_completed: {
    type: 'payout_completed',
    title: (ctx) => `Payout Sent: ${ctx.metadata.amount}`,
    body: (ctx) => `Funds have been transferred to your account ending in ${ctx.metadata.lastFour}`,
    emailSubject: (ctx) => `[NABD] Payout Completed: ${ctx.metadata.amount}`,
    emailBody: (ctx) => `
      <h2>💰 Payout Completed</h2>
      <p>Your payout has been successfully processed.</p>
      <div class="payout-details">
        <strong>Amount:</strong> ${ctx.metadata.amount}<br/>
        <strong>Bank Account:</strong> ****${ctx.metadata.lastFour}<br/>
        <strong>Reference:</strong> ${ctx.entityName}<br/>
        <strong>Expected Arrival:</strong> ${ctx.metadata.arrivalDate}
      </div>
      <a href="${ctx.metadata.actionUrl}" class="cta">View Details</a>
    `,
    actionLabel: 'View Details',
    priority: 'high',
    category: 'payout',
    expiresInHours: 168,
  },
};
```

---

## 4. Delivery Logic

### 4.1 Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION CREATED                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              1. CHECK USER PREFERENCES                          │
│  ─────────────────────────────────────────────────────────────  │
│  • Is category enabled? (emailRfq, emailOrders, etc.)           │
│  • Is this portal type enabled for user?                        │
│  • Has daily email limit been reached?                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Enabled
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              2. CHECK QUIET HOURS                               │
│  ─────────────────────────────────────────────────────────────  │
│  • Is quietHoursEnabled = true?                                 │
│  • Is current time in quiet window?                             │
│  • If yes → Queue for delivery after quiet hours                │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Not in quiet hours
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              3. DETERMINE DELIVERY METHOD                       │
│  ─────────────────────────────────────────────────────────────  │
│  Priority = CRITICAL or HIGH?                                   │
│    → Immediate email delivery                                   │
│                                                                 │
│  Priority = NORMAL or LOW?                                      │
│    → Add to digest batch (daily/weekly per preference)          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. ALWAYS: IN-APP DELIVERY                         │
│  ─────────────────────────────────────────────────────────────  │
│  • Save to Notification table                                   │
│  • Emit via WebSocket: `portal-notification`                    │
│  • Update unread count                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Immediate Email vs Digest

| Delivery Type | Priority Levels | Timing | Use Case |
|---------------|-----------------|--------|----------|
| **Immediate** | critical, high | Within 30 seconds | Order created, SLA breach, disputes |
| **Daily Digest** | normal, low | User's preferred time (default 9am) | Status updates, reminders |
| **Weekly Digest** | low, system | Monday at preferred time | Weekly summary, low-priority system |

### 4.3 Anti-Spam Rules

```typescript
const ANTI_SPAM_RULES = {
  // Maximum emails per day per user
  maxDailyEmails: 20,

  // Minimum gap between same-type notifications
  deduplicationWindowMinutes: {
    rfq_received: 5,        // Bundle RFQs arriving close together
    order_status_changed: 15, // Don't spam on rapid status changes
    sla_warning: 60,        // One warning per hour max
  },

  // Never send email for these (in-app only)
  inAppOnlyTypes: [
    'rfq_expired',
    'rfq_lost',
    'order_processing',
    'order_out_for_delivery',
    'sla_recovered',
    'feature_unlocked',
  ],

  // Critical overrides all rules (always send)
  criticalAlwaysSend: true,
};
```

---

## 5. UI Behavior

### 5.1 Notification Bell Component

```
┌──────────────────────────────────────────────────────────────┐
│  [Bell Icon] ● 5                                              │
│              ↑                                                │
│         Red badge = action required                           │
│         Blue badge = unread only                              │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼ Click
┌──────────────────────────────────────────────────────────────┐
│  Notifications                        [Mark all read]        │
│  ─────────────────────────────────────────────────────────── │
│  [ All (12) ] [ Action Required (3) ]                        │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔴 ⚠️  SLA Alert: Order #12345                         │ │
│  │     Order at 90% of deadline. Ship now.      2m ago   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟠 📦 New Order: Order #67890                          │ │
│  │     Buyer Corp placed order for $5,420       15m ago  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚪ 📋 Quote Received: RFQ-2024-001                     │ │
│  │     Supplier X submitted a quote             1h ago   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [View all notifications →]                                  │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Visual Priority Indicators

| Priority | Badge Color | Icon BG | Border | Sound |
|----------|-------------|---------|--------|-------|
| **critical** | Red (#dc2626) | Red-50 | Red left border | Alert chime |
| **high** | Orange (#f97316) | Orange-50 | Orange left border | Soft chime |
| **normal** | Blue (#3b82f6) | Blue-50 | None | None |
| **low** | Gray (#6b7280) | Gray-50 | None | None |

### 5.3 Category Icons

| Category | Icon | Color |
|----------|------|-------|
| rfq | FileText | Blue |
| order | Package | Green |
| invoice | Receipt | Purple |
| dispute | AlertTriangle | Red |
| payout | DollarSign | Emerald |
| system | Settings | Gray |

### 5.4 Interaction States

```typescript
interface NotificationUIStates {
  // List States
  empty: {
    icon: 'CheckCircle',
    title: 'All caught up!',
    subtitle: 'No new notifications',
  },

  // Item States
  unread: {
    background: 'bg-blue-50 dark:bg-blue-900/20',
    indicator: 'Blue dot on left',
  },
  read: {
    background: 'bg-white dark:bg-gray-800',
    indicator: 'None',
  },
  actionRequired: {
    background: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-l-4 border-red-500',
    badge: 'Action Required' chip,
  },

  // Hover/Focus
  hover: 'bg-gray-50 dark:bg-gray-700',
  focus: 'ring-2 ring-blue-500',
}
```

### 5.5 Toast Notifications (Real-time)

For critical notifications received while user is active:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  SLA Alert: Order #12345                          [X]   │
│     Ship immediately to avoid breach                        │
│                                                             │
│     [Dismiss]  [View Order →]                               │
└─────────────────────────────────────────────────────────────┘

Duration: 8 seconds (critical), 5 seconds (high)
Position: Top-right
Max visible: 3 (stack)
```

### 5.6 Full Notifications Page (Optional)

For users who want to see full history:

```
/portal/notifications

┌─────────────────────────────────────────────────────────────┐
│  Notifications                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Filters: [All ▼] [All Categories ▼] [All Time ▼] [🔍]     │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  TODAY                                                       │
│  ├─ [Notification Item]                                      │
│  ├─ [Notification Item]                                      │
│  └─ [Notification Item]                                      │
│                                                              │
│  YESTERDAY                                                   │
│  ├─ [Notification Item]                                      │
│  └─ [Notification Item]                                      │
│                                                              │
│  OLDER                                                       │
│  └─ [Notification Item]                                      │
│                                                              │
│  [Load more]                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Notification Preferences UI

### 6.1 Settings Page Layout

```
/portal/settings/notifications

┌─────────────────────────────────────────────────────────────┐
│  Notification Settings                                       │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  IN-APP NOTIFICATIONS                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Enable in-app notifications          [═══════●] ON    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  EMAIL NOTIFICATIONS                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Enable email notifications           [═══════●] ON    │ │
│  │                                                        │ │
│  │ Categories:                                            │ │
│  │   ☑ RFQs & Quotes                                     │ │
│  │   ☑ Orders & Shipping                                 │ │
│  │   ☑ Invoices & Payments                               │ │
│  │   ☑ Disputes                                          │ │
│  │   ☑ Payouts                                           │ │
│  │   ☑ System Updates                                    │ │
│  │                                                        │ │
│  │ Email Digest:                                          │ │
│  │   ○ None (immediate only)                             │ │
│  │   ● Daily digest                                       │ │
│  │   ○ Weekly digest                                      │ │
│  │                                                        │ │
│  │ Digest delivery time: [ 9:00 AM ▼ ] [ UTC ▼ ]         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│  QUIET HOURS                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Enable quiet hours                   [●═══════] OFF   │ │
│  │                                                        │ │
│  │ During quiet hours, only critical notifications        │ │
│  │ (disputes, SLA breaches) will trigger emails.         │ │
│  │                                                        │ │
│  │ From: [ 10:00 PM ▼ ]  To: [ 8:00 AM ▼ ]               │ │
│  │ Timezone: [ America/New_York ▼ ]                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Save Changes]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Email Digest Format

### 7.1 Daily Digest Template

```html
Subject: [NABD] Daily Summary: 5 updates for Jan 15

┌─────────────────────────────────────────────────────────────┐
│                         NABD                                 │
│              Your Daily Business Summary                     │
│                  January 15, 2024                            │
└─────────────────────────────────────────────────────────────┘

Hi [Name],

Here's what happened in your NABD portal today:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 ORDERS (3 updates)

  ✓ Order #12345 was delivered
    Buyer: ABC Corp | Amount: $2,450

  ✓ Order #12346 was delivered
    Buyer: XYZ Inc | Amount: $890

  → Order #12350 shipped
    Buyer: Tech Co | Tracking: FEDEX123456

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RFQs (2 updates)

  ⚠ RFQ-2024-015 expires tomorrow
    Buyer: Manufacturing Ltd | 5 items
    [Submit Quote →]

  ○ RFQ-2024-018 was cancelled
    Buyer: Industrial Co

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 PAYOUTS

  ✓ $3,340.00 payout completed
    Bank account: ****4523
    Reference: PAY-2024-0115

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    [View All in Portal →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Manage notification preferences: [Settings →]
Unsubscribe from digests: [Unsubscribe →]

© 2024 NABD | Terms | Privacy
```

### 7.2 Weekly Summary Template

```html
Subject: [NABD] Weekly Summary: Jan 8-14

┌─────────────────────────────────────────────────────────────┐
│                         NABD                                 │
│              Your Weekly Business Summary                    │
│                  Jan 8 - Jan 14, 2024                        │
└─────────────────────────────────────────────────────────────┘

Hi [Name],

Here's your business performance this week:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 THIS WEEK AT A GLANCE

  Orders Received:     12 (+20% vs last week)
  Orders Shipped:      10
  Revenue:            $24,560
  RFQs Received:       8
  Quotes Submitted:    6
  Payouts Received:    $18,230

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ ACTION ITEMS

  • 2 orders awaiting confirmation
  • 3 RFQs expiring this week
  • 1 invoice overdue

                    [Take Action →]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 8. Implementation Priorities

### Phase 1: Foundation (Existing + Minor Enhancements)
- [x] Database schema (exists)
- [x] Core CRUD APIs (exists)
- [x] WebSocket real-time (exists)
- [x] NotificationBell component (exists)
- [x] NotificationContext (exists)
- [ ] Add `actionLabel` field usage in UI
- [ ] Add `archived` support

### Phase 2: Email Delivery
- [ ] Integrate email service (SendGrid/SES/Resend)
- [ ] Implement immediate email for critical/high
- [ ] Add email templates (HTML)
- [ ] Enforce preferences before sending
- [ ] Track `emailSent` / `emailSentAt`

### Phase 3: Digest System
- [ ] Create digest batch job (BullMQ)
- [ ] Daily digest aggregation logic
- [ ] Weekly summary generation
- [ ] Digest email templates
- [ ] Schedule jobs (cron)

### Phase 4: Preferences UI
- [ ] Create `/portal/settings/notifications` page
- [ ] Preference form components
- [ ] Save/load preferences
- [ ] Toast confirmation on save

### Phase 5: Advanced Features
- [ ] Quiet hours enforcement
- [ ] Anti-spam rate limiting
- [ ] Notification archiving
- [ ] Full notifications page with search
- [ ] Push notifications (Web Push API)

---

## 9. API Reference

### Existing Endpoints (Already Implemented)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/notifications/portal` | List portal notifications |
| GET | `/api/notifications/portal/count` | Get unread counts |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/portal/read-all` | Mark all read |
| GET | `/api/notifications/preferences` | Get preferences |
| PATCH | `/api/notifications/preferences` | Update preferences |

### New Endpoints (To Implement)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| DELETE | `/api/notifications/:id` | Delete notification |
| PATCH | `/api/notifications/:id/archive` | Archive notification |
| GET | `/api/notifications/portal/history` | Full paginated history |
| POST | `/api/notifications/preferences/test-email` | Send test email |

---

## 10. WebSocket Events

### Emitted to Client

```typescript
// New notification received
socket.emit('portal-notification', {
  type: 'new',
  notification: PortalNotification,
});

// Notification count updated
socket.emit('portal-notification', {
  type: 'count-update',
  counts: { total: number, actionRequired: number },
});

// Notification marked as read (sync across tabs)
socket.emit('portal-notification', {
  type: 'read',
  notificationId: string,
});
```

### Client Events

```typescript
// Join user's notification room
socket.emit('join-user-room', { userId: string });

// Leave room
socket.emit('leave-user-room', { userId: string });
```

---

## Summary

This notification system design provides:

1. **55+ Event Types** across 9 categories (RFQ, Quote, Order, SLA, Invoice, Payout, Dispute, Return, System)

2. **Smart Delivery**:
   - Critical/High → Immediate email
   - Normal/Low → Daily/Weekly digest
   - Anti-spam with rate limiting and deduplication

3. **User Control**:
   - Per-category email toggles
   - Digest frequency preference
   - Quiet hours support
   - Max 20 emails/day limit

4. **Rich UI**:
   - Real-time bell with badge
   - Action Required tab
   - Priority-based visual styling
   - Toast notifications for critical alerts
   - Full notification history page

5. **Business-Critical Focus**:
   - Only actionable notifications
   - Clear action labels and URLs
   - Expiration for stale notifications
   - No spam or noise
