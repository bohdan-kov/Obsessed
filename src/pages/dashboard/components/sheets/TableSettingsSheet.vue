<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="bottom" class="h-[85vh]">
      <SheetHeader>
        <SheetTitle>
          {{ t('workout.tableSettings.titleWithTab', {
            tab: t(`workout.tableSettings.tabs.${activeTab}`)
          }) }}
        </SheetTitle>
        <SheetDescription>
          {{ t('workout.tableSettings.descriptionWithScope', {
            tab: t(`workout.tableSettings.tabs.${activeTab}`)
          }) }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6 space-y-4">
        <!-- Column toggles -->
        <div
          v-for="column in configurableColumns"
          :key="column.key"
          class="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-h-[60px]"
        >
          <Label
            :for="column.key"
            class="text-base font-medium cursor-pointer flex-1"
          >
            {{ t(column.label) }}
          </Label>
          <Switch
            :id="column.key"
            :model-value="columnVisibility[column.key]"
            @update:model-value="(value) => toggleColumn(column.key, value)"
            class="shrink-0"
          />
        </div>

        <!-- Info text -->
        <p class="text-xs text-muted-foreground mt-6 px-1">
          {{ t('workout.tableSettings.info') }}
        </p>
      </div>

      <!-- Footer with Reset button -->
      <SheetFooter class="mt-6 gap-2">
        <Button
          variant="outline"
          class="h-12 flex-1 text-base"
          @click="handleReset"
          :disabled="resetLoading"
        >
          {{ t('workout.tableSettings.resetDefaults') }}
        </Button>
        <Button
          class="h-12 flex-1 text-base"
          @click="$emit('update:open', false)"
        >
          {{ t('workout.tableSettings.close') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/userStore'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  activeTab: {
    type: String,
    default: 'overview',
    validator: (value) => ['overview', 'history', 'exercises', 'plans'].includes(value),
  },
})

defineEmits(['update:open'])

const { t } = useI18n()
const { toast } = useToast()
const userStore = useUserStore()
const { tableSettings } = storeToRefs(userStore)

/**
 * Configurable columns based on active tab
 * Each tab has different columns that can be toggled
 */
const configurableColumns = computed(() => {
  switch (props.activeTab) {
    case 'overview':
      return [
        { key: 'type', label: 'workout.tableSettings.columns.type' },
        { key: 'status', label: 'workout.tableSettings.columns.status' },
        { key: 'sets', label: 'workout.tableSettings.columns.sets' },
        { key: 'reps', label: 'workout.tableSettings.columns.reps' },
        { key: 'weight', label: 'workout.tableSettings.columns.weight' },
      ]
    case 'history':
      return [
        { key: 'exercises', label: 'workout.tableSettings.columns.exercises' },
        { key: 'duration', label: 'workout.tableSettings.columns.duration' },
        { key: 'volume', label: 'workout.tableSettings.columns.volume' },
        { key: 'status', label: 'workout.tableSettings.columns.status' },
      ]
    case 'exercises':
      return [
        { key: 'lastPerformed', label: 'workout.tableSettings.columns.lastPerformed' },
        { key: 'totalSets', label: 'workout.tableSettings.columns.totalSets' },
        { key: 'totalVolume', label: 'workout.tableSettings.columns.totalVolume' },
        { key: 'timesPerformed', label: 'workout.tableSettings.columns.timesPerformed' },
      ]
    case 'plans':
      // Plans tab uses cards, not a table - return empty array
      return []
    default:
      return []
  }
})

// Local state for column visibility (synced with store)
// Initialize with empty object, will be populated by syncWithStore()
const columnVisibility = ref({})

/**
 * Sync columnVisibility with current store state for the active tab
 * Called when sheet opens to load current user settings
 *
 * CRITICAL: This function reads from store and copies values AS-IS (no inversion)
 * - If store has `type: false`, we set local `type: false`
 * - The Switch component then shows as OFF (checked=false)
 * - This ensures UI matches stored state exactly
 */
