# Portal AI — Source of Truth

> AI Power Features for NABD Portal (Buyer & Seller Workspaces)

## Architecture

```
Browser  →  /api/ai/*  →  aiGatewayRoutes.ts  →  aiGatewayService.ts  →  Gemini API
                ↑                                        ↓
         Bearer token                            Prisma (data fetch)
         (Portal JWT)                            Redaction layer
                                                 Rate limiter (per-user)
                                                 Structured JSON output
                                                 Auto-emit WorkspaceInsightEvent

Browser  →  /api/workspace/intelligence/*  →  workspaceIntelligenceRoutes.ts
                ↑                                        ↓
         Bearer token                            workspaceIntelligenceService.ts
         (Portal JWT)                            Prisma CRUD + cursor pagination
```

**Key principles**:
- No Gemini API key in the browser. All AI calls go through backend `/api/ai/*`.
- AI gateway auto-emits `WorkspaceInsightEvent` records so every analysis is tracked.
- Intelligence feed is a separate read-only API under `/api/workspace/intelligence/*`.

---

## Endpoints

### POST `/api/ai/insights`

Generate business insights for buyer or seller workspace.

**Request:**
```json
{
  "role": "buyer" | "seller",
  "focusArea": "optional focus area string",
  "language": "en" | "ar"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Brief overview of findings",
    "insights": [{ "title": "...", "description": "...", "severity": "info|warning|critical" }],
    "risks": [{ "title": "...", "description": "...", "severity": "low|medium|high|critical" }],
    "recommendedActions": [{ "title": "...", "description": "...", "deepLink": "/page" }],
    "confidence": 0.85,
    "dataUsed": ["orders", "invoices", "rfqs"]
  }
}
```

### POST `/api/ai/rfq-draft`

AI-generate an RFQ message draft.

**Request:**
```json
{
  "itemName": "Steel Pipes",
  "quantity": 500,
  "requirements": "Grade A, corrosion resistant",
  "deliveryTimeline": "Within 30 days",
  "budget": "50,000-70,000 SAR",
  "language": "en" | "ar"
}
```

**Response:** Same structured schema as insights.

### POST `/api/ai/quote-compare`

Compare quotes for a given RFQ.

**Request:**
```json
{
  "rfqId": "uuid-of-item-rfq",
  "language": "en" | "ar"
}
```

**Response:** Same structured schema. Summary includes comparison analysis.

### POST `/api/ai/workspace-summary`

Summarize workspace activity for a period.

**Request:**
```json
{
  "role": "buyer" | "seller",
  "period": "7d" | "30d" | "90d",
  "language": "en" | "ar"
}
```

**Response:** Same structured schema.

### POST `/api/ai/order-summary`

AI-analyze a marketplace order (health, risks, next actions).

**Request:**
```json
{
  "orderId": "uuid-of-marketplace-order",
  "language": "en" | "ar"
}
```

**Response:** Same structured schema. Auto-emits a `WorkspaceInsightEvent` with `insightType: "order_summary"`.

### POST `/api/ai/invoice-risk`

AI-assess risk and recommended actions for an invoice.

**Request:**
```json
{
  "invoiceId": "uuid-of-invoice",
  "language": "en" | "ar"
}
```

**Response:** Same structured schema. Auto-emits a `WorkspaceInsightEvent` with `insightType: "invoice_risk"`, severity based on overdue status.

---

## Workspace Intelligence Feed Endpoints

### GET `/api/workspace/intelligence/feed`

