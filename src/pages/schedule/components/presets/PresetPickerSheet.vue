<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScheduleStore } from '@/stores/scheduleStore'
import { SPLIT_PRESETS, getPresetName, getPresetDescription, getPresetById } from '@/constants/splitPresets'
import { getSmartDayPattern, getDayNameFromIndex } from '@/utils/scheduleUtils'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PresetCard from './PresetCard.vue'
import WeekDaySelector from './WeekDaySelector.vue'
import { Zap, Dumbbell, Trophy, Calendar, Settings2, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  activePresetId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['close', 'select'])

const { t, locale } = useI18n()
const scheduleStore = useScheduleStore()
const activeTab = ref('beginner')
const selectedPresetId = ref(null)
const scheduleMode = ref('auto') // 'auto' or 'custom'
const customDays = ref([])

const beginnerPresets = computed(() => SPLIT_PRESETS.beginner)
const intermediatePresets = computed(() => SPLIT_PRESETS.intermediate)
const advancedPresets = computed(() => SPLIT_PRESETS.advanced)

const selectedPreset = computed(() => {
  return selectedPresetId.value ? getPresetById(selectedPresetId.value) : null
})

const autoDays = computed(() => {
  if (!selectedPreset.value) return []
  return getSmartDayPattern(selectedPreset.value.frequency)
})

const selectedDays = computed(() => {
  return scheduleMode.value === 'auto' ? autoDays.value : customDays.value
})

const dayNames = computed(() => {
  return selectedDays.value.map(dayIndex => {
    const dayName = getDayNameFromIndex(dayIndex)
    return t(`schedule.daysShort.${dayName}`)
  })
})

const canApply = computed(() => {
  if (!selectedPresetId.value) return false
  if (scheduleMode.value === 'custom') {
    return customDays.value.length === selectedPreset.value.frequency
  }
  return true
})

function handleSelectPreset(presetId) {
  selectedPresetId.value = presetId
  scheduleMode.value = 'auto'
  customDays.value = []
}

function handleApply() {
  if (!canApply.value) return

  const finalDays = scheduleMode.value === 'auto' ? null : customDays.value
  emit('select', { presetId: selectedPresetId.value, customDays: finalDays })
}

function handleClose() {
  emit('close') // State reset is handled by the watch on props.open
}

// Auto-select active program when sheet opens
watch(() => props.open, (isOpen) => {
  if (isOpen && props.activePresetId) {
    // Auto-select the active program
    selectedPresetId.value = props.activePresetId

    // Restore custom days from activeProgram if they exist
    const activeProgram = scheduleStore.activeProgram
    if (activeProgram && activeProgram.customDays && activeProgram.customDays.length > 0) {
      // User had custom days - restore them
      scheduleMode.value = 'custom'
      customDays.value = [...activeProgram.customDays]
    } else {
      // Auto mode (no custom days)
      scheduleMode.value = 'auto'
      customDays.value = []
    }

    // Switch to the correct difficulty tab
    const activePreset = getPresetById(props.activePresetId)
    if (activePreset) {
      activeTab.value = activePreset.difficulty
    }
  } else if (!isOpen) {
    // Reset when closing
    selectedPresetId.value = null
    scheduleMode.value = 'auto'
    customDays.value = []
    activeTab.value = 'beginner'
  }
})
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && handleClose()">
    <SheetContent side="right" class="w-full sm:max-w-3xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle class="text-2xl">
          {{ t('schedule.presets.title') }}
        </SheetTitle>
        <SheetDescription>
          {{ selectedPresetId ? t('schedule.presets.configureDays') : t('schedule.presets.subtitle') }}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <!-- Difficulty Tabs -->
      <div class="px-6 pt-4 flex-1 overflow-hidden flex flex-col">
        <Tabs v-model="activeTab" class="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="beginner" class="flex items-center gap-1.5">
              <Zap class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.beginner') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.beginner').slice(0, 3) }}</span>
            </TabsTrigger>
            <TabsTrigger value="intermediate" class="flex items-center gap-1.5">
              <Dumbbell class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.intermediate') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.intermediate').slice(0, 3) }}</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" class="flex items-center gap-1.5">
              <Trophy class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.advanced') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.advanced').slice(0, 3) }}</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea :class="selectedPresetId ? 'h-[calc(100vh-500px)]' : 'h-[calc(100vh-240px)]'" class="mt-4 flex-1">
            <!-- Beginner Tab -->
            <TabsContent value="beginner" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in beginnerPresets"
                :key="preset.id"
                :preset="preset"
                :loading="false"
                :active-preset-id="activePresetId"
                :selected="selectedPresetId === preset.id"
                @select="handleSelectPreset"
              />
            </TabsContent>

            <!-- Intermediate Tab -->
            <TabsContent value="intermediate" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in intermediatePresets"
                :key="preset.id"
                :preset="preset"
                :loading="false"
                :active-preset-id="activePresetId"
                :selected="selectedPresetId === preset.id"
                @select="handleSelectPreset"
              />
            </TabsContent>

            <!-- Advanced Tab -->
            <TabsContent value="advanced" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in advancedPresets"
                :key="preset.id"
                :preset="preset"
                :loading="false"
                :active-preset-id="activePresetId"
                :selected="selectedPresetId === preset.id"
                @select="handleSelectPreset"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      <!-- Day Configuration Section (appears when preset is selected) -->
      <div v-if="selectedPresetId" class="border-t bg-muted/30">
        <div class="px-6 py-4 space-y-4">
          <!-- Section Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Settings2 class="w-4 h-4 text-muted-foreground" />
              <h3 class="font-semibold text-sm">{{ t('schedule.presets.selectDays') }}</h3>
            </div>
            <Badge variant="outline" class="text-xs">
              {{ selectedPreset.frequency }} {{ t('schedule.presets.daysPerWeek') }}
            </Badge>
          </div>

          <!-- Mode Toggle -->
          <div class="flex gap-2">
            <Button
              :variant="scheduleMode === 'auto' ? 'default' : 'outline'"
              size="sm"
              class="flex-1"
              @click="scheduleMode = 'auto'"
            >
              <Sparkles class="w-3.5 h-3.5 mr-1.5" />
              {{ t('schedule.presets.autoSchedule') }}
            </Button>
            <Button
              :variant="scheduleMode === 'custom' ? 'default' : 'outline'"
              size="sm"
              class="flex-1"
              @click="scheduleMode = 'custom'"
            >
              <Calendar class="w-3.5 h-3.5 mr-1.5" />
              {{ t('schedule.presets.customSchedule') }}
            </Button>
          </div>

          <!-- Auto Mode Preview -->
          <div v-if="scheduleMode === 'auto'" class="rounded-lg border bg-card p-3">
            <p class="text-xs text-muted-foreground mb-2">{{ t('schedule.presets.autoDescription') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <Badge v-for="dayName in dayNames" :key="dayName" variant="secondary" class="text-xs">
                {{ dayName }}
              </Badge>
            </div>
          </div>

          <!-- Custom Mode Selector -->
          <div v-else>
            <WeekDaySelector
              v-model="customDays"
              :required-days="selectedPreset.frequency"
            />
          </div>

          <!-- Apply Button -->
          <Button
            class="w-full"
            :disabled="!canApply || loading"
            @click="handleApply"
          >
            <span v-if="loading">{{ t('schedule.presets.applying') }}</span>
            <span v-else>{{ t('schedule.presets.apply') }}</span>
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
