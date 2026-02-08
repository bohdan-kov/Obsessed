<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFirestoreDate } from '@/composables/useFirestoreDate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import { MoreVertical, Eye, Edit, Copy, Trash2, Dumbbell, Clock, Play } from 'lucide-vue-next'

const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  showQuickStart: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['quick-start', 'view', 'edit', 'delete', 'duplicate'])

const { t } = useI18n()
const { formatRelativeDate, isServerTimestampPlaceholder } = useFirestoreDate()

const lastUsedLabel = computed(() => {
  // If template has been used but lastUsedAt hasn't synced yet, show "today"
  if (!props.template.lastUsedAt && props.template.usageCount > 0) {
    return t('schedule.calendar.today')
  }

  // If it's a serverTimestamp placeholder, show "today"
  if (isServerTimestampPlaceholder(props.template.lastUsedAt)) {
    return t('schedule.calendar.today')
  }

  // Use the composable to format the date
  return formatRelativeDate(props.template.lastUsedAt)
})

function handleQuickStart() {
  emit('quick-start', props.template.id)
}

function handleView() {
  emit('view', props.template.id)
}

function handleEdit() {
  emit('edit', props.template.id)
}

function handleDuplicate() {
  emit('duplicate', props.template.id)
}

function handleDelete() {
  emit('delete', props.template.id)
}
</script>

<template>
  <Card class="group hover:shadow-lg transition-all duration-200">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0 mr-2">
          <CardTitle class="text-lg line-clamp-1 mb-1">
            {{ template.name }}
          </CardTitle>
          <p class="text-xs text-muted-foreground">
            {{ lastUsedLabel }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <Badge v-if="template.usageCount > 0" variant="secondary" class="shrink-0">
            {{ template.usageCount }}x
          </Badge>

          <DropdownMenu v-if="showActions">
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :aria-label="t('schedule.templates.actions')"
              >
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="handleView">
                <Eye class="mr-2 h-4 w-4" />
                {{ t('schedule.templates.view') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleEdit">
                <Edit class="mr-2 h-4 w-4" />
                {{ t('schedule.templates.edit') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleDuplicate">
                <Copy class="mr-2 h-4 w-4" />
                {{ t('schedule.templates.duplicate') }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                @click="handleDelete"
              >
                <Trash2 class="mr-2 h-4 w-4" />
                {{ t('schedule.templates.delete') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Muscle Groups -->
      <MuscleGroupBadges :muscle-groups="template.muscleGroups" :max="3" />

      <!-- Template Stats -->
      <div class="flex items-center gap-4 text-sm text-muted-foreground">
        <div class="flex items-center gap-1">
          <Dumbbell class="w-4 h-4" />
          <span>{{ template.exercises.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Clock class="w-4 h-4" />
          <span>~{{ template.estimatedDuration }} {{ t('common.min') }}</span>
        </div>
      </div>

      <!-- Footer - horizontal layout with Start button -->
      <div v-if="showQuickStart" class="flex items-center justify-between gap-3 pt-2 border-t">
        <!-- Last used text - takes natural width, doesn't shrink -->
        <p class="text-xs text-muted-foreground shrink-0">
          {{ lastUsedLabel }}
        </p>

        <!-- Start Workout button - icon only with tooltip -->
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="handleQuickStart"
                variant="ghost"
                size="icon"
                class="h-11 w-11 shrink-0"
                :aria-label="t('schedule.templates.startWorkout', { name: template.name })"
              >
                <Play class="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{{ t('schedule.templateDetails.startWorkout') }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardContent>
  </Card>
</template>
