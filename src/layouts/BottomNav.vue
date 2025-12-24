<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Activity, BarChart3, Search } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// Bottom navigation items (most important for mobile)
const navItems = computed(() => [
  {
    name: t('common.nav.dashboard.name'),
    route: 'Dashboard',
    icon: LayoutDashboard,
    ariaLabel: t('common.nav.dashboard.description'),
  },
  {
    name: t('common.nav.workouts.name'),
    route: 'Workouts',
    icon: Activity,
    ariaLabel: t('common.nav.workouts.description'),
  },
  {
    name: t('common.nav.analytics.name'),
    route: 'Analytics',
    icon: BarChart3,
    ariaLabel: t('common.nav.analytics.description'),
  },
  {
    name: t('common.nav.search.name'),
    route: 'Search',
    icon: Search,
    ariaLabel: t('common.nav.search.description'),
  },
])

// Check if route is active
function isActive(routeName) {
  return route.name === routeName
}

// Navigate to route
function navigateTo(routeName) {
  router.push({ name: routeName })
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border md:hidden"
    role="navigation"
    aria-label="Bottom navigation"
  >
    <div class="grid grid-cols-4 h-16">
      <Button
        v-for="item in navItems"
        :key="item.route"
        variant="ghost"
        @click="navigateTo(item.route)"
        :aria-label="item.ariaLabel"
        :aria-current="isActive(item.route) ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-1 h-full rounded-none border-0 hover:bg-accent transition-colors"
        :class="[
          isActive(item.route)
            ? 'text-primary bg-accent'
            : 'text-muted-foreground hover:text-foreground',
        ]"
      >
        <component
          :is="item.icon"
          :class="['w-5 h-5 shrink-0', isActive(item.route) && 'text-primary']"
        />
        <span class="text-xs font-medium truncate max-w-full px-1">{{ item.name }}</span>
      </Button>
    </div>
  </nav>
</template>
