# Schedule Section - Product Requirements Document (PRD)

## Executive Summary

The Schedule section transforms Obsessed from a **reactive tracking tool** into a **proactive training companion**. While Dashboard/Analytics answer "What did I do?", Schedule answers **strategic planning questions**:
- "What should I train today?"
- "Am I following my program consistently?"
- "How do I quickly start my planned workout?"
- "Is my training split balanced?"

**Core Philosophy**: Reduce friction between planning and execution. Every tap saved is a PR gained. The gym is not a place for complex UI - workouts should start in <30 seconds.

**Target Impact**:
- 60% reduction in time from app open to workout start
- 75%+ schedule adherence rate
- 20% higher retention for users with templates

---

## 📅 Implementation Status (Updated: 2026-01-11)

### MVP (Phase 1) - Weeks 1-4 - ✅ **100% COMPLETE**
- ✅ Workout Templates CRUD
- ✅ Pre-built Split Presets (PPL, Upper/Lower, Arnold Split, Full Body)
- ✅ Quick Start (1-Tap Workout Launch)
- ✅ Weekly Calendar View (7-day grid)
- ✅ Template Assignment to Days

### V1.1 (Phase 2) - Weeks 5-6 - 🟡 **67% COMPLETE**
- ✅ Adherence Tracker (completion %, streak, achievement badges)
- ❌ Rest Day Suggestions (muscle fatigue warnings) - NOT IMPLEMENTED
- ❌ Muscle Rotation Heatmap (weekly balance) - NOT IMPLEMENTED

### V1.2 (Phase 3) - Future - ❌ **0% COMPLETE**
- ❌ Workout Reminders/Notifications
- ❌ Adaptive Rescheduling (missed workout recovery)
- ❌ Template Sharing (community library)
- ❌ Periodization Support (macrocycles/mesocycles)

### Store & Utilities Status
- ✅ `scheduleStore.js` - IMPLEMENTED (19 passing tests)
- ✅ `useWorkoutTemplates.js` - IMPLEMENTED
- ✅ `useSchedule.js` - IMPLEMENTED
- ✅ `useWeekNavigation.js` - IMPLEMENTED
- ✅ `useAdherence.js` - IMPLEMENTED
- ✅ `splitPresets.js` - IMPLEMENTED (4 complete programs)
- ✅ `scheduleUtils.js` - IMPLEMENTED
- ✅ `templateUtils.js` - IMPLEMENTED

**Status**: MVP + Adherence Tracking fully implemented and tested (1,390 tests passing). Production-ready! 🎉

---

## 1. Background Analysis

### 1.1 Current User Flow Pain Points

**Problem 1: Slow Workout Start**
```
Current Flow (6 taps, ~45 seconds):
1. Open app → Dashboard
2. Click "Quick Log" button
3. Click "Add Exercise"
4. Search/Select exercise
5. Enter sets/reps/weight manually
6. Repeat for 5-8 exercises
7. Finally start logging sets
```

**Problem 2: Memory Load**
- Users must remember their workout plan
- No visual schedule of what to train when
- Easy to overtrain same muscle groups
- Forget rest days or optimal rotation

**Problem 3: Inconsistent Programs**
- No template = improvising every workout
- Hard to track if following a structured program
- Can't measure adherence to training plan

### 1.2 What Competitors Do (Hevy, Strong, FitNotes)

| Feature | Hevy | Strong | FitNotes | Obsessed (Target) |
|---------|------|--------|----------|-------------------|
| Workout Templates | ✅ | ✅ | ✅ | ✅ (MVP) |
| Quick Start | ✅ (2 taps) | ✅ (3 taps) | ❌ | ✅ (1 tap) |
| Weekly Schedule | ✅ | ❌ | ❌ | ✅ (MVP) |
| Pre-built Splits | ✅ (paid) | ❌ | ❌ | ✅ (free) |
| Auto Weight Fill | ✅ | ✅ | ❌ | ✅ (MVP) |
| Adherence Tracking | ❌ | ❌ | ❌ | ✅ (V1.1) |
| Rest Day Intelligence | ❌ | ❌ | ❌ | ✅ (V1.1) |

**Our Differentiator**: Fastest workout start (1 tap) + adherence insights + Ukrainian localization

### 1.3 Available Data (from Existing Stores)

**workoutStore**:
- `workouts[]` - Historical workout data
- `startWorkout()` - Current action to start workout
- `exerciseHistory` - Last weights per exercise

**exerciseStore**:
- `exercises[]` - Exercise library with muscle groups
- `searchExercises()` - Quick exercise lookup

**analyticsStore**:
- `muscleGroupDistribution` - Current training balance
- `frequencyData` - Training consistency

**What's Missing for Schedule**:
- Workout templates (saved workout plans)
- Weekly schedule assignments (what day = what template)
- Adherence tracking (completed vs planned)
- Split presets (pre-configured programs)

---

## 2. User Personas & Jobs-to-be-Done

### Persona 1: The Structured Lifter (Primary)
- **Name**: Богдан (our actual user!)
- **Goals**: Follow consistent program, track progressive overload, save time
- **Pain Points**: Wastes 5 minutes every workout deciding what to do, forgets planned exercises
- **Jobs-to-be-Done**:
  - "When I arrive at the gym, I want to start my planned workout in <30 seconds, so I don't waste mental energy deciding what to do."
  - "When I open the app, I want to see my weekly schedule, so I know exactly what I'm training today."

### Persona 2: The Program Hopper
- **Goals**: Try different training splits (PPL, Upper/Lower, etc.), optimize for goals
- **Pain Points**: Hard to compare program effectiveness, tedious to recreate templates
- **Jobs-to-be-Done**:
  - "When I want to try a new program, I want pre-built templates, so I don't have to research and create from scratch."
  - "When I compare programs, I want to see adherence %, so I know which one I actually stick to."

### Persona 3: The Beginner (Secondary)
- **Goals**: Learn proper program structure, build workout habit
- **Pain Points**: Doesn't know what a good program looks like, trains same muscles too often
- **Jobs-to-be-Done**:
  - "When I'm new to lifting, I want recommended workout splits, so I don't injure myself or plateau."
  - "When I plan my week, I want rest day suggestions, so I don't overtrain."

---

## 3. Feature Specifications

## MVP (Weeks 1-4)

### Feature 1.1: Workout Templates CRUD
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to create, edit, and save workout templates with exercises/sets/reps/weights, so I can quickly reuse them instead of manually entering exercises every time.

**Acceptance Criteria**:
- [ ] "Create Template" button in Schedule page
- [ ] Template creation sheet:
  - Template name input (e.g., "Push Day A")
  - Optional description/notes
  - Add exercises from library (with search)
  - For each exercise: sets, reps, target weight (optional)
  - Muscle group tags (auto-detected from exercises)
  - Estimated duration display
- [ ] Template list view:
  - Card layout with template name, exercise count, muscle groups
  - Last used date display
  - Edit/Delete actions (with confirmation)
  - Search/filter by muscle group
