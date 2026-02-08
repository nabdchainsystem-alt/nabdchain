# RoomTable Refactoring Plan

> Target: Break `src/features/board/views/Table/RoomTable.tsx` (3,461 lines) into ~12 focused modules

## Current State

- **Total Lines**: 3,461
- **React Hooks**: 41 (useState, useEffect, useCallback, useMemo, useTransition)
- **Handler Functions**: 29+
- **State Variables**: 27+ useState declarations

## Proposed Architecture

```
RoomTable (Main) ~600 lines
├─ hooks/
│   ├─ useRoomTableState.ts      ~400 lines  (core state)
│   ├─ useGroupManagement.ts     ~200 lines  (group CRUD)
│   ├─ useRowOperations.ts       ~250 lines  (row CRUD)
│   ├─ useColumnOperations.ts    ~250 lines  (column CRUD, styling)
│   ├─ useDragDrop.ts            ~180 lines  (dnd-kit integration)
│   ├─ useTableFiltering.ts      ~250 lines  (filter/sort/search)
│   ├─ useCustomStatuses.ts       ~80 lines  (status management)
│   ├─ useRowSelection.ts        ~100 lines  (checkbox logic)
│   ├─ useSearchFilters.ts        ~80 lines  (search + person filter)
│   ├─ usePinnedCharts.ts         ~60 lines  (chart persistence)
│   └─ useFileUpload.ts           ~80 lines  (file upload modal)
├─ components/
│   ├─ RoomTableToolbar.tsx      ~350 lines  (toolbar + actions)
│   ├─ RoomTableBody.tsx         ~400 lines  (groups + rows render)
│   ├─ RoomTableModals.tsx       ~200 lines  (all modals)
│   └─ TableCellRenderer.tsx      ~80 lines  (cell factory)
```

## Implementation Phases

### Phase 1: State Management (Low Risk)
- Extract `useRoomTableState` — consolidate all useState
- Extract `useCustomStatuses` — simple, isolated
- Extract `useSearchFilters` — simple, isolated

### Phase 2: Operations (Medium Risk)
- Extract `useGroupManagement` — core group CRUD
- Extract `useRowOperations` — row add/update/delete
- Extract `useColumnOperations` — column add/update/delete/style

### Phase 3: Complex Features (Medium Risk)
- Expand `useTableFiltering` (already exists, add missing pieces)
- Extract `useDragDrop` — high complexity but isolated
- Extract `useRowSelection` — depends on rows

### Phase 4: UI Components (Medium Risk)
- Extract `RoomTableModals` — low risk, render-only
- Extract `RoomTableToolbar` — needs handler props
- Extract `RoomTableBody` — JSX-heavy

### Phase 5: Polish
- Extract remaining hooks (usePinnedCharts, useFileUpload)
- Clean up main component
- Add tests for each extracted hook

## Major Sections (Current)

| Section | Lines | Complexity |
|---------|-------|-----------|
| Imports & Types | 1-142 | Low |
| TableGroups State & Sync | 229-504 | HIGH |
| Custom Status Management | 563-645 | Medium |
| Group Management Handlers | 744-844 | HIGH |
| Excel Import Logic | 933-1159 | HIGH |
| Row Filtering Logic | 1170-1369 | HIGH |
| Cell Rendering & Actions | 1540-2277 | HIGH |
| Row CRUD Operations | 1606-1768 | HIGH |
| Main Render JSX | 2313-3456 | VERY HIGH |

## Migration Notes

- Keep localStorage keys consolidated in `useRoomTableState`
- Map external props through main component to sub-hooks
- Keep dnd-kit sensors at main level, pass handlers down
- Watch for prop drilling — consider Context for deeply nested handlers
- Each extracted hook should be independently testable
