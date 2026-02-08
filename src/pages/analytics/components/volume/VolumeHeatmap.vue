<script setup>
/**
 * VolumeHeatmap Component
 *
 * Displays a GitHub-style contribution heatmap showing daily training volume over 365 days.
 * Uses CSS Grid layout with grid-auto-flow: column to render ~52 weeks × 7 days = ~365 cells.
 * Adapted from the working FrequencyChart.vue pattern.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useContributionHeatmap } from '@/composables/useContributionHeatmap'
import { useUnits } from '@/composables/useUnits'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar, Info } from 'lucide-vue-next'
import { toLocalDateString, formatDate } from '@/utils/dateUtils'

const { t, locale } = useI18n()
const { formatWeight } = useUnits()

const analyticsStore = useAnalyticsStore()
const { dailyVolumeMap } = storeToRefs(analyticsStore)

const {
  gridData,
  monthLabels,
  dayLabels,
  legendLevels,
  isEmpty,
  totalWeeks,
  isCappedToYear,
} = useContributionHeatmap()

// Grid sizing: Define a 7-row × N-column grid where N = totalWeeks
// Rows = 7 days (Mon-Sun), Columns = number of weeks in the period
// Cell sizes are CSS variables that adjust per breakpoint for responsive design
const gridColumnsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${totalWeeks.value}, var(--cell-size))`,
  gridTemplateRows: 'repeat(7, var(--cell-size))',
}))

const monthLabelsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${totalWeeks.value}, var(--cell-size))`,
}))

// Refs for scroll synchronization
const monthLabelsScrollRef = ref(null)
const heatmapContainerRef = ref(null)

// Tooltip state
const activeCell = ref(null)
const showTooltip = ref(false)
const tooltipPosition = ref({ x: 0, y: 0 })

// Performance optimization: Prevent infinite scroll loops and throttle updates
let isScrolling = false
let rafId = null

// Calculate max volume for color scaling
const maxVolume = computed(() => {
  if (!dailyVolumeMap.value) return 0
  const volumes = Object.values(dailyVolumeMap.value)
  return volumes.length ? Math.max(...volumes) : 0
})

/**
 * Gets the color intensity level based on volume percentage
 * @param {number} volume - Daily volume
 * @param {number} maxVolume - Maximum volume in the period
 * @returns {number} Level 0-3
 */
function getVolumeIntensityLevel(volume, maxVolume) {
  if (volume === 0 || maxVolume === 0) return 0

  const intensity = volume / maxVolume

  if (intensity >= 0.75) return 3
  if (intensity >= 0.5) return 2
  if (intensity >= 0.25) return 1
  return 0
}

/**
 * Gets the Tailwind color class for a level (0-3)
 * @param {number} level - Intensity level
 * @returns {string} Tailwind class
 */
function getColorClass(level) {
  const LEVEL_COLORS = ['bg-muted/30', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80']
  return LEVEL_COLORS[level] || LEVEL_COLORS[0]
}

/**
 * Augmented grid data with volume-specific color classes
 * Enriches the base gridData from useContributionHeatmap with volume-based colors
 */
const volumeGridData = computed(() => {
  return gridData.value.map((week) =>
    week.map((cell) => {
      const dateStr = toLocalDateString(cell.date)
      const volume = dailyVolumeMap.value?.[dateStr] || 0
      const level = getVolumeIntensityLevel(volume, maxVolume.value)

      return {
        ...cell,
        volume,
        colorClass: getColorClass(level),
      }
    })
  )
})

/**
 * Format tooltip text for a cell
 * @param {Object} cell - Cell data with volume property
 * @returns {string} Tooltip text
 */
function formatTooltipText(cell) {
  const dateFormatted = formatDate(cell.date, locale.value)
  const volume = cell.volume || 0

  if (volume === 0) {
    return `${dateFormatted}\n${t('analytics.volume.heatmap.noWorkout')}`
  }

  return `${dateFormatted}\n${formatWeight(volume, { precision: 0, compact: 'auto' })}`
}

/**
 * Synchronize scroll between month labels and heatmap grid
 * Optimized with requestAnimationFrame to prevent layout thrashing
 */
function syncScroll(event) {
  // Prevent infinite loop (if we just set scrollLeft, don't trigger again)
  if (isScrolling) return

  const source = event.target
  const isMonthLabels = source === monthLabelsScrollRef.value
  const target = isMonthLabels ? heatmapContainerRef.value : monthLabelsScrollRef.value

  if (!target) return

  // Cancel previous frame if user is still scrolling
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }

  // Batch DOM update to next animation frame for 60fps performance
  rafId = requestAnimationFrame(() => {
    isScrolling = true // Set lock before update
    target.scrollLeft = source.scrollLeft

    // Release lock after the next frame to ensure propagation is complete
    requestAnimationFrame(() => {
      isScrolling = false
      rafId = null
    })
  })
}