- [ ] Edit template flow (same as create, pre-filled)
- [ ] Delete template (soft delete, confirm dialog)
- [ ] Empty state: "Create your first template" with illustration
- [ ] Validation:
  - Template name required (max 50 chars)
  - At least 1 exercise required
  - Sets/reps must be positive numbers

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Firestore collection: users/{userId}/workoutTemplates/{templateId}
{
  id: 'template-uuid',
  name: 'Push Day A',
  description: 'Chest, shoulders, triceps focus',
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press', // Denormalized for quick display
      sets: 4,
      reps: 8,
      targetWeight: 100, // kg, optional
      restTime: 120, // seconds
      notes: 'Focus on form'
    },
    // ...
  ],
  muscleGroups: ['chest', 'shoulders', 'triceps'], // Auto-computed
  estimatedDuration: 75, // minutes
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastUsedAt: Timestamp | null,
  usageCount: 0
}
```

**New Store: scheduleStore.js**:
```javascript
// src/stores/scheduleStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createDocument, updateDocument, deleteDocument, fetchCollection } from '@/firebase/firestore'
import { useAuthStore } from './authStore'

export const useScheduleStore = defineStore('schedule', () => {
  const authStore = useAuthStore()
  const templates = ref([])
  const loading = ref(false)

  // Fetch all templates
  async function fetchTemplates() {
    loading.value = true
    try {
      const path = `users/${authStore.currentUser.uid}/workoutTemplates`
      templates.value = await fetchCollection(path)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      loading.value = false
    }
  }

  // Create template
  async function createTemplate(templateData) {
    const path = `users/${authStore.currentUser.uid}/workoutTemplates`
    const newTemplate = {
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUsedAt: null,
      usageCount: 0
    }
    const docId = await createDocument(path, newTemplate)
    await fetchTemplates() // Refresh list
    return docId
  }

  // Update template
  async function updateTemplate(templateId, updates) {
    const path = `users/${authStore.currentUser.uid}/workoutTemplates/${templateId}`
    await updateDocument(path, { ...updates, updatedAt: new Date() })
    await fetchTemplates()
  }

  // Delete template
  async function deleteTemplate(templateId) {
    const path = `users/${authStore.currentUser.uid}/workoutTemplates/${templateId}`
    await deleteDocument(path)
    templates.value = templates.value.filter(t => t.id !== templateId)
  }

  // Computed
  const templatesByMuscle = computed(() => {
    // Group templates by primary muscle group
    const groups = {}
    templates.value.forEach(t => {
      const primary = t.muscleGroups[0] || 'other'
      if (!groups[primary]) groups[primary] = []
      groups[primary].push(t)
    })
    return groups
  })

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    templatesByMuscle
  }
})
```

**Components**:
- `src/pages/schedule/SchedulePage.vue` - Main page with tabs
- `src/pages/schedule/components/TemplateList.vue` - Template grid/list
- `src/pages/schedule/components/TemplateCard.vue` - Single template card
- `src/pages/schedule/components/TemplateFormSheet.vue` - Create/Edit sheet
- `src/pages/schedule/components/ExerciseSelector.vue` - Exercise picker (reuse from workouts)

**i18n Keys**:
```json
{
  "schedule.templates.title": "Workout Templates",
  "schedule.templates.create": "Create Template",
  "schedule.templates.empty": "You haven't created any templates yet",
  "schedule.templates.emptyDescription": "Templates let you quickly start workouts with pre-loaded exercises",
  "schedule.templates.name": "Template Name",
  "schedule.templates.description": "Description (optional)",
  "schedule.templates.exercises": "Exercises",
  "schedule.templates.addExercise": "Add Exercise",
  "schedule.templates.estimatedDuration": "Estimated Duration",
  "schedule.templates.lastUsed": "Last used",
  "schedule.templates.usageCount": "{count} times used",
  "schedule.templates.delete": "Delete Template",
  "schedule.templates.deleteConfirm": "Are you sure you want to delete this template?",
  "schedule.templates.validation.nameRequired": "Template name is required",
  "schedule.templates.validation.exercisesRequired": "Add at least one exercise"
}
```

**Technical Notes**:
- Use shadcn-vue Sheet for create/edit modal
- ExerciseSelector can reuse logic from quick log feature
- Auto-compute muscle groups from selected exercises using `muscleUtils.js`
- Estimated duration: `exercises.length * 2.5 minutes` (rough estimate)

---

### Feature 1.2: Pre-built Split Presets
**Priority**: HIGH | **Effort**: LOW | **Version**: MVP

**User Story**:
> As a user (especially beginner), I want to choose from popular pre-built workout splits (PPL, Upper/Lower, etc.), so I don't have to create templates from scratch.

**Acceptance Criteria**:
- [ ] "Browse Presets" button in template list
- [ ] Preset library sheet with categories:
  - 💪 Beginner (Full Body 3x/week, Upper/Lower)
  - 🔥 Intermediate (PPL 6x/week, PHUL, PHAT)
  - 🏆 Advanced (Arnold Split, Bro Split)
- [ ] Each preset card shows:
  - Split name + frequency (e.g., "Push Pull Legs - 6 days/week")
  - Description (e.g., "Classic bodybuilding split for muscle growth")
  - Muscle group icons
  - Difficulty badge
  - "Use This Split" button
- [ ] Clicking "Use This Split" creates all templates in that split:
  - PPL → Creates "Push Day", "Pull Day", "Legs Day" templates
  - Shows success toast: "3 templates created"
  - Navigates to template list
- [ ] Each preset template includes:
  - 5-8 exercises per template
  - Recommended sets/reps (e.g., 3x8-12 for hypertrophy)
  - No target weights (user fills during workout)
- [ ] Ukrainian names for splits:
  - "Push Pull Legs" → "Жим Тяга Ноги"
  - "Upper Lower" → "Верх Низ"

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// src/constants/splitPresets.js
export const SPLIT_PRESETS = {
  beginner: [
    {
      id: 'full-body-3x',
      name: {
        en: 'Full Body 3x/week',
        uk: 'Все тіло 3р/тиждень'
      },
      description: {
        en: 'Perfect for beginners. Train all muscles 3 times per week.',
        uk: 'Ідеально для початківців. Тренуйте все тіло 3 рази на тиждень.'
      },
      frequency: 3,
      difficulty: 'beginner',
      templates: [
        {
          name: { en: 'Full Body A', uk: 'Все тіло A' },
          exercises: [
            { exerciseId: 'squat', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'bench-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 3, reps: 10, restTime: 90 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 90 },
            { exerciseId: 'lat-pulldown', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'plank', sets: 3, reps: 60, restTime: 60 }
          ]
        },
        // Full Body B and C variations...
      ]
    },
    {
      id: 'upper-lower-4x',
      name: { en: 'Upper/Lower 4x/week', uk: 'Верх/Низ 4р/тиждень' },
      // ...
    }
  ],
  intermediate: [
    {
      id: 'ppl-6x',
      name: { en: 'Push Pull Legs', uk: 'Жим Тяга Ноги' },
      description: {
        en: 'Classic bodybuilding split. Train each muscle 2x per week.',
        uk: 'Класичний спліт бодібілдингу. Тренуйте кожен м\'яз 2р/тиждень.'
      },
      frequency: 6,
      difficulty: 'intermediate',
      templates: [
        {
          name: { en: 'Push Day', uk: 'День жиму' },
          exercises: [
            { exerciseId: 'bench-press', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'incline-dumbbell-press', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'overhead-press', sets: 3, reps: 8, restTime: 120 },
            { exerciseId: 'lateral-raise', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'tricep-pushdown', sets: 3, reps: 12, restTime: 60 },
            { exerciseId: 'overhead-tricep-extension', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Pull Day', uk: 'День тяги' },
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 5, restTime: 180 },
            { exerciseId: 'pull-up', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'barbell-row', sets: 4, reps: 8, restTime: 120 },
            { exerciseId: 'face-pull', sets: 3, reps: 15, restTime: 60 },
            { exerciseId: 'barbell-curl', sets: 3, reps: 10, restTime: 60 },
            { exerciseId: 'hammer-curl', sets: 3, reps: 12, restTime: 60 }
          ]
        },
        {
          name: { en: 'Leg Day', uk: 'День ніг' },
          exercises: [
            { exerciseId: 'squat', sets: 4, reps: 8, restTime: 180 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, restTime: 120 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, restTime: 120 },
            { exerciseId: 'leg-curl', sets: 3, reps: 12, restTime: 90 },
            { exerciseId: 'leg-extension', sets: 3, reps: 15, restTime: 90 },
            { exerciseId: 'calf-raise', sets: 4, reps: 15, restTime: 60 }
          ]
        }
      ]
    }
  ]
  // ... more presets
}
```

