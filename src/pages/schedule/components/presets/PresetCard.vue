<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPresetName, getPresetDescription } from '@/constants/splitPresets'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Zap, Trophy, Loader2, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  preset: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  activePresetId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select'])

const { t, locale } = useI18n()

const isActive = computed(() => props.activePresetId === props.preset.id)

const presetName = computed(() => getPresetName(props.preset, locale.value))
const presetDescription = computed(() => getPresetDescription(props.preset, locale.value))

const difficultyIcon = computed(() => {
  switch (props.preset.difficulty) {
    case 'beginner':
      return Zap
    case 'intermediate':
      return Dumbbell
    case 'advanced':
      return Trophy
    default:
      return Dumbbell
  }
})

const difficultyColor = computed(() => {
  switch (props.preset.difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
    case 'intermediate':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
    case 'advanced':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
})

function handleSelect() {
  emit('select', props.preset.id)
}
</script>

<template>
  <Card :class="[
    'group hover:shadow-lg transition-all duration-200',
    isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
  ]">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between mb-2">
        <Badge :class="difficultyColor" class="px-2 py-1">
          <component :is="difficultyIcon" class="w-3 h-3 mr-1" />
          {{ $t(`schedule.presets.categories.${preset.difficulty}`) }}
        </Badge>
        <div class="flex items-center gap-2">
          <Badge v-if="isActive" variant="default" class="px-2 py-1">
            <CheckCircle2 class="w-3 h-3 mr-1" />
            {{ t('schedule.presets.active') }}
          </Badge>
          <Badge variant="outline" class="px-2 py-1">
            {{ $t('schedule.presets.frequencyShort', { count: preset.frequency }) }}
          </Badge>
        </div>
      </div>
      <CardTitle class="text-xl line-clamp-1">
        {{ presetName }}
      </CardTitle>
      <CardDescription class="line-clamp-2 mt-1">
        {{ presetDescription }}
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <!-- Template Preview -->
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase">
          {{ $t('schedule.presets.workouts') }}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <Badge
            v-for="(template, index) in preset.templates"
            :key="index"
            variant="secondary"
            class="text-xs px-2 py-0.5"
          >
            {{ template.name[locale] || template.name.en }}
          </Badge>
        </div>
      </div>

      <!-- Apply Button -->
      <Button
        v-if="isActive"
        variant="default"
        class="w-full"
        disabled
      >
        <CheckCircle2 class="w-4 h-4 mr-2" />
        {{ t('schedule.presets.active') }}
      </Button>
      <Button
        v-else
        variant="outline"
        class="w-full transition-all duration-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary"
        :disabled="loading"
        @click="handleSelect"
      >
        <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
        {{ loading ? $t('common.applying') : $t('schedule.presets.selectPreset') }}
      </Button>
    </CardContent>
  </Card>
</template>