/**
 * Handle cell hover (desktop)
 */
function handleCellHover(cell, event) {
  activeCell.value = cell
  showTooltip.value = true

  const rect = event.target.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  }
}

/**
 * Handle cell leave
 */
function handleCellLeave() {
  showTooltip.value = false
  activeCell.value = null
}

/**
 * Handle cell click (mobile)
 */
function handleCellClick(cell, event) {
  if (activeCell.value === cell && showTooltip.value) {
    showTooltip.value = false
    activeCell.value = null
  } else {
    handleCellHover(cell, event)
  }
}

/**
 * Setup scroll synchronization on mount
 * Using passive listeners for better scroll performance
 */
onMounted(() => {
  if (monthLabelsScrollRef.value) {
    monthLabelsScrollRef.value.addEventListener('scroll', syncScroll, { passive: true })
  }
  if (heatmapContainerRef.value) {
    heatmapContainerRef.value.addEventListener('scroll', syncScroll, { passive: true })
  }
})

/**
 * Cleanup scroll listeners and pending RAF on unmount
 */
onUnmounted(() => {
  // Cancel any pending animation frame
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }

  if (monthLabelsScrollRef.value) {
    monthLabelsScrollRef.value.removeEventListener('scroll', syncScroll, { passive: true })
  }
  if (heatmapContainerRef.value) {
    heatmapContainerRef.value.removeEventListener('scroll', syncScroll, { passive: true })
  }
})
</script>

