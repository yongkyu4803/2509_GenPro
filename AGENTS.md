# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `src/` with Next.js App Router:
  - `src/app/` pages, API routes, and layout.
  - `src/components/` UI components (`PromptGenerator.tsx`, `ui/*`).
  - `src/lib/` domain logic and utilities (e.g., `rulepack-loader.ts`).
  - `src/types/` shared TypeScript types.
- Static assets: `public/`.
- Config: `eslint.config.mjs`, `.prettierrc`, `tsconfig.json`, `next.config.ts`.
- Env templates: `.env.example` (copy to `.env.local`).

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server at `http://localhost:3000`.
- `npm run build` — Production build (Next.js + Turbopack).
- `npm start` — Run built app.
- `npm run lint` — Lint with ESLint.
- `npm run type-check` — TypeScript compile check.
- `npm run format` / `npm run format:check` — Prettier write/check.
- Tests use Jest; if no `test` script, run: `npx jest`.

## Coding Style & Naming Conventions
- TypeScript, 2-space indent, Prettier-enforced; run `npm run format`.
- ESLint rules via `eslint.config.mjs`; fixable issues: `npm run lint -- --fix`.
- Filenames:
  - React components: `PascalCase.tsx` (e.g., `PromptGenerator.tsx`).
  - Library/util files: `kebab-case.ts` (e.g., `rulepack-loader.ts`).
  - Tests: colocated `__tests__/` with `*.test.ts`.
- Prefer named exports; avoid default exports in libs.

## Testing Guidelines
- Framework: Jest with `@jest/globals`.
- Location: `src/**/__tests__/*.test.ts` (example: `src/lib/__tests__/rulepack-loader.test.ts`).
- Naming: mirror source name + `.test.ts`.
- Run: `npx jest`. For additional TS transforms, add a Jest config if needed.
- Aim for fast, isolated unit tests; mock I/O and network.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep subject ≤ 72 chars; body explains rationale and impact.
- PRs should include:
  - Clear description and motivation; link issues (e.g., `Closes #123`).
  - Screenshots/GIFs for UI changes.
  - Checklist: `npm run lint`, `npm run type-check`, and build pass locally.

## Security & Configuration
- Do not commit secrets. Use `.env.local` (ignored). Required keys: `OPENAI_API_KEY`, others in `.env.example`.
- Validate config via app health route `src/app/api/health/route.ts` when applicable.
