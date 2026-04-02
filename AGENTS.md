# AGENTS.md - Commitry Development Guide

This document provides guidance for agentic coding agents working in this repository.

## Project Overview

Commitry is a Next.js 16 application with React 19 and TypeScript. The main code is in the `ui/` directory.

## Build / Lint / Test Commands

### Installation
```bash
cd ui && npm install
```

### Development
```bash
cd ui && npm run dev
```

### Build
```bash
cd ui && npm run build
```

### Lint
```bash
cd ui && npm run lint
```

### TypeScript Type Check
```bash
cd ui && npx tsc --noEmit
```

### Running a Single Test
There are currently no tests in the project. To add tests:
```bash
# Install testing libraries
cd ui && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jest

# Run tests
cd ui && npx vitest run
# or with coverage
cd ui && npx vitest run --coverage
```

## Code Style Guidelines

### General
- Use ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Strict TypeScript mode enabled (`strict: true` in tsconfig.json)
- Use functional components with hooks instead of class components

### Imports
- Use path aliases: `@/*` maps to `./ui/*`
- Group imports in this order: external libs, then internal components/utils
- Example:
  ```tsx
  import { useState, useMemo, memo, useCallback, useEffect } from 'react';
  import Home from "@/components/Home";
  ```

### Formatting
- Use 2 spaces for indentation
- Use single quotes for strings in JSX, double quotes for other strings
- Use Prettier for code formatting (integrated with ESLint)
- Max line length: 100 characters

### Types
- Always declare types for props and function parameters
- Use explicit return types for functions
- Use interface for object shapes, type for unions/intersections
- Example:
  ```tsx
  interface ContributionData {
    date: Date;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }

  interface ContributionGraphProps {
    contributions: Map<string, number>;
    selectedYear?: number;
    onDotClick?: (date: Date, count: number) => void;
  }
  ```

### Naming Conventions
- **Components**: PascalCase (e.g., `ContributionGraph.tsx`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Variables**: camelCase
- **Interfaces**: PascalCase with descriptive names (e.g., `ContributionData`)
- **Props**: Descriptive names matching the data they represent

### React Patterns
- Use `'use client'` directive for client-side components
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `memo()` for pure components to prevent unnecessary re-renders
- Define custom hooks with `use` prefix (e.g., `useContributionData`)
- Destructure props for better readability

### Error Handling
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safe access
- Handle edge cases explicitly (e.g., empty arrays, null values)
- Provide proper TypeScript types for potentially undefined values

### CSS / Styling
- Use Tailwind CSS v4 with `@tailwindcss/postcss`
- Use dark mode with `dark:` prefix (e.g., `dark:text-white`)
- Use arbitrary values when needed (e.g., `w-[13px]`)
- Maintain consistent spacing using Tailwind's scale

### Performance
- Use `memo()` for list items and frequently rendered components
- Use `useCallback` for event handlers passed to child components
- Use `useMemo` for expensive computations
- Consider `useEffect` cleanup functions for subscriptions

### File Organization
```
ui/
├── app/              # Next.js App Router pages
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/       # Reusable React components
│   ├── ContributionGraph.tsx
│   ├── Home.tsx
│   └── YearSelector.tsx
├── public/           # Static assets
└── package.json      # Dependencies
```

### Component Structure
Each component file should:
1. Start with `'use client'` if it uses hooks
2. Import React hooks and other dependencies
3. Define interfaces/types
4. Define helper functions
5. Create the component
6. Export using `memo()` for performance

### Git Conventions
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- Keep commits focused and atomic
- Write descriptive commit messages
