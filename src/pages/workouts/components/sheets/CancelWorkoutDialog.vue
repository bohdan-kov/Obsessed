<template>
  <AlertDialog :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{
          t('workout.activeWorkout.cancel.title')
        }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('workout.activeWorkout.cancel.message', { count: setsCount }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel as-child>
          <Button variant="outline" class="min-h-11 min-w-11">
            {{ t('workout.activeWorkout.cancel.keepGoing') }}
          </Button>
        </AlertDialogCancel>

        <AlertDialogAction as-child>
          <Button
            variant="destructive"
            class="min-h-11 min-w-11"
            @click="$emit('confirm')"
          >
            {{ t('workout.activeWorkout.cancel.confirm') }}
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
  setsCount: {
    type: Number,
    default: 0,
  },
})

defineEmits(['update:open', 'confirm'])

const { t } = useI18n()
</script>
