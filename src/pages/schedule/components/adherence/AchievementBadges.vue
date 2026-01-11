<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdherence } from '@/composables/useAdherence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Sparkles } from 'lucide-vue-next'

const { t } = useI18n()
const { achievements, currentStreak } = useAdherence()

// Celebration animation state
const celebrating = ref(false)
const previousStreak = ref(currentStreak.value)

// Watch for streak increases to trigger celebration
watch(currentStreak, (newStreak, oldStreak) => {
  if (newStreak > oldStreak && newStreak >= 2) {
    triggerCelebration()
  }
  previousStreak.value = newStreak
})

function triggerCelebration() {
  celebrating.value = true
  setTimeout(() => {
    celebrating.value = false
  }, 3000)
}

// Group achievements by category
const streakAchievements = computed(() =>
  achievements.value.filter((a) =>
    ['on-fire', 'unstoppable', 'legendary', 'obsessed', 'streak-master'].includes(a.id)
  )
)

const adherenceAchievements = computed(() =>
  achievements.value.filter((a) => ['consistent', 'dedicated', 'perfect'].includes(a.id))
)

const hasAchievements = computed(() => achievements.value.length > 0)

// Get achievement variant (color)
function getAchievementVariant(achievementId) {
  const rarityMap = {
    'on-fire': 'default',
    unstoppable: 'default',
    legendary: 'default',
    obsessed: 'default',
    consistent: 'secondary',
    dedicated: 'secondary',
    perfect: 'default',
    'streak-master': 'default',
  }
  return rarityMap[achievementId] || 'secondary'
}
</script>

<template>
  <Card :class="['achievement-card', celebrating && 'celebrating']">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Award class="w-5 h-5" />
        {{ t('schedule.achievements.title') }}
        <Sparkles v-if="celebrating" class="w-4 h-4 ml-auto text-yellow-500 sparkle-icon" />
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div v-if="hasAchievements" class="space-y-4">
        <!-- Streak Achievements -->
        <div v-if="streakAchievements.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-muted-foreground">
            {{ t('schedule.achievements.streaks') }}
          </h4>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="achievement in streakAchievements"
              :key="achievement.id"
              :variant="getAchievementVariant(achievement.id)"
              class="achievement-badge px-3 py-1.5 text-sm"
            >
              <span class="mr-1.5 text-base">{{ achievement.icon }}</span>
              {{ t(`schedule.achievements.${achievement.id}.name`) }}
            </Badge>
          </div>
        </div>

        <!-- Adherence Achievements -->
        <div v-if="adherenceAchievements.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-muted-foreground">
            {{ t('schedule.achievements.adherence') }}
          </h4>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="achievement in adherenceAchievements"
              :key="achievement.id"
              :variant="getAchievementVariant(achievement.id)"
              class="achievement-badge px-3 py-1.5 text-sm"
            >
              <span class="mr-1.5 text-base">{{ achievement.icon }}</span>
              {{ t(`schedule.achievements.${achievement.id}.name`) }}
            </Badge>
          </div>
        </div>

        <!-- Celebration Message -->
        <div
          v-if="celebrating"
          class="celebration-message text-center py-4 px-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-950 dark:to-orange-950 rounded-lg border-2 border-yellow-400 dark:border-yellow-600"
        >
          <div class="flex items-center justify-center gap-2 mb-1">
            <Sparkles class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span class="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {{ t('schedule.achievements.celebration') }}
            </span>
            <Sparkles class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            {{ t('schedule.achievements.keepGoing', { streak: currentStreak }) }}
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <Award class="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h3 class="font-medium text-sm mb-1">
          {{ t('schedule.achievements.noAchievements') }}
        </h3>
        <p class="text-xs text-muted-foreground">
          {{ t('schedule.achievements.startEarning') }}
        </p>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
/* Achievement card celebration animation */
.achievement-card {
  transition: all 0.3s ease;
}

.achievement-card.celebrating {
  animation: cardPulse 0.5s ease-in-out;
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
}

@keyframes cardPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

/* Achievement badge entrance animation */
.achievement-badge {
  animation: badgeFadeIn 0.4s ease-out backwards;
  transition: all 0.2s ease;
}

.achievement-badge:hover {
  transform: scale(1.05);
}

.achievement-badge:nth-child(1) {
  animation-delay: 0ms;
}
.achievement-badge:nth-child(2) {
  animation-delay: 100ms;
}
.achievement-badge:nth-child(3) {
  animation-delay: 200ms;
}
.achievement-badge:nth-child(4) {
  animation-delay: 300ms;
}
.achievement-badge:nth-child(5) {
  animation-delay: 400ms;
}

@keyframes badgeFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Sparkle icon animation */
.sparkle-icon {
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: rotate(180deg) scale(1.2);
  }
}

/* Celebration message animation */
.celebration-message {
  animation: messageSlideIn 0.5s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Accessibility: Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .achievement-card,
  .achievement-badge,
  .sparkle-icon,
  .celebration-message {
    animation: none !important;
  }

  .achievement-card.celebrating {
    box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);
  }

  .achievement-badge:hover {
    transform: none;
  }
}
</style>
