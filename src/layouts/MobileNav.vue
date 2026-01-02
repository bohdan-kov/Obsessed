<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'
import { useNavigation } from '@/composables/useNavigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VisuallyHidden } from 'reka-ui'
import { Dumbbell, LogOut, Menu, Zap } from 'lucide-vue-next'

const { t } = useI18n()
const { displayName, email, photoURL, logout } = useAuth()
const {
  mainNavItems,
  libraryItems,
  footerItems,
  isActive,
  navigateTo: baseNavigateTo,
  userInitials,
} = useNavigation()

const isOpen = ref(false)

// Navigate and close sheet
function navigateTo(routeName) {
  baseNavigateTo(routeName)
  isOpen.value = false
}

// Quick log
function quickLog() {
  baseNavigateTo('Workouts')
  isOpen.value = false
}

// Logout
async function handleLogout() {
  await logout()
  isOpen.value = false
}
</script>

<template>
  <div class="lg:hidden">
    <Sheet v-model:open="isOpen">
      <SheetTrigger as-child>
        <Button variant="ghost" size="icon" class="shrink-0">
          <Menu class="w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" class="w-64 p-0 bg-background mobile-nav-sheet">
        <VisuallyHidden>
          <SheetTitle>{{ t('common.nav.mobileMenu.title') }}</SheetTitle>
          <SheetDescription>{{ t('common.nav.mobileMenu.description') }}</SheetDescription>
        </VisuallyHidden>

        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="mobile-nav-header flex items-center h-16 px-4 border-b border-border">
            <div class="flex items-center gap-2.5">
              <div
                class="mobile-nav-logo w-7 h-7 rounded-md bg-linear-to-br from-red-500 to-red-600 flex items-center justify-center"
              >
                <Dumbbell class="mobile-nav-logo-icon w-[18px] h-[18px] text-white" />
              </div>
              <span class="mobile-nav-brand text-lg font-bold tracking-tight bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Obsessed</span>
            </div>
          </div>

          <!-- Navigation with ScrollArea -->
          <ScrollArea class="flex-1 mobile-nav-scroll px-3 py-4">
            <div class="mobile-nav-content space-y-0.5">
              <!-- Quick Log Button -->
              <Button
                @click="quickLog"
                class="mobile-nav-quick-log w-full justify-center gap-2 mb-6 h-10 px-4 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_2px_8px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_12px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 transition-all"
              >
                <Zap class="w-4 h-4 shrink-0" />
                <span class="text-sm font-medium">{{ t('common.nav.quickLog') }}</span>
              </Button>

              <!-- Main Navigation Items -->
              <div class="mobile-nav-main space-y-0.5 mb-6">
                <Button
                  v-for="item in mainNavItems"
                  :key="item.route"
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'mobile-nav-item w-full justify-start gap-2.5 h-10 px-3 text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span class="text-sm">{{ item.name }}</span>
                </Button>
              </div>

              <!-- Library Section -->
              <div class="mobile-nav-library space-y-0.5">
                <div class="mobile-nav-library-label px-3 py-2 mb-2">
                  <span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    {{ t('common.nav.library.label') }}
                  </span>
                </div>
                <Button
                  v-for="item in libraryItems"
                  :key="item.route"
                  variant="ghost"
                  @click="navigateTo(item.route)"
                  :class="[
                    'mobile-nav-item w-full justify-start gap-2.5 h-10 px-3 text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                    isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                  ]"
                >
                  <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                  <span class="text-sm">{{ item.name }}</span>
                </Button>
              </div>
            </div>
          </ScrollArea>

          <!-- Footer Section -->
          <div class="mobile-nav-footer border-t border-border">
            <div class="px-3 py-2 space-y-0.5">
              <Button
                v-for="item in footerItems"
                :key="item.route"
                variant="ghost"
                @click="navigateTo(item.route)"
                :class="[
                  'mobile-nav-item w-full justify-start gap-2.5 h-10 px-3 text-muted-foreground hover:bg-accent hover:text-foreground transition-all',
                  isActive(item.route) && 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500',
                ]"
              >
                <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
                <span class="text-sm">{{ item.name }}</span>
              </Button>
            </div>

            <!-- User Profile -->
            <div class="mobile-nav-profile px-3 pb-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                @click="navigateTo('Profile')"
                class="mobile-nav-profile-btn w-full h-auto p-3 justify-start gap-2.5 hover:bg-accent transition-all"
              >
                <Avatar class="mobile-nav-avatar w-9 h-9 shrink-0 rounded-lg bg-linear-to-br from-red-500 to-orange-500">
                  <AvatarImage :src="photoURL" :alt="displayName" />
                  <AvatarFallback class="rounded-lg text-xs font-semibold">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>

                <div class="flex-1 text-left overflow-hidden min-w-0">
                  <div class="text-sm font-medium truncate">
                    {{ displayName || t('common.user.defaultName') }}
                  </div>
                  <div class="text-xs text-muted-foreground truncate">
                    {{ email }}
                  </div>
                </div>
              </Button>

              <Button
                variant="ghost"
                @click="handleLogout"
                class="mobile-nav-logout w-full justify-start gap-2.5 h-10 px-3 mt-2 text-destructive hover:text-destructive hover:bg-accent"
              >
                <LogOut class="w-[18px] h-[18px] shrink-0" />
                <span class="text-sm">{{ t('common.user.menu.signOut') }}</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
