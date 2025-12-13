<template>
  <AlertDialog :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{
          t('workout.exerciseTable.deleteDialog.title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          <span v-if="canDelete">
            {{
              t('workout.exerciseTable.deleteDialog.message', {
                name: exercise?.name || '',
                count: setsCount,
              })
            }}
          </span>
          <span v-else class="text-destructive">
            {{ t('workout.exerciseTable.deleteDialog.lastExerciseWarning') }}
          </span>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel as-child>
          <Button variant="outline" class="min-h-11 min-w-11">
            {{ t('workout.exerciseTable.deleteDialog.cancel') }}
          </Button>
        </AlertDialogCancel>

        <AlertDialogAction as-child>
          <Button
            variant="destructive"
            class="min-h-11 min-w-11"
            :disabled="!canDelete"
            @click="$emit('confirm')"
          >
            {{ t('workout.exerciseTable.deleteDialog.confirm') }}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  exercise: {
    type: Object,
    default: null,
  },
  canDelete: {
    type: Boolean,
    default: true,
  },
  setsCount: {
    type: Number,
    default: 0,
  },
})

defineEmits(['update:open', 'confirm'])

const { t } = useI18n()
</script>
