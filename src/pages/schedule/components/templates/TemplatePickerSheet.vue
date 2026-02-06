<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useWorkoutTemplates } from '@/composables/useWorkoutTemplates'
import { useFirestoreDate } from '@/composables/useFirestoreDate'
import { getLocalizedExerciseName } from '@/utils/exerciseUtils'
import { CONFIG } from '@/constants/config'
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { Search, Dumbbell, Clock, X, ChevronDown } from 'lucide-vue-next'

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
const { formatRelativeDate } = useFirestoreDate()
const scheduleStore = useScheduleStore()
const { templates } = storeToRefs(scheduleStore)

const searchInput = ref('')
const searchQuery = refDebounced(searchInput, CONFIG.exercise.SEARCH_DEBOUNCE)
const selectedTemplateId = ref(null)
const expandedTemplates = ref(new Set())

// Filter templates by search query (uses debounced search)
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
  searchInput.value = ''
  selectedTemplateId.value = null
  expandedTemplates.value.clear()
  emit('close')
}

function toggleExpanded(templateId) {
  if (expandedTemplates.value.has(templateId)) {
    expandedTemplates.value.delete(templateId)
  } else {
    expandedTemplates.value.add(templateId)
  }
}

function isExpanded(templateId) {
  return expandedTemplates.value.has(templateId)
}

// Format last used date using the composable
function formatLastUsed(date) {
  return formatRelativeDate(date, {
    todayKey: 'schedule.todaysWorkout.title'
  })
}

// Cleanup: Clear expanded templates set on unmount to prevent memory leaks
onUnmounted(() => {
  expandedTemplates.value.clear()
})
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
            v-model="searchInput"
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
          <div v-if="recentTemplates.length > 0 && !searchInput">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">
              {{ t('schedule.templates.recentTemplates') }}
            </h3>
            <div class="space-y-2">
              <Collapsible
                v-for="template in recentTemplates"
                :key="template.id"
                :open="isExpanded(template.id)"
                @update:open="() => toggleExpanded(template.id)"
              >
                <div
                  :class="[
                    'border rounded-lg transition-all',
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  ]"
                >
                  <div class="p-4 cursor-pointer" @click="selectTemplate(template)">
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

                  <!-- Expand button -->
                  <CollapsibleTrigger class="w-full px-4 pb-2 pt-1" @click.stop>
                    <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span>{{ isExpanded(template.id) ? t('schedule.templates.hideExercises') : t('schedule.templates.showExercises') }}</span>
                      <ChevronDown :class="['w-3 h-3 transition-transform', isExpanded(template.id) && 'rotate-180']" />
                    </div>
                  </CollapsibleTrigger>

                  <!-- Exercise list -->
                  <CollapsibleContent>
                    <div class="px-4 pb-4 pt-2 border-t">
                      <div class="space-y-2">
                        <div
                          v-for="(exercise, index) in template.exercises"
                          :key="index"
                          class="flex items-start gap-2 text-sm"
                        >
                          <span class="text-muted-foreground font-mono text-xs mt-0.5">{{ index + 1 }}.</span>
                          <div class="flex-1">
                            <p class="font-medium">{{ getLocalizedExerciseName(exercise.exerciseName, locale) || exercise.exerciseId }}</p>
                            <p class="text-xs text-muted-foreground">
                              {{ exercise.sets }} {{ t('common.sets') }} × {{ exercise.reps }} {{ t('common.reps') }}
                              <span v-if="exercise.targetWeight"> · {{ exercise.targetWeight }} {{ t('common.kg') }}</span>
                              <span v-if="exercise.restTime"> · {{ exercise.restTime }}{{ t('common.sec') }} {{ t('common.rest') }}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>

          <Separator v-if="recentTemplates.length > 0 && otherTemplates.length > 0 && !searchInput" />

          <!-- All Templates -->
          <div v-if="otherTemplates.length > 0">
            <h3 v-if="!searchInput" class="text-sm font-semibold text-muted-foreground mb-3">
              {{ t('schedule.templates.allTemplates') }}
            </h3>
            <div class="space-y-2">
              <Collapsible
                v-for="template in otherTemplates"
                :key="template.id"
                :open="isExpanded(template.id)"
                @update:open="() => toggleExpanded(template.id)"
              >
                <div
                  :class="[
                    'border rounded-lg transition-all',
                    selectedTemplateId === template.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  ]"
                >
                  <div class="p-4 cursor-pointer" @click="selectTemplate(template)">
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

                  <!-- Expand button -->
                  <CollapsibleTrigger class="w-full px-4 pb-2 pt-1" @click.stop>
                    <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span>{{ isExpanded(template.id) ? t('schedule.templates.hideExercises') : t('schedule.templates.showExercises') }}</span>
                      <ChevronDown :class="['w-3 h-3 transition-transform', isExpanded(template.id) && 'rotate-180']" />
                    </div>
                  </CollapsibleTrigger>

                  <!-- Exercise list -->
                  <CollapsibleContent>
                    <div class="px-4 pb-4 pt-2 border-t">
                      <div class="space-y-2">
                        <div
                          v-for="(exercise, index) in template.exercises"
                          :key="index"
                          class="flex items-start gap-2 text-sm"
                        >
                          <span class="text-muted-foreground font-mono text-xs mt-0.5">{{ index + 1 }}.</span>
                          <div class="flex-1">
                            <p class="font-medium">{{ getLocalizedExerciseName(exercise.exerciseName, locale) || exercise.exerciseId }}</p>
                            <p class="text-xs text-muted-foreground">
                              {{ exercise.sets }} {{ t('common.sets') }} × {{ exercise.reps }} {{ t('common.reps') }}
                              <span v-if="exercise.targetWeight"> · {{ exercise.targetWeight }} {{ t('common.kg') }}</span>
                              <span v-if="exercise.restTime"> · {{ exercise.restTime }}{{ t('common.sec') }} {{ t('common.rest') }}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredTemplates.length === 0" class="text-center py-12">
            <Dumbbell class="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 class="font-semibold mb-1">
              {{ searchInput ? t('schedule.templates.noResults') : t('schedule.templates.noTemplates') }}
            </h3>
            <p class="text-sm text-muted-foreground">
              {{ searchInput ? t('schedule.templates.tryDifferentSearch') : t('schedule.templates.createFirst') }}
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