/* Landscape mode optimizations for mobile devices */
/* Apply compact layout for all mobile devices in landscape orientation */
@media (max-width: 767px) and (orientation: landscape) {
  /* Header: Reduce height and padding for landscape mode */
  .mobile-nav-header {
    height: 3rem; /* 48px */
    padding-left: 0.75rem; /* 12px */
    padding-right: 0.75rem;
  }

  /* Logo: Compact size */
  .mobile-nav-logo {
    width: 1.5rem; /* 24px */
    height: 1.5rem;
  }

  .mobile-nav-logo-icon {
    width: 0.875rem; /* 14px */
    height: 0.875rem;
  }

  /* Brand text: Reduce size */
  .mobile-nav-brand {
    font-size: 1rem; /* 16px from 18px */
  }

  /* Scroll area: Reduce vertical padding */
  .mobile-nav-scroll {
    padding-top: 0.5rem; /* 8px from 16px */
    padding-bottom: 0.5rem;
  }

  /* Navigation content: Tighter spacing */
  .mobile-nav-content {
    gap: 0.25rem; /* 4px */
  }

  /* Quick Log button: Reduce height and margin */
  .mobile-nav-quick-log {
    margin-bottom: 0.75rem; /* 12px from 24px */
    height: 2.25rem; /* 36px from 40px */
    padding-left: 0.75rem; /* 12px from 16px */
    padding-right: 0.75rem;
  }

  /* Main navigation: Reduce spacing */
  .mobile-nav-main {
    margin-bottom: 0.75rem; /* 12px from 24px */
  }

  /* Library label: Compact padding */
  .mobile-nav-library-label {
    padding-top: 0.25rem; /* 4px from 8px */
    padding-bottom: 0.25rem;
    margin-bottom: 0.25rem; /* 4px from 8px */
  }

  /* Navigation items: Compact size */
  .mobile-nav-item {
    height: 2.25rem; /* 36px from 40px */
    padding-left: 0.75rem; /* 12px */
    padding-right: 0.75rem;
    gap: 0.5rem; /* 8px from 10px */
  }

  /* Footer section: Optimize for limited vertical space */
  .mobile-nav-footer {
    border-top-width: 1px;
  }

  /* Footer container: Minimal padding */
  .mobile-nav-footer > div:first-child {
    padding-left: 0.75rem; /* 12px */
    padding-right: 0.75rem;
    padding-top: 0.25rem; /* 4px */
    padding-bottom: 0.25rem;
  }

  /* Footer items: Minimal spacing between elements */
  .mobile-nav-footer > div:first-child {
    gap: 0.125rem; /* 2px */
  }

  /* Footer items: More compact than main navigation */
  .mobile-nav-footer .mobile-nav-item {
    height: 2rem; /* 32px */
    padding-left: 0.625rem; /* 10px */
    padding-right: 0.625rem;
    gap: 0.375rem; /* 6px */
  }

  /* Footer icons: Smaller size */
  .mobile-nav-footer .mobile-nav-item :deep(svg) {
    width: 1rem; /* 16px from 18px */
    height: 1rem;
  }

  /* Footer text: Smaller font */
  .mobile-nav-footer .mobile-nav-item .text-sm {
    font-size: 0.8125rem; /* 13px from 14px */
  }

  /* User profile section: Compact layout */
  .mobile-nav-profile {
    padding-left: 0.75rem; /* 12px */
    padding-right: 0.75rem;
    padding-top: 0.25rem; /* 4px */
    padding-bottom: 0.375rem; /* 6px */
    border-top-width: 1px;
  }

  /* Profile button: Reduce padding and spacing */
  .mobile-nav-profile-btn {
    padding: 0.375rem; /* 6px */
    gap: 0.375rem; /* 6px */
    min-height: auto;
  }

  /* Avatar: Smaller in landscape mode */
  .mobile-nav-avatar {
    width: 1.75rem; /* 28px from 36px */
    height: 1.75rem;
  }

  /* Profile name: Smaller font */
  .mobile-nav-profile-btn .text-sm {
    font-size: 0.8125rem; /* 13px from 14px */
    line-height: 1.3;
  }

  /* Profile email: Smaller font */
  .mobile-nav-profile-btn .text-xs {
    font-size: 0.6875rem; /* 11px from 12px */
    line-height: 1.2;
  }

  /* Logout button: Compact size */
  .mobile-nav-logout {
    height: 2rem; /* 32px from 40px */
    padding-left: 0.625rem; /* 10px */
    padding-right: 0.625rem;
    margin-top: 0.25rem; /* 4px */
    gap: 0.375rem; /* 6px */
  }

  /* Logout icon: Smaller size */
  .mobile-nav-logout :deep(svg) {
    width: 1rem; /* 16px from 18px */
    height: 1rem;
  }

  /* Logout text: Smaller font */
  .mobile-nav-logout .text-sm {
    font-size: 0.8125rem; /* 13px from 14px */
  }
}

