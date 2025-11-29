<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'destructive'].includes(value),
  },
})

const emit = defineEmits(['dismiss'])

const variantClasses = computed(() => {
  const variants = {
    default: 'bg-background text-foreground border-border',
    destructive: 'bg-destructive text-destructive-foreground border-destructive',
  }
  return variants[props.variant] || variants.default
})
</script>

<template>
  <div
    :class="
      cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
        variantClasses
      )
    "
    role="alert"
  >
    <div class="grid gap-1">
      <div v-if="title" class="text-sm font-semibold">
        {{ title }}
      </div>
      <div v-if="description" class="text-sm opacity-90">
        {{ description }}
      </div>
    </div>
    <button
      @click="emit('dismiss', id)"
      class="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <X class="h-4 w-4" />
      <span class="sr-only">Close</span>
    </button>
  </div>
</template>
