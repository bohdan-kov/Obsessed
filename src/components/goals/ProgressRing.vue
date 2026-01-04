<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 100,
  },
  size: {
    type: Number,
    default: 120,
  },
  color: {
    type: String,
    default: 'hsl(var(--primary))',
  },
  strokeWidth: {
    type: Number,
    default: 8,
  },
})

// SVG circle calculations
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const strokeDashoffset = computed(() => {
  const progress = Math.min(Math.max(props.progress, 0), 100)
  return circumference.value - (progress / 100) * circumference.value
})

const center = computed(() => props.size / 2)
</script>

<template>
  <div class="progress-ring" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg :width="size" :height="size" class="progress-ring__svg">
      <!-- Background circle -->
      <circle
        class="progress-ring__circle-bg"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        stroke="hsl(var(--muted))"
      />

      <!-- Progress circle -->
      <circle
        class="progress-ring__circle-progress"
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        fill="none"
        :stroke="color"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        stroke-linecap="round"
      />
    </svg>

    <!-- Progress percentage text -->
    <div class="progress-ring__text">
      <span class="progress-ring__percentage">{{ Math.round(progress) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.progress-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring__svg {
  transform: rotate(-90deg);
}

.progress-ring__circle-progress {
  transition: stroke-dashoffset 0.6s ease-in-out;
}

.progress-ring__text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-ring__percentage {
  font-size: clamp(1rem, 20%, 1.5rem);
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1;
}
</style>