/* Additional optimization for very short landscape screens */
@media (max-width: 767px) and (orientation: landscape) and (max-height: 400px) {
  /* Header: Ultra compact for limited vertical space */
  .mobile-nav-header {
    height: 2.5rem; /* 40px */
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
  }

  /* Navigation items: Maximum compactness */
  .mobile-nav-item {
    height: 2rem; /* 32px */
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
  }

  /* Quick Log: Reduce height */
  .mobile-nav-quick-log {
    height: 2rem; /* 32px */
    margin-bottom: 0.5rem; /* 8px */
  }

  /* Scroll area: Minimal padding */
  .mobile-nav-scroll {
    padding-top: 0.25rem; /* 4px */
    padding-bottom: 0.25rem;
  }

  /* Library label: Hide to save vertical space */
  .mobile-nav-library-label {
    display: none;
  }

  /* Library section: Reduce spacing */
  .mobile-nav-library {
    margin-top: 0.5rem; /* 8px */
  }

  /* Footer container: Ultra minimal padding */
  .mobile-nav-footer > div:first-child {
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
    padding-top: 0.125rem; /* 2px */
    padding-bottom: 0.125rem;
  }

  /* Footer items: Ultra compact size */
  .mobile-nav-footer .mobile-nav-item {
    height: 1.75rem; /* 28px */
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
    gap: 0.25rem; /* 4px */
  }

  /* Footer icons: Smallest practical size */
  .mobile-nav-footer .mobile-nav-item :deep(svg) {
    width: 0.875rem; /* 14px */
    height: 0.875rem;
  }

  /* Footer text: Smallest readable size */
  .mobile-nav-footer .mobile-nav-item .text-sm {
    font-size: 0.75rem; /* 12px */
  }

  /* Profile section: Ultra compact layout */
  .mobile-nav-profile {
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
    padding-top: 0.125rem; /* 2px */
    padding-bottom: 0.25rem; /* 4px */
  }

  /* Profile button: Minimal padding */
  .mobile-nav-profile-btn {
    padding: 0.25rem; /* 4px */
    gap: 0.25rem; /* 4px */
  }

  /* Avatar: Smallest practical size */
  .mobile-nav-avatar {
    width: 1.5rem; /* 24px */
    height: 1.5rem;
  }

  /* Profile name: Smallest readable font */
  .mobile-nav-profile-btn .text-sm {
    font-size: 0.75rem; /* 12px */
    line-height: 1.2;
  }

  /* Profile email: Smallest readable font */
  .mobile-nav-profile-btn .text-xs {
    font-size: 0.625rem; /* 10px */
    line-height: 1.1;
  }

  /* Logout button: Ultra compact */
  .mobile-nav-logout {
    height: 1.75rem; /* 28px */
    padding-left: 0.5rem; /* 8px */
    padding-right: 0.5rem;
    margin-top: 0.125rem; /* 2px */
    gap: 0.25rem; /* 4px */
  }

  /* Logout icon: Smallest practical size */
  .mobile-nav-logout :deep(svg) {
    width: 0.875rem; /* 14px */
    height: 0.875rem;
  }

  /* Logout text: Smallest readable font */
  .mobile-nav-logout .text-sm {
    font-size: 0.75rem; /* 12px */
  }
}
</style>
