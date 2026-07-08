# Delivery Assist — React Native Mobile App
## Claude Code Project Prompt

---

You are building the **Delivery Assist (DA)** mobile application using React Native (Expo). The backend is a Django REST Framework project already present in this codebase.

## Step 1: Audit the Codebase

Before writing a single line of mobile code, do a full audit of this project:

1. **Map all Django apps** — list every app in `INSTALLED_APPS` and what it does
2. **Extract all API endpoints** — read every `urls.py` (root + per-app) and list every route with its HTTP method, URL path, and view name
3. **Read every Serializer** — understand the request/response shape for each endpoint
4. **Read every Model** — understand the data structure (fields, relationships, choices)
5. **Identify auth method** — JWT, Session, Token? What headers are required?
6. **Find user roles** — what role/permission system exists? (groups, is_staff, custom field?)
7. **Check media/file handling** — any image upload endpoints? What's the upload format?
8. **Note the base URL pattern** — how are API routes prefixed? (e.g. `/api/v1/`, `/api/`)

Present your findings as a structured report before proceeding.

---

## Step 2: Plan the Mobile App

Based on the audit, create a detailed build plan:

1. **List all screens needed** — one screen per major feature found in the API
2. **Define user roles & flows** — separate navigation stacks per role
3. **Map every screen to its API endpoint(s)**
4. **Identify what's missing** — any endpoint the mobile app needs that doesn't exist yet? Flag it.
5. **Propose the folder structure** for `da_app/` using Expo Router
6. **List all dependencies** needed with exact versions

Get my approval on the plan before writing any code.

---

## Step 3: Build (after approval)

Only after I approve the plan, build the app module by module in this order:

1. Project scaffold — `da_app/` with Expo Router, NativeWind, Zustand, Axios
2. API client — Axios instance with auth interceptors wired to the real backend
3. Auth screens — Login (and any other auth flow found in the audit)
4. Core screens — in priority order from the plan
5. Shared UI components — Button, Input, Card, Badge, LoadingSpinner, EmptyState
6. Role-based navigation — separate tab/stack navigators per user role

---

## Constraints

- **TypeScript only** — strict mode, no `any`
- **No mock data** — every screen must call real backend endpoints found in the audit
- **NativeWind** for styling — use the color palette found in existing frontend (if any), otherwise use `#059669` as primary green
- **One module at a time** — complete + test each screen before moving to the next
- **All new mobile code goes inside `da_app/`** — do not modify the Django backend or any existing frontend
- **Environment variable** for base URL — never hardcode the API domain

---

## Output of the Audit (Step 1 format)

Structure your audit report like this:

```
### Django Apps Found
- app_name: what it does

### API Endpoints
| Method | Path | View | Description |
|--------|------|------|-------------|

### User Roles
- role_name: permissions/access level

### Auth Method
- Type: JWT / Token / Session
- Header format: Authorization: Bearer <token>

### Data Models Summary
- ModelName: key fields

### Missing Endpoints (mobile needs but backend lacks)
- ...

### Proposed da_app/ Folder Structure
...

### Dependencies to Install
...
```

Start with Step 1 now.
