<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSchedule } from '@/composables/useSchedule'
import { usePageMeta } from '@/composables/usePageMeta'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, X, Plus } from 'lucide-vue-next'
import WeeklyCalendar from './components/calendar/WeeklyCalendar.vue'
import TodayWorkoutCard from './components/calendar/TodayWorkoutCard.vue'
import WeekNavigator from './components/calendar/WeekNavigator.vue'
import TemplateList from './components/templates/TemplateList.vue'
import TemplateFormSheet from './components/templates/TemplateFormSheet.vue'
import TemplatePickerSheet from './components/templates/TemplatePickerSheet.vue'
import AdherenceStatsCard from './components/adherence/AdherenceStatsCard.vue'
import AdherenceChart from './components/adherence/AdherenceChart.vue'
import AchievementBadges from './components/adherence/AchievementBadges.vue'
import PresetPickerSheet from './components/presets/PresetPickerSheet.vue'
import { getPresetById, getPresetName } from '@/constants/splitPresets'

const { t, locale } = useI18n()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('schedule.title')),
  computed(() => t('schedule.subtitle'))
)

const router = useRouter()
const scheduleStore = useScheduleStore()
const { currentSchedule } = storeToRefs(scheduleStore)
const { currentWeekId } = useSchedule()
const { toast } = useToast()

const activeTab = ref('calendar')

// Active preset computed
const activePreset = computed(() => {
  if (!currentSchedule.value?.activePresetId) return null
  return getPresetById(currentSchedule.value.activePresetId)
})

const activePresetName = computed(() => {
  if (!activePreset.value) return ''
  return getPresetName(activePreset.value, locale.value)
})

// Template form sheet state
const templateFormOpen = ref(false)
const editingTemplateId = ref(null)

// Template picker sheet state
const templatePickerOpen = ref(false)
const selectedDayName = ref(null)

// Preset picker sheet state
const presetPickerOpen = ref(false)
const applyingPreset = ref(false)

onMounted(async () => {
  await scheduleStore.fetchTemplates()
  await scheduleStore.fetchScheduleForWeek(currentWeekId.value)
})

// Template form handlers
function handleCreateTemplate() {
  editingTemplateId.value = null
  templateFormOpen.value = true
}

function handleEditTemplate(templateId) {
  editingTemplateId.value = templateId
  templateFormOpen.value = true
}

function handleTemplateSaved() {
  toast({
    title: t('schedule.success.templateCreated'),
    variant: 'default'
  })
}

// Template picker handlers
function handleChangeTemplate(dayName) {
  selectedDayName.value = dayName
  templatePickerOpen.value = true
}

async function handleTemplateSelected(templateId) {
  if (!selectedDayName.value) return

  try {
    if (templateId === null) {
      // Clear day (make it rest day)
      await scheduleStore.removeTemplateFromDay(currentWeekId.value, selectedDayName.value)
      toast({
        title: t('schedule.success.dayCleared'),
        variant: 'default'
      })
    } else {
      // Assign template
      await scheduleStore.assignTemplateToDay(currentWeekId.value, selectedDayName.value, templateId)
      toast({
        title: t('schedule.success.templateAssigned'),
        variant: 'default'
      })
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to assign template:', error)
    }
    toast({
      title: t('schedule.errors.failedToAssignTemplate'),
      variant: 'destructive'
    })
  }
}

// Quick start handler
async function handleQuickStart(templateId) {
  try {
    await scheduleStore.startWorkoutFromTemplate(templateId)
    toast({
      title: t('schedule.quickStart.started'),
      variant: 'default'
    })
    router.push('/workouts')
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to start workout:', error)
    }
    toast({
      title: t('schedule.errors.failedToStartWorkout'),
      variant: 'destructive'
    })
  }
}

// Preset handlers
function handleOpenPresetPicker() {
  presetPickerOpen.value = true
}

