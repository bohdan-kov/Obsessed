<script setup>
import { AlertDialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})
</script>

<template>
  <AlertDialogDescription
    :as="as"
    :as-child="asChild"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