<template>
  <Card data-testid="volume-heatmap">
    <CardHeader class="pb-4">
      <CardTitle>{{ t('analytics.volume.heatmap.title') }}</CardTitle>
      <CardDescription>
        {{ t('analytics.volume.heatmap.description') }}
      </CardDescription>
      <!-- 365-Day Cap Indicator -->
      <div
        v-if="isCappedToYear"
        class="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground"
      >
        <Info class="w-3.5 h-3.5" />
        <span>{{ t('analytics.volume.heatmap.cappedToYear') }}</span>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Empty State -->
      <div
        v-if="isEmpty"
        class="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <Calendar class="w-12 h-12 mb-2 opacity-50" />
        <p class="text-sm font-medium">{{ t('analytics.volume.heatmap.noData') }}</p>
        <p class="text-xs mt-1">{{ t('analytics.volume.heatmap.noDataSubtitle') }}</p>
      </div>

      <!-- Heatmap Grid -->
      <div v-else class="contribution-heatmap heatmap-entrance">
        <!-- Month Labels Row -->
        <div class="month-labels-row">
          <div class="day-label-spacer"></div>
          <div ref="monthLabelsScrollRef" class="month-labels-scroll">
            <div class="month-labels" :style="monthLabelsStyle">
              <span
                v-for="(label, index) in monthLabels"
                :key="index"
                :style="{ gridColumnStart: label.weekIndex + 1 }"
                class="month-label"
              >
                {{ label.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Main Grid -->
        <div ref="heatmapContainerRef" class="heatmap-container">
          <!-- Day Labels Column -->
          <div class="day-labels">
            <span
              v-for="(label, index) in dayLabels"
              :key="index"
              class="day-label"
            >
              {{ label }}
            </span>
          </div>

          <!-- Weeks Grid: 2D grid with cells as direct children -->
          <div class="weeks-grid" :style="gridColumnsStyle">
            <template v-for="(week, weekIndex) in volumeGridData" :key="weekIndex">
              <div
                v-for="(cell, dayIndex) in week"
                :key="`${weekIndex}-${dayIndex}`"
                :class="[
                  'day-cell',
                  cell.colorClass,
                  {
                    'is-today': cell.isToday,
                    'is-out-of-period': !cell.isInPeriod,
                  },
                ]"
                :aria-label="formatTooltipText(cell)"
                tabindex="0"
                @mouseenter="handleCellHover(cell, $event)"
                @mouseleave="handleCellLeave"
                @click="handleCellClick(cell, $event)"
                @focus="handleCellHover(cell, $event)"
                @blur="handleCellLeave"
              />
            </template>
          </div>
        </div>

        <!-- Legend -->
        <div class="legend">
          <span class="text-xs text-muted-foreground">
            {{ t('analytics.volume.heatmap.legend.less') }}
          </span>
          <div class="legend-colors">
            <div
              v-for="level in legendLevels"
              :key="level"
              :class="['legend-cell', getColorClass(level)]"
            />
          </div>
          <span class="text-xs text-muted-foreground">
            {{ t('analytics.volume.heatmap.legend.more') }}
          </span>
        </div>

        <!-- Tooltip -->
        <Teleport to="body">
          <div
            v-if="showTooltip && activeCell"
            class="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
            :style="{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }"
          >
            <div class="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-lg min-w-[140px] text-center whitespace-pre-line text-sm">
              {{ formatTooltipText(activeCell) }}
            </div>
          </div>
        </Teleport>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* CSS Variables for responsive cell sizing */
.contribution-heatmap {
  --cell-size: 0.875rem; /* 14px - Desktop default */
  --cell-gap: 0.125rem; /* 2px - Gap between cells */
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0; /* Allow shrinking */
  overflow: hidden; /* Establish scroll container context */
  width: 100%; /* Ensure full width usage */
}

/* Entrance animation - matches EmptyState pattern but faster */
.heatmap-entrance {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Month Labels */
.month-labels-row {
  display: flex;
  gap: 0.5rem;
}

.day-label-spacer {
  width: 2rem;
  flex-shrink: 0;
}

.month-labels-scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.month-labels-scroll::-webkit-scrollbar {
  display: none;
}

.month-labels {
  display: grid;
  gap: var(--cell-gap);
  /* Width is set by gridTemplateColumns inline style */
  min-width: fit-content;
}

.month-label {
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  text-align: left;
  padding-left: 0.25rem;
}

/* Main Grid Container */
.heatmap-container {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  width: 100%; /* Ensure container can expand */
}

/* Day Labels */
.day-labels {
  display: flex;
  flex-direction: column;
  gap: var(--cell-gap);
  width: 2rem;
  flex-shrink: 0;
  padding-top: var(--cell-gap);
}

.day-label {
  height: var(--cell-size);
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  display: flex;
  align-items: center;
}

/* Weeks Grid - 2D CSS Grid layout */
/* Cells are placed column-by-column (week by week) filling 7 rows */
.weeks-grid {
  display: grid;
  /* gridTemplateColumns and gridTemplateRows set via inline style */
  grid-auto-flow: column; /* Fill columns first (top to bottom, then next column) */
  gap: var(--cell-gap);
  flex: 1;
}

/* Day Cells - Using aspect-ratio to maintain square shape on all screen sizes */
.day-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  aspect-ratio: 1 / 1; /* Ensure cells stay square */
  border-radius: 0.125rem;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  /* Subtle stagger: Fast cascade effect (20ms per cell max) */
  animation: cellFadeIn 0.3s ease-out backwards;
}

/* Very fast stagger based on grid position (column-major order) */
/* This creates a subtle cascade from top-left to bottom-right */
.day-cell:nth-child(1) { animation-delay: 0ms; }
.day-cell:nth-child(2) { animation-delay: 2ms; }
.day-cell:nth-child(3) { animation-delay: 4ms; }
.day-cell:nth-child(4) { animation-delay: 6ms; }
.day-cell:nth-child(5) { animation-delay: 8ms; }
.day-cell:nth-child(6) { animation-delay: 10ms; }
.day-cell:nth-child(7) { animation-delay: 12ms; }
.day-cell:nth-child(n+8) { animation-delay: 14ms; } /* Cap at 14ms for rest */

@keyframes cellFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.day-cell:hover,
.day-cell:focus {
  transform: scale(1.2);
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.3),
              0 4px 8px -2px hsl(var(--primary) / 0.2);
  z-index: 10;
  border-color: hsl(var(--primary) / 0.4);
}