**Components**:
- `src/pages/schedule/components/PresetLibrary.vue` - Preset browser sheet
- `src/pages/schedule/components/PresetCard.vue` - Single preset card

**i18n Keys**:
```json
{
  "schedule.presets.title": "Workout Split Presets",
  "schedule.presets.browse": "Browse Presets",
  "schedule.presets.beginner": "Beginner",
  "schedule.presets.intermediate": "Intermediate",
  "schedule.presets.advanced": "Advanced",
  "schedule.presets.frequency": "{count} days/week",
  "schedule.presets.useThisSplit": "Use This Split",
  "schedule.presets.templatesCreated": "{count} templates created",
  "schedule.presets.difficulty.beginner": "Beginner",
  "schedule.presets.difficulty.intermediate": "Intermediate",
  "schedule.presets.difficulty.advanced": "Advanced"
}
```

**Technical Notes**:
- Presets are static data (not in Firestore)
- When user selects preset, create templates in Firestore
- Use locale-aware names from preset definition
- Mark created templates with `sourcePresetId` field for analytics

---

### Feature 1.3: Quick Start (1-Tap Workout Launch)
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to start a workout from a template in 1 tap with exercises and weights pre-loaded, so I can begin training immediately without manual data entry.

**Acceptance Criteria**:
- [ ] "Quick Start" button on each template card
- [ ] Clicking Quick Start:
  - Navigates to active workout page
  - Pre-loads all exercises from template
  - Auto-fills target weight from last workout history
  - Auto-fills sets/reps from template
  - Shows "Workout started from [Template Name]" toast
  - Increments template `usageCount`
  - Updates template `lastUsedAt` timestamp
- [ ] Weight auto-fill logic:
  - Query workout history for each exercise
  - Use last logged weight for that exercise
  - If no history, leave weight empty (user fills)
  - Show indicator: "Last: 100 kg" next to weight input
- [ ] User can still modify exercises/sets before logging
- [ ] Template is linked to workout in Firestore:
  - `workout.templateId` field
  - `workout.templateName` field (denormalized)
- [ ] "Start from Template" alternative flow:
  - In Dashboard → "Quick Log" button menu
  - Shows template picker sheet
  - Select template → same Quick Start behavior

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Modified workout data structure
{
  id: 'workout-uuid',
  userId: 'user-id',
  templateId: 'template-uuid', // NEW: Link to template
  templateName: 'Push Day A', // NEW: Denormalized for display
  exercises: [
    {
      exerciseId: 'bench-press',
      sets: [
        { reps: 8, weight: 100, completed: true },
        // ...
      ]
    }
  ],
  createdAt: Timestamp,
  // ... rest of workout fields
}
```

**Modified workoutStore.js**:
```javascript
// Add to src/stores/workoutStore.js

async function startWorkoutFromTemplate(templateId) {
  const scheduleStore = useScheduleStore()
  const template = scheduleStore.templates.find(t => t.id === templateId)

  if (!template) {
    throw new Error('Template not found')
  }

  // Fetch last weights for each exercise
  const exercisesWithWeights = await Promise.all(
    template.exercises.map(async (exercise) => {
      const lastWeight = await getLastWeightForExercise(exercise.exerciseId)
      return {
        ...exercise,
        lastWeight, // For display only
        sets: Array(exercise.sets).fill(null).map(() => ({
          reps: exercise.reps,
          weight: lastWeight || null,
          completed: false
        }))
      }
    })
  )

  // Create new workout with template data
  currentWorkout.value = {
    templateId: template.id,
    templateName: template.name,
    exercises: exercisesWithWeights,
    startTime: new Date(),
    // ...
  }

  // Update template usage stats
  await scheduleStore.updateTemplate(templateId, {
    lastUsedAt: new Date(),
    usageCount: template.usageCount + 1
  })

  // Navigate to workout page
  router.push('/workout-active')
}

async function getLastWeightForExercise(exerciseId) {
  // Query last 10 workouts
  const recentWorkouts = workouts.value
    .slice(0, 10)
    .flatMap(w => w.exercises)
    .filter(e => e.exerciseId === exerciseId)

  if (recentWorkouts.length === 0) return null

  // Get highest weight from last workout with this exercise
  const lastExercise = recentWorkouts[0]
  const weights = lastExercise.sets.map(s => s.weight).filter(Boolean)
  return weights.length > 0 ? Math.max(...weights) : null
}
```

**Components**:
- Modify `src/pages/dashboard/components/QuickLogButton.vue` to add "From Template" option
- Create `src/components/TemplatePickerSheet.vue` for template selection
- Modify workout active page to show template name badge

**i18n Keys**:
```json
{
  "schedule.quickStart.button": "Quick Start",
  "schedule.quickStart.started": "Workout started from {templateName}",
  "schedule.quickStart.fromTemplate": "Start from Template",
  "schedule.quickStart.selectTemplate": "Select a template",
  "schedule.quickStart.lastWeight": "Last: {weight}",
  "schedule.quickStart.noHistory": "No previous data"
}
```

**Technical Notes**:
- This is THE killer feature - must be ultra-fast (<1 second load)
- Cache last weights in localStorage for offline mode
- Consider batch Firestore query for weight history (max 10 workouts)
- Show loading spinner only if weight fetch takes >500ms

---

### Feature 1.4: Weekly Calendar View
**Priority**: HIGH | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to see a 7-day weekly calendar showing which templates are assigned to which days, so I have a clear visual schedule of my training week.

**Acceptance Criteria**:
- [ ] Weekly calendar grid: 7 columns (Mon-Sun)
- [ ] Each day cell shows:
  - Day name + date (e.g., "Mon, Jan 8")
  - Assigned template name (if any)
  - Muscle group badges
  - Status badge:
    - ✅ Completed (workout logged today)
    - 📅 Planned (template assigned, not done)
    - 🏖️ Rest Day (no template assigned)
    - ❌ Missed (template assigned, day passed, not completed)
- [ ] Week navigation: "< Previous Week" | "This Week" | "Next Week >"
- [ ] Current day highlighted with border
- [ ] Empty state (no templates assigned): "Assign templates to days to build your schedule"
- [ ] Clicking day cell opens day detail sheet:
  - Assigned template (if any)
  - "Change Template" button
  - "Mark as Rest Day" toggle
  - If completed: Link to workout detail
  - If planned: "Quick Start" button
- [ ] Mobile: Vertical scroll list instead of grid
- [ ] Today's workout card at top (quick access):
  - "Today: Push Day A"
  - "Quick Start" button
  - If no template: "No workout planned today"

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Firestore collection: users/{userId}/schedules/{weekId}
{
  id: '2026-W02', // ISO week format: YYYY-Www
  userId: 'user-id',
  weekStart: Timestamp, // Monday of this week
  days: {
    monday: {
      templateId: 'template-uuid-1',
      templateName: 'Push Day A', // Denormalized
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      completed: false,
      workoutId: null // If completed, link to workout
    },
    tuesday: {
      templateId: 'template-uuid-2',
      templateName: 'Pull Day A',
      muscleGroups: ['back', 'biceps'],
      completed: true,
      workoutId: 'workout-uuid'
    },
    wednesday: {
      templateId: null, // Rest day
      completed: false,
      workoutId: null
    },
    // ... thursday-sunday
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**New scheduleStore methods**:
```javascript
// Add to scheduleStore.js

