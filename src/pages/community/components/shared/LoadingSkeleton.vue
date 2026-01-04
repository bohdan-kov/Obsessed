<script setup>
import { computed } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * LoadingSkeleton - Loading placeholder for feed/lists
 *
 * Features:
 * - Different variants (post, user-card, list-item)
 * - Configurable repeat count
 * - Smooth pulse animation (built into Skeleton component)
 */

const props = defineProps({
  variant: {
    type: String,
    default: 'post',
    validator: (value) => ['post', 'user-card', 'list-item', 'profile'].includes(value),
  },
  count: {
    type: Number,
    default: 3,
    validator: (value) => value >= 1 && value <= 10,
  },
})

const items = computed(() => Array.from({ length: props.count }, (_, i) => i))
</script>

<template>
  <div class="space-y-4">
    <!-- Post Skeleton (FeedPostCard) -->
    <div v-if="variant === 'post'" v-for="item in items" :key="`post-${item}`" class="border rounded-lg p-4 space-y-4">
      <!-- Header: Avatar + Name + Timestamp -->
      <div class="flex items-center gap-3">
        <Skeleton class="w-10 h-10 rounded-full" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-3 w-20" />
        </div>
        <Skeleton class="h-9 w-20" />
      </div>

      <!-- Caption -->
      <div class="space-y-2">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
      </div>

      <!-- Workout Summary -->
      <div class="border rounded-lg p-3 space-y-3">
        <div class="flex gap-4">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-24" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
          <Skeleton class="h-4 w-4/6" />
        </div>
      </div>

      <!-- Actions: Like, Comment, Share -->
      <div class="flex gap-4 pt-2">
        <Skeleton class="h-9 w-20" />
        <Skeleton class="h-9 w-20" />
        <Skeleton class="h-9 w-20" />
      </div>
    </div>

    <!-- User Card Skeleton -->
    <div
      v-else-if="variant === 'user-card'"
      v-for="item in items"
      :key="`user-card-${item}`"
      class="flex items-center gap-3 p-3 border rounded-lg"
    >
      <Skeleton class="w-12 h-12 rounded-full flex-shrink-0" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-3 w-48" />
      </div>
      <Skeleton class="h-9 w-20" />
    </div>

    <!-- List Item Skeleton (simple) -->
    <div
      v-else-if="variant === 'list-item'"
      v-for="item in items"
      :key="`list-item-${item}`"
      class="flex items-center gap-3 p-3"
    >
      <Skeleton class="w-10 h-10 rounded-full" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-4 w-40" />
        <Skeleton class="h-3 w-24" />
      </div>
    </div>

    <!-- Profile Skeleton -->
    <div v-else-if="variant === 'profile'" class="space-y-6">
      <!-- Profile Header -->
      <div class="flex items-start gap-4">
        <Skeleton class="w-24 h-24 rounded-full" />
        <div class="flex-1 space-y-3">
          <Skeleton class="h-6 w-48" />
          <Skeleton class="h-4 w-64" />
          <div class="flex gap-4 pt-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-24" />
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-2">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-3 w-full" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-3 w-full" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-8 w-full" />
          <Skeleton class="h-3 w-full" />
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b">
        <Skeleton class="h-10 w-24" />
        <Skeleton class="h-10 w-24" />
        <Skeleton class="h-10 w-24" />
      </div>

      <!-- Content placeholder -->
      <div class="space-y-4">
        <Skeleton class="h-32 w-full rounded-lg" />
        <Skeleton class="h-32 w-full rounded-lg" />
      </div>
    </div>
  </div>
</template>