.day-cell.is-today {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary)),
              0 0 12px -2px hsl(var(--primary) / 0.5);
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Subtle pulse animation for "today" cell */
@keyframes pulse-ring {
  0%, 100% {
    box-shadow: 0 0 0 1px hsl(var(--primary)),
                0 0 12px -2px hsl(var(--primary) / 0.5);
  }
  50% {
    box-shadow: 0 0 0 1px hsl(var(--primary)),
                0 0 16px -2px hsl(var(--primary) / 0.7);
  }
}

/* Phase 2: Out-of-period cells shown with low opacity */
.day-cell.is-out-of-period {
  opacity: 0.15;
  cursor: default;
}

.day-cell.is-out-of-period:hover,
.day-cell.is-out-of-period:focus {
  transform: none;
  box-shadow: none;
  border-color: transparent;
}

/* Legend */
.legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid hsl(var(--border));
  margin-top: 0.5rem;
  /* Subtle delayed entrance */
  animation: fadeIn 0.3s ease-out 0.15s backwards;
}

.legend-colors {
  display: flex;
  gap: 0.125rem;
}

.legend-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  aspect-ratio: 1 / 1; /* Ensure legend cells stay square */
  border-radius: 0.125rem;
  border: 1px solid hsl(var(--border) / 0.3);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.legend-cell:hover {
  transform: scale(1.15);
  border-color: hsl(var(--border));
  box-shadow: 0 2px 4px -1px hsl(var(--primary) / 0.15);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  /* Update CSS variable for smaller cell size on mobile */
  .contribution-heatmap {
    --cell-size: 0.625rem; /* 10px - Mobile size */
  }

  /* Enable touch scrolling and sticky day labels */
  .heatmap-container {
    -webkit-overflow-scrolling: touch;
  }

  .month-labels-scroll {
    -webkit-overflow-scrolling: touch;
  }

  .day-labels {
    position: sticky;
    left: 0;
    z-index: 10;
    background: hsl(var(--background));
    width: 1.5rem;
  }

  .day-label-spacer {
    width: 1.5rem;
  }

  .month-label {
    font-size: 0.625rem;
  }

  .day-label {
    font-size: 0.625rem;
  }

  .day-cell:hover,
  .day-cell:focus {
    transform: scale(1.3); /* Larger touch target feedback */
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  /* Disable entrance animations */
  .heatmap-entrance,
  .day-cell,
  .legend {
    animation: none !important;
  }

  /* Disable transitions but keep basic interactivity */
  .day-cell,
  .legend-cell {
    transition: opacity 100ms ease;
  }

  .day-cell.is-today {
    animation: none;
  }

  /* Keep only essential hover feedback */
  .day-cell:hover,
  .day-cell:focus {
    transform: none;
    opacity: 0.8;
  }
}
</style>
