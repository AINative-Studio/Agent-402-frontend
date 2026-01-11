# Agent402 Frontend

React + TypeScript frontend for Agent402 - a cryptographically signed agent workflow platform with auditable persistence.

## Features

- **Agent Management**: Create, view, and manage AI agents
- **Run Tracking**: Monitor agent workflow runs with detailed logs
- **X402 Inspector**: View and verify cryptographic payment signatures
- **Compliance Audit**: Track and audit compliance events with risk scoring
- **Memory Viewer**: Explore agent memory with semantic search
- **Embeddings Playground**: Generate and search vector embeddings
- **Tables (NoSQL)**: CRUD operations for dynamic NoSQL tables

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **TanStack React Query** for server state management
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Router v7** for navigation
- **Playwright** for E2E testing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000/v1/public
```

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### E2E Testing

```bash
npx playwright test
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── layout/       # Layout components (Sidebar, Layout)
│   └── ...
├── contexts/         # React contexts (Auth, Project)
├── hooks/            # Custom hooks for API calls
├── lib/              # Utilities (apiClient, config, types)
└── pages/            # Page components
    ├── Overview.tsx
    ├── RunsList.tsx
    ├── RunDetail.tsx
    ├── X402Inspector.tsx
    ├── MemoryViewer.tsx
    ├── ComplianceAudit.tsx
    ├── Embeddings.tsx
    ├── Tables.tsx
    ├── TableDetail.tsx
    ├── Agents.tsx
    └── Login.tsx
```

## API Integration

The frontend communicates with the Agent402 backend API at `/v1/public/...`:

- `GET /projects` - List projects
- `GET /{project_id}/runs` - List agent runs
- `GET /{project_id}/agents` - List agents
- `GET /{project_id}/x402-requests` - X402 payment requests
- `GET /{project_id}/compliance-events` - Compliance audit events
- `GET /{project_id}/agent-memory` - Agent memory entries
- `POST /embeddings/generate` - Generate embeddings
- `POST /embeddings/search` - Semantic vector search
- `GET /tables` - List NoSQL tables
- `POST /tables/{table_id}/rows` - CRUD for table rows

## License

See [LICENSE](LICENSE) for details.
