<script setup>
import { ref } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Target, Calendar, TrendingUp } from 'lucide-vue-next'

import VolumeChart from './charts/VolumeChart.vue'
import MuscleChart from './charts/MuscleChart.vue'
import FrequencyChart from './charts/FrequencyChart.vue'
import ComparisonChart from './charts/ComparisonChart.vue'

const activeTab = ref('volume')
</script>

<template>
  <Tabs v-model="activeTab" default-value="volume" class="w-full">
    <TabsList class="grid w-full grid-cols-2 lg:grid-cols-4">
      <TabsTrigger value="volume" class="gap-2">
        <BarChart3 class="w-4 h-4" />
        <span class="hidden sm:inline">Обсяг</span>
      </TabsTrigger>
      <TabsTrigger value="muscle" class="gap-2">
        <Target class="w-4 h-4" />
        <span class="hidden sm:inline">М'язи</span>
      </TabsTrigger>
      <TabsTrigger value="frequency" class="gap-2">
        <Calendar class="w-4 h-4" />
        <span class="hidden sm:inline">Частота</span>
      </TabsTrigger>
      <TabsTrigger value="comparison" class="gap-2">
        <TrendingUp class="w-4 h-4" />
        <span class="hidden sm:inline">Прогрес</span>
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
