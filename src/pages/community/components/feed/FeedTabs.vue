<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * FeedTabs - Feed type tabs component
 *
 * Features:
 * - 3 tabs: Following / Discover / You
 * - Active tab indicator
 * - Emits tab change event
 * - Mobile-optimized (equal width tabs)
 */

const props = defineProps({
  modelValue: {
    type: String,
    default: 'following',
    validator: (value) => ['following', 'discover', 'you'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const currentTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <Tabs v-model="currentTab" class="w-full">
    <TabsList class="grid w-full grid-cols-3">
      <TabsTrigger value="following" class="text-sm">
        {{ t('community.feed.following') }}
      </TabsTrigger>
      <TabsTrigger value="discover" class="text-sm">
        {{ t('community.feed.discover') }}
      </TabsTrigger>
      <TabsTrigger value="you" class="text-sm">
        {{ t('community.feed.you') }}
      </TabsTrigger>
    </TabsList>

    <!-- Slot for tab content (FeedList will be rendered here) -->
    <TabsContent value="following">
      <slot name="following" />
    </TabsContent>
    <TabsContent value="discover">
      <slot name="discover" />
    </TabsContent>
    <TabsContent value="you">
      <slot name="you" />
    </TabsContent>
  </Tabs>
</template>
