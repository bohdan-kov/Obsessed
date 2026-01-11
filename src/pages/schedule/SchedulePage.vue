<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useSchedule } from '@/composables/useSchedule'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/components/ui/toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-vue-next'
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

const { t, locale } = useI18n()
const router = useRouter()
const scheduleStore = useScheduleStore()
const { currentWeekId } = useSchedule()
const { toast } = useToast()

const activeTab = ref('calendar')

// Template form sheet state
const templateFormOpen = ref(false)
const editingTemplateId = ref(null)

// Template picker sheet state
const templatePickerOpen = ref(false)
const selectedDayName = ref(null)

// Preset picker sheet state
const presetPickerOpen = ref(false)

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
    console.error('Failed to assign template:', error)
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
    router.push('/workout-active')
  } catch (error) {
    console.error('Failed to start workout:', error)
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
  try {
    await scheduleStore.applyPreset(presetId, currentWeekId.value, locale.value)
    toast({
      title: t('schedule.presets.applySuccess', { presetName: presetId }),
      variant: 'default'
    })
  } catch (error) {
    console.error('Failed to apply preset:', error)
    toast({
      title: t('schedule.presets.applyError'),
      variant: 'destructive'
    })
  }
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-7xl">
    <h1 class="text-3xl font-bold mb-6">{{ t('schedule.title') }}</h1>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="calendar">{{ t('schedule.tabs.calendar') }}</TabsTrigger>
        <TabsTrigger value="templates">{{ t('schedule.tabs.templates') }}</TabsTrigger>
        <TabsTrigger value="stats">{{ t('schedule.tabs.stats') }}</TabsTrigger>
      </TabsList>

      <TabsContent value="calendar" class="mt-6 space-y-6">
        <!-- Preset Picker Button -->
        <Button variant="outline" class="w-full" @click="handleOpenPresetPicker">
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
      @close="presetPickerOpen = false"
      @select="handleApplyPreset"
    />
  </div>
</template>
