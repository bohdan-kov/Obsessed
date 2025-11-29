# Testing Guide for Obsessed Gym Tracking App

## Overview

This document provides guidance for testing Pinia stores in the Obsessed gym tracking app. The stores use Vue 3 Composition API with Pinia and expose state as computed properties, which requires specific testing patterns.

## Key Challenge: Computed Property State

The stores expose their state as computed properties in the return statement:

```javascript
return {
  workouts: computed(() => workouts.value),
  user: computed(() => user.value),
  // ...
}
```

This means:
- `store.workouts` is a **computed ref** (readonly)
- You **cannot** directly assign: `store.workouts = [...]`
- You **cannot** use `$patch`: `store.$patch({ workouts: [...] })`

## Testing Patterns

### ✅ Correct: Populate state through actions

Use the store's own actions with mocked Firebase responses:

```javascript
// Mock Firebase to return data
fetchCollection.mockResolvedValue([
  { id: 'workout-1', status: 'completed' },
])

// Call the action that populates state
await store.fetchWorkouts('week')

// Now test computed properties
expect(store.workouts).toHaveLength(1)
```

### ✅ Correct: Use subscriptions with mocked callbacks

For real-time data, mock the subscription to call the callback immediately:

```javascript
subscribeToCollection.mockImplementation((path, options, callback) => {
  callback([{ id: 'workout-1', status: 'active' }])
  return vi.fn() // unsubscribe function
})

store.subscribeToActive()
expect(store.activeWorkout?.id).toBe('workout-1')
```

### ❌ Incorrect: Direct assignment

```javascript
// This will fail with "Set operation failed: target is readonly"
store.workouts = [{ id: 'workout-1' }]
```

### ❌ Incorrect: Using $patch on computed properties

```javascript
// This will not work
store.$patch({ workouts: [...] })
```

## Test File Structure

### 1. Setup and Mocks

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Firebase modules BEFORE importing stores
vi.mock('@/firebase/firestore', () => ({
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  updateDocument: vi.fn(),
  subscribeToCollection: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))

vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(),
  signInWithGoogle: vi.fn(),
  // ... other mocks
}))

// Import mocked modules
import { fetchCollection, createDocument } from '@/firebase/firestore'
import { useWorkoutStore } from '../workoutStore'

describe('workoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ... tests
})
```

### 2. Testing Computed Getters

Always populate state through actions first:

```javascript
it('should return today\'s workout if it exists', async () => {
  const authStore = useAuthStore()
  authStore.uid = 'test-user-id'

  const store = useWorkoutStore()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Mock the Firebase response
  const mockWorkouts = [
    {
      id: 'workout-1',
      startedAt: today,
      status: 'completed',
    },
  ]

  fetchCollection.mockResolvedValue(mockWorkouts)

  // Populate state through action
  await store.fetchWorkouts('week')

  // Test the computed property
  expect(store.todaysWorkout?.id).toBe('workout-1')
})
```

### 3. Testing Actions

Test both success and error cases:

```javascript
describe('startWorkout', () => {
  it('should successfully start a new workout', async () => {
    const authStore = useAuthStore()
    authStore.uid = 'test-user-id'

    const store = useWorkoutStore()

    createDocument.mockResolvedValue('new-workout-id')
    subscribeToCollection.mockReturnValue(vi.fn())

    const result = await store.startWorkout()

    expect(createDocument).toHaveBeenCalledWith(
      'users/test-user-id/workouts',
      expect.objectContaining({
        userId: 'test-user-id',
        status: 'active',
      })
    )
    expect(result).toBe('new-workout-id')
    expect(store.error).toBeNull()
  })

  it('should handle error', async () => {
    const store = useWorkoutStore()
    createDocument.mockRejectedValue(new Error('Failed'))

    await expect(store.startWorkout()).rejects.toThrow('Failed')
    expect(store.error).toBe('Failed')
  })
})
```

### 4. Testing Store Dependencies

analyticsStore depends on workoutStore:

```javascript
it('should calculate total workouts', async () => {
  const authStore = useAuthStore()
  authStore.uid = 'test-user-id'

  const workoutStore = useWorkoutStore()
  const analyticsStore = useAnalyticsStore()

  // Populate workoutStore through action
  fetchCollection.mockResolvedValue([
    { id: 'w1', status: 'completed' },
    { id: 'w2', status: 'completed' },
  ])

  await workoutStore.fetchWorkouts('week')

  // Test analytics computed property
  expect(analyticsStore.totalWorkouts).toBe(2)
})
```

## Common Testing Scenarios

### Firebase Timestamp Handling

Mock Firebase Timestamps to return dates:

```javascript
const mockTimestamp = (date) => ({
  toDate: () => date,
})