function syncWithStore() {
  // Get settings for the current tab
  const currentTabSettings = tableSettings.value?.[props.activeTab]?.columns

  if (currentTabSettings) {
    // Deep copy current store values for this tab
    // Use ?? (not ||) to properly handle false values
    const newVisibility = {}
    configurableColumns.value.forEach(column => {
      newVisibility[column.key] = currentTabSettings[column.key] ?? true
    })
    columnVisibility.value = newVisibility
  } else {
    // Fallback to all visible if store not initialized
    const defaultVisibility = {}
    configurableColumns.value.forEach(column => {
      defaultVisibility[column.key] = true
    })
    columnVisibility.value = defaultVisibility
  }
}

// Watch for sheet opening - sync local state with store when user opens the sheet
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Use nextTick to ensure DOM and store are ready
      nextTick(() => {
        syncWithStore()
      })
    }
  },
  { immediate: false } // Don't run on mount, only when modal opens
)

// ALSO watch tableSettings changes to keep in sync
watch(
  () => tableSettings.value?.columns,
  (newColumns) => {
    // Only sync if modal is currently open
    if (props.open && newColumns) {
      syncWithStore()
    }
  },
  { deep: true }
)

// Loading state for reset button
const resetLoading = ref(false)

/**
 * Toggle column visibility
 * @param {string} columnKey - Column key (e.g., 'type', 'status')
 * @param {boolean} value - New visibility value from Switch component
 *
 * DATA FLOW:
 * 1. User clicks Switch → Switch emits @update:checked with boolean
 * 2. This function receives the EXACT boolean from Switch (true = visible, false = hidden)
 * 3. Optimistically update local state immediately (for instant UI feedback)
 * 4. Save ENTIRE columnVisibility object to store with tab parameter
 * 5. Store wraps it and saves to Firestore + localStorage for this specific tab
 * 6. On error, revert the optimistic update
 *
 * CRITICAL: NO BOOLEAN INVERSION - we pass the value AS-IS
 * - Switch ON (checked=true) → value=true → column VISIBLE
 * - Switch OFF (checked=false) → value=false → column HIDDEN
 */
async function toggleColumn(columnKey, value) {
  const previousValue = columnVisibility.value[columnKey]

  // Validation: Prevent hiding all columns
  const visibleCount = Object.values(columnVisibility.value).filter(v => v === true).length
  if (value === false && visibleCount === 1) {
    toast({
      title: t('errors.titles.error'),
      description: t('workout.tableSettings.validation.atLeastOneColumn'),
      variant: 'destructive'
    })
    return
  }

  try {
    // Optimistic update: immediately reflect in UI
    columnVisibility.value[columnKey] = value

    // Save ALL columns to store with tab parameter
    // Spread to create new object (triggers reactivity)
    await userStore.updateTableSettings(props.activeTab, { ...columnVisibility.value })
  } catch {
    // Revert optimistic update on error
    columnVisibility.value[columnKey] = previousValue

    toast({
      title: t('errors.titles.error'),
      description: t('workout.tableSettings.updateError'),
      variant: 'destructive'
    })
  }
}

/**
 * Reset all columns to default (all visible) for the current tab
 */
async function handleReset() {
  try {
    resetLoading.value = true

    // Reset to all true for all columns in current tab
    const defaults = {}
    configurableColumns.value.forEach(column => {
      defaults[column.key] = true
    })

    columnVisibility.value = { ...defaults }
    await userStore.updateTableSettings(props.activeTab, defaults)

    toast({
      description: t('workout.tableSettings.settingsReset')
    })
  } catch {
    toast({
      title: t('errors.titles.error'),
      description: t('workout.tableSettings.resetError'),
      variant: 'destructive'
    })
  } finally {
    resetLoading.value = false
  }
}
</script>
