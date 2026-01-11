<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'

const props = defineProps({
  muscleGroups: {
    type: Array,
    default: () => [],
  },
  max: {
    type: Number,
    default: 3,
  },
})

const { t } = useI18n()

const displayGroups = computed(() => {
  return props.muscleGroups.slice(0, props.max)
})

const remaining = computed(() => {
  const count = props.muscleGroups.length - props.max
  return count > 0 ? count : 0
})
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <Badge
      v-for="muscle in displayGroups"
      :key="muscle"
      variant="outline"
      class="text-xs"
    >
      {{ t(`common.muscles.${muscle}`) }}
    </Badge>
    <Badge v-if="remaining > 0" variant="outline" class="text-xs">
      +{{ remaining }}
    </Badge>
  </div>
</template>
