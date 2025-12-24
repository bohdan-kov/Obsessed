# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Obsessed** is a mobile-first gym tracking application built with Vue 3, Firebase, and Tailwind CSS v4. It focuses on quick workout logging, real-time analytics, and progress tracking for gym enthusiasts.

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

# Run all tests with watch mode
npm run test

# Run tests once (CI mode)
npm run test:run
```

## Agent Behavior Rules

**CRITICAL - Code Formatting:**

- **NEVER run `npm run format` or any Prettier command**
- **NEVER run formatting tools** (prettier, eslint --fix for formatting, etc.)
- Code formatting is handled exclusively by the developer through their IDE or manual execution
- Agents may run `npm run lint` for linting checks, but must NOT trigger automatic formatting
- Write clean, properly-indented code that follows existing patterns, but do not auto-format the codebase

**Rationale:** Automatic formatting by agents can create noisy commits and interfere with the developer's workflow and IDE integration.

## High-Level Architecture

### Application Entry & Initialization

1. **src/main.js** - Creates Vue app, registers Pinia, Router, and vue-i18n, imports global styles
2. **src/App.vue** - Root component that initializes Firebase auth via `authStore.initAuth()` in `onMounted` hook, renders `<RouterView>` and `<Toaster>` for notifications
3. **src/router/index.js** - Defines routes with auth guards (`requiresAuth`, `requiresGuest`, `requiresVerification`). **Critical:** Router waits for auth initialization before executing guards to prevent race conditions.

### Firebase Integration Pattern

**Three-layer architecture:**

1. **Configuration Layer** (`src/firebase/config.js`)
   - Validates all `VITE_FIREBASE_*` environment variables on initialization
   - Throws clear error if any Firebase config is missing
   - Exports initialized Firebase app instance

2. **Service Layer** (`src/firebase/auth.js`, `src/firebase/firestore.js`)
   - **auth.js**: Exports auth functions (signInWithGoogle, signInWithEmail, onAuthChange, etc.)
   - **firestore.js**: Exports Firestore utilities (fetchCollection, createDocument, updateDocument, subscribeToCollection, etc.) and COLLECTIONS constant
   - Uses modular Firebase SDK imports for tree-shaking

3. **Store Layer** (`src/stores/*.js`)
   - Pinia stores consume Firebase services
   - **authStore**: Manages authentication state with `initAuth()` that sets up Firebase auth listener
   - **workoutStore**: Manages workouts with real-time subscriptions
   - **analyticsStore**: Computes analytics from workout data (depends on workoutStore)
   - **exerciseStore**: Manages exercise library
   - **userStore**: Manages user profile data

**Important:** All Firebase real-time listeners MUST be cleaned up in `onUnmounted` hooks to prevent memory leaks.

### State Management Strategy

**Pinia Setup Stores (function syntax):**
```javascript
export const useMyStore = defineStore('myStore', () => {
  // State (refs)
  const data = ref([])

  // Getters (computed)
  const filteredData = computed(() => data.value.filter(...))

  // Actions (functions)
  async function fetchData() { ... }

  return { data, filteredData, fetchData }
})
```

**Store Dependencies:**
- **analyticsStore** depends on **workoutStore** data (reactive computations)
- **All stores** can access **authStore** for current user UID
- Use `storeToRefs()` when accessing reactive state in components

### Routing & Authentication Flow

**Route Meta Fields:**
- `requiresAuth: true` - Must be logged in
- `requiresGuest: true` - Must be logged out (login/register pages)
- `requiresVerification: true` - Must have verified email

**Navigation Guard Logic:**
1. Wait for `authStore.initializing` to become false
2. Check route meta requirements
3. Redirect to login if auth required but not authenticated
4. Redirect to dashboard if guest route but authenticated
5. Redirect to verify-email if verification required but email not verified

**Route Structure:**
- `/login`, `/register`, `/verify-email` - Auth pages (no layout)
- `/` - AppLayout wrapper with sidebar
  - `/` (Dashboard) - Main analytics dashboard
  - `/workouts` - Workout history
  - `/analytics` - Detailed analytics
  - `/settings` - User settings

### UI Architecture

**Component Organization:**
- `src/components/ui/` - shadcn-vue base components (Button, Card, Input, etc.)
- `src/components/` - App-specific components (QuickLogSheet, QuickLogButton)
- `src/pages/*/components/` - Page-specific components (StatCard, ChartSection, ExerciseTable)
- `src/layouts/` - Layout components (AppLayout, AppSidebar, MobileNav)

**Layout System:**
- **Desktop**: Collapsible sidebar with tooltips when collapsed
- **Mobile**: Bottom navigation bar + hamburger menu sheet
- Responsive breakpoints defined in `src/constants/config.js`

### Internationalization (i18n)

**Technology:** vue-i18n with Composition API mode

**Locales Structure:**
- `src/i18n/locales/uk/` - Ukrainian translations (default)
- `src/i18n/locales/en/` - English translations
- Each locale has namespaced JSON files: `common.json`, `dashboard.json`, `workout.json`, `settings.json`, `auth.json`, `errors.json`
- Locale modules combine these in `index.js` (e.g., `src/i18n/locales/uk/index.js`)

**i18n Configuration (`src/i18n/index.js`):**
- **Initial locale detection**: localStorage > browser language > default ('uk')
- **Composition API mode**: `legacy: false` for `<script setup>` compatibility
- **Global injection enabled**: `$t` available in templates
- **RTL-ready**: Future-proofed with `dir` attribute support
- **Development warnings**: Missing translation warnings only in dev mode

**Usage Pattern:**
```javascript
// In components
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()

