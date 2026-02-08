# ADR-002: RoomTable Decomposition into Hooks and Components

**Status:** Accepted (Implemented)

**Date:** 2025-12

## Context

`src/features/board/views/Table/RoomTable.tsx` had grown to **3,461 lines** -- the single largest file in the codebase. It contained:

- 41 React hooks (useState, useEffect, useCallback, useMemo, useTransition)
- 27+ useState declarations
- 29+ handler functions
- Group management, row CRUD, column CRUD, drag-and-drop, filtering, Excel import, chart persistence, and all rendering JSX

This created several problems:

1. **Unmaintainable** -- developers could not reason about the component without scrolling through thousands of lines.
2. **Untestable** -- state logic was tightly coupled to rendering; unit testing individual behaviors was impractical.
3. **Merge conflicts** -- any change to board functionality touched this one file, causing frequent conflicts across branches.
4. **Slow IDE performance** -- TypeScript language server struggled with the file size.

## Decision

Decompose `RoomTable.tsx` into **10 custom hooks** and **3 extracted components**, keeping the original file as a slim orchestrator (~600-800 lines).

### Extracted Hooks (`src/features/board/views/Table/hooks/`)

| Hook | Responsibility | Lines |
|------|---------------|-------|
| `useTableDataProcessing.ts` | Core state, localStorage sync, data loading | ~400 |
| `useGroupManagement.ts` | Group CRUD (add, rename, delete, reorder) | ~200 |
| `useRowOperations.ts` | Row add, update, delete, duplicate | ~250 |
| `useColumnOperations.ts` | Column add, update, delete, resize, styling | ~250 |
| `useDragDropHandlers.ts` | dnd-kit integration for rows and groups | ~180 |
| `useTableFiltering.ts` | Filter, sort, and search logic | ~250 |
| `useCustomStatuses.ts` | Status and label management | ~80 |
| `useTableSelection.ts` | Row checkbox selection logic | ~100 |
| `useExcelImport.ts` | Excel/CSV file import parsing | ~80 |
| `useToolbarState.ts` | Toolbar UI state (search, person filter, charts) | ~80 |
| `useModalState.ts` | Modal open/close state management | ~60 |

### Extracted Components (`src/features/board/views/Table/components/`)

| Component | Responsibility |
|-----------|---------------|
| `RoomTableToolbar.tsx` | Toolbar with search, filters, view toggles, actions |
| `RoomTableBody.tsx` | Group headers, sortable rows, drag overlays |
| `RoomTableModals.tsx` | All modal dialogs (column config, dropdown config, delete confirmation) |

### Implementation approach

- **Phase 1 (Low Risk):** Extract pure state hooks (`useCustomStatuses`, `useToolbarState`, `useModalState`).
- **Phase 2 (Medium Risk):** Extract CRUD hooks (`useGroupManagement`, `useRowOperations`, `useColumnOperations`).
- **Phase 3 (Medium Risk):** Extract complex features (`useTableFiltering`, `useDragDropHandlers`, `useTableSelection`).
- **Phase 4 (Medium Risk):** Extract UI components (`RoomTableModals`, `RoomTableToolbar`, `RoomTableBody`).

Each hook was extracted one at a time with manual verification that the board still functioned correctly after each step.

## Consequences

### Positive

- **RoomTable.tsx reduced from 3,461 to 779 lines** (78% reduction).
- Each hook is independently testable with React Testing Library's `renderHook`.
- Merge conflicts dropped significantly -- changes to filtering do not conflict with changes to drag-and-drop.
- IDE responsiveness improved; TypeScript completes in under 1 second.
- Clear ownership: a developer working on column logic knows to look at `useColumnOperations.ts`.

### Negative

- Props must be passed from the orchestrator to sub-hooks, introducing some boilerplate.
- Cross-hook communication (e.g., row operations triggering a filter refresh) requires careful callback wiring.
- 14 new files to navigate instead of 1 -- developers must understand the decomposition to know where to make changes.

### Mitigations

- The `hooks/index.ts` barrel file provides a single import point with clear naming.
- The refactoring plan is documented in `docs/refactoring/ROOMTABLE_REFACTOR_PLAN.md`.

## Related Files

- `src/features/board/views/Table/RoomTable.tsx` -- orchestrator (779 lines)
- `src/features/board/views/Table/hooks/` -- 10+ custom hooks
- `src/features/board/views/Table/components/RoomTableToolbar.tsx`
- `src/features/board/views/Table/components/RoomTableBody.tsx`
- `src/features/board/views/Table/components/RoomTableModals.tsx`
- `docs/refactoring/ROOMTABLE_REFACTOR_PLAN.md` -- original plan
