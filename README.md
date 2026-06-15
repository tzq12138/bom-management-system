# BOM Management System

## Structure

- `bom-app`: React + TypeScript + Vite frontend
- `bom-server`: Zero-dependency Node.js backend with file-based persistence
- `run-bom-app.bat`: Start the frontend dev server
- `run-bom-server.bat`: Start the backend server

## Start The Project

1. Start the backend first:

```bat
run-bom-server.bat
```

2. Start the frontend in another terminal:

```bat
run-bom-app.bat
```

3. Open the frontend URL shown by Vite, usually:

```text
http://localhost:5173
```

## Backend API

- Base URL: `http://localhost:3001/api`
- Health check: `GET /health`
- Frontend dev requests to `/api/*` are proxied to the backend by Vite

## Current Storage Behavior

- Business data such as projects, materials, modules, users, and activities is stored by `bom-server`
- Backend data is persisted in `bom-server/data/store.json`
- The current signed-in user is still cached in browser `localStorage`