// Or use the useLocale composable
import { useLocale } from '@/composables/useLocale'
const { t, currentLocale, changeLocale } = useLocale()
```

**Important:**
- All new UI text MUST use i18n translations (no hardcoded strings)
- Translation keys follow namespace pattern: `namespace.section.key` (e.g., `dashboard.stats.totalWorkouts`)
- When adding features, update BOTH `uk/` and `en/` locale files
- The old `src/constants/strings.js` file is deprecated and will be removed

### Constants & Configuration

**src/constants/config.js** - All magic numbers and configuration:
- UI constants (touch target sizes, breakpoints, sidebar dimensions)
- Workout constants (RPE scale, weight limits, default rest time)
- Analytics constants (chart display limits, default periods)
- Performance constants (debounce delays, cache duration)
- Firebase constants (batch sizes, retry config)
- localStorage keys (prefixed with `obsessed_`)
- Feature flags

### Composables Pattern

**src/composables/useErrorHandler.js** - Centralized error handling:
- `handleError(error, userMessage, context)` - Logs errors in dev, shows toast to user
- Environment-aware (console.error only in development)
- Prepared for production error tracking (Sentry/LogRocket integration point)

**src/composables/useLocale.js** - Locale management:
- `currentLocale` - Reactive current locale code
- `availableLocales` - List of supported locales with metadata (name, flag, RTL)
- `isRTL` - Whether current locale is RTL (future-proof for Arabic/Hebrew)
- `changeLocale(code)` - Switch locale (updates vue-i18n → userStore → localStorage → Firestore)
- **Automatic sync**: Watches userStore settings and updates locale when changed from Firestore
- **Coordination flow**: UI updates immediately via vue-i18n, then persists to userStore (localStorage + Firestore)

**src/composables/useUnits.js** - Weight unit conversion and formatting:
- `weightUnit` - Current weight unit from user settings ('kg' | 'lbs')
- `unitLabel` - Localized unit label from i18n
- `availableWeightUnits` - List of supported weight units
- `convertWeight(value, options)` - Convert between units with configurable precision
- `formatWeight(value, options)` - Format weight with locale-aware number formatting and unit label
- `toStorageUnit(value)` - Convert from display unit to storage unit (kg) for database saves
- `fromStorageUnit(value)` - Convert from storage unit (kg) to display unit for UI rendering
- `changeWeightUnit(unit)` - Update user's weight unit preference
- **Storage convention**: All weights stored in kg in Firestore, converted to user's preferred unit for display
- **Locale-aware formatting**: Uses `Intl.NumberFormat` with current locale for proper decimal/thousands separators

**src/composables/useAuth.js** - Auth utilities for components

**src/composables/useFirestore.js** - Firestore helpers

### Testing Architecture

**Technology:** Vitest with jsdom environment, @vue/test-utils, @pinia/testing

**Global Test Setup (`vitest.setup.js`):**
- **vue-i18n mocking**: `$t` and `t` functions mocked globally to return translation keys
- **useUnits mocking**: Global mock with kg defaults and pass-through conversion functions
- **useLocale mocking**: Global mock with 'uk' default and available locales
- **Automatic setup**: Runs before all test files via Vitest `setupFiles` config
- **Why global mocks?**: i18n and unit composables are used across nearly all components, mocking globally reduces test boilerplate

**Test Organization:**
- Store tests: `src/stores/__tests__/*.spec.js` (authStore, workoutStore, analyticsStore)
- Component tests: `src/pages/*/components/__tests__/*.spec.js` and `src/components/__tests__/*.spec.js`

**Critical Testing Patterns:**

1. **Mock Firebase before imports:**
```javascript
// BEFORE importing stores
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  // ... all exports including those used by authStore
}))
```

2. **Never assign to computed properties directly:**
```javascript
// ❌ WRONG
store.workouts = [mockData]

// ✅ CORRECT - use mocked Firebase action
fetchCollection.mockResolvedValue([mockData])
await store.fetchWorkouts()
```

3. **Set auth state properly:**
```javascript
function setAuthUser(userId = 'test-user-id') {
  onAuthChange.mockImplementation((callback) => {
    callback(userId ? { uid: userId, email: 'test@test.com' } : null)
    return vi.fn() // unsubscribe function
  })
  const authStore = useAuthStore()
  authStore.initAuth()
}
```

4. **Component testing with Pinia:**
```javascript
mount(Component, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: { storeName: { ... } }
      })
    ]
  }
})
```

5. **i18n in tests (already globally mocked):**
- `$t('key')` and `t('key')` return the key itself for easy assertions
- Locale is always 'uk' by default in tests
- No need to mock i18n in individual test files unless overriding behavior

## Styling System

- **Tailwind CSS v4**: Uses new `@import "tailwindcss"` syntax and `@theme inline` directives in `src/styles/globals.css`
- **PostCSS**: Configured with `@tailwindcss/postcss` plugin (NOT the old `tailwindcss` plugin)
- **Design tokens**: CSS variables using OKLCH color space for better color manipulation
- **Dark mode**: Class-based strategy (`darkMode: ["class"]`)
- **Animations**: tw-animate-css library for additional animations
- **Path alias**: `@` → `src/` directory (configured in `vite.config.js`)

## shadcn-vue Integration

- **Configuration**: `components.json` defines component structure and aliases
- **Style**: "new-york" variant
- **Base color**: neutral with CSS variables enabled
- **Icon library**: lucide-vue-next
- **Component location**: UI components go in `src/components/ui/`
- **Utils location**: Utility functions in `src/lib/utils`
- **Adding components**: Use `npx shadcn-vue add @shadcn/[component-name]`
- **Toast system**: Custom implementation in `src/components/ui/toast/` (use-toast.js, Toast.vue, Toaster.vue)

## Key Dependencies

- **Vue ecosystem**: vue@3.5.25, vue-router@4.6.3, pinia@3.0.4, vue-i18n@9.14.5
- **Firebase**: firebase@12.6.0 (modular SDK with tree-shaking)
- **UI components**: reka-ui@2.6.0 (headless), lucide-vue-next (icons), vue-sonner@2.0.9
- **Styling utilities**: class-variance-authority, clsx, tailwind-merge
- **VueUse**: @vueuse/core@14.1.0 for Vue composition utilities
- **Form validation**: vee-validate@4.15.1, @vee-validate/zod@4.15.1, zod@3.25.76
- **Testing**: vitest@4.0.14, @vue/test-utils@2.4.6, @pinia/testing@1.0.3, jsdom@27.2.0

## Configuration Files

- **Node version**: Requires Node.js ^20.19.0 or >=22.12.0
- **Environment**: `.env.local` required with all `VITE_FIREBASE_*` variables (see src/firebase/config.js for validation)
- **Vite**: Vue plugin and Vue DevTools enabled
- **ESLint**: Flat config with Vue essential rules and Prettier skip formatting
- **PostCSS**: Uses `@tailwindcss/postcss` (v4) not the legacy `tailwindcss` plugin
- **Tailwind**: Class-based dark mode, content scanning includes all Vue/JS/TS files
- **Vitest**: Configured in `vitest.config.js` with jsdom environment, `@` path alias, and global setup file (`vitest.setup.js`)

## Code Style

- Vue 3 Composition API with `<script setup>` syntax (avoid Options API)
- Pinia stores use the function/setup syntax: `defineStore(() => { ... })`
- Prettier formatting is configured (see `.prettierrc.json`)
- **i18n-first approach**: All UI text must use vue-i18n translations (no hardcoded strings)
- **Bilingual support**: Ukrainian (default) and English locales with proper fallbacks
- Translation keys use namespace pattern: `namespace.section.key`
- All magic numbers go in `src/constants/config.js`
- **Weight storage convention**: Always store weights in kg in Firestore, use `useUnits` composable for display conversion
- JSDoc comments for complex functions
- ARIA labels for accessibility (screen readers)
- Minimum 44x44px touch targets (WCAG 2.1)
- Always cleanup Firebase subscriptions in `onUnmounted` hooks
