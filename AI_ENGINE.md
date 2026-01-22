# Smart Hybrid AI Engine - NABD Chain System

## Overview

A cost-optimized, multi-model AI architecture powering Chart Generation, GTD Automation, and Data Analysis in NABD.

### Architecture ("The Hybrid Brain")

| Tier | Model | Role | Credit Cost | Trigger |
|------|-------|------|-------------|---------|
| **Cleaner** | Gemini 2.5 Flash | Data processing | 1 | File uploads (CSV/XLSX/JSON) |
| **Worker** | Gemini 3 Flash | Default engine (90%) | 1 | "Generate Chart", standard questions |
| **Thinker** | Gemini 3 Pro | Deep analysis (10%) | 5 | "Deep Analysis" toggle ON, complex queries |

---

## Quick Start

### 1. Environment Setup

Add to `server/.env`:
```bash
GEMINI_API_KEY=your_google_ai_api_key
```

### 2. Database Migration

```bash
cd server && npx prisma db push
```

### 3. Start Servers

```bash
# Terminal 1 - Frontend
pnpm dev

# Terminal 2 - Backend  
cd server && pnpm dev
```

---

## Files Reference

### Backend (`server/src/`)

| File | Description |
|------|-------------|
| `services/aiRouterService.ts` | Core routing logic, tier detection, credit management |
| `services/departmentPrompts.ts` | Department-specific system prompt templates |
| `routes/aiRoutes.ts` | REST API endpoints for AI operations |

### Frontend (`src/`)

| File | Description |
|------|-------------|
| `contexts/AIContext.tsx` | React context for AI state and API methods |
| `components/AICreditsDisplay.tsx` | TopBar credits counter and Fast/Deep toggle |

### Database (`server/prisma/schema.prisma`)

New Fields/Models:
- `User.aiCreditsBalance` - Integer, default 100
- `FileMapping` - Stores AI-generated schema mappings
- `AIUsageLog` - Tracks AI usage for analytics

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/credits` | GET | Get user's credit balance |
| `/api/ai/process` | POST | Main processing (auto-routes to tier) |
| `/api/ai/upload` | POST | File → schema mapping (Tier 1) |
| `/api/ai/chart` | POST | Chart generation (Tier 2/3) |
| `/api/ai/analyze` | POST | Deep analysis (Tier 3) |
| `/api/ai/tier-preview` | POST | Preview tier without charging |

### Request Examples

**Process Prompt:**
```json
POST /api/ai/process
{
  "prompt": "Create a bar chart showing sales by region",
  "forceDeepMode": false,
  "promptType": "chart"
}
```

**Generate Chart:**
```json
POST /api/ai/chart
{
  "prompt": "Show monthly revenue trend",
  "data": [{"month": "Jan", "revenue": 10000}, ...],
  "deepMode": false
}
```

---

## Frontend Usage

### Using the AI Context

```tsx
import { useAI } from '../contexts/AIContext';

function MyComponent() {
  const { 
    credits,
    deepModeEnabled,
    toggleDeepMode,
    userDepartment,
    setUserDepartment,
    processPrompt,
    generateChart,
    isProcessing 
  } = useAI();

  // Set user's department for context-aware responses
  useEffect(() => {
    setUserDepartment('Finance'); // HR, Sales, Operations, etc.
  }, []);

  const handleGenerate = async () => {
    const result = await generateChart("Show sales trend", myData);
    if (result.success) {
      setChartConfig(result.chartConfig);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={isProcessing}>
      Generate Chart ({deepModeEnabled ? '5' : '1'} credits)
    </button>
  );
}
```

---

## Department Prompts

The AI automatically adapts responses based on user department. Available departments:
- HR, Finance, Operations, Sales, Marketing
- IT, Procurement, CustomerService, Legal, Executive

---

## Implementation Status

- [x] Backend AI Router Service
- [x] REST API Endpoints  
- [x] Database Schema (Credits, FileMapping, UsageLog)
- [x] Frontend AIContext
- [x] Credits Display Component
- [x] Department-specific Prompts
- [x] ChartBuilderModal AI Integration
- [x] User department context injection
- [ ] Context caching for Tier 2

---

## Troubleshooting

**"GEMINI_API_KEY is not configured"**
→ Add `GEMINI_API_KEY=...` to `server/.env`

**Credits show 0 for existing users**
→ Run: `UPDATE "User" SET "aiCreditsBalance" = 100;`

**AI returns empty response**
→ Check server logs for model errors, verify API key has access to Gemini 3 models

---

*Last updated: 2026-01-22*
