<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  workout: {
    type: Object,
    required: true,
  },
})

const { locale } = useI18n()

const formattedDate = computed(() => {
  const date = props.workout.startedAt?.toDate
    ? props.workout.startedAt.toDate()
    : props.workout.startedAt
      ? new Date(props.workout.startedAt)
      : new Date()

  return date.toLocaleDateString(locale.value, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})
</script>

<template>
  <!-- Hide on mobile since date is shown in mobile page header -->
  <div class="hidden md:block">
    <!-- Date Heading (visible on desktop/tablet) -->
    <h1 class="text-3xl font-bold">
      {{ formattedDate }}
    </h1>
  </div>
</template>
