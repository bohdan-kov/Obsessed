<script setup>
import { AlertDialogAction } from 'reka-ui'

defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
})
</script>

<template>
  <AlertDialogAction :as="as" :as-child="asChild">
    <slot />
  </AlertDialogAction>
</template>
