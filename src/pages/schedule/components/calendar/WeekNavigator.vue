<script setup>
import { useWeekNavigation } from '@/composables/useWeekNavigation'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const { t } = useI18n()
const {
  weekLabel,
  canGoBack,
  canGoForward,
  goToPreviousWeek,
  goToNextWeek,
  goToThisWeek,
  currentWeekOffset,
} = useWeekNavigation()
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <Button variant="outline" size="sm" :disabled="!canGoBack" @click="goToPreviousWeek">
      <ChevronLeft class="w-4 h-4 mr-1" />
      <span class="hidden sm:inline">{{ t('schedule.calendar.previousWeek') }}</span>
      <span class="sm:hidden">{{ t('schedule.calendar.prev') }}</span>
    </Button>

    <div class="flex items-center gap-2">
      <span class="font-semibold text-lg">{{ weekLabel }}</span>
      <Button
        v-if="currentWeekOffset !== 0"
        variant="ghost"
        size="sm"
        @click="goToThisWeek"
      >
        {{ t('schedule.calendar.thisWeek') }}
      </Button>
    </div>

    <Button variant="outline" size="sm" :disabled="!canGoForward" @click="goToNextWeek">
      <span class="hidden sm:inline">{{ t('schedule.calendar.nextWeek') }}</span>
      <span class="sm:hidden">{{ t('schedule.calendar.next') }}</span>
      <ChevronRight class="w-4 h-4 ml-1" />
    </Button>
  </div>
</template>
