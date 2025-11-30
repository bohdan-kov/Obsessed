<script setup>
import { AlertDialogCancel } from 'reka-ui'

defineProps({
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
})
</script>

<template>
  <AlertDialogCancel :as="as" :as-child="asChild">
    <slot />
  </AlertDialogCancel>
</template>
