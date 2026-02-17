<script setup>
import { AlertDialogAction } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
})
</script>

<template>
  <AlertDialogAction :as="as" :as-child="asChild" :class="cn(buttonVariants(), props.class)">
    <slot />
  </AlertDialogAction>
</template>
