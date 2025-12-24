<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail, Book, Lightbulb, MessageSquare } from 'lucide-vue-next'

const { t } = useI18n()
const expandedFaq = ref(['faq-1'])

const faqItems = [
  {
    id: 'faq-1',
    question: t('help.sections.faq.questions.howToLog.q'),
    answer: t('help.sections.faq.questions.howToLog.a'),
  },
  {
    id: 'faq-2',
    question: t('help.sections.faq.questions.howToTrack.q'),
    answer: t('help.sections.faq.questions.howToTrack.a'),
  },
  {
    id: 'faq-3',
    question: t('help.sections.faq.questions.units.q'),
    answer: t('help.sections.faq.questions.units.a'),
  },
  {
    id: 'faq-4',
    question: t('help.sections.faq.questions.sync.q'),
    answer: t('help.sections.faq.questions.sync.a'),
  },
]
</script>

<template>
  <div class="container max-w-4xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">{{ t('help.title') }}</h1>
      <p class="text-muted-foreground">{{ t('help.subtitle') }}</p>
    </div>

    <!-- FAQ Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle class="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{{ t('help.sections.faq.title') }}</CardTitle>
            <CardDescription>{{ t('common.nav.help.description') }}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" v-model="expandedFaq" class="w-full">
          <AccordionItem v-for="item in faqItems" :key="item.id" :value="item.id">
            <AccordionTrigger class="text-left hover:no-underline">
              <span class="font-medium">{{ item.question }}</span>
            </AccordionTrigger>
            <AccordionContent>
              <p class="text-muted-foreground leading-relaxed">{{ item.answer }}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <!-- Contact Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"
          >
            <Mail class="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <CardTitle>{{ t('help.sections.contact.title') }}</CardTitle>
            <CardDescription>{{ t('help.sections.contact.description') }}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" class="justify-start gap-3 h-auto py-4" disabled>
            <Mail class="w-5 h-5 text-muted-foreground" />
            <div class="text-left">
              <div class="text-sm font-medium">{{ t('help.sections.contact.email') }}</div>
              <div class="text-xs text-muted-foreground">support@obsessed.app</div>
            </div>
          </Button>
          <Button variant="outline" class="justify-start gap-3 h-auto py-4" disabled>
            <MessageSquare class="w-5 h-5 text-muted-foreground" />
            <div class="text-left">
              <div class="text-sm font-medium">{{ t('help.sections.contact.feedback') }}</div>
              <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Resources Section -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"
          >
            <Book class="w-5 h-5 text-green-500" />
          </div>
          <div>
            <CardTitle>{{ t('help.sections.resources.title') }}</CardTitle>
            <CardDescription>{{ t('common.nav.help.description') }}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <Button variant="ghost" class="w-full justify-start gap-3 h-auto py-4" disabled>
            <Lightbulb class="w-5 h-5 text-muted-foreground shrink-0" />
            <div class="text-left flex-1">
              <div class="text-sm font-medium">
                {{ t('help.sections.resources.gettingStarted') }}
              </div>
              <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
            </div>
          </Button>
          <Button variant="ghost" class="w-full justify-start gap-3 h-auto py-4" disabled>
            <Book class="w-5 h-5 text-muted-foreground shrink-0" />
            <div class="text-left flex-1">
              <div class="text-sm font-medium">{{ t('help.sections.resources.userGuide') }}</div>
              <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
            </div>
          </Button>
          <Button variant="ghost" class="w-full justify-start gap-3 h-auto py-4" disabled>
            <HelpCircle class="w-5 h-5 text-muted-foreground shrink-0" />
            <div class="text-left flex-1">
              <div class="text-sm font-medium">{{ t('help.sections.resources.tips') }}</div>
              <div class="text-xs text-muted-foreground">{{ t('common.status.comingSoon') }}</div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
