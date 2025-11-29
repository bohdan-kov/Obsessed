<script setup>
import { ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Target, Calendar, TrendingUp } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import VolumeChart from './charts/VolumeChart.vue'
import MuscleChart from './charts/MuscleChart.vue'
import FrequencyChart from './charts/FrequencyChart.vue'
import ComparisonChart from './charts/ComparisonChart.vue'

const { t } = useI18n()
const activeTab = ref('volume')
</script>

<template>
  <Tabs v-model="activeTab" default-value="volume" class="w-full">
    <TabsList class="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
      <!-- Volume Tab -->
      <TabsTrigger value="volume" class="inline-flex items-center justify-center gap-2 px-3 py-2.5">
        <BarChart3 class="w-4 h-4 shrink-0" />
        <span class="hidden sm:inline truncate">{{ t('dashboard.tabs.volume') }}</span>
      </TabsTrigger>

      <!-- Muscles Tab -->
      <TabsTrigger value="muscle" class="inline-flex items-center justify-center gap-2 px-3 py-2.5">
        <Target class="w-4 h-4 shrink-0" />
        <span class="hidden sm:inline truncate">{{ t('dashboard.tabs.muscles') }}</span>
      </TabsTrigger>

      <!-- Frequency Tab -->
      <TabsTrigger
        value="frequency"
        class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
      >
        <Calendar class="w-4 h-4 shrink-0" />
        <span class="hidden sm:inline truncate">{{ t('dashboard.tabs.frequency') }}</span>
      </TabsTrigger>

      <!-- Progress Tab -->
      <TabsTrigger
        value="comparison"
        class="inline-flex items-center justify-center gap-2 px-3 py-2.5"
      >
        <TrendingUp class="w-4 h-4 shrink-0" />
        <span class="hidden sm:inline truncate">{{ t('dashboard.tabs.progress') }}</span>
      </TabsTrigger>
    </TabsList>

    <!-- Volume Chart Tab -->
    <TabsContent value="volume" class="mt-6">
      <VolumeChart />
    </TabsContent>

    <!-- Muscle Distribution Chart Tab -->
    <TabsContent value="muscle" class="mt-6">
      <MuscleChart />
    </TabsContent>

    <!-- Frequency Heatmap Tab -->
    <TabsContent value="frequency" class="mt-6">
      <FrequencyChart />
    </TabsContent>

    <!-- Week Comparison Tab -->
    <TabsContent value="comparison" class="mt-6">
      <ComparisonChart />
    </TabsContent>
  </Tabs>
</template>
