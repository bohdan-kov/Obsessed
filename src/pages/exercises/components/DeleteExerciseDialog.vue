<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('exercises.delete.title') }}</DialogTitle>
        <DialogDescription class="space-y-2">
          <p>{{ t('exercises.delete.message', { name: exerciseName }) }}</p>

          <!-- Warning about usage in workouts -->
          <div
            v-if="usageCount > 0"
            class="p-3 bg-warning/10 border border-warning/20 rounded-md"
          >
            <p class="text-warning font-medium text-sm">
              {{ t('exercises.delete.warning', { count: usageCount }) }}
            </p>
          </div>
          <div v-else class="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p class="text-destructive font-medium text-sm">
              {{ t('exercises.delete.warningUnused') }}
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button
          variant="outline"
          :disabled="deleting"
          @click="handleOpenChange(false)"
        >
          {{ t('exercises.delete.cancel') }}
        </Button>
        <Button
          variant="destructive"
          @click="handleConfirm"
          :disabled="deleting"
        >
          <Loader2 v-if="deleting" class="h-4 w-4 mr-2 animate-spin" />
          {{ deleting ? t('common.deleting') : t('exercises.delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useToast } from '@/components/ui/toast/use-toast'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  /**
   * Dialog open state
   */
  open: {
    type: Boolean,
    required: true,
  },
  /**
   * Exercise to delete
   */
  exercise: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'deleted'])

const router = useRouter()
const { t } = useI18n()
const { toast } = useToast()
const libraryStore = useExerciseLibraryStore()

// Local state
const deleting = ref(false)

// Computed properties
const exerciseName = computed(() => {
  if (!props.exercise) return ''
  const locale = t('locale') // Get current locale
  return props.exercise.name?.[locale] || props.exercise.name?.uk || props.exercise.name
})

const usageCount = computed(() => {
  if (!props.exercise) return 0
  return libraryStore.countExerciseUsage(props.exercise.id)
})

/**
 * Handle dialog open state change
 */
function handleOpenChange(newValue) {
  if (!deleting.value) {
    emit('update:open', newValue)
  }
}

/**
 * Handle confirm delete
 */
async function handleConfirm() {
  if (!props.exercise) return

  deleting.value = true

  try {
    await libraryStore.deleteExercise(props.exercise.id)

    toast({
      title: t('exercises.toast.exerciseDeleted'),
      description: usageCount.value > 0
        ? t('exercises.toast.softDeleteMessage')
        : t('exercises.toast.hardDeleteMessage'),
    })

    emit('deleted')
    emit('update:open', false)

    // Redirect to exercises list after successful deletion
    router.push({ name: 'Exercises' })
  } catch (error) {
    console.error('Failed to delete exercise:', error)
    toast({
      title: t('exercises.toast.error'),
      description: t('exercises.toast.deleteFailed'),
      variant: 'destructive',
    })
  } finally {
    deleting.value = false
  }
}
</script>
