import { ref, watch } from 'vue'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { CONFIG } from '@/constants/config'
import { useDebounceFn } from '@vueuse/core'
import { useErrorHandler } from '@/composables/useErrorHandler'

/**
 * Exercise Notes Composable
 * Manages exercise notes with autosave functionality
 *
 * @param {string} exerciseId - Exercise ID
 * @returns {Object} Notes management utilities
 */
export function useExerciseNotes(exerciseId) {
  const exerciseLibraryStore = useExerciseLibraryStore()
  const { showSuccess } = useErrorHandler()

  // Local state
  const note = ref('')
  const saving = ref(false)
  const lastSaved = ref(null)
  const error = ref(null)
  const isDirty = ref(false)

  /**
   * Load note from store
   */
  async function loadNote() {
    try {
      await exerciseLibraryStore.loadNote(exerciseId)
      const noteData = exerciseLibraryStore.getNote(exerciseId).value
      note.value = noteData.text || ''
      lastSaved.value = noteData.updatedAt
      isDirty.value = false
    } catch (err) {
      error.value = err.message
      console.error('Error loading note:', err)
    }
  }

  /**
   * Save note to Firestore
   */
  async function saveNote() {
    if (!isDirty.value) return // Don't save if nothing changed

    try {
      saving.value = true
      error.value = null

      await exerciseLibraryStore.saveNote(exerciseId, note.value)

      lastSaved.value = new Date()
      isDirty.value = false

      // Show success toast (only for manual saves, not autosave)
      // Autosave is silent to avoid spamming the user
    } catch (err) {
      // Error is already handled by the store with handleError
      // Just set local error state for component display
      error.value = err.message
      // Don't rethrow - error already shown via toast
    } finally {
      saving.value = false
    }
  }

  /**
   * Debounced save function
   * Waits 2 seconds after user stops typing before saving
   */
  const debouncedSave = useDebounceFn(async () => {
    await saveNote()
  }, CONFIG.exercise.NOTES_AUTOSAVE_DELAY)

  /**
   * Watch for changes and trigger autosave
   */
  watch(note, (newValue, oldValue) => {
    // Mark as dirty if value changed
    if (newValue !== oldValue) {
      isDirty.value = true

      // Trigger debounced save
      debouncedSave()
    }
  })

  /**
   * Manually trigger save (for immediate save)
   * Used when user explicitly saves (e.g., blur, button click)
   */
  async function forceSave() {
    // Cancel any pending debounced save
    debouncedSave.cancel()

    // Save immediately
    await saveNote()

    // Show success message for manual saves
    if (!error.value && lastSaved.value) {
      showSuccess('exercises.toast.notesSaved', { isI18nKey: true })
    }
  }

  /**
   * Reset note to last saved state
   */
  function resetNote() {
    const noteData = exerciseLibraryStore.getNote(exerciseId).value
    note.value = noteData.text || ''
    isDirty.value = false
    error.value = null
  }

  /**
   * Clear note
   */
  async function clearNote() {
    note.value = ''
    isDirty.value = true
    await forceSave()
  }

  // Load note on initialization
  loadNote()

  return {
    // State
    note,
    saving,
    lastSaved,
    error,
    isDirty,

    // Actions
    loadNote,
    saveNote,
    forceSave,
    resetNote,
    clearNote,
  }
}
