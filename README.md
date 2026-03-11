# Strategic Planning Automation Tool

Strategic planning application with:

- `frontend/`: React + Vite UI
- `backend/`: Express API
- `docker-compose.yml`: frontend + backend + PostgreSQL stack

## Prerequisites

- Node.js 18 or 20
- npm
- Docker Desktop (for containerized run)

## Quick Start With Docker

1. Start Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Run:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:8001`
- Backend: `http://localhost:9001`
- PostgreSQL: `localhost:5432`

The frontend proxies `/api` requests to the backend automatically.

## Local Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
DATABASE_URL=postgresql://planning:planning_secret@localhost:5432/strategic_planning PORT=9001 CORS_ORIGIN=http://localhost:8001 npm run dev
```

## Production Build Check

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax check:

```bash
cd backend
node --check src/index.js
```

## Environment Variables

Root `.env` file used by Docker Compose:

- `FRONTEND_PORT`
- `BACKEND_PORT`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `CORS_ORIGIN`

Example file: `.env.example`

## Troubleshooting

If the project was copied from another machine or downloaded as an archive on macOS, native `node_modules` binaries can be blocked by Gatekeeper. If frontend build fails with `rollup`, `esbuild`, or `swc` native binding errors, run:

```bash
xattr -dr com.apple.quarantine frontend/node_modules
```
