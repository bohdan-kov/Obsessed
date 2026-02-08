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
import { Button } from '@/components/ui/button'

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
        <AlertDialogCancel as-child>
          <Button variant="outline" class="min-h-11 min-w-11">
            {{ t('plans.delete.cancel') }}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction as-child>
          <Button
            variant="destructive"
            class="min-h-11 min-w-11"
            @click="handleConfirm"
          >
            {{ t('plans.delete.confirm') }}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
