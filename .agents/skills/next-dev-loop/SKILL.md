---
name: next-dev-loop
description: Rapid development, testing, and debugging workflows for Next.js frontend code in habitparty-web.
---

# Next.js Development Loop & Debugging

This skill guides standard development, build checks, and debugging workflows for `habitparty-web`.

## Common Commands (run from `habitparty-web/`)
- **Start dev server**: `npm run dev`
- **Lint & check code**: `npm run lint` (uses Biome)
- **Format code**: `npm run format` (uses Biome)
- **Production build check**: `npm run build`

## Development Workflow
1. **Incremental Edits**: When editing UI or components, maintain clean separation of layout and logic.
2. **Biome Validation**: Before finishing a feature or bugfix, run `npm run lint` or ensure formatting is compliant with Biome rules.
3. **Hydration & SSR Awareness**:
   - Avoid mismatch between server-rendered HTML and client state (e.g., accessing `window`, `localStorage`, or dates directly during initial render).
   - Use `suppressHydrationWarning` or ensure client-side state loads safely in `useEffect` when localStorage is necessary.
4. **Environment Variables**:
   - Public frontend variables must be prefixed with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_API_URL`).
   - Server-only secrets must never have the `NEXT_PUBLIC_` prefix.
