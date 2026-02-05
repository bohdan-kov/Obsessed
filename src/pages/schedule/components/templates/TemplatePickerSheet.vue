<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useWorkoutTemplates } from '@/composables/useWorkoutTemplates'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { Search, Dumbbell, Clock, X } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  dayName: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'select'])

const { t, locale } = useI18n()
const scheduleStore = useScheduleStore()
const { templates } = storeToRefs(scheduleStore)

const searchQuery = ref('')
const selectedTemplateId = ref(null)

// Filter templates by search query
const filteredTemplates = computed(() => {
  if (!searchQuery.value) return templates.value

  const query = searchQuery.value.toLowerCase()
  return templates.value.filter(template =>
    template.name.toLowerCase().includes(query) ||
    template.muscleGroups.some(muscle => muscle.toLowerCase().includes(query))
  )
})

// Group templates by usage (recent first)
const recentTemplates = computed(() => {
  return filteredTemplates.value
    .filter(t => t.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
    .slice(0, 3)
})

const otherTemplates = computed(() => {
  const recentIds = new Set(recentTemplates.value.map(t => t.id))
  return filteredTemplates.value.filter(t => !recentIds.has(t.id))
})

const dayLabel = computed(() => {
  if (!props.dayName) return ''
  return t(`schedule.days.${props.dayName}`)
})

function selectTemplate(template) {
  selectedTemplateId.value = template.id
}

function confirmSelection() {
  if (selectedTemplateId.value) {
    emit('select', selectedTemplateId.value)
    clearAndClose()
  }
}

function clearDay() {
  emit('select', null)
  clearAndClose()
}

function clearAndClose() {
  searchQuery.value = ''
  selectedTemplateId.value = null
  emit('close')
}

function formatLastUsed(date) {
  if (!date) return t('schedule.templates.neverUsed')

  const lastUsed = new Date(date)
  const now = new Date()
  const diffMs = now - lastUsed
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('schedule.todaysWorkout.title')
  if (diffDays === 1) return t('schedule.calendar.yesterday')
  if (diffDays < 7) return t('schedule.daysAgo', { count: diffDays })

  return lastUsed.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
}
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && clearAndClose()">
    <SheetContent side="right" class="w-full sm:max-w-lg flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle class="text-2xl">
          {{ t('schedule.assign.title') }}
        </SheetTitle>
        <SheetDescription v-if="dayName">
          {{ t('schedule.assign.selectTemplate', { day: dayLabel }) }}
        </SheetDescription>
      </SheetHeader>

      <div class="px-6 pb-4">
        <!-- Search Input -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="t('schedule.templates.search')"
            class="pl-10"
          />
        </div>
      </div>

      <Separator />

      <!-- Template List -->
      <ScrollArea class="flex-1 px-6">
        <div class="space-y-6 py-4">
          <!-- Recent Templates -->
          <div v-if="recentTemplates.length > 0 && !searchQuery">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">
              {{ t('schedule.templates.recentTemplates') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="template in recentTemplates"
                :key="template.id"
                :class="[
                  'p-4 border rounded-lg cursor-pointer transition-all',
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'hover:border-primary/50 hover:bg-accent'
                ]"
                @click="selectTemplate(template)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">{{ template.name }}</h4>
                    <p class="text-xs text-muted-foreground">
                      {{ formatLastUsed(template.lastUsedAt) }}
                    </p>
                  </div>
                  <Badge v-if="template.usageCount > 0" variant="secondary" class="ml-2">
                    {{ template.usageCount }}x
                  </Badge>
                </div>
                <MuscleGroupBadges :muscle-groups="template.muscleGroups" :max="3" />
                <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Dumbbell class="w-3 h-3" />
                  <span>{{ template.exercises.length }} {{ t('schedule.todaysWorkout.exercises', { count: template.exercises.length }) }}</span>
                  <Clock class="w-3 h-3 ml-2" />
                  <span>~{{ template.estimatedDuration }} {{ t('common.min') }}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator v-if="recentTemplates.length > 0 && otherTemplates.length > 0 && !searchQuery" />

          <!-- All Templates -->
          <div v-if="otherTemplates.length > 0">
            <h3 v-if="!searchQuery" class="text-sm font-semibold text-muted-foreground mb-3">
              {{ t('schedule.templates.allTemplates') }}
            </h3>
            <div class="space-y-2">
              <div
                v-for="template in otherTemplates"
                :key="template.id"
                :class="[
                  'p-4 border rounded-lg cursor-pointer transition-all',
                  selectedTemplateId === template.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'hover:border-primary/50 hover:bg-accent'
                ]"
                @click="selectTemplate(template)"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">{{ template.name }}</h4>
                    <p v-if="template.lastUsedAt" class="text-xs text-muted-foreground">
                      {{ formatLastUsed(template.lastUsedAt) }}
                    </p>
                  </div>
                  <Badge v-if="template.usageCount > 0" variant="secondary" class="ml-2">
                    {{ template.usageCount }}x
                  </Badge>
                </div>
                <MuscleGroupBadges :muscle-groups="template.muscleGroups" :max="3" />
                <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Dumbbell class="w-3 h-3" />
                  <span>{{ template.exercises.length }} {{ t('common.exercises') }}</span>
                  <Clock class="w-3 h-3 ml-2" />
                  <span>~{{ template.estimatedDuration }} {{ t('common.min') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredTemplates.length === 0" class="text-center py-12">
            <Dumbbell class="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 class="font-semibold mb-1">
              {{ searchQuery ? t('schedule.templates.noResults') : t('schedule.templates.noTemplates') }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ searchQuery ? t('schedule.templates.tryDifferentSearch') : t('schedule.templates.createFirst') }}
            </p>
          </div>
        </div>
      </ScrollArea>

      <Separator />

      <!-- Footer Actions -->
      <div class="p-6 space-y-2">
        <Button
          class="w-full"
          @click="confirmSelection"
          :disabled="!selectedTemplateId"
        >
          {{ t('schedule.assign.assign') }}
        </Button>
        <Button
          variant="outline"
          class="w-full"
          @click="clearDay"
        >
          <X class="w-4 h-4 mr-2" />
          {{ t('schedule.assign.clear') }}
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