const mockWorkout = {
  id: 'workout-1',
  startedAt: mockTimestamp(new Date()),
  completedAt: mockTimestamp(new Date()),
}
```

### Testing Real-time Listeners

Mock subscriptions to immediately call callbacks:

```javascript
it('should update state from subscription', () => {
  subscribeToCollection.mockImplementation((path, options, callback) => {
    callback([{ id: 'workout-1', status: 'active' }])
    return vi.fn() // unsubscribe function
  })

  store.subscribeToActive()

  expect(store.currentWorkout?.id).toBe('workout-1')
})
```

### Testing Auth Guards

```javascript
it('should throw error when user not authenticated', async () => {
  const authStore = useAuthStore()
  authStore.uid = null

  const store = useWorkoutStore()

  await expect(store.startWorkout()).rejects.toThrow(
    'User must be authenticated'
  )
})
```

### Testing Loading States

```javascript
it('should manage loading state', async () => {
  const store = useWorkoutStore()

  createDocument.mockImplementation(() => {
    expect(store.loading).toBe(true)
    return Promise.resolve('id')
  })

  await store.startWorkout()

  expect(store.loading).toBe(false)
})
```

### Testing Calculations

```javascript
it('should calculate volume correctly', async () => {
  const store = useWorkoutStore()

  // Set up active workout with exercises
  createDocument.mockResolvedValue('workout-1')
  subscribeToCollection.mockImplementation((path, options, callback) => {
    callback([{
      id: 'workout-1',
      exercises: [
        {
          exerciseId: 'ex-1',
          sets: [{ weight: 100, reps: 10 }],
        },
      ],
      totalVolume: 1000,
      status: 'active',
    }])
    return vi.fn()
  })

  await store.startWorkout()
  updateDocument.mockResolvedValue()

  await store.addSet('ex-1', { weight: 100, reps: 10 })

  const callArgs = updateDocument.mock.calls[0][2]
  expect(callArgs.totalVolume).toBe(2000) // 100 * 10 * 2
})
```

## Edge Cases to Test

1. **Empty Data States**
   - No workouts
   - No exercises
   - No sets

2. **Null/Undefined Values**
   - Missing totalVolume
   - Missing completedAt
   - Missing primaryMuscle

3. **Boundary Conditions**
   - Division by zero (avg calculations)
   - Date comparisons (today, yesterday, last week)
   - Array limits (top 10 workouts)

4. **Error Handling**
   - Network errors
   - Validation errors
   - Auth errors
   - Missing data errors

5. **Date/Time Handling**
   - Firebase Timestamps vs JavaScript Dates
   - Timezone consistency
   - Date comparisons (setHours(0,0,0,0))

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run specific test file
npm test -- workoutStore.spec.js

# Run with coverage
npm test -- --coverage
```

## Test Coverage Goals

- **authStore**: ~20 tests covering auth flows, profile management, error handling
- **workoutStore**: ~25 tests covering workout CRUD, real-time listeners, calculations
- **analyticsStore**: ~20 tests covering all computed analytics, edge cases, calculations

Target: **80%+ code coverage** for critical paths

## Debugging Tips

1. **Check mock setup**: Ensure mocks are defined BEFORE importing stores
2. **Verify auth state**: Many actions require `authStore.uid` to be set
3. **Use async/await**: Don't forget to await async actions
4. **Check computed reactivity**: Ensure source data is populated before testing computed properties
5. **Clear mocks**: Use `vi.clearAllMocks()` in `beforeEach` to prevent test pollution

## Common Errors and Solutions

### Error: "Set operation failed: target is readonly"

**Cause**: Trying to assign to a computed property
**Solution**: Populate state through actions with mocked Firebase responses

### Error: "Cannot read property 'uid' of undefined"

**Cause**: authStore.uid not set
**Solution**: Set `authStore.uid = 'test-user-id'` before testing

### Error: "Expected undefined to be..."

**Cause**: State not populated before testing computed properties
**Solution**: Call action (e.g., `fetchWorkouts`) with mocked data first

### Warning: "Unhandled Promise Rejection"

**Cause**: Action throwing error not properly caught in test
**Solution**: Use `await expect(...).rejects.toThrow()`

## Best Practices

1. ✅ Mock at module level before imports
2. ✅ Clear mocks in beforeEach
3. ✅ Test both success and failure cases
4. ✅ Test loading states
5. ✅ Test edge cases (empty, null, boundary)
6. ✅ Use descriptive test names
7. ✅ Group related tests with describe blocks
8. ✅ Test one thing per test
9. ✅ Use meaningful assertions
10. ✅ Comment complex test logic

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Pinia Testing Documentation](https://pinia.vuejs.org/cookbook/testing.html)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Firebase Testing Best Practices](https://firebase.google.com/docs/rules/unit-tests)