const currentSchedule = ref(null) // Current week's schedule

// Get or create schedule for a given week
async function fetchScheduleForWeek(weekId) {
  loading.value = true
  try {
    const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
    const schedule = await getDocument(path)

    if (!schedule) {
      // Create empty schedule for this week
      return await createEmptySchedule(weekId)
    }

    currentSchedule.value = schedule
    return schedule
  } finally {
    loading.value = false
  }
}

// Create empty schedule with all days
function createEmptySchedule(weekId) {
  const weekStart = getWeekStartDate(weekId)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const emptySchedule = {
    id: weekId,
    userId: authStore.currentUser.uid,
    weekStart,
    days: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }

  days.forEach(day => {
    emptySchedule.days[day] = {
      templateId: null,
      templateName: null,
      muscleGroups: [],
      completed: false,
      workoutId: null
    }
  })

  const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
  createDocument(path, emptySchedule)

  currentSchedule.value = emptySchedule
  return emptySchedule
}

// Assign template to a day
async function assignTemplateToDay(weekId, dayName, templateId) {
  const template = templates.value.find(t => t.id === templateId)
  if (!template) throw new Error('Template not found')

  const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
  await updateDocument(path, {
    [`days.${dayName}`]: {
      templateId: template.id,
      templateName: template.name,
      muscleGroups: template.muscleGroups,
      completed: false,
      workoutId: null
    },
    updatedAt: new Date()
  })

  await fetchScheduleForWeek(weekId)
}

// Mark day as completed (called after workout)
async function markDayCompleted(weekId, dayName, workoutId) {
  const path = `users/${authStore.currentUser.uid}/schedules/${weekId}`
  await updateDocument(path, {
    [`days.${dayName}.completed`]: true,
    [`days.${dayName}.workoutId`]: workoutId,
    updatedAt: new Date()
  })
}

// Helper: Get ISO week ID (e.g., "2026-W02")
function getWeekId(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
```

**Components**:
- `src/pages/schedule/components/WeeklyCalendar.vue` - Main calendar grid
- `src/pages/schedule/components/DayCard.vue` - Single day cell
- `src/pages/schedule/components/DayDetailSheet.vue` - Day detail modal
- `src/pages/schedule/components/TodayWorkoutCard.vue` - Today's quick access

**i18n Keys**:
```json
{
  "schedule.calendar.title": "Weekly Schedule",
  "schedule.calendar.today": "Today",
  "schedule.calendar.thisWeek": "This Week",
  "schedule.calendar.previousWeek": "Previous Week",
  "schedule.calendar.nextWeek": "Next Week",
  "schedule.calendar.planned": "Planned",
  "schedule.calendar.completed": "Completed",
  "schedule.calendar.missed": "Missed",
  "schedule.calendar.restDay": "Rest Day",
  "schedule.calendar.noTemplate": "No workout planned",
  "schedule.calendar.empty": "Assign templates to days to build your schedule",
  "schedule.calendar.todayWorkout": "Today's Workout",
  "schedule.calendar.changeTemplate": "Change Template",
  "schedule.calendar.markRestDay": "Mark as Rest Day"
}
```

**Technical Notes**:
- Use ISO 8601 week format (Monday = week start)
- Store one Firestore document per week (not per day - reduces reads)
- Auto-create schedule document when user first assigns template
- Sync completed status from workoutStore (listen to workout creation)
- Consider caching current week in localStorage for offline

---

### Feature 1.5: Template Assignment Flow (Drag & Drop)
**Priority**: MEDIUM | **Effort**: MEDIUM | **Version**: MVP

**User Story**:
> As a user, I want to drag templates onto calendar days to assign them quickly, so I can build my weekly schedule with minimal taps.

**Acceptance Criteria**:
- [ ] Desktop: Drag template cards onto calendar day cells
- [ ] Mobile: Tap day cell → template picker sheet → select template
- [ ] Visual feedback during drag:
  - Template card becomes semi-transparent
  - Valid drop zones (calendar days) highlighted
  - Invalid zones (past days?) grayed out
- [ ] Drop behavior:
  - If day already has template: Show replace confirmation
  - If rest day: Assign template
  - If future day: Assign template
  - If past missed day: Show "Assign anyway?" confirmation
- [ ] Batch assignment shortcut:
  - "Apply to Multiple Days" button on template card
  - Checkbox selector for days (Mon-Sun)
  - Apply same template to selected days
- [ ] Template picker alternative (mobile):
  - List of all templates grouped by muscle group
  - Search bar for quick filtering
  - Recently used templates at top
- [ ] Undo last assignment (toast with "Undo" button)

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
- Same as Feature 1.4 (schedules collection)
- No additional fields needed

**New composable: useSchedule.js**:
```javascript
// src/composables/useSchedule.js
import { computed } from 'vue'
import { useScheduleStore } from '@/stores/scheduleStore'

export function useSchedule() {
  const scheduleStore = useScheduleStore()

  // Get current week ID
  const currentWeekId = computed(() => {
    return scheduleStore.getWeekId(new Date())
  })

  // Get today's scheduled workout
  const todaysWorkout = computed(() => {
    if (!scheduleStore.currentSchedule) return null
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
    return scheduleStore.currentSchedule.days[today]
  })

  // Check if day is in past
  function isDayInPast(dayName) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return dayOrder.indexOf(dayName) < dayOrder.indexOf(today)
  }

  // Get adherence stats for current week
  const weekAdherence = computed(() => {
    if (!scheduleStore.currentSchedule) return { completed: 0, planned: 0, percentage: 0 }

    const days = Object.values(scheduleStore.currentSchedule.days)
    const planned = days.filter(d => d.templateId).length
    const completed = days.filter(d => d.completed).length

    return {
      completed,
      planned,
      percentage: planned > 0 ? Math.round((completed / planned) * 100) : 0
    }
  })

  return {
    currentWeekId,
    todaysWorkout,
    isDayInPast,
    weekAdherence
  }
}
```

**Components**:
- `src/pages/schedule/components/TemplateDragItem.vue` - Draggable template wrapper
- `src/pages/schedule/components/DayDropZone.vue` - Droppable day cell
- `src/pages/schedule/components/TemplatePickerSheet.vue` - Mobile template selector
- `src/pages/schedule/components/BatchAssignSheet.vue` - Multi-day assignment

**i18n Keys**:
```json
{
  "schedule.assign.dragToAssign": "Drag to calendar to assign",
  "schedule.assign.tapToAssign": "Tap to assign to a day",
  "schedule.assign.replaceConfirm": "This day already has a template. Replace?",
  "schedule.assign.pastDayConfirm": "This day has passed. Assign anyway?",
  "schedule.assign.applyToMultiple": "Apply to Multiple Days",
  "schedule.assign.selectDays": "Select days",
  "schedule.assign.assigned": "Template assigned to {dayName}",
  "schedule.assign.undo": "Undo"
}
```

**Technical Notes**:
- Use VueUse `useDraggable` and `useDropZone` for drag-and-drop
- Mobile: Fallback to tap-based assignment (no drag)
- Store last assignment in memory for undo (don't need Firestore)
- Optimistic UI updates (update local state immediately, sync Firestore in background)

---

## V1.1 (Weeks 5-6)

### Feature 2.1: Adherence Tracker (Completion Rate + Streak)
**Priority**: MEDIUM | **Effort**: LOW | **Version**: V1.1

**User Story**:
> As a user, I want to see my schedule adherence rate and current streak, so I can stay motivated and accountable to my training plan.

**Acceptance Criteria**:
- [ ] Adherence stats card at top of Schedule page:
  - This week: `5/6 workouts` (83% completion)
  - Current streak: `🔥 12 days` (consecutive days following schedule)
  - Best streak: `🏆 28 days`
  - Monthly adherence: `89%` (last 30 days)
- [ ] Color-coded adherence badge:
  - 🟢 Excellent: ≥90%
  - 🟡 Good: 70-89%
  - 🔴 Needs Work: <70%
- [ ] Adherence chart (last 12 weeks):
  - Bar chart: X = Week, Y = Completion %
  - Color bars by performance tier
  - Tap bar to see week detail
- [ ] Streak rules:
  - Streak continues if scheduled rest days are respected
  - Streak breaks if planned workout missed
  - Streak continues if workout done on unplanned day (bonus!)
- [ ] Achievements/Badges (gamification):
  - 🎯 "Perfect Week" - 100% adherence
  - 🔥 "On Fire" - 7 day streak
  - 💪 "Consistent" - 30 day streak
  - 🏆 "Dedicated" - 90% adherence for 3 months

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Add to schedules document
{
  // ... existing fields
  stats: {
    weeklyAdherence: 83, // Percentage
    currentStreak: 12,
    bestStreak: 28
  }
}

// Or compute dynamically from workout + schedule history
```

