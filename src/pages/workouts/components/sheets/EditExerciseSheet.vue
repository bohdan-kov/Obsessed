<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader>
        <SheetTitle>{{ t('workout.exerciseTable.editSheet.title') }}</SheetTitle>
        <SheetDescription v-if="exercise">
          {{ exercise.name }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-6">
        <!-- Notes Input -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>{{ t('workout.exerciseTable.editSheet.notes') }}</Label>
            <span v-if="saving" class="text-xs text-muted-foreground">
              {{ t('workout.exerciseTable.editSheet.saving') }}
            </span>
            <span
              v-else-if="lastSaved"
              class="text-xs text-muted-foreground"
            >
              {{ t('workout.exerciseTable.editSheet.saved') }}
            </span>
          </div>

          <Textarea
            v-model="notes"
            :placeholder="t('workout.exerciseTable.editSheet.notesPlaceholder')"
            class="min-h-32 resize-none"
            :disabled="saving"
          />
        </div>

        <!-- Info text -->
        <p class="text-xs text-muted-foreground">
          {{ t('workout.exerciseTable.editSheet.autoSaveInfo') }}
        </p>
      </div>

      <!-- Close Button -->
      <SheetFooter class="mt-6">
        <Button
          variant="outline"
          class="h-12 w-full text-lg"
          @click="$emit('update:open', false)"
        >
          {{ t('workout.exerciseTable.editSheet.close') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  exercise: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'save'])

const { t } = useI18n()

// Form state
const notes = ref('')
const saving = ref(false)
const lastSaved = ref(false)

// Debounced save function (2 seconds)
const debouncedSave = useDebounceFn(async () => {
  if (!props.exercise) return

  saving.value = true
  lastSaved.value = false

  try {
    await emit('save', {
      exerciseId: props.exercise.id,
      notes: notes.value,
    })

    lastSaved.value = true

    // Clear "saved" indicator after 2 seconds
    setTimeout(() => {
      lastSaved.value = false
    }, 2000)
  } catch (error) {
    // Error handling is done in parent component
  } finally {
    saving.value = false
  }
}, 2000)

// Watch notes for changes and trigger auto-save
watch(notes, () => {
  if (props.open && props.exercise) {
    debouncedSave()
  }
})

// Pre-fill form when sheet opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.exercise) {
      notes.value = props.exercise.notes || ''
      lastSaved.value = false
    }
  },
)

// Reset saving state on close
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      saving.value = false
      lastSaved.value = false
    }
  },
)
</script>
