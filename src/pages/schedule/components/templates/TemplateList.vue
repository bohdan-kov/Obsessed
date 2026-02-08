<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { refDebounced } from '@vueuse/core'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useWorkoutTemplates } from '@/composables/useWorkoutTemplates'
import { CONFIG } from '@/constants/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import TemplateCard from './TemplateCard.vue'
import TemplateDetailsSheet from './TemplateDetailsSheet.vue'
import { Plus, Search, Dumbbell } from 'lucide-vue-next'

const emit = defineEmits(['create-template', 'edit-template', 'quick-start'])

const { t } = useI18n()
const scheduleStore = useScheduleStore()
const { templates, currentSchedule } = storeToRefs(scheduleStore)

// Get active preset ID to automatically filter templates
const activePresetId = computed(() => currentSchedule.value?.activePresetId || null)

// Search input (local ref for immediate feedback)
const searchInput = ref('')

// Debounced search query for filtering (reduces computation on each keystroke)
const searchQuery = refDebounced(searchInput, CONFIG.exercise.SEARCH_DEBOUNCE)

// Use the useWorkoutTemplates composable for filtering
// Note: We're not using its searchQuery, we're using our debounced one
const {
  muscleFilter,
  sortBy
} = useWorkoutTemplates()

// Manual filtering with debounced search
const baseFilteredTemplates = computed(() => {
  let result = templates.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.muscleGroups.some(muscle => muscle.toLowerCase().includes(query))
    )
  }

  // Muscle filter
  if (muscleFilter.value && muscleFilter.value !== 'all') {
    result = result.filter(template =>
      template.muscleGroups.includes(muscleFilter.value)
    )
  }

  // Sort
  if (sortBy.value === 'usage') {
    result = [...result].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
  } else if (sortBy.value === 'name') {
    result = [...result].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'recent') {
    result = [...result].sort((a, b) => {
      if (!a.lastUsedAt && !b.lastUsedAt) return 0
      if (!a.lastUsedAt) return 1
      if (!b.lastUsedAt) return -1
      return new Date(b.lastUsedAt) - new Date(a.lastUsedAt)
    })
  }

  return result
})

// Automatically filter by active program + always show custom templates
const filteredTemplates = computed(() => {
  if (!activePresetId.value) {
    return baseFilteredTemplates.value
  }
  // Show templates from active program + custom templates (no sourcePresetId)
  return baseFilteredTemplates.value.filter(t =>
    t.sourcePresetId === activePresetId.value || !t.sourcePresetId
  )
})

// Delete confirmation dialog
const deleteDialogOpen = ref(false)
const templateToDelete = ref(null)

// Template details sheet
const detailsSheetOpen = ref(false)
const templateToView = ref(null)

// Available muscle groups for filter
const muscleGroups = computed(() => {
  const groups = new Set()
  templates.value.forEach(template => {
    template.muscleGroups.forEach(muscle => groups.add(muscle))
  })
  return Array.from(groups).sort()
})

function handleCreateTemplate() {
  emit('create-template')
}

function handleViewTemplate(templateId) {
  templateToView.value = templateId
  detailsSheetOpen.value = true
}

function handleEditTemplate(templateId) {
  emit('edit-template', templateId)
}

function handleQuickStart(templateId) {
  emit('quick-start', templateId)
}

function handleDuplicateTemplate(templateId) {
  scheduleStore.duplicateTemplate(templateId)
}

function handleDeleteTemplate(templateId) {
  templateToDelete.value = templateId
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (templateToDelete.value) {
    await scheduleStore.deleteTemplate(templateToDelete.value)
    templateToDelete.value = null
  }
  deleteDialogOpen.value = false
}

function cancelDelete() {
  templateToDelete.value = null
  deleteDialogOpen.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          v-model="searchInput"
          :placeholder="t('schedule.templates.search')"
          class="pl-10"
        />
      </div>

      <!-- Muscle Group Filter -->
      <Select v-model="muscleFilter">
        <SelectTrigger class="w-full sm:w-[200px]">
          <SelectValue :placeholder="t('schedule.templates.filterByMuscle')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {{ t('schedule.templates.allMuscles') }}
          </SelectItem>
          <SelectItem v-for="muscle in muscleGroups" :key="muscle" :value="muscle">
            {{ t(`common.muscleGroups.${muscle}`) }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Sort By -->
      <Select v-model="sortBy">
        <SelectTrigger class="w-full sm:w-[160px]">
          <SelectValue :placeholder="t('schedule.templates.sortBy')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="usage">
            {{ t('schedule.templates.sortByUsage') }}
          </SelectItem>
          <SelectItem value="name">
            {{ t('schedule.templates.sortByName') }}
          </SelectItem>
          <SelectItem value="recent">
            {{ t('schedule.templates.sortByRecent') }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Template Grid -->
    <div v-if="filteredTemplates.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <TemplateCard
        v-for="template in filteredTemplates"
        :key="template.id"
        :template="template"
        @quick-start="handleQuickStart"
        @view="handleViewTemplate"
        @edit="handleEditTemplate"
        @duplicate="handleDuplicateTemplate"
        @delete="handleDeleteTemplate"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <Dumbbell class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 class="text-xl font-semibold mb-2">
        {{ searchInput || muscleFilter !== 'all' || activePresetId ? t('schedule.templates.noResults') : t('schedule.templates.noTemplates') }}
      </h3>
      <p class="text-muted-foreground mb-6">
        {{ searchInput || muscleFilter !== 'all' || activePresetId ? t('schedule.templates.tryDifferentSearch') : t('schedule.templates.createFirst') }}
      </p>
      <Button v-if="!searchInput && muscleFilter === 'all' && !activePresetId" @click="handleCreateTemplate">
        <Plus class="w-4 h-4 mr-2" />
        {{ t('schedule.templates.create') }}
      </Button>
    </div>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('schedule.templates.delete') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('schedule.templates.deleteConfirm') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel as-child>
            <Button variant="outline" class="min-h-11 min-w-11" @click="cancelDelete">
              {{ t('common.cancel') }}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button variant="destructive" class="min-h-11 min-w-11" @click="confirmDelete">
              {{ t('common.delete') }}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Template Details Sheet -->
    <TemplateDetailsSheet
      :open="detailsSheetOpen"
      :template-id="templateToView"
      @update:open="detailsSheetOpen = $event"
      @start="handleQuickStart"
      @edit="handleEditTemplate"
    />
  </div>
</template>
