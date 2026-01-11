<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useWorkoutTemplates } from '@/composables/useWorkoutTemplates'
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
import { Plus, Search, Dumbbell } from 'lucide-vue-next'

const emit = defineEmits(['create-template', 'edit-template', 'quick-start'])

const { t } = useI18n()
const scheduleStore = useScheduleStore()
const { templates } = storeToRefs(scheduleStore)

// Use the useWorkoutTemplates composable for filtering
const {
  templates: filteredTemplates,
  searchQuery,
  muscleFilter,
  sortBy
} = useWorkoutTemplates()

// Delete confirmation dialog
const deleteDialogOpen = ref(false)
const templateToDelete = ref(null)

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
    <!-- Header with Create Button -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ t('schedule.templates.title') }}
        </h2>
        <p class="text-muted-foreground">
          {{ t('schedule.templates.noTemplatesDescription') }}
        </p>
      </div>
      <Button @click="handleCreateTemplate">
        <Plus class="w-4 h-4 mr-2" />
        {{ t('schedule.templates.create') }}
      </Button>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row gap-3">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
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
        @edit="handleEditTemplate"
        @duplicate="handleDuplicateTemplate"
        @delete="handleDeleteTemplate"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <Dumbbell class="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
      <h3 class="text-xl font-semibold mb-2">
        {{ searchQuery || muscleFilter !== 'all' ? t('schedule.templates.noResults') : t('schedule.templates.noTemplates') }}
      </h3>
      <p class="text-muted-foreground mb-6">
        {{ searchQuery || muscleFilter !== 'all' ? t('schedule.templates.tryDifferentSearch') : t('schedule.templates.createFirst') }}
      </p>
      <Button v-if="!searchQuery && muscleFilter === 'all'" @click="handleCreateTemplate">
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
          <AlertDialogCancel @click="cancelDelete">
            {{ t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {{ t('common.delete') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
