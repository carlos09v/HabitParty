---
name: nextjs-app-router-patterns
description: Guidelines and best practices for Next.js 15+ App Router, React 19, TypeScript, Biome, and Tailwind CSS v4.
---

# Next.js App Router & Architecture Patterns

This skill enforces architectural standards and best practices for `habitparty-web`.

## Tech Stack Context
- **Framework**: Next.js (App Router with `src/app`)
- **React**: React 19 (Server Components + Client Components)
- **Styling**: Tailwind CSS v4, `clsx`, `tailwind-merge`
- **State & Stores**: Zustand
- **Tooling**: Biome (Linter & Formatter), TypeScript

## Core Rules & Patterns

### 1. Server vs Client Components
- **Default to React Server Components (RSC)**: Keep components server-side unless interactivity, browser APIs, or React hooks (`useState`, `useEffect`) are explicitly required.
- **Client Boundaries**: Add `"use client";` at the very top of files only when necessary. Push client boundaries as far down the component tree as possible (leaf nodes).
- **Data Fetching**: Fetch data inside Server Components directly or via Server Actions rather than in `useEffect`.

### 2. File & Route Organization (`src/app`)
- Use route groups like `(main)` and `(auth)` to organize navigation and layouts without affecting URLs.
- Reusable UI elements belong in `src/components/ui/`.
- Composite / Layout components belong in `src/components/layout/`.
- Global state should be modularly organized with Zustand stores (e.g. `src/store/`).

### 3. Styling & Tailwind v4
- Use `clsx` and `tailwind-merge` (e.g., via a `cn()` utility) when merging dynamic class names.
- Ensure all components are responsive (mobile-first) and accessible with semantic HTML elements.
- Avoid legacy CSS styles when Tailwind utilities can achieve the same result.

### 4. Code Quality & Biome
- Always conform to Biome's linting and formatting rules (`pnpm/npm run lint` & `format`).
- Use strict TypeScript types. Avoid `any`. Define clear interfaces/types for props and API responses.
