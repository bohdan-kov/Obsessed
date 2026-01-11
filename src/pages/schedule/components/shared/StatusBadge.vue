<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, XCircle, Bed } from 'lucide-vue-next'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['completed', 'planned', 'missed', 'rest'].includes(value),
  },
})

const { t } = useI18n()

const config = computed(() => {
  const configs = {
    completed: {
      label: t('schedule.status.completed'),
      variant: 'default',
      icon: CheckCircle2,
      class: 'bg-green-500/10 text-green-700 dark:text-green-400',
    },
    planned: {
      label: t('schedule.status.planned'),
      variant: 'secondary',
      icon: Circle,
      class: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    },
    missed: {
      label: t('schedule.status.missed'),
      variant: 'destructive',
      icon: XCircle,
      class: 'bg-red-500/10 text-red-700 dark:text-red-400',
    },
    rest: {
      label: t('schedule.status.rest'),
      variant: 'outline',
      icon: Bed,
      class: 'bg-muted/50 text-muted-foreground',
    },
  }
  return configs[props.status] || configs.rest
})
</script>

<template>
  <Badge :variant="config.variant" :class="config.class" class="gap-1">
    <component :is="config.icon" class="w-3 h-3" />
    {{ config.label }}
  </Badge>
</template>
