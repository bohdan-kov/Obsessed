<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePageMeta } from '@/composables/usePageMeta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  Calculator,
  Timer,
  FileText,
  Download,
  Upload,
  Database,
  Info,
  Clock,
  Shield,
  FileCheck,
} from 'lucide-vue-next'

const { t } = useI18n()

// Set page metadata for mobile header
usePageMeta(
  computed(() => t('more.title')),
  computed(() => t('more.subtitle'))
)

// Tool sections
const toolItems = [
  { icon: Calculator, label: t('more.sections.tools.calculator'), disabled: true },
  { icon: Timer, label: t('more.sections.tools.timer'), disabled: true },
  { icon: FileText, label: t('more.sections.tools.notes'), disabled: true },
]

const dataItems = [
  { icon: Download, label: t('more.sections.data.export'), disabled: true },
  { icon: Upload, label: t('more.sections.data.import'), disabled: true },
  { icon: Database, label: t('more.sections.data.backup'), disabled: true },
]

const aboutItems = [
  { icon: Info, label: t('more.sections.about.version'), value: 'v1.0.0', disabled: true },
  { icon: Clock, label: t('more.sections.about.changelog'), disabled: true },
  { icon: Shield, label: t('more.sections.about.privacy'), disabled: true },
  { icon: FileCheck, label: t('more.sections.about.terms'), disabled: true },
]
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header (hidden on mobile, shown in AppLayout mobile header) -->
    <div class="hidden md:block space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('more.title') }}</h1>
      <p class="text-muted-foreground">{{ t('more.subtitle') }}</p>
    </div>

    <!-- Coming Soon Card -->
    <Card class="border-dashed">
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-4"
        >
          <MoreHorizontal class="w-8 h-8 text-indigo-500" />
        </div>
        <CardTitle class="text-2xl">{{ t('more.comingSoon.title') }}</CardTitle>
        <CardDescription class="max-w-md mx-auto text-base">
          {{ t('more.comingSoon.description') }}
        </CardDescription>
      </CardHeader>
    </Card>

    <!-- Tools Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('more.sections.tools.title') }}</CardTitle>
        <CardDescription>{{ t('more.sections.tools.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <Button
          v-for="(item, index) in toolItems"
          :key="index"
          variant="ghost"
          :disabled="item.disabled"
          class="w-full justify-start gap-3 h-auto py-4"
        >
          <component :is="item.icon" class="w-5 h-5 text-muted-foreground shrink-0" />
          <div class="text-left flex-1">
            <div class="text-sm font-medium">{{ item.label }}</div>
            <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
          </div>
        </Button>
      </CardContent>
    </Card>

    <!-- Data Management Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('more.sections.data.title') }}</CardTitle>
        <CardDescription>{{ t('more.sections.data.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <Button
          v-for="(item, index) in dataItems"
          :key="index"
          variant="ghost"
          :disabled="item.disabled"
          class="w-full justify-start gap-3 h-auto py-4"
        >
          <component :is="item.icon" class="w-5 h-5 text-muted-foreground shrink-0" />
          <div class="text-left flex-1">
            <div class="text-sm font-medium">{{ item.label }}</div>
            <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
          </div>
        </Button>
      </CardContent>
    </Card>

    <!-- About Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t('more.sections.about.title') }}</CardTitle>
        <CardDescription>{{ t('more.sections.about.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <div
          v-for="(item, index) in aboutItems"
          :key="index"
          class="flex items-center gap-3 px-3 py-4 rounded-lg hover:bg-accent/50 transition-colors"
          :class="{ 'cursor-not-allowed opacity-60': item.disabled }"
        >
          <component :is="item.icon" class="w-5 h-5 text-muted-foreground shrink-0" />
          <div class="flex-1">
            <div class="text-sm font-medium">{{ item.label }}</div>
            <div v-if="item.value" class="text-xs text-muted-foreground">{{ item.value }}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
