<!-- Last synced: 2025-12-13 -->

# Obsessed

> **Track hard. Train smart. Stay obsessed.** | **Відстежуй чітко. Тренуйся розумно. Залишайся одержимим.**

[![Vue.js](https://img.shields.io/badge/Vue.js-3.5.25-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-^20.19.0%20||%20>=22.12.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[🇬🇧 English](README.md) | [🇺🇦 Українська](README.uk.md)

**Obsessed** is a mobile-first gym tracking application designed for serious lifters who demand precision, speed, and insights from their workout data. Built with Vue 3, Firebase, and Tailwind CSS v4, it delivers real-time analytics, offline-first tracking, and a bilingual exercise library—all optimized for the gym environment.

---

## 🎥 Screenshots

### Desktop Views

<details open>
<summary>Click to expand Desktop screenshots</summary>

#### Dashboard Overview
![Dashboard Overview](./screenshots/01-dashboard-overview.png)
*Main analytics dashboard with real-time stats, workout volume charts, training frequency heatmap, and muscle group distribution. The sidebar provides quick navigation to all app sections.*

#### Workout History
![Workout History](./screenshots/04-workout-history.png)
*Complete workout history with filters, search functionality, and detailed stats for each session including duration, exercises count, and total volume.*

#### Exercise Progress Details
![Exercise Details](./screenshots/05-exercise-details.png)
*Individual exercise tracking with progress charts, personal records, volume trends, and detailed set-by-set history.*

#### Analytics Dashboard with Charts
![Analytics Charts](./screenshots/06-analytics-charts.png)
*Advanced analytics with multiple chart types: weekly volume breakdown, muscle group distribution pie chart, training frequency heatmap, and period-over-period progress comparison.*

#### Settings Page
![Settings Page](./screenshots/07-settings-page.png)
*User preferences including profile settings, locale selection (Ukrainian/English), weight unit conversion (kg/lbs), and account management.*

</details>

### Mobile Views

<details>
<summary>Click to expand Mobile screenshots</summary>

#### Quick Log Exercise Selection
![Quick Log Sheet](./screenshots/02-quick-log-sheet.png)
*Mobile-optimized quick logging interface with exercise search, recent exercises section, and full exercise library. Designed for thumb-friendly interactions with 44x44px minimum touch targets.*

#### Active Workout Tracking
![Active Workout](./screenshots/03-active-workout.png)
*Live workout tracking screen with running timer, exercise list, set logging interface, and quick actions. Optimized for gym use with large, high-contrast buttons.*

#### Mobile Navigation
![Mobile Navigation](./screenshots/08-mobile-navigation.png)
*Bottom navigation bar with Home, Workouts, Analytics, and Settings tabs. Clean, minimalist design for one-handed operation.*

</details>

---

## 🏋️ Why Obsessed?

Most gym tracking apps are cluttered, slow, or lack the depth serious lifters need. **Obsessed** solves this by:

- **⚡ Lightning-fast logging:** Quick log sheet designed for gym use—log sets in seconds, even with sweaty hands
- **📊 Real-time insights:** Watch your analytics update instantly as you log workouts
- **🌐 Bilingual from day one:** Full Ukrainian and English support, including 68 exercises in both languages
- **📴 Offline-first:** Track workouts without internet; syncs automatically when back online
- **🎯 Mobile-optimized UX:** Built for thumb-friendly interactions with 44x44px minimum touch targets (WCAG 2.1)
- **🧠 Smart analytics:** Automatic personal best tracking, training frequency analysis, and muscle group balance insights
- **⚙️ Unit flexibility:** Toggle between kg and lbs with instant conversion across the entire app

Whether you're a powerlifter tracking PRs, a bodybuilder monitoring volume, or a casual gym-goer building consistency, Obsessed gives you the tools to level up.

---

## ✨ Core Features

### 🏃 Workout Tracking
- **Quick Log Sheet:** Overlay interface for rapid set logging without leaving the workout view
- **Live Timer:** Integrated rest timer with customizable intervals
- **Workout Plans:** Create custom workout templates with pre-defined exercises
- **Workout History:** Browse past workouts with search and filter capabilities
- **Exercise Library:** 68 bilingual exercises covering all major muscle groups (chest, back, shoulders, arms, legs, core)

### 📈 Analytics & Insights
- **Real-time Dashboard:** See total workouts, volume lifted, training frequency, and active streaks at a glance
- **Personal Bests:** Automatic tracking of 1RM, max volume, and heaviest sets per exercise
- **Training Trends:** Visual charts showing workout frequency, volume progression, and rest day patterns
- **Muscle Group Balance:** Analyze which muscle groups are being trained and identify imbalances
- **Exercise History:** Detailed logs per exercise with progression tracking

### 🌍 Internationalization (i18n)
- **Full Bilingual Support:** Ukrainian (default) and English with seamless switching
- **Localized Number Formatting:** Proper decimal/thousands separators per locale
- **Translation Namespacing:** Organized translation keys for maintainability
- **User Preference Sync:** Language choice persists across devices via Firestore

### 🔧 Technical Highlights
- **Offline-first Architecture:** Firebase persistence layer ensures uninterrupted tracking
- **Smart Unit Conversion:** All weights stored in kg, displayed in user's preferred unit (kg/lbs)
- **Reactive State Management:** Pinia stores with Vue 3 Composition API for instant UI updates
- **Mobile-first Design:** Responsive layouts optimized for 375px-428px mobile viewports
- **Accessibility First:** ARIA labels, semantic HTML, keyboard navigation, WCAG 2.1 compliant

---

## 🛠️ Tech Stack

### Frontend
- **[Vue.js 3.5.25](https://vuejs.org/)** - Progressive JavaScript framework with Composition API
- **[Pinia 3.0.4](https://pinia.vuejs.org/)** - Intuitive state management
- **[Vue Router 4.6.3](https://router.vuejs.org/)** - Official router with navigation guards
- **[vue-i18n 9.14.5](https://vue-i18n.intlify.dev/)** - Internationalization framework

### Backend & Database
- **[Firebase 12.6.0](https://firebase.google.com/)** - Modular SDK with tree-shaking
  - **Firestore:** Real-time NoSQL database
  - **Authentication:** Email/password + Google OAuth
  - **Offline Persistence:** Local caching for offline-first UX

### UI & Styling
- **[Tailwind CSS 4.1.17](https://tailwindcss.com/)** - Utility-first CSS framework (v4 with modern syntax)
- **[shadcn-vue](https://www.shadcn-vue.com/)** - Headless UI components built on reka-ui
- **[reka-ui 2.6.0](https://reka-ui.com/)** - Vue port of Radix UI primitives
- **[lucide-vue-next 0.555.0](https://lucide.dev/)** - Beautiful icon library
- **[vue-sonner 2.0.9](https://vue-sonner.vercel.app/)** - Toast notifications

### Data Visualization
- **[@unovis/vue 1.6.2](https://unovis.dev/)** - Modular chart library for analytics

### Form Handling & Validation
- **[vee-validate 4.15.1](https://vee-validate.logaretm.com/)** - Form validation framework
- **[@vee-validate/zod 4.15.1](https://vee-validate.logaretm.com/v4/integrations/zod)** - Zod integration for schema validation
- **[zod 3.25.76](https://zod.dev/)** - TypeScript-first schema validation

### Development Tools
- **[Vite 7.2.4](https://vite.dev/)** - Next-generation frontend tooling
- **[Vitest 4.0.14](https://vitest.dev/)** - Fast unit testing framework
- **[@vue/test-utils 2.4.6](https://test-utils.vuejs.org/)** - Official Vue testing utilities
- **[ESLint 9.39.1](https://eslint.org/)** - Linting with flat config + Vue plugin
- **[Prettier 3.6.2](https://prettier.io/)** - Code formatting
- **[Vue DevTools 8.0.5](https://devtools.vuejs.org/)** - Browser extension integration

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** `^20.19.0` OR `>=22.12.0` (LTS recommended)
- **npm:** `10.9.4` or higher (comes with Node.js)
- **Firebase Project:** Create one at [Firebase Console](https://console.firebase.google.com/)
  - Enable **Firestore Database**
  - Enable **Authentication** (Email/Password + Google)
  - Enable **Offline Persistence** in Firestore settings

Optional but recommended:
- **Git:** For version control
- **VS Code:** With Vue (Official) extension

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bohdan-kov/Obsessed.git
cd obsessed
```

### 2. Install Dependencies

```bash
npm install
```

This will install all production and development dependencies listed in `package.json`.

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Where to find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll to "Your apps" → Web app → SDK setup and configuration
5. Copy the config values

**Important:**
- All Firebase environment variables are **required**. The app validates them on startup and throws clear errors if any are missing.
- Never commit `.env.local` to version control (it's already in `.gitignore`)

### 4. Set Up Firestore Database

#### 4a. Enable Firestore
1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your preferred region

#### 4b. Seed Exercise Library

The app comes with a comprehensive library of 68 bilingual exercises. Seed them into Firestore:

```bash
npm run seed:exercises
```

This will populate your database with exercises covering:
- Chest: 9 exercises
- Back: 10 exercises
- Shoulders: 8 exercises
- Biceps: 7 exercises
- Triceps: 6 exercises
- Legs: 14 exercises (quads, hamstrings, glutes)
- Calves: 3 exercises
- Core: 8 exercises

**Note:** This script is idempotent—safe to run multiple times. It skips exercises that already exist.

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### 6. Create Your First Account

1. Navigate to `http://localhost:5173`
2. Click **Register** and create an account with email/password or Google OAuth
3. Verify your email if using email/password authentication
4. You'll be redirected to the dashboard

**First-time setup tip:** Create a workout plan, add exercises, and log your first workout to see analytics populate in real-time!

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `npm run dev` | Starts Vite dev server with hot-reload at `http://localhost:5173` |
| **Build** | `npm run build` | Compiles and minifies for production in `dist/` folder |
| **Preview** | `npm run preview` | Previews production build locally before deployment |
| **Lint** | `npm run lint` | Runs ESLint with auto-fix and caching enabled |
| **Format** | `npm run format` | Formats code with Prettier (experimental CLI) |
| **Test** | `npm run test` | Runs Vitest in watch mode with UI |
| **Test (CI)** | `npm run test:run` | Runs tests once without watch mode (for CI/CD pipelines) |
| **Seed Workouts** | `npm run seed:workouts` | Adds sample workout data to Firestore (development) |
| **Remove Seed Workouts** | `npm run seed:workouts:remove` | Removes sample workout data from Firestore |

**Pro Tips:**
- Use `npm run dev` during development for instant hot-reload
- Run `npm run lint` before committing to catch issues early
- Use `npm run test` to watch tests as you write them
- Always run `npm run build` before deploying to production

---

## 📁 Project Structure

```
obsessed/
├── public/                     # Static assets (served as-is)
├── scripts/                    # Utility scripts
│   ├── seedExercises.js        # Seed exercise library to Firestore
│   └── seedWorkouts.js         # Seed sample workouts (dev/testing)
├── src/
│   ├── assets/                 # Images, fonts, static files
│   ├── components/             # Reusable Vue components
│   │   ├── ui/                 # shadcn-vue base components
│   │   │   ├── button/         # Button component
│   │   │   ├── card/           # Card component
│   │   │   ├── input/          # Input component
│   │   │   ├── sheet/          # Sheet (drawer) component
│   │   │   ├── toast/          # Toast notification system
│   │   │   └── ...             # Other UI primitives
│   │   ├── QuickLogButton.vue  # Floating action button for quick logging
│   │   └── QuickLogSheet.vue   # Quick workout logging overlay
│   ├── composables/            # Reusable composition functions
│   │   ├── useAuth.js          # Authentication utilities
│   │   ├── useErrorHandler.js  # Centralized error handling
│   │   ├── useFirestore.js     # Firestore helpers
│   │   ├── useLocale.js        # i18n and locale management
│   │   └── useUnits.js         # Weight unit conversion (kg/lbs)
│   ├── constants/              # Application constants
│   │   └── config.js           # All magic numbers and configuration
│   ├── firebase/               # Firebase configuration and services
│   │   ├── config.js           # Firebase initialization & validation
│   │   ├── auth.js             # Authentication service layer
│   │   └── firestore.js        # Firestore service layer
│   ├── i18n/                   # Internationalization
│   │   ├── locales/
│   │   │   ├── en/             # English translations
│   │   │   │   ├── common.json
│   │   │   │   ├── dashboard.json
│   │   │   │   ├── workout.json
│   │   │   │   └── ...
│   │   │   ├── uk/             # Ukrainian translations (default)
│   │   │   │   ├── common.json
│   │   │   │   ├── dashboard.json
│   │   │   │   └── ...
│   │   └── index.js            # i18n configuration
│   ├── layouts/                # Layout components
│   │   ├── AppLayout.vue       # Main app layout with sidebar
│   │   ├── AppSidebar.vue      # Desktop sidebar navigation
│   │   └── MobileNav.vue       # Mobile bottom navigation
│   ├── lib/                    # Utility libraries
│   │   └── utils.js            # Helper functions (cn, clsx, etc.)
│   ├── pages/                  # Route pages
│   │   ├── analytics/          # Analytics page
│   │   ├── auth/               # Auth pages (login, register, verify-email)
│   │   ├── dashboard/          # Dashboard page
│   │   │   └── components/     # Dashboard-specific components
│   │   ├── settings/           # Settings page
│   │   └── workouts/           # Workouts page
│   ├── router/                 # Vue Router configuration
│   │   └── index.js            # Route definitions & navigation guards
│   ├── stores/                 # Pinia stores (state management)
│   │   ├── analyticsStore.js   # Analytics computations
│   │   ├── authStore.js        # Authentication state
│   │   ├── exerciseStore.js    # Exercise library state
│   │   ├── userStore.js        # User profile state
│   │   └── workoutStore.js     # Workout data state
│   ├── styles/                 # Global styles
│   │   └── globals.css         # Tailwind imports & custom CSS
│   ├── App.vue                 # Root Vue component
│   └── main.js                 # Application entry point
├── .env.local                  # Environment variables (create this, not committed)
├── .eslintrc.js                # ESLint configuration (flat config)
├── .gitignore                  # Git ignore rules
├── .prettierrc.json            # Prettier configuration
├── CLAUDE.md                   # Project documentation for Claude Code
├── components.json             # shadcn-vue configuration
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Vitest configuration
├── vitest.setup.js             # Vitest global setup
└── README.md                   # This file
```

---

## 🏗️ Architecture Overview

### Three-Layer Architecture

Obsessed follows a clean three-layer architecture for Firebase integration:

```
┌─────────────────────────────────────────┐
│          Component Layer (UI)           │
│  Vue components consume Pinia stores    │
│  Use storeToRefs() for reactivity       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Store Layer (State Management)    │
│  Pinia stores with Setup Store syntax   │
│  - authStore: Authentication state      │
│  - workoutStore: Workout data           │
│  - analyticsStore: Computed analytics   │
│  - exerciseStore: Exercise library      │
│  - userStore: User profile              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Service Layer (Firebase SDK)       │
│  auth.js: Authentication functions      │
│  firestore.js: Database utilities       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   Configuration Layer (Firebase Init)   │
│  config.js: Validates env vars          │
│  Exports initialized Firebase app       │
└─────────────────────────────────────────┘
```

### State Management Strategy

**Pinia Setup Stores (function syntax):**
```javascript
export const useMyStore = defineStore('myStore', () => {
  // State (refs)
  const data = ref([])
  const loading = ref(false)

  // Getters (computed)
  const filteredData = computed(() =>
    data.value.filter(item => item.active)
  )

  // Actions (functions)
  async function fetchData() {
    loading.value = true
    try {
      data.value = await fetchCollection('collectionName')
    } catch (error) {
      handleError(error, 'Failed to fetch data')
    } finally {
      loading.value = false
    }
  }

  return { data, loading, filteredData, fetchData }
})
```

**Store Dependencies:**
- `analyticsStore` depends on `workoutStore` data for reactive computations
- All stores can access `authStore` for current user UID
- Use `storeToRefs()` when accessing reactive state in components

### Routing & Authentication Flow

**Route Meta Fields:**
- `requiresAuth: true` - Must be logged in
- `requiresGuest: true` - Must be logged out (login/register pages)
- `requiresVerification: true` - Must have verified email

**Navigation Guard Logic:**
1. Wait for `authStore.initializing` to become false (prevents race conditions)
2. Check route meta requirements
3. Redirect to login if auth required but not authenticated
4. Redirect to dashboard if guest route but authenticated
5. Redirect to verify-email if verification required but email not verified

---

## 🎨 Technical Highlights

### 1. Offline-First Workout Tracking
Firebase Firestore persistence layer ensures uninterrupted workout logging even without internet. Data syncs automatically when connectivity is restored.

```javascript
// Example: Firestore persistence is enabled in config.js
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence enabled only in first tab')
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support persistence')
  }
})
```

### 2. Real-Time Analytics with Reactive Computed
Analytics update instantly as workouts are logged thanks to Pinia's reactive computed properties.

```javascript
// Example: analyticsStore computes stats from workoutStore
const totalWorkouts = computed(() => workoutStore.workouts.length)
const totalVolume = computed(() =>
  workoutStore.workouts.reduce((sum, w) => sum + w.totalVolume, 0)
)
```

### 3. Bilingual Exercise Library
68 exercises with full Ukrainian and English translations. The `useLocale` composable handles switching seamlessly.

```javascript
// Example: Exercise names are locale-aware
const exerciseName = computed(() =>
  currentLocale.value === 'uk' ? exercise.name.uk : exercise.name.en
)
```

### 4. Smart Unit Conversion (kg ↔ lbs)
All weights stored in kg in Firestore. The `useUnits` composable handles conversion for display.

```javascript
// Example: Display weight in user's preferred unit
import { useUnits } from '@/composables/useUnits'
const { formatWeight, toStorageUnit } = useUnits()

// Display: 100 kg → "220.46 lbs" if user prefers lbs
const displayWeight = formatWeight(100)

// Save: 220 lbs → 100 kg for Firestore
const storageWeight = toStorageUnit(220)
```

### 5. Mobile-Optimized UX
Built mobile-first with thumb-friendly interactions:
- Minimum 44x44px touch targets (WCAG 2.1)
- Large, high-contrast buttons for gym lighting
- Quick log sheet overlay for rapid set logging
- Responsive breakpoints: `375px → 428px → 768px → 1024px`

---

## 🧪 Testing

### Running Tests

```bash
# Watch mode (recommended during development)
npm run test

# CI mode (runs once)
npm run test:run
```

### Test Structure

```
src/
├── stores/
│   └── __tests__/
│       ├── authStore.spec.js
│       ├── workoutStore.spec.js
│       └── analyticsStore.spec.js
├── pages/
│   └── dashboard/
│       └── components/
│           └── __tests__/
│               └── StatCard.spec.js
└── components/
    └── __tests__/
        └── QuickLogSheet.spec.js
```

### Testing Patterns

**1. Mock Firebase before imports:**
```javascript
import { vi, describe, it, expect, beforeEach } from 'vitest'

// BEFORE importing stores
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
}))

import { useWorkoutStore } from '@/stores/workoutStore'
```

**2. Set auth state properly:**
```javascript
import { useAuthStore } from '@/stores/authStore'
import { onAuthChange } from '@/firebase/auth'

function setAuthUser(userId = 'test-user-id') {
  onAuthChange.mockImplementation((callback) => {
    callback(userId ? { uid: userId, email: 'test@test.com' } : null)
    return vi.fn() // unsubscribe function
  })
  const authStore = useAuthStore()
  authStore.initAuth()
}
```

**3. Test components with Pinia:**
```javascript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

const wrapper = mount(MyComponent, {
  global: {
    plugins: [
      createTestingPinia({
        initialState: {
          workoutStore: { workouts: [] }
        }
      })
    ]
  }
})
```

**Global Test Setup:**
- `vitest.setup.js` mocks `vue-i18n`, `useUnits`, and `useLocale` globally
- `$t('key')` returns the key itself for easy assertions
- No need to mock i18n in individual test files

---

## 📐 Code Style & Standards

### Vue 3 Composition API
- **ALWAYS** use `<script setup>` syntax (Options API is forbidden)
- Use `ref()` for reactive primitives and objects needing deep reactivity
- Use `computed()` for derived state depending on other reactive values
- Use `watch()` and `watchEffect()` for side effects
- Destructure props with `defineProps()` and emit events with `defineEmits()`

### Pinia State Management
- **ALWAYS** use Setup Store syntax: `defineStore(() => { ... })`
- NEVER use Options Store syntax
- Structure stores: state (refs), getters (computed), actions (functions)
- Use `storeToRefs()` in components to maintain reactivity when destructuring

### Tailwind v4 & Mobile-First UI
- Build MOBILE-FIRST: design for thumb-friendly interactions
- Minimum touch target size: 44x44px (`min-h-11 min-w-11`)
- Use responsive breakpoints progressively: `sm:`, `md:`, `lg:`, `xl:`
- Leverage `shadcn-vue` components as UI primitives, customize with Tailwind

### Internationalization
- All UI text MUST use i18n translations (no hardcoded strings)
- Translation keys follow namespace pattern: `namespace.section.key`
- Update BOTH `uk/` and `en/` locale files when adding features

### Code Formatting
- Prettier handles all formatting (see `.prettierrc.json`)
- ESLint enforces Vue best practices (flat config with `eslint-plugin-vue`)
- Run `npm run format` before committing

---

## 🖥️ Browser & IDE Setup

### Recommended IDE
**[VS Code](https://code.visualstudio.com/)** with the following extensions:
- **[Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)** - Vue language support (disable Vetur if installed)
- **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)** - Real-time linting
- **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)** - Code formatting
- **[Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)** - Tailwind autocomplete

### Recommended Browser Setup

**Chromium-based browsers (Chrome, Edge, Brave):**
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
- [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters) for better console logging

**Firefox:**
- [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
- [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

---

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes** and follow the code style guidelines above
4. **Run tests:** `npm run test:run`
5. **Lint your code:** `npm run lint`
6. **Commit your changes:** `git commit -m 'feat: Add amazing feature'`
7. **Push to your branch:** `git push origin feature/amazing-feature`
8. **Open a Pull Request** with a clear description of your changes

### Contribution Guidelines
- Follow the Vue 3 Composition API and Pinia Setup Store patterns
- Update both English and Ukrainian translations for UI changes
- Add tests for new features or bug fixes
- Ensure all tests pass before submitting PR
- Keep commits atomic and use [Conventional Commits](https://www.conventionalcommits.org/) format

### Reporting Bugs
Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Browser/device information

---

## 🚢 Deployment

### Automated CI/CD with GitHub Actions

This project includes a fully configured **CI/CD pipeline** that automatically deploys to Firebase Hosting on every push to `main`. It also creates preview deployments for Pull Requests.

#### Quick Start (3 Steps)

1. **Get Firebase Service Account token:**
   ```bash
   firebase login:ci
   ```
   Copy the token that appears (looks like `1//0eXXXXX...`)

2. **Add GitHub Secrets:**
   - Go to: `GitHub Repository → Settings → Secrets and variables → Actions`
   - Add 7 repository secrets (use helper: `bash .github/copy-secrets.sh`)
   - Required secrets:
     - `FIREBASE_SERVICE_ACCOUNT` (token from step 1 in JSON format: `{"token": "YOUR_TOKEN"}`)
     - `VITE_FIREBASE_API_KEY` (from `.env.local`)
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```
   The CI/CD workflow will automatically:
   - Run tests (`npm run test:run`)
   - Build production bundle (`npm run build`)
   - Deploy to Firebase Hosting
   - Takes 2-4 minutes

**Live URL:** `https://obsessed-a405c.web.app`

#### What You Get with CI/CD

- Automatic deployment on every `push` to `main`
- Preview URLs for every Pull Request
- Tests run before deployment (deployment fails if tests fail)
- Deployment history in GitHub Actions
- Email notifications on deployment success/failure
- Rollback capability via Firebase Console

#### Detailed Documentation

For complete setup instructions, troubleshooting, and advanced features:
- [CI/CD Documentation](.github/DEPLOYMENT.md) - Full setup guide and instructions

### Manual Deployment Options

If you prefer to deploy manually or use a different platform:

#### Option 1: Firebase Hosting (Manual)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build and deploy
npm run deploy
```

#### Option 2: Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in project root
3. Follow prompts to deploy
4. Add environment variables in Vercel dashboard

#### Option 3: Netlify
1. Push your code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

**Important:** Ensure all `VITE_FIREBASE_*` environment variables are configured in your deployment platform's dashboard.

### Build for Production (Local)

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

This creates an optimized production build in the `dist/` folder.

---

## 🛠️ Troubleshooting

### Common Issues

#### Issue: "Firebase config validation failed"
**Solution:** Ensure all `VITE_FIREBASE_*` variables are set in `.env.local`. The app validates them on startup and will throw clear errors indicating which ones are missing.

#### Issue: Tests failing with "Cannot access 'X' before initialization"
**Solution:** Ensure Firebase services are mocked BEFORE importing stores:
```javascript
vi.mock('@/firebase/firestore', () => ({ ... }))
import { useWorkoutStore } from '@/stores/workoutStore' // Import AFTER mock
```

#### Issue: "Route navigation guard infinite loop"
**Solution:** Ensure `authStore.initAuth()` is called in `App.vue` onMounted. Router waits for `authStore.initializing` to become false before executing guards.

#### Issue: Weights not converting between kg/lbs
**Solution:** Check that `useUnits` composable is imported and used. Storage is always in kg; conversion happens at display time.

#### Issue: i18n translations showing as "namespace.section.key"
**Solution:** Ensure both `uk/` and `en/` locale files have the translation key. Check browser console for missing translation warnings (dev mode only).

#### Issue: "Multiple tabs open, persistence enabled only in first tab"
**Solution:** This is a warning, not an error. Firebase offline persistence only works in one tab at a time. Close other tabs or ignore the warning.

---

## 🗺️ Roadmap

### Version 1.0 (Current)
- ✅ Workout tracking with quick log sheet
- ✅ Real-time analytics dashboard
- ✅ Bilingual exercise library (68 exercises)
- ✅ Offline-first architecture
- ✅ Unit conversion (kg/lbs)
- ✅ Personal best tracking

### Version 1.1 (Next Release)
- ⏳ Workout plan templates
- ⏳ Custom exercise creation
- ⏳ Export workout data (CSV, JSON)
- ⏳ Dark mode support
- ⏳ Progressive Web App (PWA) support

### Version 2.0 (Future)
- 🔮 Social features (share workouts, follow friends)
- 🔮 AI-powered workout recommendations
- 🔮 Video exercise demonstrations
- 🔮 Advanced analytics (periodization tracking, deload detection)
- 🔮 Integration with fitness trackers (Apple Health, Google Fit)

**Have a feature request?** Open an issue with the `enhancement` label!

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Obsessed Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE](LICENSE) file for full text.

---

## 🙏 Acknowledgments

Built with passion by developers who understand the grind. Special thanks to:

- **[Vue.js Team](https://vuejs.org/)** - For creating an amazing framework
- **[Firebase Team](https://firebase.google.com/)** - For the best real-time database and auth
- **[shadcn](https://ui.shadcn.com/)** - For the beautiful headless component system
- **[Tailwind Labs](https://tailwindcss.com/)** - For revolutionizing CSS with utility-first design
- **The open-source community** - For countless libraries and tools that make this possible

**Inspired by lifters, for lifters.** Stay obsessed.

---

**Links:**
- [Report a Bug](https://github.com/bohdan-kov/Obsessed/issues/new?labels=bug)
- [Request a Feature](https://github.com/bohdan-kov/Obsessed/issues/new?labels=enhancement)
- [Contribute](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

---

Made with 💪 and Vue.js
