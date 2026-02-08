# Service Consolidation Report

> **Date**: 2026-02-06
> **Goal**: Eliminate duplicated business logic between frontend and backend services
> **Principle**: Backend is the single source of truth for ALL business rules

---

## Summary

| Metric | Count |
|--------|-------|
| Frontend services scanned | 40+ |
| Backend services scanned | 50+ |
| Services with business logic removed | 5 |
| Lines of business logic removed | ~1,500+ |
| Behavior changes | 0 |

---

## Services Modified

### 1. compareScoringService.ts (Frontend)

**Location**: `src/features/portal/services/compareScoringService.ts`

**Before**: 949 lines with full scoring engine
**After**: 275 lines (thin API client)

**Business Logic Removed**:
| Function | Description | Lines Removed |
|----------|-------------|---------------|
| `calculateBreakdown()` | Score calculation for each attribute | ~80 |
| `calculateTotalScore()` | Weighted score aggregation | ~30 |
| `normalizeInverse()` | Min-max normalization (inverse) | ~15 |
| `normalizeDirect()` | Min-max normalization (direct) | ~15 |
| `generateProsAndCons()` | Pros/cons based on scores | ~100 |
| `generateBestPickReasons()` | Best pick reasoning | ~50 |
| `detectTradeOffs()` | Trade-off analysis between products | ~120 |
| `generateReasoning()` | Explainable AI reasoning | ~80 |
| `calculateDataCompleteness()` | Data completeness scoring | ~30 |
| `calculateRecommendation()` | Main scoring orchestration | ~100 |
| `scoreManualCompare()` | Manual comparison scoring | ~80 |

**Backend Authority**: `server/src/services/rfqScoringService.ts`

**Now Does**:
- Calls `POST /api/compare/score` for scoring
- Calls `POST /api/compare/manual` for manual comparisons
- Exports types for frontend consumption
- Provides weight presets (UI configuration only)

---

### 2. expenseAnalyticsService.ts (Frontend)

**Location**: `src/features/portal/services/expenseAnalyticsService.ts`

**Before**: ~760 lines with business logic + mock data
**After**: ~183 lines (thin API client)

**Business Logic Removed**:
| Function | Description | Lines Removed |
|----------|-------------|---------------|
| `detectSpendLeakage()` | Policy violation detection algorithm | ~60 |
| `calculatePriceDrift()` | Price drift calculation engine | ~50 |
| `calculateCategoryInefficiency()` | Weighted scoring algorithm | ~80 |
| `generateRecommendations()` | Business rule-based recommendations | ~40 |

**Mock Data Removed**:
| Function | Description |
|----------|-------------|
| `getMockDashboard()` | Full dashboard mock |
| `getMockBudgetTrend()` | Budget trend data |
| `getMockCategories()` | Category breakdown |
| `getMockLeakages()` | Spend leakage alerts |
| `getMockPriceDrifts()` | Price drift alerts |
| `getMockInefficiencies()` | Category inefficiencies |
| `getMockLineItems()` | Expense line items |

**Backend Authority**: `server/src/services/expenseAnalyticsService.ts`

**Now Does**:
- Calls `GET /api/buyer/expenses/analytics/dashboard`
- Calls `GET /api/buyer/expenses/leakages`
- Calls `GET /api/buyer/expenses/price-drifts`
- Calls `PATCH /api/buyer/expenses/leakages/:id`
- Calls `POST /api/buyer/expenses/price-drifts/:id/action`
- Calls `GET /api/buyer/expenses/line-items`

---

### 3. featureGatingService.ts (Frontend)

**Location**: `src/features/portal/services/featureGatingService.ts`

**Before**: ~200 lines with default feature rules
**After**: ~165 lines (thin API client + cache)

**Business Logic Removed**:
| Function | Description | Lines Removed |
|----------|-------------|---------------|
| `getDefaultFeatures()` | Default gating rules by seller status | ~40 |

**Backend Authority**: `server/src/services/featureGatingService.ts`

**Now Does**:
- Calls `GET /api/gating/features` for all feature access
- Calls `GET /api/gating/features/:action` for single feature check
- Caches results in localStorage (5-minute TTL)
- Falls back to restrictive defaults when cache is stale (triggers API refresh)

---

