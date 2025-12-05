<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Calendar } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { CONFIG } from '@/constants/config'

const { t } = useI18n()
const analyticsStore = useAnalyticsStore()
const { period } = storeToRefs(analyticsStore)

const periods = CONFIG.analytics.periods.PERIOD_OPTIONS

function handlePeriodChange(newPeriod) {
  analyticsStore.setPeriod(newPeriod)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Select :model-value="period" @update:model-value="handlePeriodChange">
      <SelectTrigger
        class="w-[180px]"
        :aria-label="t('dashboard.periodSelector.ariaLabel')"
      >
        <div class="flex items-center gap-2">
          <Calendar class="h-4 w-4" />
          <SelectValue :placeholder="t('dashboard.periodSelector.placeholder')" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="p in periods" :key="p.id" :value="p.id">
          {{ t(p.labelKey) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
