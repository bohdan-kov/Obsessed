# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 application built with Vite, using Pinia for state management and Vue Router for routing. The project uses Tailwind CSS v4 with shadcn-vue components.

## Development Commands

```sh
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and auto-fix (uses cache)
npm run lint

# Format code with Prettier
npm run format
```

## Architecture

- **Entry point**: `src/main.js` - Creates the Vue app, registers Pinia, Vue Router, and imports global styles
- **State management**: Pinia stores in `src/stores/` using Composition API style with `defineStore(() => { ... })`
- **Routing**: Vue Router configured in `src/router/index.js` with `createWebHistory`
- **Styling**: Global styles in `src/styles/globals.css` with Tailwind CSS v4 and design tokens
- **Path alias**: `@` is aliased to `src/` directory (configured in `vite.config.js`)

## Styling System

- **Tailwind CSS v4**: Uses new `@import "tailwindcss"` syntax and `@theme inline` directives
- **PostCSS**: Configured with `@tailwindcss/postcss` plugin (NOT the old `tailwindcss` plugin)
- **Design tokens**: CSS variables defined in `src/styles/globals.css` using OKLCH color space
- **Dark mode**: Implemented with class-based strategy (`darkMode: ["class"]`)
- **Animations**: tw-animate-css library included for additional animations

## shadcn-vue Integration

- **Configuration**: `components.json` defines component structure and aliases
- **Style**: "new-york" variant
- **Base color**: neutral with CSS variables enabled
- **Icon library**: lucide-vue-next
- **Component location**: UI components go in `src/components/ui/`
- **Utils location**: Utility functions in `src/lib/utils`
- **Adding components**: Use `npx shadcn-vue add @shadcn/[component-name]`

## Key Dependencies

- **Vue ecosystem**: vue@3.5.25, vue-router@4.6.3, pinia@3.0.4
- **UI components**: reka-ui@2.6.0 (headless component library), lucide-vue-next (icons)
- **Styling utilities**: class-variance-authority, clsx, tailwind-merge
- **VueUse**: @vueuse/core@14.1.0 for Vue composition utilities

## Configuration Files

- **Node version**: Requires Node.js ^20.19.0 or >=22.12.0
- **Vite**: Vue plugin and Vue DevTools enabled
- **ESLint**: Flat config with Vue essential rules and Prettier skip formatting
- **PostCSS**: Uses `@tailwindcss/postcss` (v4) not the legacy `tailwindcss` plugin
- **Tailwind**: Class-based dark mode, content scanning includes all Vue/JS/TS files

## Code Style

- Vue 3 Composition API (avoid Options API)
- Use `<script setup>` syntax for all components
- Pinia stores use the function/setup syntax: `defineStore(() => { ... })`
- Prettier formatting is configured (see `.prettierrc.json`)