Paginated feed of AI insight events with filters.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `role` | `buyer` \| `seller` | required | Portal role |
| `status` | `active` \| `resolved` \| `dismissed` | — | Filter by status |
| `entityType` | string | — | Filter by entity type (order, invoice, rfq, workspace) |
| `insightType` | string | — | Filter by insight type |
| `limit` | number | 20 | Page size (max 50) |
| `cursor` | string (ISO date) | — | Cursor for next page |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [{ "id": "...", "title": "...", "summary": "...", ... }],
    "hasMore": true,
    "nextCursor": "2024-06-15T10:30:00.000Z",
    "total": 42
  }
}
```

### GET `/api/workspace/intelligence/count`

Count of active insight events.

**Query params:** `role` (required)

**Response:** `{ "success": true, "data": { "count": 7 } }`

### GET `/api/workspace/intelligence/:id`

Get a single insight event by ID.

### POST `/api/workspace/intelligence/:id/resolve`

Mark an insight event as resolved.

### POST `/api/workspace/intelligence/:id/dismiss`

Dismiss an insight event (soft-delete from feed).

---

## Shared Output Schema

All 6 AI endpoints return the same JSON structure:

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | 1-2 sentence overview |
| `insights[]` | array | Business insights with severity |
| `risks[]` | array | Risk items with severity levels |
| `recommendedActions[]` | array | Action items with optional deep links |
| `confidence` | number (0-1) | AI confidence score |
| `dataUsed[]` | string[] | Data sources used for analysis |

Validated with Zod schema `AIInsightSchema` in `aiGatewayService.ts`.

---

## Safety Features

### Sensitive Data Redaction
Before sending data to Gemini, the service redacts:
- IBAN / bank account numbers
- Credit card numbers
- API keys / tokens / secrets
- Email addresses
- Phone numbers

Implementation: `redactSensitiveData()` in `aiGatewayService.ts`

### Prompt Injection Resistance
- System prompt is hard-coded (not user-editable)
- User input is passed as data context, not as system instructions
- Output is validated with Zod schema before returning to client
- Fallback to raw content wrapper if parsing fails (confidence set to 0.3)

### Rate Limiting
- Per-user rate limit: 10 AI requests per minute
- In-memory store (Map) with automatic cleanup
- Headers: `X-AI-RateLimit-Remaining`, `X-AI-RateLimit-Reset`
- Designed for Redis plug-in (swap `rateLimitStore` Map for Redis)

### Input Validation
All inputs validated with Zod schemas:
- `InsightsInputSchema`
- `RFQDraftInputSchema`
- `QuoteCompareInputSchema`
- `WorkspaceSummaryInputSchema`
- `OrderSummaryInputSchema`
- `InvoiceRiskInputSchema`
- `CreateEventSchema` (intelligence service)
- `FeedQuerySchema` (intelligence service)

---

## UI Entry Points

### Buyer Workspace (`BuyerWorkspace.tsx`)
- **"Ask AI" button** in page header (gradient purple, sparkle icon)
- Opens `AICopilotPanel` in slide-over mode
- Quick actions: Summarize Workspace, Get Insights, Draft RFQ, Compare Quotes
- **Intelligence tab** — paginated feed of AI insight events with filters and resolve/dismiss

### Seller Workspace (`SellerWorkspace.tsx`)
- **"Ask AI" button** in page header (same style)
- Opens `AICopilotPanel` with `role="seller"`
- Quick actions: Summarize Workspace, Get Insights
- **Intelligence tab** — same feed component with `role="seller"`

### AI Copilot Panel (`AICopilotPanel.tsx`)
- Right-side slide-in panel (400px max width)
- Quick action chips at top
- Result cards: Summary, Insights, Risks, Recommended Actions
- Loading skeleton animation
- Error state with retry button
- Confidence bar

### Order Details Panel (`OrderDetailsPanel.tsx`)
- **"AI" tab** alongside Details and Timeline tabs (sparkle icon)
- On-demand AI analysis: click tab → fetches `POST /api/ai/order-summary`
- Displays results in `AIResultCard` (summary, insights, risks, actions)
- Auto-fetches on first tab switch

### Buyer Invoices (`BuyerInvoices.tsx`)
- **"Analyze Risk with AI" button** in invoice detail panel
- On-demand risk analysis: click → fetches `POST /api/ai/invoice-risk`
- Inline `AIResultCard` with risk assessment, severity colors, recommended actions

### Intelligence Feed (`IntelligenceFeed.tsx`)
- Full-page feed component used as tab in both workspaces
- Status filter chips: active, resolved, dismissed
- Entity type filter chips: order, invoice, rfq, workspace
- Severity-colored event cards (info=blue, warning=amber, critical=red)
- Resolve / Dismiss action buttons per event
- Cursor-based "Load More" pagination
- Relative timestamps (just now, 5m ago, 2h ago, 3d ago)

---

## Data Model

### WorkspaceInsightEvent (Prisma)

```prisma
model WorkspaceInsightEvent {
  id          String   @id @default(uuid())
  userId      String
  role        String                     // "buyer" | "seller"
  entityType  String                     // "order" | "invoice" | "rfq" | "workspace"
  entityId    String?
  insightType String                     // "order_summary" | "invoice_risk" | etc.
  title       String
  summary     String
  severity    String   @default("info")  // "info" | "warning" | "critical"
  confidence  Float    @default(0.5)
  payload     String?                    // JSON blob for full AI response
  status      String   @default("active") // "active" | "resolved" | "dismissed"
  resolvedAt  DateTime?
  resolvedBy  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Indexes: `[userId, role]`, `[userId, role, status]`, `[entityType, entityId]`, `[insightType]`, `[createdAt]`, `[status]`

---

## Files Changed

### Backend (server/)
| File | Purpose |
|------|---------|
| `server/src/services/aiGatewayService.ts` | Gateway service: redaction, rate limit, data fetch, structured output, auto-emit events |
| `server/src/services/workspaceIntelligenceService.ts` | CRUD + feed queries for WorkspaceInsightEvent |
| `server/src/routes/aiGatewayRoutes.ts` | 6 POST endpoints under `/api/ai/` |
| `server/src/routes/workspaceIntelligenceRoutes.ts` | 5 endpoints under `/api/workspace/intelligence/` |
| `server/src/app.ts` | Mount gateway + intelligence routes |
| `server/prisma/schema.prisma` | WorkspaceInsightEvent model |
| `server/src/__tests__/services/workspaceIntelligenceService.test.ts` | 17 unit tests |

### Frontend (src/)
| File | Purpose |
|------|---------|
| `src/features/portal/services/aiService.ts` | Frontend AI service client (6 AI + 4 intelligence methods) |
| `src/features/portal/components/ai/AICopilotPanel.tsx` | AI Copilot slide-in panel |
| `src/features/portal/components/ai/AIResultCard.tsx` | Reusable AI result display card |
| `src/features/portal/components/ai/IntelligenceFeed.tsx` | Intelligence feed with filters + pagination |
| `src/features/portal/hooks/useOrderAISummary.ts` | Hook for on-demand order AI analysis |
| `src/features/portal/hooks/useInvoiceAIRisk.ts` | Hook for on-demand invoice risk analysis |
| `src/features/portal/buyer/pages/BuyerWorkspace.tsx` | Added "Ask AI" button + Intelligence tab |
| `src/features/portal/buyer/pages/BuyerInvoices.tsx` | Added AI risk button in invoice detail |
| `src/features/portal/seller/pages/SellerWorkspace.tsx` | Added "Ask AI" button + Intelligence tab |
| `src/features/portal/seller/components/OrderDetailsPanel.tsx` | Added AI tab for order analysis |

### Documentation
| File | Purpose |
|------|---------|
| `docs/runbook/PORTAL_AI_SOURCE_OF_TRUTH.md` | This file |

---

## Smoke Test Checklist

### AI Gateway
- [ ] Backend starts without errors (`cd server && pnpm dev`)
- [ ] `POST /api/ai/insights` with `{"role":"buyer"}` returns structured JSON
- [ ] `POST /api/ai/rfq-draft` with valid body returns draft
- [ ] `POST /api/ai/quote-compare` with valid rfqId returns comparison
- [ ] `POST /api/ai/workspace-summary` with `{"role":"seller","period":"30d"}` returns summary
- [ ] `POST /api/ai/order-summary` with `{"orderId":"..."}` returns analysis + creates event
- [ ] `POST /api/ai/invoice-risk` with `{"invoiceId":"..."}` returns risk + creates event
- [ ] Rate limit: 11th request within 1 min returns 429
- [ ] Missing auth returns 401
- [ ] Invalid body returns 400 with Zod details

### Intelligence Feed
- [ ] `GET /api/workspace/intelligence/feed?role=buyer` returns paginated events
- [ ] `GET /api/workspace/intelligence/count?role=buyer` returns active count
- [ ] `POST /api/workspace/intelligence/:id/resolve` marks event resolved
- [ ] `POST /api/workspace/intelligence/:id/dismiss` removes event from feed
- [ ] Cursor pagination: pass `cursor` param from previous response

### UI
- [ ] Buyer Workspace shows "Ask AI" button + Intelligence tab
- [ ] Seller Workspace shows "Ask AI" button + Intelligence tab
- [ ] Clicking "Ask AI" opens panel with quick action chips
- [ ] Selecting a chip shows loading skeleton → result cards
- [ ] Error state shows retry button
- [ ] Order detail panel shows AI tab → fetches analysis on click
- [ ] Invoice detail shows "Analyze Risk with AI" button → inline result
- [ ] Intelligence tab shows feed with filters (status, entity type)
- [ ] Resolve/Dismiss buttons work on feed events
- [ ] "Load More" pagination works

### Quality Gate
- [ ] `pnpm tsc --noEmit` passes (0 errors)
- [ ] `pnpm lint --max-warnings 0` passes (0 warnings)
- [ ] `cd server && pnpm tsc --noEmit` passes (0 errors)
- [ ] `pnpm test` passes (275 tests)
- [ ] `cd server && pnpm test` passes (833 tests, includes 17 intelligence service tests)

---

## Environment Requirements

The `GEMINI_API_KEY` environment variable must be set in `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

If missing, all AI endpoints return a clear error: `"GEMINI_API_KEY is not configured"`.
