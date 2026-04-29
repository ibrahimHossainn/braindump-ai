# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## BrainDump AI

Voice-first PWA at `artifacts/braindump/` (preview path `/`). Captures speech via Web Speech API, classifies into Tasks/Ideas/Reminders/Notes via `/api/classify` (with local keyword fallback), persists to localStorage (`braindump-entries-v2`), supports edit/delete/share/export-markdown. Dark glassmorphism UI with neon cyan/purple accents. Made by Md. Ibrahim Hossain — Digital Identity Strategist.

Standalone Vercel-ready copy lives at `publish/braindump-ai/` (zipped at `publish/braindump-ai.zip`) for pushing to the user's GitHub repo `Braindump-AI`. The standalone version uses a Vercel Edge Function at `api/classify.ts` that calls Grok (xAI) with `GROK_API_KEY` env var.
