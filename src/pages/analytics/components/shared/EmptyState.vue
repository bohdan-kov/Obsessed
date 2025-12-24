<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

const props = defineProps({
  icon: {
    type: String,
    default: 'inbox',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  actionText: {
    type: String,
    default: null,
  },
  actionVariant: {
    type: String,
    default: 'default',
  },
  height: {
    type: String,
    default: '400px',
  },
})

const emit = defineEmits(['action'])

// Icon SVG paths mapping (lucide-vue-next compatible)
const iconPaths = {
  inbox: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 12h-6l-2 3h-4l-2-3H2',
      'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    ],
  },
  'bar-chart-2': {
    viewBox: '0 0 24 24',
    paths: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  },
  activity: {
    viewBox: '0 0 24 24',
    paths: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  },
  calendar: {
    viewBox: '0 0 24 24',
    paths: [
      'M8 2v4',
      'M16 2v4',
      'M3 10h18',
      'M21 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    ],
  },
  dumbbell: {
    viewBox: '0 0 24 24',
    paths: [
      'M14.4 14.4 9.6 9.6',
      'M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z',
      'M5.343 2.515a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829l-6.364 6.364a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829z',
    ],
  },
  'trending-up': {
    viewBox: '0 0 24 24',
    paths: ['M22 7 13.5 15.5 8.5 10.5 2 17', 'm16 7 6 0 0 6'],
  },
}

const iconData = computed(() => {
  return iconPaths[props.icon] || iconPaths['inbox']
})

const showAction = computed(() => {
  return props.actionText && props.actionText.trim().length > 0
})

function handleAction() {
  emit('action')
}
</script>

<template>
  <div
    class="empty-state flex flex-col items-center justify-center text-center p-6 md:p-8"
    :style="{ minHeight: height }"
    role="status"
    aria-live="polite"
  >
    <!-- Icon -->
    <div
      class="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-muted mb-4 md:mb-6"
      role="img"
      :aria-label="`${icon} icon`"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        :viewBox="iconData.viewBox"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-muted-foreground"
        aria-hidden="true"
      >
        <path v-for="(path, index) in iconData.paths" :key="index" :d="path" />
      </svg>
    </div>

    <!-- Title -->
    <h3 class="text-base md:text-lg font-semibold text-foreground mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" class="text-sm text-muted-foreground max-w-sm mb-6">
      {{ description }}
    </p>

    <!-- Action Button (optional) -->
    <Button
      v-if="showAction"
      :variant="actionVariant"
      size="default"
      class="min-h-11 min-w-11"
      @click="handleAction"
    >
      {{ actionText }}
    </Button>

    <!-- Slot for custom actions -->
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  width: 100%;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
