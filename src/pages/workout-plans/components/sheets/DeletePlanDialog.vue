<script setup>
import { ref, computed } from 'vue'
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

const { t } = useI18n()

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  plan: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'confirm'])

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const planName = computed(() => props.plan?.name || '')

function handleConfirm() {
  if (props.plan) {
    emit('confirm', props.plan.id)
  }
  isOpen.value = false
}
</script>

<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t('plans.delete.title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('plans.delete.message', { name: planName }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ t('plans.delete.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          @click="handleConfirm"
          class="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60"
        >
          {{ t('plans.delete.confirm') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
