<script setup>
import { AlertDialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})
</script>

<template>
  <AlertDialogTitle
    :as="as"
    :as-child="asChild"
    :class="cn('text-lg font-semibold', props.class)"
  >
    <slot />
  </AlertDialogTitle>
</template>
