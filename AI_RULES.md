# AI Rules - KusomaKids

## 🛑 MANDATORY GUIDELINES
**This file defines the NON-NEGOTIABLE rules for any AI agent or developer working on this codebase.**

## 1. Tech Stack Strictness
*   **Framework**: Next.js 16+ (App Router). **DO NOT** downgrade or suggest Pages Router.
*   **Database**: Supabase (PostgreSQL). Use `supabase-js` client.
*   **Styling**: **Tailwind CSS ONLY**. No CSS Modules, no Styled Components, no SASS.
*   **Icons**: `react-icons` only.
*   **Payments**: Stripe (via `@stripe/stripe-js`).
*   **AI**: Fal AI (Images) & OpenAI (Text/Audio).

## 2. Coding Standards
*   **Components**: Prefer React Server Components (RSC) by default. Use `'use client'` at the very top only when interactivity (hooks, event listeners) is strictly necessary.
*   **Imports**: Use absolute paths (`@/components/...`, `@/lib/...`) instead of relative paths (`../../`).
*   **State Management**: Use `useState` / `useReducer` for local state. **NO Redux/Zustand** unless explicitly authorized for global complexity.
*   **Environment Variables**: NEVER hardcode secrets. Always use `process.env`.
*   **Formatting**: Prettier default settings. 4 spaces indentation or 2 spaces (consistency with existing file).

## 3. Security & Auth Architecture
*   **RLS (Row Level Security)**: This project relies heavily on Supabase RLS.
    *   **Client-side queries** (via `createClient`) MUST respect RLS.
    *   **Admin/Service-side queries** (via `supabaseAdmin` / Service Role Key) are ONLY for:
        *   Webhooks (Stripe).
        *   Privileged background jobs (Asset generation).
        *   Admin role management (`update-role`).
    *   **NEVER** bypass RLS in client-facing API routes unless absolutely necessary and documented.
*   **Authentication Required**: All mutating API routes (`books/create`, `workers/*`, `admin/*`) require authentication. Guest checkout is **DISABLED**.
*   **No Debug Endpoints**: Debug/probe endpoints are forbidden in production. Any endpoint using `service_role` without auth is a critical vulnerability.
*   **Worker Security**: Worker endpoints (`generate-magic-book`, `generate-book`) must verify the authenticated user owns the resource being processed.

## 4. Workflow & Knowledge
*   **Context First**: Before WRITING code, **ALWAYS** read `PROJECT_CONTEXT.md` to understand the current state.
*   **Update Documentation**: If you add a feature, a table, or a route, you **MUST** update `PROJECT_CONTEXT.md` and `ARCHITECTURE.md`.
*   **Refactoring**: Do not refactor "working legacy code" unless asked. Focus on the active task.

## 5. Specific Features
*   **Image Generation**: Handled via Fal AI (Flux / Face Swap). Logic is in `src/app/api/workers/...`. Do not duplicate generation logic in the client.
*   **PDF System**: Uses `@react-pdf/renderer`. It is a critical revenue feature. Test changes thoroughly.
*   **Audio**: Uses OpenAI TTS (`tts-1-hd`). Files are stored in `book-audio` bucket.