async function handleApplyPreset(presetId) {
  applyingPreset.value = true
  try {
    // Get preset info for display
    const preset = getPresetById(presetId)
    const presetName = preset ? getPresetName(preset, locale.value) : presetId

    await scheduleStore.applyPreset(presetId, currentWeekId.value, locale.value)

    // Close the preset picker modal
    presetPickerOpen.value = false

    // Show success message
    toast({
      title: t('schedule.presets.applySuccess', { presetName }),
      variant: 'default'
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to apply preset:', error)
    }
    toast({
      title: t('schedule.presets.applyError'),
      variant: 'destructive'
    })
  } finally {
    applyingPreset.value = false
  }
}

async function handleClearProgram() {
  try {
    // Clear activePresetId from current week
    await scheduleStore.clearActivePreset(currentWeekId.value)

    toast({
      title: t('schedule.success.programCleared'),
      variant: 'default'
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to clear program:', error)
    }
    toast({
      title: t('schedule.errors.failedToClearProgram'),
      variant: 'destructive'
    })
  }
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl space-y-6">
    <!-- Page Header - Title hidden on mobile, shown on desktop -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div class="hidden md:block">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('schedule.title') }}</h1>
        <p class="text-muted-foreground mt-1">{{ t('schedule.subtitle') }}</p>
      </div>
      <!-- Create Template Button - shown only on templates tab -->
      <div v-if="activeTab === 'templates'">
        <Button @click="handleCreateTemplate" size="lg" class="min-h-11">
          <Plus class="mr-2 h-5 w-5" />
          {{ t('schedule.templates.create') }}
        </Button>
      </div>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="calendar">{{ t('schedule.tabs.calendar') }}</TabsTrigger>
        <TabsTrigger value="templates">{{ t('schedule.tabs.templates') }}</TabsTrigger>
        <TabsTrigger value="stats">{{ t('schedule.tabs.stats') }}</TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" class="mt-6 space-y-6">
        <!-- Preset Picker Button / Active Program Display -->
        <div v-if="activePreset" class="w-full border rounded-md p-3 bg-primary/5 border-primary/30">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <Trophy class="w-5 h-5 text-primary flex-shrink-0" />
              <div class="flex flex-col gap-1 flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium">{{ t('schedule.activeProgram.following') }}</span>
                  <Badge variant="default" class="font-semibold">
                    {{ activePresetName }}
                  </Badge>
                </div>
                <p class="text-xs text-muted-foreground">
                  {{ t('schedule.activeProgram.description', { frequency: activePreset.frequency }) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" @click="handleOpenPresetPicker">
                {{ t('schedule.activeProgram.change') }}
              </Button>
              <Button variant="ghost" size="icon" @click="handleClearProgram" :aria-label="t('schedule.activeProgram.clear')">
                <X class="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button v-else variant="outline" class="w-full" @click="handleOpenPresetPicker">
          <Trophy class="w-4 h-4 mr-2" />
          {{ t('schedule.presets.selectPreset') }}
        </Button>

        <TodayWorkoutCard @quick-start="handleQuickStart" />
        <WeekNavigator />
        <WeeklyCalendar
          @change-template="handleChangeTemplate"
          @quick-start="handleQuickStart"
        />
      </TabsContent>

      <TabsContent value="templates" class="mt-6">
        <TemplateList
          @create-template="handleCreateTemplate"
          @edit-template="handleEditTemplate"
          @quick-start="handleQuickStart"
        />
      </TabsContent>

      <TabsContent value="stats" class="mt-6 space-y-6">
        <!-- Adherence Stats -->
        <AdherenceStatsCard />

        <!-- Achievements -->
        <AchievementBadges />

        <!-- 12-Week Chart -->
        <AdherenceChart />
      </TabsContent>
    </Tabs>

    <!-- Template Form Sheet (Create/Edit) -->
    <TemplateFormSheet
      :open="templateFormOpen"
      :template-id="editingTemplateId"
      @close="templateFormOpen = false"
      @save="handleTemplateSaved"
    />

    <!-- Template Picker Sheet (Assign to Day) -->
    <TemplatePickerSheet
      :open="templatePickerOpen"
      :day-name="selectedDayName"
      @close="templatePickerOpen = false"
      @select="handleTemplateSelected"
    />

    <!-- Preset Picker Sheet (Apply Pre-built Program) -->
    <PresetPickerSheet
      :open="presetPickerOpen"
      :loading="applyingPreset"
      :active-preset-id="currentSchedule?.activePresetId"
      @close="presetPickerOpen = false"
      @select="handleApplyPreset"
    />
  </div>
</template>
