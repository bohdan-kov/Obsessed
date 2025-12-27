import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Target,
  Users,
  Dumbbell,
  FileText,
  Calendar,
  MoreHorizontal,
  Settings,
  HelpCircle,
  Search,
} from 'lucide-vue-next'

/**
 * Shared navigation composable for AppSidebar and MobileNav
 * Provides navigation items, active route checking, and user profile utilities
 */
export function useNavigation() {
  const router = useRouter()
  const route = useRoute()
  const { t } = useI18n()
  const { displayName } = useAuth()

  // Main navigation items - computed for reactive i18n
  const mainNavItems = computed(() => [
    {
      name: t('common.nav.dashboard.name'),
      route: 'Dashboard',
      icon: LayoutDashboard,
      description: t('common.nav.dashboard.description'),
    },
    {
      name: t('common.nav.workouts.name'),
      route: 'Workouts',
      icon: Activity,
      description: t('common.nav.workouts.description'),
    },
    {
      name: t('common.nav.analytics.name'),
      route: 'Analytics',
      icon: BarChart3,
      description: t('common.nav.analytics.description'),
    },
    {
      name: t('common.nav.goals.name'),
      route: 'Goals',
      icon: Target,
      description: t('common.nav.goals.description'),
    },
    {
      name: t('common.nav.community.name'),
      route: 'Community',
      icon: Users,
      description: t('common.nav.community.description'),
    },
  ])

  // Library section items - computed for reactive i18n
  const libraryItems = computed(() => [
    {
      name: t('common.nav.library.exercises.name'),
      route: 'Exercises',
      icon: Dumbbell,
      description: t('common.nav.library.exercises.description'),
    },
    {
      name: t('common.nav.library.workoutPlans.name'),
      route: 'WorkoutPlans',
      icon: FileText,
      description: t('common.nav.library.workoutPlans.description'),
    },
    {
      name: t('common.nav.library.schedule.name'),
      route: 'Schedule',
      icon: Calendar,
      description: t('common.nav.library.schedule.description'),
    },
    {
      name: t('common.nav.library.more.name'),
      route: 'More',
      icon: MoreHorizontal,
      description: t('common.nav.library.more.description'),
    },
  ])

  // Footer navigation items - computed for reactive i18n
  const footerItems = computed(() => [
    {
      name: t('common.nav.settings.name'),
      route: 'Settings',
      icon: Settings,
      description: t('common.nav.settings.description'),
    },
    {
      name: t('common.nav.help.name'),
      route: 'Help',
      icon: HelpCircle,
      description: t('common.nav.help.description'),
    },
    {
      name: t('common.nav.search.name'),
      route: 'Search',
      icon: Search,
      description: t('common.nav.search.description'),
    },
  ])

  /**
   * Get user initials for avatar fallback
   * Returns 'OB' (Obsessed) if no display name is set
   */
  const userInitials = computed(() => {
    if (!displayName.value) return 'OB'
    return displayName.value
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  /**
   * Check if a route is currently active
   * @param {string} routeName - Route name to check
   * @returns {boolean} True if route is active
   */
  function isActive(routeName) {
    return route.name === routeName
  }

  /**
   * Navigate to a route
   * @param {string} routeName - Route name to navigate to
   */
  function navigateTo(routeName) {
    router.push({ name: routeName })
  }

  return {
    // Navigation items
    mainNavItems,
    libraryItems,
    footerItems,

    // User utilities
    userInitials,

    // Navigation functions
    isActive,
    navigateTo,
  }
}
