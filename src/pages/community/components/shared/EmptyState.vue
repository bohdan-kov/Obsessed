<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Users,
  UserPlus,
  MessageSquare,
  Heart,
  Share2,
  Inbox,
  Search,
  Lock,
  UserX,
} from 'lucide-vue-next'

/**
 * EmptyState - Consistent empty state component
 *
 * Features:
 * - Icon variants for different contexts
 * - Title and description
 * - Optional CTA button
 * - Mobile-optimized spacing
 */

const props = defineProps({
  icon: {
    type: String,
    default: 'inbox',
    validator: (value) =>
      ['users', 'user-plus', 'message', 'heart', 'share', 'inbox', 'search', 'lock', 'user-x'].includes(
        value
      ),
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  ctaText: {
    type: String,
    default: '',
  },
  ctaVariant: {
    type: String,
    default: 'default',
  },
})

const emit = defineEmits(['cta-click'])

// Icon components mapping
const iconComponents = {
  users: Users,
  'user-plus': UserPlus,
  message: MessageSquare,
  heart: Heart,
  share: Share2,
  inbox: Inbox,
  search: Search,
  lock: Lock,
  'user-x': UserX,
}

const IconComponent = computed(() => iconComponents[props.icon])

const handleCtaClick = () => {
  emit('cta-click')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <component
      :is="IconComponent"
      class="w-16 h-16 mb-4 text-muted-foreground opacity-50"
      :stroke-width="1.5"
    />

    <!-- Title -->
    <h3 class="text-lg font-semibold mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" class="text-sm text-muted-foreground max-w-md mb-6">
      {{ description }}
    </p>

    <!-- CTA Button -->
    <Button v-if="ctaText" :variant="ctaVariant" @click="handleCtaClick">
      {{ ctaText }}
    </Button>

    <!-- Default slot for custom content -->
    <slot />
  </div>
</template>
