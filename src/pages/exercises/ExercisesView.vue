<template>
  <div class="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        {{ t('exercises.title') }}
      </h1>
      <p class="text-muted-foreground">
        {{ t('exercises.subtitle') }}
      </p>
    </div>

    <!-- Search and Actions -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1">
        <ExerciseSearchBar
          v-model="searchQuery"
          @update:modelValue="handleSearchChange"
        />
      </div>

      <div class="flex gap-2">
        <!-- Sort dropdown -->
        <ExerciseSortDropdown
          v-model="sortBy"
          @change="handleSortChange"
          class="flex-1 sm:flex-initial"
        />

        <!-- Filter button (mobile) -->
        <Sheet v-model:open="showFilters">
          <SheetTrigger as-child>
            <Button variant="outline" size="icon" class="sm:hidden min-h-11 min-w-11">
              <SlidersHorizontal class="h-4 w-4" />
              <span class="sr-only">{{ t('exercises.filters.title') }}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-[300px]">
            <SheetHeader>
              <SheetTitle>{{ t('exercises.filters.title') }}</SheetTitle>
            </SheetHeader>
            <div class="mt-6">
              <ExerciseFilters
                v-model="filters"
                @change="handleFiltersChange"
              />
            </div>
          </SheetContent>
        </Sheet>

        <!-- Create button -->
        <Button @click="handleCreateExercise" size="default" class="min-h-11">
          <Plus class="h-4 w-4 sm:mr-2" />
          <span class="hidden sm:inline">{{ t('exercises.actions.create') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main content -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Filters sidebar (desktop) -->
      <div class="hidden sm:block lg:col-span-1">
        <Card>
          <CardContent class="p-4">
            <ExerciseFilters
              v-model="filters"
              @change="handleFiltersChange"
            />
          </CardContent>
        </Card>
      </div>

      <!-- Exercise list -->
      <div class="lg:col-span-3 space-y-4">
        <!-- Loading state -->
        <div v-if="loading" class="space-y-3">
          <Card v-for="i in 5" :key="i" class="animate-pulse">
            <CardContent class="p-4 h-24 bg-muted"></CardContent>
          </Card>
        </div>

        <!-- Exercise list -->
        <div v-else-if="displayedExercises.length > 0" class="space-y-4">
          <div class="space-y-3">
            <ExerciseListItem
              v-for="exercise in displayedExercises"
              :key="exercise.id"
              :exercise="exercise"
              :is-favorite="favorites.includes(exercise.id)"
              :show-stats="true"
              @click="handleExerciseClick"
            />
          </div>

          <!-- Page-based Pagination -->
          <div v-if="totalPages > 1" class="flex flex-col items-center gap-3 pt-2">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @update:current-page="handlePageChange"
            />
            <p class="text-sm text-muted-foreground">
              {{ t('exercises.list.showing', {
                showing: `${currentPageRange.start}-${currentPageRange.end}`,
                total: totalExercises
              }) }}
            </p>
          </div>
        </div>

        <!-- Empty state -->
        <ExerciseEmptyState
          v-else
          :type="hasActiveFilters ? 'no-results' : 'no-exercises'"
          @create="handleCreateExercise"
          @reset-filters="handleResetFilters"
        />
      </div>
    </div>

    <!-- Exercise Form Dialog -->
    <ExerciseFormDialog
      v-model:open="showCreateDialog"
      @success="handleExerciseCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Plus, SlidersHorizontal } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Pagination } from '@/components/ui/pagination'
import ExerciseSearchBar from './components/ExerciseSearchBar.vue'
import ExerciseFilters from './components/ExerciseFilters.vue'
import ExerciseSortDropdown from './components/ExerciseSortDropdown.vue'
import ExerciseListItem from './components/ExerciseListItem.vue'
import ExerciseEmptyState from './components/ExerciseEmptyState.vue'
import ExerciseFormDialog from './components/ExerciseFormDialog.vue'
import { useExerciseStore } from '@/stores/exerciseStore'
import { useExerciseLibraryStore } from '@/stores/exerciseLibraryStore'
import { useDynamicPagination } from '@/composables/useDynamicPagination'
import { useI18n } from 'vue-i18n'
import { CONFIG } from '@/constants/config'

const { t } = useI18n()
const router = useRouter()
const exerciseStore = useExerciseStore()
const exerciseLibraryStore = useExerciseLibraryStore()

// Dynamic pagination based on viewport height
const { itemsPerPage: dynamicItemsPerPage } = useDynamicPagination({
  itemHeight: CONFIG.exercise.ITEM_HEIGHT,
  targetScreenRatio: 1.5, // Content should be ~1.5x screen height (scroll down 0.5x)
  minItems: 5,
  maxItems: CONFIG.exercise.PAGINATION_MAX_ITEMS,
  headerOffset: CONFIG.exercise.PAGE_HEADER_OFFSET,
})

// Watch dynamic items per page and update the store
watch(
  dynamicItemsPerPage,
  (newValue) => {
    exerciseLibraryStore.setItemsPerPage(newValue)
  },
  { immediate: true }
)

// State from stores (read-only)
const {
  paginatedExercises,
  totalPages,
  currentPage,
  currentPageRange,
  totalExercises,
  favorites,
  hasActiveFilters,
} = storeToRefs(exerciseLibraryStore)

const { loading } = storeToRefs(exerciseStore)

// Local state
const showFilters = ref(false)
const showCreateDialog = ref(false)

// Computed - Two-way bindings for filters/sort/search with getter/setter
const filters = computed({
  get: () => exerciseLibraryStore.filters,
  set: (newFilters) => {
    Object.keys(newFilters).forEach((key) => {
      exerciseLibraryStore.setFilter(key, newFilters[key])
    })
  }
})

const sortBy = computed({
  get: () => exerciseLibraryStore.sortBy,
  set: (value) => exerciseLibraryStore.setSortBy(value)
})

const searchQuery = computed({
  get: () => exerciseLibraryStore.searchQuery,
  set: (value) => exerciseLibraryStore.setSearchQuery(value)
})

const displayedExercises = computed(() => paginatedExercises.value)

/**
 * Handle exercise click - navigate to detail view
 */
function handleExerciseClick(exercise) {
  router.push({
    name: 'ExerciseDetail',
    params: { id: exercise.id },
  })
}

/**
 * Handle create exercise
 */
function handleCreateExercise() {
  showCreateDialog.value = true
}

/**
 * Handle exercise created successfully
 */
function handleExerciseCreated() {
  showCreateDialog.value = false
  // Exercises will update automatically via reactive subscriptions
}

/**
 * Handle search change
 */
function handleSearchChange(query) {
  exerciseLibraryStore.setSearchQuery(query)
}

/**
 * Handle filters change
 */
function handleFiltersChange(newFilters) {
  Object.keys(newFilters).forEach((key) => {
    exerciseLibraryStore.setFilter(key, newFilters[key])
  })
}

/**
 * Handle sort change
 */
function handleSortChange(newSort) {
  exerciseLibraryStore.setSortBy(newSort)
}

/**
 * Handle reset filters
 */
function handleResetFilters() {
  exerciseLibraryStore.resetFilters()
}

/**
 * Handle page change
 */
function handlePageChange(page) {
  exerciseLibraryStore.goToPage(page)
  // Scroll to top of main content area for better UX
  // Find the main scrollable container (the <main> element in AppLayout)
  const mainContent = document.querySelector('main')
  if (mainContent) {
    mainContent.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * Load exercises on mount
 */
onMounted(async () => {
  try {
    // Load exercises if not already loaded
    if (exerciseStore.exercises.length === 0) {
      await exerciseStore.fetchExercises()
    }

    // Load custom exercises
    await exerciseStore.fetchCustomExercises()

    // Subscribe to custom exercises for real-time updates
    exerciseStore.subscribeToCustom()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error loading exercises:', error)
    }
  }
})
</script>