**New analyticsStore methods**:
```javascript
// Add to analyticsStore.js

const scheduleAdherence = computed(() => {
  const scheduleStore = useScheduleStore()
  const last12Weeks = getLastNWeeks(12)

  return last12Weeks.map(weekId => {
    const schedule = scheduleStore.getScheduleByWeekId(weekId)
    if (!schedule) return { weekId, adherence: 0, planned: 0, completed: 0 }

    const days = Object.values(schedule.days)
    const planned = days.filter(d => d.templateId).length
    const completed = days.filter(d => d.completed).length

    return {
      weekId,
      adherence: planned > 0 ? Math.round((completed / planned) * 100) : 0,
      planned,
      completed
    }
  })
})

const currentStreak = computed(() => {
  const scheduleStore = useScheduleStore()
  // Calculate consecutive days where:
  // - Planned workout was completed, OR
  // - No workout was planned (rest day respected)

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' })
    const weekId = getWeekId(date)
    const schedule = scheduleStore.getScheduleByWeekId(weekId)

    if (!schedule) break

    const dayData = schedule.days[dayName]

    if (dayData.templateId && !dayData.completed) {
      // Planned workout missed - streak broken
      break
    } else if (dayData.templateId && dayData.completed) {
      // Planned workout completed - streak continues
      streak++
    } else if (!dayData.templateId) {
      // Rest day - streak continues
      streak++
    }
  }

  return streak
})
```

**Components**:
- `src/pages/schedule/components/AdherenceStatsCard.vue` - Stats summary
- `src/pages/schedule/components/AdherenceChart.vue` - 12-week bar chart
- `src/pages/schedule/components/AchievementBadges.vue` - Gamification badges

**i18n Keys**:
```json
{
  "schedule.adherence.title": "Schedule Adherence",
  "schedule.adherence.thisWeek": "This Week",
  "schedule.adherence.currentStreak": "Current Streak",
  "schedule.adherence.bestStreak": "Best Streak",
  "schedule.adherence.monthlyRate": "Monthly Rate",
  "schedule.adherence.excellent": "Excellent",
  "schedule.adherence.good": "Good",
  "schedule.adherence.needsWork": "Needs Work",
  "schedule.adherence.achievements": "Achievements",
  "schedule.adherence.perfectWeek": "Perfect Week",
  "schedule.adherence.onFire": "On Fire",
  "schedule.adherence.consistent": "Consistent",
  "schedule.adherence.dedicated": "Dedicated"
}
```

**Technical Notes**:
- Cache streak calculation (expensive to compute daily)
- Update streak after each workout completion
- Consider showing adherence in Dashboard as well (quick stat)

---

### Feature 2.2: Rest Day Suggestions (Muscle Fatigue Intelligence)
**Priority**: MEDIUM | **Effort**: MEDIUM | **Version**: V1.1

**User Story**:
> As a user, I want to receive warnings if I'm training the same muscle group too frequently, so I can avoid overtraining and optimize recovery.

**Acceptance Criteria**:
- [ ] Warning badge on calendar day if:
  - Same primary muscle trained <48h ago
  - ⚠️ "Chest trained yesterday. Consider rest or different muscle."
  - Orange border on day cell
- [ ] Rest day recommendations:
  - Analyze weekly schedule
  - If no rest days: "⚠️ No rest days planned. Add at least 1 for recovery."
  - If consecutive same muscle: "⚠️ Push Day assigned 2 days in a row. Split with Pull/Legs."
- [ ] Muscle recovery timeline:
  - Shows last trained date for each muscle group
  - Color-coded status:
    - 🟢 Recovered (>48h): Ready to train
    - 🟡 Recovering (24-48h): Light work OK
    - 🔴 Fatigued (<24h): Avoid
- [ ] Smart schedule suggestions:
  - "Optimal rest day: Wednesday (after 3 training days)"
  - "Consider swapping Push Day and Leg Day for better recovery"
- [ ] Override option: "I know what I'm doing" (dismiss warning)
- [ ] Settings toggle: "Enable recovery warnings" (default: ON)

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Compute from schedule + workout history
// No new Firestore fields needed
```

**New utility: muscleRecoveryUtils.js**:
```javascript
// src/utils/muscleRecoveryUtils.js

const RECOVERY_HOURS = {
  chest: 48,
  back: 48,
  legs: 72, // Legs need more recovery
  shoulders: 48,
  biceps: 36,
  triceps: 36,
  core: 24
}

export function getMuscleRecoveryStatus(muscleGroup, lastTrainedDate) {
  const now = new Date()
  const hoursSinceLastTrained = (now - lastTrainedDate) / (1000 * 60 * 60)
  const requiredRecovery = RECOVERY_HOURS[muscleGroup] || 48

  if (hoursSinceLastTrained >= requiredRecovery) {
    return { status: 'recovered', color: 'green', message: 'Ready to train' }
  } else if (hoursSinceLastTrained >= requiredRecovery * 0.5) {
    return { status: 'recovering', color: 'yellow', message: 'Light work OK' }
  } else {
    return { status: 'fatigued', color: 'red', message: 'Avoid training' }
  }
}

export function analyzeWeeklySchedule(schedule) {
  const warnings = []
  const days = Object.entries(schedule.days)

  for (let i = 0; i < days.length - 1; i++) {
    const [dayName, dayData] = days[i]
    const [nextDayName, nextDayData] = days[i + 1]

    if (!dayData.templateId || !nextDayData.templateId) continue

    // Check for same muscle group on consecutive days
    const sameMuscles = dayData.muscleGroups.filter(m =>
      nextDayData.muscleGroups.includes(m)
    )

    if (sameMuscles.length > 0) {
      warnings.push({
        type: 'consecutive_muscle',
        day: nextDayName,
        muscle: sameMuscles[0],
        message: `${sameMuscles[0]} trained on consecutive days`
      })
    }
  }

  // Check for no rest days
  const restDays = days.filter(([_, data]) => !data.templateId).length
  if (restDays === 0) {
    warnings.push({
      type: 'no_rest',
      message: 'No rest days scheduled this week'
    })
  }

  return warnings
}

