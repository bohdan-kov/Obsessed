<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
import MuscleGroupBadges from '@/pages/schedule/components/shared/MuscleGroupBadges.vue'
import QuickStartButton from '@/pages/schedule/components/shared/QuickStartButton.vue'
import { MoreVertical, Edit, Copy, Trash2, Dumbbell, Clock } from 'lucide-vue-next'

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

const emit = defineEmits(['quick-start', 'edit', 'delete', 'duplicate'])

const { t, locale } = useI18n()

const lastUsedLabel = computed(() => {
  if (!props.template.lastUsedAt) return t('schedule.templates.neverUsed')

  const lastUsed = new Date(props.template.lastUsedAt)
  const now = new Date()
  const diffMs = now - lastUsed
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('schedule.calendar.today')
  if (diffDays === 1) return t('schedule.calendar.yesterday')
  if (diffDays < 7) return t('schedule.daysAgo', { count: diffDays })

  return lastUsed.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
})

function handleQuickStart() {
  emit('quick-start', props.template.id)
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
                class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

    <CardContent class="space-y-3">
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

      <!-- Quick Start Button -->
      <QuickStartButton
        v-if="showQuickStart"
        :template-id="template.id"
        :template-name="template.name"
        class="w-full"
        @click="handleQuickStart"
      />
    </CardContent>
  </Card>
</template>
