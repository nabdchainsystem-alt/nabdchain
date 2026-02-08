# `any` Type Elimination Audit

> 168 files with 432 total `any` occurrences across `src/`

## Priority Tiers

### Tier 1: Critical (22+ occurrences)
| File | Count | Categories |
|------|-------|-----------|
| `board/views/Table/RoomTable.tsx` | 22 | Function params, local vars, array ops, type assertions |
| `board/BoardView.tsx` | 17 | Callbacks, flatMap, view type casting |

### Tier 2: High (7-12 occurrences)
| File | Count | Categories |
|------|-------|-----------|
| `board/views/Procurement/ProcurementOverview.tsx` | 12 | Component props, data rendering |
| `board/views/List/Lists.tsx` | 10 | Array ops, data processing |
| `portal/buyer/pages/ItemDetails.tsx` | 10 | Product data, form state, API responses |
| `board/views/ListBoard/ListBoardGroup.tsx` | 8 | Task array manipulation |
| `portal/seller/pages/SellerDashboard.tsx` | 7 | Order data processing |
| `portal/seller/pages/Analytics.tsx` | 7 | Analytics data, chart config |
| `board/hooks/useRoomBoardData.ts` | 7 | API response handling |
| `mini_company/operations/PurchaseOverviewDashboard.tsx` | 7 | Dashboard data |

### Tier 3: Medium (5-6 occurrences)
| File | Count | Categories |
|------|-------|-----------|
| `App.tsx` | 6 | Type casting, error boundaries |
| `components/layout/Sidebar.tsx` | 6 | Component types, event handlers |
| `board/views/Table/components/TableCell.tsx` | 6 | Cell rendering, events |
| `board/views/Kanban/KanbanBoard.tsx` | 6 | Drag-drop, data transformation |
| `mini_company/finance/ForecastOptimizationDashboard.tsx` | 6 | ECharts callbacks |
| `portal/components/orders/UnifiedOrders.tsx` | 6 | Order filtering |
| `portal/services/portalAuthService.ts` | 6 | API responses |
| `board/views/Overview/OverviewView.tsx` | 5 | Data filtering |
| `portal/seller/pages/SellerInventory.tsx` | 5 | Inventory data |
| `portal/seller/pages/SellerWorkspace.tsx` | 5 | Workspace config |
| `portal/buyer/pages/workspace/ExpensesTab.tsx` | 5 | Expense data |
| `mini_company/operations/CostControlDashboard.tsx` | 5 | Dashboard config |

## Most Common Patterns (432 total)

| Pattern | % | Fix Strategy |
|---------|---|-------------|
| Function parameters & callbacks | 35% | Define proper interfaces for handler signatures |
| Type casting / assertions (`as any`) | 25% | Create discriminated unions, use type guards |
| Local variables & object literals | 20% | Add explicit type annotations |
| Array element typing | 15% | Type arrays at declaration: `useState<Task[]>([])` |
| Event handler data | 5% | Use React event types (`React.ChangeEvent<HTMLInputElement>`) |

## Recommended Fix Order

1. **Services layer** — Define API response types, propagate through app
2. **Shared types** — Create proper interfaces in `types.ts` for Task, Column, Board
3. **Board hooks** — Type `useRoomBoardData.ts` return values
4. **Board views** — Fix from smallest files up (Overview → Kanban → List → RoomTable)
5. **Portal pages** — Type portal-specific data structures
6. **Dashboard components** — Add ECharts callback types

## Metric

Track progress: `grep -r ': any\|as any\|<any>' src/ --include='*.ts' --include='*.tsx' | wc -l`

Starting count: **432**
