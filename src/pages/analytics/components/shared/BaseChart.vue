<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LoadingSkeleton from './LoadingSkeleton.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  data: {
    type: [Array, Object],
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  emptyTitle: {
    type: String,
    default: null,
  },
  emptyDescription: {
    type: String,
    default: null,
  },
  emptyIcon: {
    type: String,
    default: 'bar-chart-2',
  },
  height: {
    type: String,
    default: '400px',
  },
  skeletonType: {
    type: String,
    default: 'chart',
    validator: (value) => ['chart', 'table', 'card'].includes(value),
  },
})

const { t } = useI18n()

const hasError = computed(() => !props.loading && props.error)

const isEmpty = computed(() => {
  if (props.loading || hasError.value) return false

  if (Array.isArray(props.data)) {
    return props.data.length === 0
  }

  if (props.data && typeof props.data === 'object') {
    return Object.keys(props.data).length === 0
  }

  return !props.data
})

const showChart = computed(() => !props.loading && !isEmpty.value && !hasError.value)

const computedEmptyTitle = computed(() => {
  return props.emptyTitle || t('analytics.emptyStates.noData')
})

const computedEmptyDescription = computed(() => {
  return props.emptyDescription || t('analytics.emptyStates.noWorkouts')
})
</script>

<template>
  <Card class="base-chart">
    <CardHeader v-if="title || description || $slots.header || $slots.actions" class="pb-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <CardTitle v-if="title">
            {{ title }}
          </CardTitle>
          <CardDescription v-if="description" class="mt-1.5">
            {{ description }}
          </CardDescription>
          <slot name="header" />
        </div>
        <div v-if="$slots.actions" class="flex-shrink-0">
          <slot name="actions" />
        </div>
      </div>
    </CardHeader>

    <CardContent>
      <!-- Loading State -->
      <LoadingSkeleton v-if="loading" :type="skeletonType" :height="height" />

      <!-- Empty State -->
      <EmptyState
        v-else-if="isEmpty"
        :title="computedEmptyTitle"
        :description="computedEmptyDescription"
        :icon="emptyIcon"
      />

      <!-- Error State -->
      <div
        v-else-if="hasError"
        class="flex flex-col items-center justify-center text-center error-state"
        :style="{ minHeight: height }"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4"
          role="img"
          aria-label="Error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-destructive"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>
        <p class="text-sm text-muted-foreground max-w-md">
          {{ error }}
        </p>
      </div>

      <!-- Chart Content -->
      <div v-else-if="showChart" class="chart-content" :style="{ minHeight: height }">
        <slot :data="data" />
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.base-chart {
  width: 100%;
}

.chart-content {
  position: relative;
  width: 100%;
}
</style>
