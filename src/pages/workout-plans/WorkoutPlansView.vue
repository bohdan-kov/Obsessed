<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { usePlan } from '@/composables/usePlan'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import EmptyPlansState from './components/EmptyPlansState.vue'
import PlanCard from './components/PlanCard.vue'
import DeletePlanDialog from './components/sheets/DeletePlanDialog.vue'
import PlanFormSheet from './components/sheets/PlanFormSheet.vue'
import PlanDetailsSheet from './components/sheets/PlanDetailsSheet.vue'

const { t } = useI18n()
const route = useRoute()
const { sortedPlans, loading, canCreatePlan, subscribeToPlans, deletePlan, duplicatePlan } =
  usePlan()
const workoutStore = useWorkoutStore()

// UI State
const showCreateSheet = ref(false)
const showEditSheet = ref(false)
const showDetailsSheet = ref(false)
const showDeleteDialog = ref(false)
const selectedPlanId = ref(null)
const selectedPlan = ref(null)
const highlightedPlanId = ref(null)

// Real-time subscription cleanup
let unsubscribe = null

onMounted(() => {
  // Subscribe to real-time updates
  try {
    unsubscribe = subscribeToPlans()
  } catch (error) {
    // Error handled by composable
  }

  // Handle highlight from URL query param
  if (route.query.highlight) {
    highlightedPlanId.value = route.query.highlight

    // Scroll to highlighted plan after DOM renders
    nextTick(() => {
      setTimeout(() => {
        const element = document.getElementById(`plan-${highlightedPlanId.value}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // Remove highlight after animation
          setTimeout(() => {
            highlightedPlanId.value = null
          }, 2000)
        }
      }, 300) // Wait for plans to render
    })
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Handlers
function handleCreate() {
  if (!canCreatePlan.value) {
    return
  }
  selectedPlanId.value = null
  selectedPlan.value = null
  showCreateSheet.value = true
}

function handleView(planId) {
  selectedPlanId.value = planId
  showDetailsSheet.value = true
}

function handleEdit(planId) {
  selectedPlanId.value = planId
  const plan = sortedPlans.value.find((p) => p.id === planId)
  selectedPlan.value = plan
  showEditSheet.value = true
}

async function handleDuplicate(planId) {
  try {
    await duplicatePlan(planId)
  } catch (error) {
    // Error handled by composable
  }
}

function handleDelete(planId) {
  const plan = sortedPlans.value.find((p) => p.id === planId)
  selectedPlan.value = plan
  showDeleteDialog.value = true
}

async function confirmDelete(planId) {
  try {
    await deletePlan(planId)
  } catch (error) {
    // Error handled by composable
  }
}

async function handleStart(planId) {
  try {
    // This will use startWorkoutFromPlan which we'll add to workoutStore
    await workoutStore.startWorkoutFromPlan(planId)
  } catch (error) {
    // Error handled by store
  }
}
</script>

<template>
  <div class="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:py-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold">{{ t('plans.title') }}</h1>
        <p v-if="sortedPlans.length > 0" class="text-sm text-muted-foreground mt-2">
          {{ t('plans.list.planCount', { count: sortedPlans.length }) }}
        </p>
      </div>

      <Button
        v-if="sortedPlans.length > 0"
        @click="handleCreate"
        :disabled="!canCreatePlan"
        size="lg"
        class="min-h-11"
      >
        <Plus class="mr-2 h-5 w-5" />
        {{ t('plans.list.createPlan') }}
      </Button>
    </div>

    <!-- Empty State -->
    <EmptyPlansState v-if="sortedPlans.length === 0 && !loading" @create="handleCreate" />

    <!-- Plans Grid -->
    <div v-if="sortedPlans.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="plan in sortedPlans"
        :key="plan.id"
        :id="`plan-${plan.id}`"
        :class="{
          'ring-2 ring-primary/80 animate-pulse': plan.id === highlightedPlanId,
          'transition-all duration-300': true,
        }"
        class="rounded-lg"
      >
        <PlanCard
          :plan="plan"
          @start="handleStart"
          @view="handleView"
          @edit="handleEdit"
          @duplicate="handleDuplicate"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && sortedPlans.length === 0" class="text-center py-16 text-muted-foreground">
      {{ t('common.loading') }}
    </div>

    <!-- Dialogs & Sheets -->
    <DeletePlanDialog
      v-model:open="showDeleteDialog"
      :plan="selectedPlan"
      @confirm="confirmDelete"
    />

    <PlanFormSheet v-model:open="showCreateSheet" mode="create" />

    <PlanFormSheet v-model:open="showEditSheet" mode="edit" :plan="selectedPlan" />

    <PlanDetailsSheet
      v-model:open="showDetailsSheet"
      :plan-id="selectedPlanId"
      @start="handleStart"
      @edit="handleEdit"
    />
  </div>
</template>
