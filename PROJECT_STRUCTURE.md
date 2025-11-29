# Obsessed - Project Structure

This project follows **Feature-Sliced Design (FSD)** architecture for scalability and maintainability.

## 📁 Folder Structure

```
obsessed/
├── src/
│   ├── app/                          # Application layer
│   │   ├── main.js                   # Entry point
│   │   ├── App.vue                   # Root component
│   │   └── providers/                # Global providers
│   │
│   ├── features/                     # Feature layer (business logic)
│   │   ├── auth/                     # Authentication
│   │   │   ├── api/                  # Firebase Auth API
│   │   │   ├── composables/          # useAuth, useAuthGuard
│   │   │   ├── store/                # authStore.js
│   │   │   └── ui/                   # LoginForm, SignUpForm
│   │   │
│   │   ├── workout/                  # Workout logging
│   │   │   ├── api/                  # Workout CRUD
│   │   │   ├── composables/          # useQuickLog, useWorkoutTimer
│   │   │   ├── store/                # workoutStore.js
│   │   │   └── ui/                   # QuickLogModal, SetCard
│   │   │
│   │   ├── exercise/                 # Exercise library
│   │   │   ├── api/                  # Exercise fetching
│   │   │   ├── composables/          # useExerciseSearch
│   │   │   ├── store/                # exerciseStore.js
│   │   │   └── ui/                   # ExerciseCard, ExerciseFilter
│   │   │
│   │   ├── analytics/                # Analytics & charts
│   │   │   ├── api/                  # Stats aggregation
│   │   │   ├── composables/          # useStatCards, useVolumeChart
│   │   │   ├── store/                # analyticsStore.js
│   │   │   └── ui/                   # VolumeChart, MuscleDonutChart
│   │   │
│   │   └── sync/                     # Offline sync
│   │       ├── api/                  # Sync queue processing
│   │       ├── composables/          # useSync, useOnlineStatus
│   │       ├── store/                # syncStore.js
│   │       └── ui/                   # SyncStatusIndicator
│   │
│   ├── entities/                     # Entities layer (models)
│   │   ├── user/
│   │   │   ├── model/                # User type definitions
│   │   │   ├── api/                  # User API
│   │   │   └── utils/                # User utilities
│   │   │
│   │   ├── workout/
│   │   │   ├── model/                # Workout types
│   │   │   └── utils/                # calculateVolume, calculateOneRM
│   │   │
│   │   ├── exercise/
│   │   │   ├── model/                # Exercise types
│   │   │   └── utils/                # Exercise constants
│   │   │
│   │   └── set/
│   │       ├── model/                # Set types
│   │       └── utils/                # validateSet
│   │
│   ├── shared/                       # Shared layer (reusable)
│   │   ├── api/                      # Firebase instances
│   │   ├── composables/              # Generic composables
│   │   ├── config/                   # Configuration
│   │   │   ├── firebase.js           # Firebase config
│   │   │   └── constants.js          # App constants
│   │   ├── lib/                      # Utilities
│   │   │   └── utils.js              # shadcn-vue cn() helper
│   │   └── ui/                       # shadcn-vue components
│   │
│   ├── pages/                        # Pages layer (route views)
│   │   ├── auth/                     # Auth pages
│   │   ├── dashboard/                # Dashboard
│   │   ├── workouts/                 # Workout history
│   │   ├── analytics/                # Analytics
│   │   └── settings/                 # Settings
│   │
│   ├── widgets/                      # Widgets (composed features)
│   │   ├── Header.vue                # App header
│   │   ├── Sidebar.vue               # Navigation
│   │   └── WorkoutFeed.vue           # Workout history feed
│   │
│   ├── router/                       # Vue Router
│   │   ├── index.js                  # Router config
│   │   ├── guards/                   # Route guards
│   │   │   ├── authGuard.js
│   │   │   └── verificationGuard.js
│   │   └── routes/                   # Route definitions
│   │       ├── auth.js
│   │       ├── dashboard.js
│   │       └── workouts.js
│   │
│   ├── stores/                       # Pinia stores (legacy)
│   └── styles/                       # Global styles
│       └── globals.css               # Tailwind + design tokens
│
├── public/                           # Static assets
├── .env.example                      # Environment template
├── components.json                   # shadcn-vue config
├── vite.config.js                    # Vite config
├── tailwind.config.js                # Tailwind config
└── package.json
```

## 🎯 Architecture Principles

### Feature-Sliced Design Layers (Top to Bottom)

