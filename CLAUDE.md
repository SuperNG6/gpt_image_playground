# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Purpose | Command |
|---------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Tests | `npm test` |
| Format | `npm run format` |
| Mock image API | `npm run mock:api` |
| Deploy (Cloudflare) | `npm run deploy:cf` |

## Dev Setup

**Local CORS proxy**: copy `dev-proxy.config.example.json` → `dev-proxy.config.json` (gitignored) to proxy API calls through the Vite dev server, bypassing CORS restrictions when calling local or non-HTTPS APIs.

**Optional `.env.local` vars**:
- `VITE_DEFAULT_API_URL` — override the default API endpoint shown in settings
- `VITE_API_PROXY_AVAILABLE` — show the proxy toggle in UI (`true`/`false`)

## Code Style

- **Prettier** is configured — no semicolons, single quotes, 2-space indent, trailing commas, 120-char print width.
- **TypeScript strict mode** is on; all code must pass `tsc` without errors.
- **Commit messages** follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.

## Store & Persistence

`src/store.ts` is the single Zustand store (large file — ~84 KB). **Any new action that writes persistent state must also call the corresponding function in `src/lib/db.ts`** to write through to IndexedDB. Zustand alone is in-memory; tasks and images are only durable if persisted to IndexedDB.

## Testing

Vitest needs no separate config — `npm test` just works. Use `npm run mock:api` to start a local mock HTTP server on port 8787 (configurable via `MOCK_IMAGE_API_PORT`) for tests that require image API responses, including various failure-mode simulations.
