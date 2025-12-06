<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { Flame, Calendar, Star } from 'lucide-vue-next'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()

// Destructure with storeToRefs to preserve reactivity
const { longestStreak, mostActiveDay, averageWorkoutsPerWeek } = storeToRefs(analyticsStore)
</script>

<template>
  <div class="stats-strip" role="status">
    <!-- Stat Item 1: Best Streak -->
    <div class="stat-item">
      <Flame class="stat-icon" />
      <div class="stat-content">
        <span class="stat-label">{{ t('dashboard.charts.heatmap.quickStats.bestStreak') }}</span>
        <span class="stat-value">
          {{ longestStreak.days > 0
             ? t('dashboard.charts.heatmap.quickStats.days', { count: longestStreak.days })
             : t('dashboard.charts.heatmap.quickStats.noData') }}
        </span>
      </div>
    </div>

    <!-- Stat Item 2: Avg Workouts/Week -->
    <div class="stat-item">
      <Calendar class="stat-icon" />
      <div class="stat-content">
        <span class="stat-label">{{ t('dashboard.charts.heatmap.quickStats.avgPerWeek') }}</span>
        <span class="stat-value">
          {{ averageWorkoutsPerWeek > 0
             ? t('dashboard.charts.heatmap.quickStats.perWeek', { value: averageWorkoutsPerWeek })
             : t('dashboard.charts.heatmap.quickStats.noData') }}
        </span>
      </div>
    </div>

    <!-- Stat Item 3: Most Active Day -->
    <div class="stat-item">
      <Star class="stat-icon" />
      <div class="stat-content">
        <span class="stat-label">{{ t('dashboard.charts.heatmap.quickStats.mostActiveDay') }}</span>
        <span class="stat-value">
          {{ mostActiveDay
             ? t(`dashboard.charts.daysOfWeek.${mostActiveDay.dayKey}`)
             : t('dashboard.charts.heatmap.quickStats.noData') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Default: Vertical stack for desktop sidebar mode */
.stats-strip {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
  border: none;
  margin: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: hsl(var(--muted) / 0.3);
  transition: background 150ms ease;
  cursor: default;
}

.stat-item:hover {
  background: hsl(var(--muted) / 0.5);
}

.stat-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0; /* Allow text truncation if needed */
}

.stat-label {
  font-size: 0.75rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
}

.stat-value {
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

/* Tablet/Mobile: Horizontal layout below heatmap */
@media (max-width: 1024px) {
  .stats-strip {
    flex-direction: row;
    flex-wrap: wrap;
    padding-top: 0.75rem;
    border-top: 1px solid hsl(var(--border));
    margin-top: 0.5rem;
  }

  .stat-item {
    flex: 1 1 auto;
    min-width: 120px;
    background: transparent;
    padding: 0;
  }

  .stat-item:hover {
    background: transparent;
  }
}

/* Small Mobile: Full-width stacking */
@media (max-width: 640px) {
  .stats-strip {
    flex-direction: column;
  }

  .stat-item {
    width: 100%;
  }
}
</style>