1. **app** - Application initialization & providers
2. **pages** - Route-level views (1 per route)
3. **widgets** - Composed UI sections (Header, Sidebar)
4. **features** - Business logic features (auth, workout, analytics)
5. **entities** - Domain models & business entities
6. **shared** - Reusable utilities, UI components, configs

### Import Rules

- ✅ **Allowed**: Lower layers import from lower or same layer
- ❌ **Forbidden**: Lower layers cannot import from higher layers
- ✅ **Example**: `features/workout` can import from `entities/set`
- ❌ **Example**: `entities/workout` CANNOT import from `features/workout`

### Store Architecture

All Pinia stores use **setup syntax**:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWorkoutStore = defineStore('workout', () => {
  // State
  const workouts = ref([])

  // Getters
  const totalWorkouts = computed(() => workouts.value.length)

  // Actions
  function addWorkout(workout) {
    workouts.value.push(workout)
  }

  return { workouts, totalWorkouts, addWorkout }
})
```

### Composable Pattern

Feature composables wrap stores + API:

```javascript
// features/workout/composables/useWorkout.js
import { useWorkoutStore } from '../store/workoutStore'
import { createWorkout } from '../api/createWorkout'

export function useWorkout() {
  const store = useWorkoutStore()

  async function startWorkout() {
    const workout = await createWorkout()
    store.addWorkout(workout)
    return workout
  }

  return {
    workouts: store.workouts,
    startWorkout
  }
}
```

## 🔥 Firebase Structure

### Collections

- `users/{userId}` - User profiles
- `workouts/{workoutId}` - Workout sessions
- `workouts/{workoutId}/sets/{setId}` - Sets (subcollection)
- `exercises/{exerciseId}` - Global exercise library
- `user_exercises/{userId}_{exerciseId}` - User exercise history
- `personal_records/{userId}/records/{exerciseId}` - PRs

### Offline-First Strategy

1. **Write**: Optimistic update → IndexedDB → Firestore
2. **Read**: IndexedDB first → Firestore if stale
3. **Sync**: Background queue with retry logic

## 🚀 Development Workflow

### Adding a New Feature

1. Create feature folder: `src/features/my-feature/`
2. Add subfolders: `api/`, `composables/`, `store/`, `ui/`
3. Define store in `store/myFeatureStore.js`
4. Create composable in `composables/useMyFeature.js`
5. Build UI components in `ui/`
6. Add page in `src/pages/my-feature/MyFeaturePage.vue`
7. Register route in `src/router/routes/myFeature.js`

### Code Splitting

- All pages are **lazy-loaded** via `() => import()`
- Heavy components use `defineAsyncComponent()`
- Vendor chunks split in `vite.config.js`

### Testing Strategy

- Unit tests: Composables, utilities
- Component tests: UI components
- E2E tests: Critical user flows (login, quick log)

## 📦 Dependencies

### Core
- Vue 3.5.25
- Vite 7.2.4
- Pinia 3.0.4
- Vue Router 4.6.3

### UI
- shadcn-vue (reka-ui 2.6.0)
- Tailwind CSS v4
- lucide-vue-next (icons)

### Firebase
- firebase (latest)

### Utilities
- @vueuse/core 14.1.0
- class-variance-authority
- clsx, tailwind-merge

## 🎨 Styling

- **Tailwind CSS v4** with `@import "tailwindcss"`
- **Design tokens** via CSS variables (OKLCH color space)
- **Dark mode** via class-based strategy
- **Chart colors** defined in `src/styles/globals.css`

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📝 Naming Conventions

- **Components**: PascalCase (`QuickLogModal.vue`)
- **Composables**: camelCase, prefixed with `use` (`useQuickLog.js`)
- **Stores**: camelCase, suffixed with `Store` (`workoutStore.js`)
- **Constants**: UPPER_SNAKE_CASE (`MUSCLE_GROUPS`)
- **Files**: kebab-case for non-components (`create-workout.js`)

## ✅ Best Practices

1. **Use `<script setup>`** syntax for all components
2. **Setup-style Pinia stores** (not Options API)
3. **Composables over mixins** for logic reuse
4. **Lazy load routes** for code splitting
5. **Optimistic updates** for better UX
6. **Firebase offline persistence** enabled
7. **Type-safe** via JSDoc comments (no TypeScript for now)
8. **Mobile-first** responsive design
9. **Accessibility** (WCAG AA compliance)
10. **Dark mode** support everywhere

---

**Last updated:** 2025-01-29
