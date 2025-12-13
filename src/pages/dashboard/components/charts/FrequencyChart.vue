<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContributionHeatmap } from '@/composables/useContributionHeatmap'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Calendar, Info } from 'lucide-vue-next'
import QuickStatsStrip from './QuickStatsStrip.vue'

const { t } = useI18n()
const {
  gridData,
  monthLabels,
  dayLabels,
  legendLevels,
  isEmpty,
  totalWeeks,
  isCappedToYear,
  getColorClass,
  formatTooltipText,
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
  <Card>
    <CardHeader>
      <CardTitle>{{ t('dashboard.charts.heatmap.title') }}</CardTitle>
      <CardDescription>
        {{ t('dashboard.charts.heatmap.description') }}
      </CardDescription>
      <!-- 365-Day Cap Indicator -->
      <div
        v-if="isCappedToYear"
        class="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground"
      >
        <Info class="w-3.5 h-3.5" />
        <span>{{ t('dashboard.charts.heatmap.cappedToYear') }}</span>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Empty State -->
      <div
        v-if="isEmpty"
        class="flex flex-col items-center justify-center py-12 text-muted-foreground"
      >
        <Calendar class="w-12 h-12 mb-2 opacity-50" />
        <p class="text-sm font-medium">{{ t('dashboard.charts.heatmap.noData') }}</p>
        <p class="text-xs mt-1">{{ t('dashboard.charts.heatmap.noDataSubtitle') }}</p>
      </div>

      <!-- Heatmap Grid -->
      <div v-else class="heatmap-with-stats">
        <!-- Left side: Heatmap grid and legend -->
        <div class="contribution-heatmap">
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
              <span v-for="(label, index) in dayLabels" :key="index" class="day-label">
                {{ label }}
              </span>
            </div>

            <!-- Weeks Grid: 2D grid with cells as direct children -->
            <div class="weeks-grid" :style="gridColumnsStyle">
              <template v-for="(week, weekIndex) in gridData" :key="weekIndex">
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
              {{ t('dashboard.charts.heatmap.legend.less') }}
            </span>
            <div class="legend-colors">
              <div
                v-for="level in legendLevels"
                :key="level"
                :class="['legend-cell', getColorClass(level)]"
              />
            </div>
            <span class="text-xs text-muted-foreground">
              {{ t('dashboard.charts.heatmap.legend.more') }}
            </span>
          </div>
        </div>

        <!-- Right side: Stats sidebar (desktop) / Below heatmap (mobile) -->
        <QuickStatsStrip class="stats-sidebar" />

        <!-- Tooltip -->
        <Teleport to="body">
          <div
            v-if="showTooltip && activeCell"
            class="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full"
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
}

/* Wrapper: Flexbox container for heatmap + stats sidebar */
.heatmap-with-stats {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.contribution-heatmap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0; /* Allow shrinking */
  overflow: hidden; /* Establish scroll container context */
  width: 100%; /* Ensure full width usage */
}

.stats-sidebar {
  flex-shrink: 0;
  width: 160px;
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
  transition: all 150ms ease;
  border: 1px solid transparent;
}

.day-cell:hover,
.day-cell:focus {
  transform: scale(1.15);
  outline: none;
  ring: 2px;
  ring-color: hsl(var(--primary) / 0.5);
}

.day-cell.is-today {
  border-color: hsl(var(--primary));
  ring: 1px;
  ring-color: hsl(var(--primary));
}

/* Phase 2: Out-of-period cells shown with low opacity */
.day-cell.is-out-of-period {
  opacity: 0.15;
  cursor: default;
}

.day-cell.is-out-of-period:hover,
.day-cell.is-out-of-period:focus {
  transform: none;
  ring: none;
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
}


/* Responsive Breakpoint: Stack stats below heatmap on smaller screens */
@media (max-width: 1024px) {
  .heatmap-with-stats {
    flex-direction: column;
  }

  .stats-sidebar {
    width: 100%;
  }

  /* Ensure heatmap takes full width on tablet */
  .contribution-heatmap {
    width: 100%;
    max-width: 100%;
  }
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
}
</style>
