<script setup>
import { computed } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'

const props = defineProps({
  type: {
    type: String,
    default: 'chart',
    validator: (value) => ['chart', 'table', 'card'].includes(value),
  },
  rows: {
    type: Number,
    default: 5,
  },
  height: {
    type: String,
    default: '400px',
  },
})

// Determine skeleton layout based on type
const isChart = computed(() => props.type === 'chart')
const isTable = computed(() => props.type === 'table')
const isCard = computed(() => props.type === 'card')

// Generate row array for v-for
const rowArray = computed(() => {
  return Array.from({ length: props.rows }, (_, i) => i)
})
</script>

<template>
  <div
    class="loading-skeleton"
    :style="{ minHeight: height }"
    role="status"
    aria-live="polite"
    aria-busy="true"
    aria-label="Loading content"
  >
    <!-- Chart Skeleton -->
    <div v-if="isChart" class="space-y-4">
      <!-- Chart header (title + legend) -->
      <div class="flex items-center justify-between">
        <Skeleton class="h-6 w-32" />
        <div class="flex gap-2">
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-16" />
        </div>
      </div>

      <!-- Chart area -->
      <div class="relative" :style="{ height: `calc(${height} - 60px)` }">
        <!-- Y-axis labels -->
        <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-2">
          <Skeleton class="h-3 w-8" />
          <Skeleton class="h-3 w-8" />
          <Skeleton class="h-3 w-8" />
          <Skeleton class="h-3 w-8" />
          <Skeleton class="h-3 w-8" />
        </div>

        <!-- Chart bars/lines -->
        <div class="ml-12 h-full flex items-end justify-around gap-2 pb-8">
          <Skeleton class="h-3/4 w-full" />
          <Skeleton class="h-4/5 w-full" />
          <Skeleton class="h-2/3 w-full" />
          <Skeleton class="h-5/6 w-full" />
          <Skeleton class="h-1/2 w-full" />
          <Skeleton class="h-full w-full" />
          <Skeleton class="h-3/5 w-full" />
        </div>

        <!-- X-axis labels -->
        <div class="absolute bottom-0 left-12 right-0 flex justify-around">
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-12" />
          <Skeleton class="h-3 w-12" />
        </div>
      </div>
    </div>

    <!-- Table Skeleton -->
    <div v-else-if="isTable" class="space-y-3">
      <!-- Table header -->
      <div class="flex gap-4 pb-3 border-b">
        <Skeleton class="h-4 w-32 flex-shrink-0" />
        <Skeleton class="h-4 w-24 flex-shrink-0" />
        <Skeleton class="h-4 w-20 flex-shrink-0" />
        <Skeleton class="h-4 w-24 flex-1" />
      </div>

      <!-- Table rows -->
      <div v-for="index in rowArray" :key="index" class="flex gap-4 py-3 border-b border-border/50">
        <Skeleton class="h-5 w-32 flex-shrink-0" />
        <Skeleton class="h-5 w-24 flex-shrink-0" />
        <Skeleton class="h-5 w-20 flex-shrink-0" />
        <Skeleton class="h-5 w-full flex-1" />
      </div>
    </div>

    <!-- Card Skeleton -->
    <div v-else-if="isCard" class="space-y-6">
      <!-- Header -->
      <div class="space-y-2">
        <Skeleton class="h-6 w-48" />
        <Skeleton class="h-4 w-full max-w-md" />
      </div>

      <!-- Content sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="index in Math.min(rows, 4)"
          :key="index"
          class="space-y-3 p-4 border rounded-lg"
        >
          <Skeleton class="h-5 w-24" />
          <Skeleton class="h-8 w-32" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>
    </div>

    <!-- Screen reader text -->
    <span class="sr-only">Loading analytics data...</span>
  </div>
</template>

<style scoped>
.loading-skeleton {
  width: 100%;
  padding: 1rem;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Shimmer animation is handled by Skeleton component */
</style>