export function suggestOptimalRestDay(schedule) {
  // Find day that splits training days evenly
  const days = Object.entries(schedule.days)
  const trainingDays = days.filter(([_, data]) => data.templateId)

  if (trainingDays.length <= 3) {
    return 'wednesday' // Mid-week rest for low frequency
  }

  // Find longest consecutive training stretch
  let maxStretch = 0
  let optimalRestDay = null

  for (let i = 0; i < days.length; i++) {
    const prevDay = days[i - 1]?.[1]
    const currentDay = days[i][1]
    const nextDay = days[i + 1]?.[1]

    if (prevDay?.templateId && nextDay?.templateId && !currentDay.templateId) {
      const stretchBefore = countConsecutiveTrainingDays(days, i, -1)
      const stretchAfter = countConsecutiveTrainingDays(days, i, 1)
      const totalStretch = stretchBefore + stretchAfter

      if (totalStretch > maxStretch) {
        maxStretch = totalStretch
        optimalRestDay = days[i][0]
      }
    }
  }

  return optimalRestDay || 'sunday'
}
```

**Components**:
- `src/pages/schedule/components/RecoveryWarningBadge.vue` - Warning indicator
- `src/pages/schedule/components/MuscleRecoveryTimeline.vue` - Recovery status table
- `src/pages/schedule/components/ScheduleOptimizationSheet.vue` - Suggestions modal

**i18n Keys**:
```json
{
  "schedule.recovery.title": "Muscle Recovery",
  "schedule.recovery.lastTrained": "Last trained",
  "schedule.recovery.status.recovered": "Recovered",
  "schedule.recovery.status.recovering": "Recovering",
  "schedule.recovery.status.fatigued": "Fatigued",
  "schedule.recovery.warning.consecutive": "{muscle} trained on consecutive days",
  "schedule.recovery.warning.noRest": "No rest days scheduled",
  "schedule.recovery.suggestion.addRest": "Consider adding a rest day",
  "schedule.recovery.suggestion.swap": "Consider swapping {day1} and {day2}",
  "schedule.recovery.override": "I know what I'm doing",
  "schedule.recovery.settings": "Enable recovery warnings"
}
```

**Technical Notes**:
- Recovery hours based on exercise science (48-72h for large muscle groups)
- Can be customized in settings (future)
- Don't block users from ignoring warnings (they're suggestions, not rules)
- Show warnings in UI but don't prevent template assignment

---

### Feature 2.3: Muscle Rotation Heatmap (Weekly Balance View)
**Priority**: LOW | **Effort**: LOW | **Version**: V1.1

**User Story**:
> As a user, I want to see a visual heatmap of which muscles I train on which days, so I can ensure balanced weekly programming.

**Acceptance Criteria**:
- [ ] Heatmap grid: Days (columns) x Muscle Groups (rows)
- [ ] Color intensity: Number of exercises per muscle per day
  - Light blue: 1-2 exercises
  - Medium blue: 3-4 exercises
  - Dark blue: 5+ exercises
  - Gray: 0 exercises
- [ ] Hover tooltip: "3 chest exercises on Monday"
- [ ] Highlights imbalances:
  - Red border if same muscle >2 days/week
  - Green checkmark if muscle trained 1-2x/week (optimal)
- [ ] Toggle view: Planned vs Actual
  - Planned: Shows assigned templates
  - Actual: Shows completed workouts
- [ ] Collapsible section: "Show Muscle Balance"

**Status**: ❌ **NOT IMPLEMENTED**

**Data Requirements**:
```javascript
// Compute from schedule.days → muscleGroups
// No new Firestore fields needed
```

**Components**:
- `src/pages/schedule/components/MuscleRotationHeatmap.vue` - Heatmap visualization

**i18n Keys**:
```json
{
  "schedule.heatmap.title": "Muscle Rotation",
  "schedule.heatmap.planned": "Planned",
  "schedule.heatmap.actual": "Actual",
  "schedule.heatmap.exercises": "{count} exercises",
  "schedule.heatmap.optimal": "Optimal frequency",
  "schedule.heatmap.overtrained": "Trained too frequently"
}
```

**Technical Notes**:
- Reuse heatmap animation pattern from Analytics VolumeHeatmap
- 7x8 grid (7 days × 8 muscle groups)
- Show in collapsible accordion (not always visible)

---

## V1.2 (Future)

### Feature 3.1: Workout Reminders/Notifications
**Priority**: LOW | **Effort**: MEDIUM | **Version**: V1.2

**User Story**:
> As a user, I want to receive push notifications reminding me to train at my scheduled time, so I don't forget my workouts.

**Acceptance Criteria**:
- [ ] Settings: "Enable workout reminders"
- [ ] Configure reminder time per day:
  - Monday: 6:00 PM
  - Tuesday: 6:00 PM
  - Custom time picker per day
- [ ] Notification types:
  - "Time to train! 💪 Today: Push Day A"
  - "Rest day today. Recovery is growth 🏖️"
  - "Streak alert! Don't break your 12-day streak 🔥"
- [ ] Notification actions:
  - "Start Workout" (deep link to Quick Start)
  - "Reschedule" (opens schedule page)
  - "Dismiss"
- [ ] Smart timing:
  - Don't notify if workout already completed
  - Snooze for 30 min option
  - Auto-disable if user consistently ignores

**Status**: ❌ **V1.2 - NOT IMPLEMENTED**

**Technical Requirements**:
- Firebase Cloud Messaging (FCM) for push notifications
- Service worker for background notifications
- Device token registration in Firestore
- Scheduled Cloud Functions to send notifications

---

### Feature 3.2: Adaptive Rescheduling (Missed Workout Recovery)
**Priority**: LOW | **Effort**: HIGH | **Version**: V1.2

**User Story**:
> As a user, when I miss a scheduled workout, I want the app to suggest how to adjust my schedule, so I can get back on track without losing progress.

**Acceptance Criteria**:
- [ ] After missing workout: "Missed Push Day. Reschedule options:"
  - "Do tomorrow (swap with Pull Day)"
  - "Skip and continue schedule"
  - "Do on next rest day"
- [ ] Smart suggestions based on:
  - Muscle recovery status
  - Upcoming scheduled workouts
  - User's typical adherence pattern
- [ ] Batch rescheduling: "Missed 2 workouts this week. Rebuild schedule?"
- [ ] "Catch-up mode": Compress missed workouts into weekend

**Status**: ❌ **V1.2 - NOT IMPLEMENTED**

---

### Feature 3.3: Template Sharing (Community Library)
**Priority**: LOW | **Effort**: HIGH | **Version**: Future (V2)

**User Story**:
> As a user, I want to share my workout templates with the community and browse templates created by others, so I can discover new programs and help others.

**Acceptance Criteria**:
- [ ] "Share Template" button → generates shareable link
- [ ] Community library page: Browse public templates
- [ ] Sort by: Popular, Recent, Muscle Group, Difficulty
- [ ] Import template: "Add to My Templates"
- [ ] Rate/review templates (1-5 stars)
- [ ] Report inappropriate templates

**Status**: ❌ **FUTURE (V2)** - Requires moderation system

---

## 4. Data Model Summary

### Firestore Collections

```javascript
// users/{userId}/workoutTemplates/{templateId}
{
  id: string,
  name: string,
  description: string,
  exercises: [
    {
      exerciseId: string,
      exerciseName: string,
      sets: number,
      reps: number,
      targetWeight: number | null,
      restTime: number,
      notes: string
    }
  ],
  muscleGroups: string[],
  estimatedDuration: number,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastUsedAt: Timestamp | null,
  usageCount: number,
  sourcePresetId: string | null // If created from preset
}

