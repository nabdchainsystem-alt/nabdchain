# Contributing to NABD Chain System

Thank you for your interest in contributing to NABD! This document provides guidelines and best practices for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd nabd

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd server && pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start development servers
pnpm dev              # Frontend (terminal 1)
cd server && pnpm dev # Backend (terminal 2)
```

## Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/user-notifications`)
- `fix/` - Bug fixes (e.g., `fix/login-redirect`)
- `refactor/` - Code improvements (e.g., `refactor/board-service`)
- `docs/` - Documentation (e.g., `docs/api-readme`)

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(board): add timeline view support
fix(auth): handle token refresh on expiry
docs(readme): update installation steps
refactor(storage): extract localStorage utility
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests if applicable
4. Ensure TypeScript compiles without errors
5. Submit PR with clear description

## Code Standards

### TypeScript

- **No `any` types** - Define proper interfaces
- Use strict mode
- Export types from dedicated `.types.ts` files or `types.ts`

```typescript
// Good
interface BoardUpdateParams {
  name?: string;
  columns?: BoardColumn[];
}
const updateBoard = (id: string, params: BoardUpdateParams) => { ... };

// Bad
const updateBoard = (id: any, params: any) => { ... };
```

### React Components

- Use functional components with hooks
- Keep components focused (single responsibility)
- Extract complex logic to custom hooks
- Use error boundaries for error handling

```typescript
// Good - Focused component
const BoardHeader: React.FC<BoardHeaderProps> = ({ title, onEdit }) => {
  return (
    <header className="flex items-center justify-between">
      <h1>{title}</h1>
      <button onClick={onEdit}>Edit</button>
    </header>
  );
};

// Bad - Doing too much
const BoardHeader = ({ board, onEdit, onDelete, onShare, tasks, users, ... }) => {
  // 500 lines of mixed concerns
};
```

### File Organization

```
src/features/my_feature/
├── MyFeaturePage.tsx       # Main page component
├── components/             # Feature-specific components
│   ├── FeatureHeader.tsx
│   └── FeatureList.tsx
├── hooks/                  # Feature-specific hooks
│   └── useFeatureData.ts
├── services/               # Feature-specific services
│   └── featureService.ts
├── types.ts                # Feature-specific types
└── index.ts                # Public exports
```

### Styling

- Use Tailwind CSS utility classes
- Follow existing color scheme and spacing
- Support dark mode with `dark:` prefix
- Use consistent spacing (4, 8, 12, 16, 24, 32, 48, 64)

```typescript
// Good
<div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">

// Bad - Inline styles
<div style={{ padding: '16px', backgroundColor: 'white' }}>
```

### State Management

- Use React Context for global state
- Use localStorage for persistence (via `utils/storage.ts`)
- Prefer local state when possible
- Use optimistic updates for better UX

```typescript
// Use storage utility
import { getStorageItem, setStorageItem } from '@/utils/storage';

const [boards, setBoards] = useState(() =>
  getStorageItem('app-boards', [])
);

useEffect(() => {
  setStorageItem('app-boards', boards);
}, [boards]);
```

### Logging

Use the logger utility instead of `console.log`:

```typescript
import { createLogger } from '@/utils/logger';

const logger = createLogger('MyFeature');

logger.info('Feature initialized');
logger.error('Failed to load data', error);
```

### API Calls

- Always use auth tokens
- Handle errors gracefully
- Use service layer for API abstraction

```typescript
// Good - Service layer
import { boardService } from '@/services/boardService';

const boards = await boardService.getAllBoards(token, workspaceId);

// Bad - Direct fetch in component
const response = await fetch('/api/boards', { ... });
```

## Testing

### Unit Tests

```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import { BoardHeader } from './BoardHeader';

describe('BoardHeader', () => {
  it('renders the title', () => {
    render(<BoardHeader title="My Board" onEdit={() => {}} />);
    expect(screen.getByText('My Board')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:coverage  # With coverage
```

## Database Changes

### Adding a Model

1. Update `server/prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name add_my_model`
3. Generate client: `npx prisma generate`
4. Update seed if needed: `server/prisma/seed.ts`

### Migration Best Practices

- Use descriptive migration names
- Keep migrations small and focused
- Test migrations on a copy of production data
- Never edit existing migrations

## Documentation

- Update `CLAUDE.md` for AI assistant context
- Add JSDoc comments for complex functions
- Update README for user-facing changes
- Include code examples in documentation

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Use parameterized queries (Prisma handles this)
- Follow OWASP guidelines

## Questions?

- Check existing issues and discussions
- Review `CLAUDE.md` for architecture context
- Ask in pull request comments
