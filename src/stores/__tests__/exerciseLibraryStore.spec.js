import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useAuthStore } from '@/stores/authStore'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useUserStore } from '@/stores/userStore'
import { fetchDocument, setDocument, updateDocument, deleteDocument } from '@/firebase/firestore'

// Mock Firebase Firestore
vi.mock('@/firebase/firestore', () => ({
  fetchDocument: vi.fn(),
  setDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
  fetchCollection: vi.fn(),
  createDocument: vi.fn(),
  subscribeToCollection: vi.fn(() => vi.fn()),
}))

// Mock auth module (needed by authStore)
vi.mock('@/firebase/auth', () => ({
  onAuthChange: vi.fn(() => vi.fn()),
  signOut: vi.fn(),
}))

// Mock error handler
vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
  }),
}))

describe('exerciseLibraryStore - Notes and Favorites for Base Exercises', () => {
  let exerciseLibraryStore
  let authStore
  let exerciseStore
  let userStore

  beforeEach(() => {
    // Create fresh Pinia instance
    setActivePinia(createPinia())

    // Initialize stores
    authStore = useAuthStore()
    exerciseStore = useExerciseStore()
    userStore = useUserStore()
    exerciseLibraryStore = useExerciseLibraryStore()

    // Set authenticated user (set the internal ref, not the computed)
    // Access the internal state directly via $patch
    authStore.$patch({
      user: { uid: 'test-user-123', email: 'test@example.com', emailVerified: true },
      initializing: false,
      loading: false,
    })

    // Initialize user settings (access internal state)
    userStore.$patch({
      settings: {
        favoriteExercises: [],
        recentlyUsedExercises: [],
      },
    })

    // Load base exercises
    exerciseStore.fetchExercises()

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Notes for Base Exercises', () => {
    it('should save note for a base exercise (slug-based ID)', async () => {
      const exerciseId = 'barbell-bench-press' // Base exercise slug
      const noteText = 'Focus on proper form and controlled descent'

      // Mock successful save
      setDocument.mockResolvedValue()

      // Save note
      await exerciseLibraryStore.saveNote(exerciseId, noteText)

      // Verify setDocument was called with correct path and data
      // Note: updatedAt is NOT passed to setDocument - it's added automatically by setDocument
      expect(setDocument).toHaveBeenCalledWith(
        'users/test-user-123/exerciseNotes',
        exerciseId,
        {
          note: noteText,
        },
        { merge: true }
      )

      // Verify local state was updated
      const note = exerciseLibraryStore.getNote(exerciseId).value
      expect(note.text).toBe(noteText)
      expect(note.saving).toBe(false)
    })

    it('should load note for a base exercise', async () => {
      const exerciseId = 'deadlift'
      const noteText = 'Keep back straight, drive through heels'

      // Mock note exists in Firestore
      fetchDocument.mockResolvedValue({
        id: exerciseId,
        note: noteText,
        updatedAt: new Date('2024-01-15'),
      })

      // Load note
      await exerciseLibraryStore.loadNote(exerciseId)

      // Verify fetchDocument was called with correct path
      expect(fetchDocument).toHaveBeenCalledWith(
        'users/test-user-123/exerciseNotes',
        exerciseId
      )

      // Verify local state was updated
      const note = exerciseLibraryStore.getNote(exerciseId).value
      expect(note.text).toBe(noteText)
      expect(note.updatedAt).toEqual(new Date('2024-01-15'))
    })

    it('should handle non-existent note for base exercise', async () => {
      const exerciseId = 'pull-ups'

      // Mock note does not exist
      fetchDocument.mockResolvedValue(null)

      // Load note
      await exerciseLibraryStore.loadNote(exerciseId)

      // Verify local state was initialized with empty note
      const note = exerciseLibraryStore.getNote(exerciseId).value
      expect(note.text).toBe('')
      expect(note.updatedAt).toBe(null)
    })

    it('should handle errors when saving note', async () => {
      const exerciseId = 'barbell-squat'
      const noteText = 'Test note'

      // Mock save error
      setDocument.mockRejectedValue(new Error('Firestore error'))
      fetchDocument.mockResolvedValue(null) // For revert attempt

      // Attempt to save note
      await expect(exerciseLibraryStore.saveNote(exerciseId, noteText)).rejects.toThrow()

      // Verify optimistic update was reverted by calling loadNote
      expect(fetchDocument).toHaveBeenCalled()
    })
  })

  describe('Notes for Custom Exercises', () => {
    it('should save note for a custom exercise (Firestore-generated ID)', async () => {
      const exerciseId = 'custom-exercise-abc123' // Custom exercise with Firestore ID
      const noteText = 'Custom exercise notes'

      // Mock successful save
      setDocument.mockResolvedValue()

      // Save note
      await exerciseLibraryStore.saveNote(exerciseId, noteText)

      // Verify setDocument was called (same path structure as base exercises)
      // Note: updatedAt is NOT passed to setDocument - it's added automatically by setDocument
      expect(setDocument).toHaveBeenCalledWith(
        'users/test-user-123/exerciseNotes',
        exerciseId,
        {
          note: noteText,
        },
        { merge: true }
      )

      // Verify local state was updated
      const note = exerciseLibraryStore.getNote(exerciseId).value
      expect(note.text).toBe(noteText)
    })

    it('should load note for a custom exercise', async () => {
      const exerciseId = 'custom-exercise-xyz789'
      const noteText = 'Custom cable variation'

      // Mock note exists
      fetchDocument.mockResolvedValue({
        id: exerciseId,
        note: noteText,
        updatedAt: new Date('2024-01-20'),
      })

      // Load note
      await exerciseLibraryStore.loadNote(exerciseId)

      // Verify local state was updated
      const note = exerciseLibraryStore.getNote(exerciseId).value
      expect(note.text).toBe(noteText)
    })
  })

  describe('Favorites for Base Exercises', () => {
    it('should toggle favorite for a base exercise', async () => {
      const exerciseId = 'barbell-bench-press'

      // Mock user settings update
      userStore.toggleFavoriteExercise = vi.fn(async (id) => {
        const currentFavorites = [...userStore.settings.favoriteExercises]
        if (currentFavorites.includes(id)) {
          userStore.settings.favoriteExercises = currentFavorites.filter((fav) => fav !== id)
        } else {
          userStore.settings.favoriteExercises = [...currentFavorites, id]
        }
      })

      // Add to favorites
      await exerciseLibraryStore.toggleFavorite(exerciseId)

      // Verify favorite was added
      expect(exerciseLibraryStore.favorites).toContain(exerciseId)
      expect(userStore.toggleFavoriteExercise).toHaveBeenCalledWith(exerciseId)

      // Remove from favorites
      await exerciseLibraryStore.toggleFavorite(exerciseId)

      // Verify favorite was removed
      expect(exerciseLibraryStore.favorites).not.toContain(exerciseId)
    })

    it('should get favorite exercises with full data', async () => {
      // Add base exercises to favorites
      userStore.settings.favoriteExercises = ['barbell-bench-press', 'deadlift', 'barbell-squat']

      const favoriteExercises = exerciseLibraryStore.favoriteExercises

      // Verify all favorites have full exercise data
      expect(favoriteExercises).toHaveLength(3)
      expect(favoriteExercises[0].id).toBe('barbell-bench-press')
      expect(favoriteExercises[0].name).toBeDefined()
      expect(favoriteExercises[0].muscleGroup).toBeDefined()
    })

    it('should check if exercise is favorite', async () => {
      const exerciseId = 'pull-ups'
      userStore.settings.favoriteExercises = [exerciseId]

      const result = exerciseLibraryStore.isFavorite(exerciseId)

      expect(result).toBe(true)
    })
  })

  describe('Exercise Filtering with Base Exercises', () => {
    it('should filter base exercises by muscle group', () => {
      exerciseLibraryStore.setFilter('muscleGroup', 'chest')

      const filtered = exerciseLibraryStore.filteredAndSortedExercises

      // Verify all filtered exercises are chest exercises
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((exercise) => {
        expect(
          exercise.muscleGroup === 'chest' || exercise.secondaryMuscles?.includes('chest')
        ).toBe(true)
      })
    })

    it('should filter base exercises by equipment', () => {
      exerciseLibraryStore.setFilter('equipment', 'barbell')

      const filtered = exerciseLibraryStore.filteredAndSortedExercises

      // Verify all filtered exercises use barbell
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((exercise) => {
        expect(exercise.equipment).toBe('barbell')
      })
    })

    it('should filter base exercises by type', () => {
      exerciseLibraryStore.setFilter('exerciseType', 'compound')

      const filtered = exerciseLibraryStore.filteredAndSortedExercises

      // Verify all filtered exercises are compound
      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((exercise) => {
        expect(exercise.type).toBe('compound')
      })
    })

    it('should search base exercises by name (bilingual)', () => {
      exerciseLibraryStore.setSearchQuery('bench')

      const results = exerciseLibraryStore.filteredAndSortedExercises

      // Should find exercises with "bench" in English name
      expect(results.length).toBeGreaterThan(0)
      const hasBenchPress = results.some((ex) => ex.id === 'barbell-bench-press')
      expect(hasBenchPress).toBe(true)
    })

    it('should show only favorite exercises when filter is active', () => {
      userStore.settings.favoriteExercises = ['deadlift', 'barbell-squat']
      exerciseLibraryStore.setFilter('showFavoritesOnly', true)

      const filtered = exerciseLibraryStore.filteredAndSortedExercises

      expect(filtered).toHaveLength(2)
      expect(filtered.some((ex) => ex.id === 'deadlift')).toBe(true)
      expect(filtered.some((ex) => ex.id === 'barbell-squat')).toBe(true)
    })
  })

  describe('Authentication Requirements', () => {
    it('should throw error when saving note without authentication', async () => {
      // Clear user authentication
      authStore.$patch({ user: null })

      await expect(
        exerciseLibraryStore.saveNote('barbell-bench-press', 'Test note')
      ).rejects.toThrow('User must be authenticated')
    })

    it('should not load note without authentication', async () => {
      // Clear user authentication
      authStore.$patch({ user: null })

      await exerciseLibraryStore.loadNote('barbell-bench-press')

      // Should not attempt to fetch from Firestore
      expect(fetchDocument).not.toHaveBeenCalled()
    })
  })

  describe('Pagination with Base Exercises', () => {
    it('should paginate base exercises correctly', () => {
      exerciseLibraryStore.setItemsPerPage(10)

      // First page
      const firstPage = exerciseLibraryStore.paginatedExercises
      expect(firstPage.length).toBeLessThanOrEqual(10)

      // Total pages
      const totalExercises = exerciseLibraryStore.totalExercises
      const expectedPages = Math.ceil(totalExercises / 10)
      expect(exerciseLibraryStore.totalPages).toBe(expectedPages)
    })

    it('should navigate between pages', () => {
      exerciseLibraryStore.setItemsPerPage(10)

      // Go to next page
      exerciseLibraryStore.nextPage()
      expect(exerciseLibraryStore.currentPage).toBe(2)

      // Go to previous page
      exerciseLibraryStore.previousPage()
      expect(exerciseLibraryStore.currentPage).toBe(1)

      // Go to specific page
      exerciseLibraryStore.goToPage(3)
      expect(exerciseLibraryStore.currentPage).toBe(3)
    })

    it('should reset pagination when filters change', () => {
      exerciseLibraryStore.goToPage(3)
      expect(exerciseLibraryStore.currentPage).toBe(3)

      // Change filter should reset to page 1
      exerciseLibraryStore.setFilter('muscleGroup', 'chest')
      expect(exerciseLibraryStore.currentPage).toBe(1)
    })
  })
})
