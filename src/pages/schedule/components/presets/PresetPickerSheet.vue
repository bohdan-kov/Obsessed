<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SPLIT_PRESETS, getPresetName, getPresetDescription } from '@/constants/splitPresets'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PresetCard from './PresetCard.vue'
import { Zap, Dumbbell, Trophy } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'select'])

const { t, locale } = useI18n()
const activeTab = ref('beginner')

const beginnerPresets = computed(() => SPLIT_PRESETS.beginner)
const intermediatePresets = computed(() => SPLIT_PRESETS.intermediate)
const advancedPresets = computed(() => SPLIT_PRESETS.advanced)

function handleSelectPreset(presetId) {
  emit('select', presetId)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Sheet :open="open" @update:open="(value) => !value && handleClose()">
    <SheetContent side="right" class="w-full sm:max-w-3xl flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4">
        <SheetTitle class="text-2xl">
          {{ t('schedule.presets.title') }}
        </SheetTitle>
        <SheetDescription>
          {{ t('schedule.presets.subtitle') }}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <!-- Difficulty Tabs -->
      <div class="px-6 pt-4">
        <Tabs v-model="activeTab" class="w-full">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="beginner" class="flex items-center gap-1.5">
              <Zap class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.beginner') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.beginner').slice(0, 3) }}</span>
            </TabsTrigger>
            <TabsTrigger value="intermediate" class="flex items-center gap-1.5">
              <Dumbbell class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.intermediate') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.intermediate').slice(0, 3) }}</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" class="flex items-center gap-1.5">
              <Trophy class="w-4 h-4" />
              <span class="hidden sm:inline">{{ t('schedule.presets.categories.advanced') }}</span>
              <span class="sm:hidden">{{ t('schedule.presets.categories.advanced').slice(0, 3) }}</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea class="h-[calc(100vh-240px)] mt-4">
            <!-- Beginner Tab -->
            <TabsContent value="beginner" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in beginnerPresets"
                :key="preset.id"
                :preset="preset"
                @select="handleSelectPreset"
              />
            </TabsContent>

            <!-- Intermediate Tab -->
            <TabsContent value="intermediate" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in intermediatePresets"
                :key="preset.id"
                :preset="preset"
                @select="handleSelectPreset"
              />
            </TabsContent>

            <!-- Advanced Tab -->
            <TabsContent value="advanced" class="space-y-4 px-1 pb-6">
              <PresetCard
                v-for="preset in advancedPresets"
                :key="preset.id"
                :preset="preset"
                @select="handleSelectPreset"
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </SheetContent>
  </Sheet>
</template>
