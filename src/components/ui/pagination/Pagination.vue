<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <nav
    role="navigation"
    aria-label="Pagination"
    class="flex items-center justify-between gap-2 w-full"
  >
    <!-- Previous button -->
    <Button
      variant="outline"
      size="icon"
      :disabled="currentPage === 1"
      @click="$emit('update:currentPage', currentPage - 1)"
      class="min-h-11 min-w-11"
    >
      <ChevronLeft class="h-4 w-4" />
      <span class="sr-only">{{ t('pagination.previous') }}</span>
    </Button>

    <!-- Page numbers -->
    <div class="flex items-center gap-1 flex-1 justify-center">
      <!-- First page (always show on desktop, mobile only if current) -->
      <Button
        v-if="visiblePages.includes(1) || !isMobile"
        variant="outline"
        size="icon"
        :class="currentPage === 1 ? 'bg-primary text-primary-foreground' : ''"
        @click="$emit('update:currentPage', 1)"
        class="min-h-11 min-w-11"
      >
        1
      </Button>

      <!-- Left ellipsis -->
      <span v-if="showLeftEllipsis" class="px-2 text-muted-foreground">...</span>

      <!-- Middle pages -->
      <Button
        v-for="page in middlePages"
        :key="page"
        variant="outline"
        size="icon"
        :class="currentPage === page ? 'bg-primary text-primary-foreground' : ''"
        @click="$emit('update:currentPage', page)"
        class="min-h-11 min-w-11"
      >
        {{ page }}
      </Button>

      <!-- Right ellipsis -->
      <span v-if="showRightEllipsis" class="px-2 text-muted-foreground">...</span>

      <!-- Last page (always show on desktop, mobile only if current) -->
      <Button
        v-if="totalPages > 1 && (visiblePages.includes(totalPages) || !isMobile)"
        variant="outline"
        size="icon"
        :class="currentPage === totalPages ? 'bg-primary text-primary-foreground' : ''"
        @click="$emit('update:currentPage', totalPages)"
        class="min-h-11 min-w-11"
      >
        {{ totalPages }}
      </Button>
    </div>

    <!-- Next button -->
    <Button
      variant="outline"
      size="icon"
      :disabled="currentPage === totalPages"
      @click="$emit('update:currentPage', currentPage + 1)"
      class="min-h-11 min-w-11"
    >
      <ChevronRight class="h-4 w-4" />
      <span class="sr-only">{{ t('pagination.next') }}</span>
    </Button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  /**
   * Current active page (1-indexed)
   */
  currentPage: {
    type: Number,
    required: true,
    validator: (value) => value >= 1,
  },
  /**
   * Total number of pages
   */
  totalPages: {
    type: Number,
    required: true,
    validator: (value) => value >= 1,
  },
  /**
   * Number of page buttons to show on each side of current page
   */
  siblingCount: {
    type: Number,
    default: 1,
  },
})

defineEmits(['update:currentPage'])

// Detect mobile viewport
const isMobile = useMediaQuery('(max-width: 640px)')

/**
 * Calculate which pages to show
 */
const visiblePages = computed(() => {
  const pages = []
  const { currentPage, totalPages, siblingCount } = props

  // On mobile, show fewer pages
  const actualSiblingCount = isMobile.value ? 0 : siblingCount

  // Calculate range around current page
  const leftSibling = Math.max(currentPage - actualSiblingCount, 2)
  const rightSibling = Math.min(currentPage + actualSiblingCount, totalPages - 1)

  // Add all pages in range
  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i)
  }

  return pages
})

/**
 * Pages to show between first and last (excluding them)
 */
const middlePages = computed(() => {
  return visiblePages.value.filter((page) => page !== 1 && page !== props.totalPages)
})

/**
 * Show left ellipsis if gap exists
 */
const showLeftEllipsis = computed(() => {
  const firstMiddlePage = middlePages.value[0]
  return firstMiddlePage && firstMiddlePage > 2
})

/**
 * Show right ellipsis if gap exists
 */
const showRightEllipsis = computed(() => {
  const lastMiddlePage = middlePages.value[middlePages.value.length - 1]
  return lastMiddlePage && lastMiddlePage < props.totalPages - 1
})
</script>
