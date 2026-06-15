# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Please respond in Chinese (Simplified) when communicating with the user.**

## Project Overview

BOM (Bill of Materials) team management system — a two-part application for managing hardware BOM projects, materials, and modules with role-based access control.

- **bom-app/** — React 19 + TypeScript + Vite frontend
- **bom-server/** — Zero-dependency Node.js backend (plain `node:http`, no Express)
- **stitch_bom_team_management_system/** — HTML prototypes and design artifacts (not production code)

## Commands

### Frontend (bom-app/)
```bash
cd bom-app
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build → dist/
npm run lint      # ESLint with TypeScript + React hooks rules
npm run preview   # Preview production build
```

### Backend (bom-server/)
```bash
cd bom-server
npm start         # node src/server.js on port 3001
npm run dev       # node --watch src/server.js (auto-restart)
```

### Running Both
Start backend first, then frontend. Windows batch scripts `run-bom-server.bat` and `run-bom-app.bat` automate this.

### Tests
No test framework or test files exist in this project.

## Architecture

### Frontend → Backend Communication
- Vite dev server proxies `/api/*` → `http://localhost:3001` (configured in `vite.config.ts`)
- Backend also sets CORS headers, so direct access works too
- Pure REST — no websockets

### Routing (No Router Library)
`App.tsx` uses a `currentPage` state variable of type `PageRoute` (string literal union). A `switch` statement renders the matching page component. No react-router or equivalent.

### Authentication Flow
1. `POST /api/auth/login` → backend validates credentials, creates session token in `store.json`
2. Frontend stores token in `localStorage` (`bom_auth_token`, `bom_current_user`)
3. All API requests include `Authorization: Bearer <token>` header
4. `restoreSession()` in `storage.ts` validates cached token on page load via `GET /api/auth/me`
5. Sessions expire after 7 days

### Data Layer
- **All business data** lives in `bom-server/data/store.json` (auto-seeded from `seed.js` if missing)
- **Frontend API client**: `bom-app/src/services/storage.ts` — the single module all pages import for backend calls
- **No frontend state management library** — components use `useState`/`useEffect` and fetch data on mount
- Cross-component auth updates use a custom `userUpdated` window event

### Permission System
Three roles enforced on both frontend (UI hiding) and backend (endpoint guards):

| Role | Capabilities |
|------|-------------|
| admin | Full access: create, edit, delete, approve, export, manage users |
| editor | Create, edit, export, manage modules; no delete, approve, or user management |
| viewer | Read-only |

Permission checks: `bom-app/src/types/index.ts` defines `UserPermission` interface; `bom-server/src/permissions.js` implements `requirePermission()`.

### Backend Structure
- `server.js` — Monolithic HTTP server with manual regex URL routing (~1100 lines)
- `store.js` — File-based JSON persistence (`readStore`/`updateStore` sync operations)
- `auth.js` — Session/token management, user sanitization
- `permissions.js` — Role-based permission checks
- `seed.js` — Demo data factory (projects, materials, modules, users, activities)

Activity logging is automatic on write operations (capped at 50 entries).

## Key Conventions

### Styling
- Tailwind CSS v4 with Material Design 3 custom theme tokens defined in `index.css` via `@theme`
- Icons: Google Material Symbols Outlined (loaded from CDN)
- Fonts: Manrope (headlines), Inter (body text)
- UI language: Chinese (Simplified) for labels, some English for technical terms

### Naming
- Frontend files: PascalCase components, camelCase functions/variables
- Backend: camelCase throughout, ES module imports/exports
- Entity IDs are prefixed strings: `proj-1`, `mat-1`, `mod-1`, `user-1`, `part-1`

### TypeScript
- All data shapes in `bom-app/src/types/index.ts` as interfaces (Part, BOMProject, Material, Module, User, etc.)
- Strict mode with `noUnusedLocals` and `noUnusedParameters` enabled

### Demo Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| zhangsan | demo | editor |
| lisi | demo | editor |
| wangwu | demo | viewer |