### 4. sellerHomeSummaryService.ts (Frontend)

**Location**: `src/features/portal/services/sellerHomeSummaryService.ts`

**Before**: ~280 lines with mock data generators
**After**: ~217 lines (thin API client)

**Mock Data Removed**:
| Function | Description |
|----------|-------------|
| `getMockSummary()` | Full seller home summary mock |
| `getEmptySummary()` | Empty state summary |

**Backend Authority**: `server/src/services/sellerHomeService.ts`

**Now Does**:
- Calls `GET /api/seller/home/summary`
- Calls `GET /api/seller/home/alerts`
- Calls `GET /api/seller/home/focus`
- Calls `GET /api/seller/home/pulse`
- Calls `GET /api/seller/home/health`
- Calls `GET /api/seller/home/onboarding`

---

### 5. buyerAnalyticsService.ts (Frontend)

**Location**: `src/features/portal/services/buyerAnalyticsService.ts`

**Before**: ~200 lines with mock data generators
**After**: ~131 lines (thin API client)

**Mock Data Removed**:
| Function | Description |
|----------|-------------|
| `getMockAnalyticsSummary()` | Full analytics dashboard mock |
| `generateTimelineData()` | Timeline data generator |

**Backend Authority**: `server/src/services/buyerAnalyticsService.ts`

**Now Does**:
- Calls `GET /api/analytics/buyer/summary`
- Calls `GET /api/analytics/buyer/kpis`
- Calls `GET /api/analytics/buyer/spend-by-category`
- Calls `GET /api/analytics/buyer/supplier-performance`
- Calls `GET /api/analytics/buyer/rfq-funnel`

---

## Services Already Clean (No Changes Needed)

The following frontend services were already thin API clients:

| Service | Location | Status |
|---------|----------|--------|
| orderService.ts | src/features/portal/services/ | Pure fetch calls |
| marketplaceOrderService.ts | src/features/portal/services/ | Pure fetch calls |
| quoteService.ts | src/features/portal/services/ | Pure fetch calls |
| inventoryService.ts | src/features/portal/services/ | Pure fetch calls |
| supplierService.ts | src/features/portal/services/ | Pure fetch calls |
| invoiceService.ts | src/features/portal/services/ | Pure fetch calls |
| payoutService.ts | src/features/portal/services/ | Pure fetch calls |
| listingService.ts | src/features/portal/services/ | Pure fetch calls |

---

## TODO Markers Added

All modified files include standardized TODO markers for tracking:

```typescript
// TODO: [CONSOLIDATED] <description>
// See: docs/runbook/SERVICE_CONSOLIDATION_REPORT.md
// <specific notes about what was removed>
```

**Search pattern**: `grep -r "TODO: \[CONSOLIDATED\]" src/`

---

## Verification Checklist

- [x] No business logic in frontend services
- [x] All calculations happen on backend
- [x] Request/response shapes unchanged
- [x] No endpoints renamed
- [x] No routes refactored
- [x] No new abstractions introduced
- [x] All mock data removed from frontend
- [x] Backend handles empty states appropriately
- [x] TODO markers added for future reference

---

## Architecture After Consolidation

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  Services (Thin API Clients)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • fetch() / axios calls only                         │   │
│  │ • TypeScript types for request/response              │   │
│  │ • UI configuration (weight presets, etc.)           │   │
│  │ • localStorage caching (frontend concern only)       │   │
│  │ • NO business logic                                  │   │
│  │ • NO calculations                                    │   │
│  │ • NO state machines                                  │   │
│  │ • NO validations (beyond form UX)                    │   │
│  │ • NO mock data                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   REST API (Express)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  Services (Single Source of Truth)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • ALL business rules                                 │   │
│  │ • ALL calculations (scoring, analytics, etc.)        │   │
│  │ • ALL validations                                    │   │
│  │ • ALL state machines (order status, gating, etc.)    │   │
│  │ • Empty state handling                               │   │
│  │ • Error responses                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [MOCK_REMOVAL_REPORT.md](./MOCK_REMOVAL_REPORT.md) - Previous mock data cleanup
- [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) - Production checklist
- [AUTH_FLOW_FIXES.md](./AUTH_FLOW_FIXES.md) - Authentication consolidation

---

*Report generated as part of production readiness journey - PROMPT-15*
