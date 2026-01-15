# NABD Chain System - AI Development Guide

> This document provides essential context for AI assistants (Claude, Copilot, etc.) working on this codebase.

## Project Overview

NABD is a full-stack enterprise SaaS platform for business management, combining project management, supply chain operations, CRM, and collaboration tools.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, Prisma ORM |
| Database | SQLite (dev), PostgreSQL (prod-ready) |
| Auth | Clerk (with mock auth fallback) |
| State | React Context API + localStorage persistence |

## Quick Start

```bash
# Install dependencies
pnpm install
cd server && pnpm install

# Start development
pnpm dev          # Frontend on :5173
cd server && pnpm dev  # Backend on :3001
```

## Architecture

### Directory Structure

```
nabd/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   ├── common/        # Generic components (ErrorBoundary)
│   │   ├── layout/        # Layout (Sidebar, TopBar)
│   │   ├── ui/            # UI primitives
│   │   └── features/      # Feature-specific components
│   ├── contexts/          # React Context providers
│   │   ├── AppContext     # Global app state
│   │   ├── UIContext      # UI state (sidebar)
│   │   ├── LanguageContext # i18n
│   │   ├── NavigationContext
│   │   └── FocusContext   # Focus mode
│   ├── features/          # Feature modules (45+)
│   │   ├── board/         # Core board system
│   │   ├── dashboard/     # Dashboard
│   │   ├── inbox/         # Email integration
│   │   ├── vault/         # Document storage
│   │   └── [many more]    # See full list below
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── utils/             # Utility functions
│   └── types.ts           # Global TypeScript types
├── server/                # Backend Express application
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Backend services
│   │   └── utils/         # Backend utilities
│   └── prisma/            # Database schema & migrations
└── public/                # Static assets
```

### Feature Modules

The app is organized by business domain:

- **board/** - Core board/table system (largest module)
- **dashboard/** - Main dashboard
- **inbox/** - Email integration (Google, Outlook)
- **vault/** - Document storage
- **supply_chain/** - Procurement, Warehouse, Shipping, Fleet, Vendors, Planning
- **operations/** - Maintenance, Production, Quality
- **business/** - Sales, Finance
- **business_support/** - HR, IT, Marketing
- **mini_company/** - Company simulation
- **marketplace/** - Local & Foreign marketplace
- **teams/** - Team management
- **talk/** - Communication/discussion
- **tools/** - Utilities (Whiteboard, Cornell Notes, Automation)
- **gtd/** - Getting Things Done methodology

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app router & state |
| `src/auth-adapter.tsx` | Auth abstraction (Clerk/Mock) |
| `src/features/board/BoardView.tsx` | Board view coordinator |
| `src/features/board/views/Table/RoomTable.tsx` | Table component (largest) |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar |
| `server/src/index.ts` | Express server entry |
| `server/prisma/schema.prisma` | Database schema |

## Code Patterns

### State Management

```typescript
// Use React Context for global state
const { activeWorkspaceId } = useContext(AppContext);

// localStorage for persistence (use utility)
import { getStorageItem, setStorageItem } from '@/utils/storage';
const boards = getStorageItem('app-boards', []);
```

### API Calls

```typescript
// Always use auth token from Clerk
const { getToken } = useAuth();
const token = await getToken();

// Use service layer
import { boardService } from '@/services/boardService';
const boards = await boardService.getAllBoards(token, workspaceId);
```

### Component Patterns

```typescript
// Lazy load feature pages
const SalesPage = lazyWithRetry(() => import('./features/sales/SalesPage'));

// Use ErrorBoundary for error handling
<ErrorBoundary>
  <FeatureComponent />
</ErrorBoundary>
```

## Database Schema (Key Models)

```prisma
model User          // Clerk-synced user
model Workspace     // Multi-tenant workspace
model Board         // Kanban/table boards
model Room          // Board groups/sections
model Row           // Board rows (JSON content)
model Activity      // Activity logging
model EmailAccount  // Connected email accounts
model VaultItem     // Document storage
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/workspaces` | List user workspaces |
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/boards` | List boards |
| POST | `/api/boards` | Create board |
| PATCH | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| GET | `/api/rooms/:boardId` | Get board rooms |
| POST | `/api/activities` | Log activity |

## Development Guidelines

### DO:
- Use TypeScript strictly (avoid `any`)
- Use the `storage.ts` utility for localStorage
- Use the `logger.ts` utility instead of `console.log`
- Follow existing patterns for new features
- Add proper error handling
- Use lazy loading for feature pages
- Keep components focused and small

### DON'T:
- Commit `.env` files or API keys
- Use `any` type - define proper interfaces
- Put business logic in components - use services
- Skip error boundaries
- Create massive monolithic components

### Type Safety

```typescript
// GOOD - Explicit types
const boards: Board[] = await fetchBoards();
const handleUpdate = (id: string, data: Partial<Board>) => { ... };

// BAD - Implicit any
const boards = await fetchBoards(); // any[]
const handleUpdate = (id, data) => { ... }; // any, any
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `BoardView.tsx`)
- Utilities: `camelCase.ts` (e.g., `storage.ts`)
- Types: Define in `types.ts` or co-located `.types.ts`
- Tests: `*.test.ts` or `*.spec.ts`

## Common Tasks

### Adding a New Feature Page

1. Create feature directory: `src/features/my_feature/`
2. Create main component: `MyFeaturePage.tsx`
3. Add lazy import in `App.tsx`
4. Add route condition in `AppContent`
5. Add sidebar navigation in `Sidebar.tsx`
6. Add to `ViewState` type in `types.ts`

### Adding API Endpoint

1. Create/update route in `server/src/routes/`
2. Add Prisma model if needed
3. Create service in `src/services/`
4. Use service in components

### Working with Boards

```typescript
// Board data structure
interface Board {
  id: string;
  name: string;
  workspaceId: string;
  columns: BoardColumn[];
  tasks: Task[];
  defaultView: BoardViewType;
  availableViews: BoardViewType[];
}

// Available view types
type BoardViewType =
  | 'overview' | 'table' | 'kanban' | 'calendar'
  | 'gantt' | 'timeline' | 'doc' | 'pivot';
```

## Known Issues & TODOs

1. **Type Safety**: ~124 files still use `any` - gradually improve
2. **RoomTable.tsx**: 4,500+ lines - needs refactoring
3. **Console Logging**: Replace with logger utility
4. **Token Refresh**: Email routes need token refresh logic
5. **Timeline View**: New feature in `views/Timeline/` - needs integration

## Environment Variables

See `.env.example` for required variables:

- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk auth
- `VITE_GEMINI_API_KEY` - AI features (optional)
- `VITE_USE_MOCK_AUTH` - Enable mock auth for dev

## Testing

```bash
# Run tests (when configured)
pnpm test

# Type checking
pnpm tsc --noEmit

# Lint
pnpm lint
```

## Deployment

```bash
# Build frontend
pnpm build

# Build server
cd server && pnpm build

# Database migrations
cd server && npx prisma migrate deploy
```

## Contact & Resources

- Main entry: `src/App.tsx`
- API server: `server/src/index.ts`
- Database: `server/prisma/schema.prisma`
- Types: `src/types.ts`
