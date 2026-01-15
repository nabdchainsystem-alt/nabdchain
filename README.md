# NABD Chain System

A comprehensive full-stack enterprise SaaS platform for business management, combining project management, supply chain operations, CRM, and collaboration tools.

## Features

- **Board System** - Flexible boards with multiple views (Table, Kanban, Calendar, Timeline, Gantt, Pivot)
- **Supply Chain** - Procurement, Warehouse, Shipping, Fleet, Vendors, Planning
- **Operations** - Maintenance, Production, Quality management
- **Business** - Sales, Finance, HR, IT, Marketing
- **Collaboration** - Teams, Talk/Discussion, Document Vault
- **Inbox** - Email integration (Google, Outlook)
- **Marketplace** - Local and Foreign marketplace views
- **Tools** - Whiteboard, Cornell Notes, Automation Rules

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, Prisma ORM |
| Database | SQLite (dev), PostgreSQL (prod-ready) |
| Auth | Clerk (with mock auth fallback for dev) |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd nabd

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd server && pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your Clerk keys
```

### Development

```bash
# Terminal 1 - Frontend
pnpm dev

# Terminal 2 - Backend
cd server && pnpm dev
```

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:3001`

### Build

```bash
# Build frontend
pnpm build

# Build backend
cd server && pnpm build
```

## Project Structure

```
nabd/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── features/           # Feature modules
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── utils/              # Utility functions
│   └── types.ts            # TypeScript definitions
├── server/                 # Backend Express application
│   ├── src/                # Server source code
│   └── prisma/             # Database schema & migrations
├── public/                 # Static assets
└── dist/                   # Build output
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) - AI development guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [.env.example](./.env.example) - Environment configuration

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk authentication key |
| `VITE_GEMINI_API_KEY` | Google Gemini API key (optional) |
| `VITE_USE_MOCK_AUTH` | Enable mock auth for development |

## Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |

### Backend

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

## License

Private - All rights reserved