// users/{userId}/schedules/{weekId}
{
  id: string, // ISO week: "2026-W02"
  userId: string,
  weekStart: Timestamp,
  days: {
    monday: {
      templateId: string | null,
      templateName: string | null,
      muscleGroups: string[],
      completed: boolean,
      workoutId: string | null
    },
    // ... tuesday-sunday
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Modified: users/{userId}/workouts/{workoutId}
{
  // ... existing fields
  templateId: string | null, // NEW
  templateName: string | null // NEW
}
```

---

## 5. Success Metrics (Analytics)

### User Adoption (MVP)
- **Target**: 60% of users create ≥1 template in first week
- **Target**: 40% of users assign templates to schedule
- **Target**: 30% of workouts started via Quick Start

### Efficiency (MVP)
- **Target**: 30% reduction in time from app open to workout start
- **Measure**: Average time (seconds) from app launch to first set logged

### Adherence (V1.1)
- **Target**: 75% average schedule adherence rate
- **Target**: 50% of users maintain ≥7 day streak
- **Target**: 20% higher retention for users with templates vs non-template users

### Feature Usage (V1.1)
- **Measure**: % of users who view Adherence Tracker weekly
- **Measure**: % of users who dismiss vs follow recovery warnings
- **Measure**: % of users using pre-built presets vs custom templates

---

## 6. Technical Dependencies

### New Stores
- `scheduleStore.js` - Template + schedule management
- Modified `workoutStore.js` - Add `startWorkoutFromTemplate()` method

### New Composables
- `useSchedule.js` - Schedule utilities (week ID, adherence, etc.)
- `useWorkoutTemplates.js` - Template CRUD helpers

### New Utilities
- `splitPresets.js` - Pre-built workout split definitions
- `muscleRecoveryUtils.js` - Recovery logic + warnings (V1.1)

### UI Components
- 15+ new components (cards, sheets, pickers, calendar, heatmap)
- Reuse existing: Button, Card, Sheet, Dialog, Calendar (shadcn-vue)

### External Dependencies
- No new packages required (all features possible with existing stack)
- Future (V1.2): Firebase Cloud Messaging for notifications

---

## 7. Implementation Roadmap

### Week 1: Data Model + Templates CRUD
- [ ] Create `scheduleStore.js`
- [ ] Create Firestore data model (templates, schedules)
- [ ] Implement template CRUD UI
- [ ] Create `TemplateFormSheet.vue`
- [ ] Create `TemplateList.vue`

### Week 2: Pre-built Presets + Quick Start
- [ ] Define split presets in `splitPresets.js`
- [ ] Create `PresetLibrary.vue`
- [ ] Implement Quick Start flow
- [ ] Modify `workoutStore.startWorkoutFromTemplate()`
- [ ] Auto-fill weights from history

### Week 3: Weekly Calendar View
- [ ] Create `WeeklyCalendar.vue`
- [ ] Implement schedule Firestore logic
- [ ] Create `DayCard.vue` and `DayDetailSheet.vue`
- [ ] Create `TodayWorkoutCard.vue`

### Week 4: Template Assignment + Polish
- [ ] Implement template assignment (drag-drop on desktop, picker on mobile)
- [ ] Create `TemplatePickerSheet.vue`
- [ ] Create `useSchedule.js` composable
- [ ] Add i18n translations (uk + en)
- [ ] Testing + bug fixes

### Week 5: Adherence Tracking (V1.1)
- [ ] Implement adherence calculation logic
- [ ] Create `AdherenceStatsCard.vue`
- [ ] Create `AdherenceChart.vue`
- [ ] Add achievement badges

### Week 6: Recovery Intelligence (V1.1)
- [ ] Create `muscleRecoveryUtils.js`
- [ ] Implement recovery warnings
- [ ] Create `MuscleRecoveryTimeline.vue`
- [ ] Create `MuscleRotationHeatmap.vue`
- [ ] Add settings toggle for warnings

---

## 8. Edge Cases & Risks

### Edge Cases
1. **User changes template after assigning to schedule**
   - Solution: Templates are denormalized in schedule (snapshot). Editing template doesn't affect past assignments.

2. **User deletes template that's assigned to schedule**
   - Solution: Soft delete templates. Keep in Firestore with `deleted: true`. Show "(Deleted)" in schedule UI.

3. **User works out on unplanned day**
   - Solution: Allow completing workouts without template. Schedule adherence unaffected (bonus workout).

4. **User has multiple workouts in one day**
   - Solution: Schedule only tracks "primary" workout per day. Show all workouts in day detail.

5. **Week starts on different day (locale-dependent)**
   - Solution: Always use Monday as week start (ISO 8601). Add setting in future for custom week start.

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users don't adopt templates | HIGH | MEDIUM | Pre-built presets make adoption easy. Quick Start value prop is clear. |
| Schedule becomes stale (users don't update) | MEDIUM | HIGH | Adherence tracking creates accountability. Show "Update Schedule" prompt if no changes in 4 weeks. |
| Drag-and-drop too complex on mobile | LOW | LOW | Fallback to tap-based picker. Test on 375px viewport. |
| Firestore reads scale poorly (weekly schedules) | MEDIUM | LOW | Use pagination (only load current + adjacent weeks). Cache in localStorage. |
| Recovery warnings annoying | MEDIUM | MEDIUM | Add "Dismiss All" option. Make toggle easy to find in settings. Default to OFF for advanced users? |

---

## 9. Differentiators from Dashboard/Analytics

| Feature | Dashboard | Analytics | **Schedule** |
|---------|-----------|-----------|--------------|
| **Time Focus** | Past (what happened) | Past (trends) | **Future (what to do)** |
| **Primary Question** | "How did I do?" | "Am I progressing?" | **"What should I train today?"** |
| **Data Type** | Completed workouts | Historical analysis | **Planned workouts** |
| **User Action** | View stats | Analyze trends | **Start workout** |
| **Value Prop** | Motivation (see progress) | Insights (make decisions) | **Efficiency (save time)** |

**Schedule is proactive, not reactive.**

---

## 10. Future Enhancements (V2+)

### Advanced Program Management
- Periodization support (macrocycles, mesocycles, deload weeks)
- Progressive overload planning (auto-increment weights weekly)
- Exercise substitution suggestions (if equipment unavailable)

### Social Features
- Share templates with friends
- Community-voted best programs
- Coach-athlete template sharing

### AI-Powered (Far Future)
- Auto-generate optimal schedule based on goals
- Predict optimal rest days based on volume/intensity
- Adaptive program adjustments based on performance

---

## Appendix: i18n Key Reference

All translation keys for Schedule section:

```json
{
  "schedule": {
    "title": "Schedule",
    "templates": {
      "title": "Workout Templates",
      "create": "Create Template",
      "empty": "You haven't created any templates yet",
      "emptyDescription": "Templates let you quickly start workouts with pre-loaded exercises",
      "name": "Template Name",
      "description": "Description (optional)",
      "exercises": "Exercises",
      "addExercise": "Add Exercise",
      "estimatedDuration": "Estimated Duration",
      "lastUsed": "Last used",
      "usageCount": "{count} times used",
      "delete": "Delete Template",
      "deleteConfirm": "Are you sure you want to delete this template?",
      "validation": {
        "nameRequired": "Template name is required",
        "exercisesRequired": "Add at least one exercise"
      }
    },
    "presets": {
      "title": "Workout Split Presets",
      "browse": "Browse Presets",
      "beginner": "Beginner",
      "intermediate": "Intermediate",
      "advanced": "Advanced",
      "frequency": "{count} days/week",
      "useThisSplit": "Use This Split",
      "templatesCreated": "{count} templates created",
      "difficulty": {
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced"
      }
    },
    "quickStart": {
      "button": "Quick Start",
      "started": "Workout started from {templateName}",
      "fromTemplate": "Start from Template",
      "selectTemplate": "Select a template",
      "lastWeight": "Last: {weight}",
      "noHistory": "No previous data"
    },
    "calendar": {
      "title": "Weekly Schedule",
      "today": "Today",
      "thisWeek": "This Week",
      "previousWeek": "Previous Week",
      "nextWeek": "Next Week",
      "planned": "Planned",
      "completed": "Completed",
      "missed": "Missed",
      "restDay": "Rest Day",
      "noTemplate": "No workout planned",
      "empty": "Assign templates to days to build your schedule",
      "todayWorkout": "Today's Workout",
      "changeTemplate": "Change Template",
      "markRestDay": "Mark as Rest Day"
    },
    "assign": {
      "dragToAssign": "Drag to calendar to assign",
      "tapToAssign": "Tap to assign to a day",
      "replaceConfirm": "This day already has a template. Replace?",
      "pastDayConfirm": "This day has passed. Assign anyway?",
      "applyToMultiple": "Apply to Multiple Days",
      "selectDays": "Select days",
      "assigned": "Template assigned to {dayName}",
      "undo": "Undo"
    },
    "adherence": {
      "title": "Schedule Adherence",
      "thisWeek": "This Week",
      "currentStreak": "Current Streak",
      "bestStreak": "Best Streak",
      "monthlyRate": "Monthly Rate",
      "excellent": "Excellent",
      "good": "Good",
      "needsWork": "Needs Work",
      "achievements": "Achievements",
      "perfectWeek": "Perfect Week",
      "onFire": "On Fire",
      "consistent": "Consistent",
      "dedicated": "Dedicated"
    },
    "recovery": {
      "title": "Muscle Recovery",
      "lastTrained": "Last trained",
      "status": {
        "recovered": "Recovered",
        "recovering": "Recovering",
        "fatigued": "Fatigued"
      },
      "warning": {
        "consecutive": "{muscle} trained on consecutive days",
        "noRest": "No rest days scheduled"
      },
      "suggestion": {
        "addRest": "Consider adding a rest day",
        "swap": "Consider swapping {day1} and {day2}"
      },
      "override": "I know what I'm doing",
      "settings": "Enable recovery warnings"
    },
    "heatmap": {
      "title": "Muscle Rotation",
      "planned": "Planned",
      "actual": "Actual",
      "exercises": "{count} exercises",
      "optimal": "Optimal frequency",
      "overtrained": "Trained too frequently"
    }
  }
}
```

---

## 📦 Implementation Summary (Jan 11, 2026)

### ✅ Completed Components (18/18)

#### Calendar Components (Week 3) - 5/5 ✅
1. **WeeklyCalendar.vue** - Interactive 7-day grid with status indicators
2. **DayCard.vue** - Individual day cells with template info
3. **DayDetailSheet.vue** - Full day details modal with quick actions
4. **TodayWorkoutCard.vue** - Today's workout quick access card
5. **WeekNavigator.vue** - Week navigation controls

#### Template Management (Week 4) - 4/4 ✅
6. **TemplateList.vue** - Full template library with search/filters/sorting
7. **TemplateCard.vue** - Template display with action menu
8. **TemplateFormSheet.vue** - Create/edit template form with exercise picker
9. **TemplatePickerSheet.vue** - Template selection modal

#### Split Presets (Week 4) - 2/2 ✅
10. **PresetPickerSheet.vue** - Preset selection with difficulty tabs
11. **PresetCard.vue** - Preset program display cards

#### Adherence Tracking (Week 5) - 3/3 ✅
12. **AdherenceStatsCard.vue** - Overall adherence statistics
13. **AdherenceChart.vue** - 12-week bar chart (completed vs missed)
14. **AchievementBadges.vue** - 8 achievement badges with animations

#### Shared Components - 4/4 ✅
15. **StatusBadge.vue** - Status indicators (Completed/Planned/Missed/Rest)
16. **MuscleGroupBadges.vue** - Muscle group tags
17. **QuickStartButton.vue** - Reusable Quick Start button
18. **SchedulePage.vue** - Main schedule page with 3 tabs

### ✅ Completed Stores & Composables (8/8)

#### Stores
- **scheduleStore.js** - Complete schedule management (19 passing tests)

#### Composables
- **useWorkoutTemplates.js** - Template filtering and management
- **useSchedule.js** - Schedule data fetching and day assignment
- **useWeekNavigation.js** - Week calculation and navigation
- **useAdherence.js** - 12-week adherence tracking and achievements

#### Utilities
- **splitPresets.js** - 4 complete preset programs (16 templates total)
- **scheduleUtils.js** - Week ID calculation and date utilities
- **templateUtils.js** - Template validation and helpers

### ✅ Completed Features

#### MVP Features (5/5) ✅
1. **Workout Templates CRUD** - Create, edit, duplicate, delete templates
2. **Pre-built Split Presets** - 4 programs: Full Body, Upper/Lower, PPL, Arnold Split
3. **Quick Start** - 1-tap workout launch from templates
4. **Weekly Calendar View** - 7-day grid with status tracking
5. **Template Assignment** - Assign templates to specific days

#### V1.1 Features (1/3) 🟡
1. **Adherence Tracking** ✅ - 12-week tracking, streaks, achievement badges
2. **Rest Day Suggestions** ❌ - NOT IMPLEMENTED (muscle fatigue warnings)
3. **Muscle Rotation Heatmap** ❌ - NOT IMPLEMENTED (weekly balance grid)

### ✅ Testing Status
- **Unit Tests**: 1,390/1,390 passing (100%)
- **scheduleStore Tests**: 19/19 passing (100%)
- **Production Build**: Successful (4.72s)
- **Bundle Size**: SchedulePage chunk 56.74 kB (gzipped: 14.94 kB)

### ✅ i18n Coverage
- **English (en)**: Complete
- **Ukrainian (uk)**: Complete
- **Translation Keys**: 150+ keys across all sections

### 🎯 Production Readiness: ✅ READY

**What Works:**
- Complete MVP implementation (Weeks 1-4)
- Adherence tracking with gamification (Week 5)
- All components tested and integrated
- Bilingual support (en/uk)
- Mobile-responsive design
- Firebase Firestore persistence
- Toast notifications for all actions
- Error handling and validation

**What's Missing (V1.1):**
- Rest Day Suggestions (muscle recovery warnings)
- Muscle Rotation Heatmap (weekly balance visualization)

**Recommendation:** Ship MVP + Adherence Tracking to production. V1.1 missing features are nice-to-have enhancements that can be added in next iteration based on user feedback.

---

**End of Document**
