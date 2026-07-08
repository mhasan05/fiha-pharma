# Delivery Assist (DA) — Mobile App

React Native (Expo Router) app for **delivery agents** of the BDM Medicine Selling platform.
Talks directly to the existing Django REST backend in `../project_backend`.

## Stack

- Expo SDK 52 / React Native 0.76 — Expo Router (file-based)
- TypeScript (strict, no `any`)
- NativeWind v4 (Tailwind) for styling
- Zustand for client/auth state
- Axios + React Query for the data layer

## Setup

```bash
cd da_app
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_BASE_URL
npm run start
```

### Backend base URL

Set `EXPO_PUBLIC_API_BASE_URL` in `.env`. There is **no `/api` prefix** — apps are
mounted at root (`/auth`, `/delivery`, `/user`, ...).

| Target | URL |
|--------|-----|
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://localhost:8000` |
| Production | `https://bdmpharmacy.store` |

## Auth

JWT (SimpleJWT). Login at `POST /auth/login/` with phone + password; the app stores the
access token in `expo-secure-store` and sends `Authorization: Bearer <token>`. Only users
with `role == "delivery_man"` may sign in. There is no refresh route on the backend, so on a
401 the app clears the session and returns to Login.

## Project structure

```
app/                file-based routes (Expo Router)
src/api/            axios client + per-domain endpoint modules
src/store/          zustand stores (auth, ui)
src/components/ui/  shared UI primitives
src/lib/            env, constants, formatters
src/types/          API/serializer types
```

## Verify the scaffold

```bash
npm run typecheck
```
