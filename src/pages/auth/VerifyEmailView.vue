<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const isSending = ref(false)
const localError = ref(null)
const emailSent = ref(false)
const cooldown = ref(0)

let cooldownInterval = null

async function sendVerification() {
  if (cooldown.value > 0) return

  isSending.value = true
  localError.value = null
  authStore.clearError()

  try {
    await authStore.sendEmailVerification()
    emailSent.value = true

    // Start 60 second cooldown
    cooldown.value = 60
    cooldownInterval = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) {
        clearInterval(cooldownInterval)
        emailSent.value = false
      }
    }, 1000)
  } catch (error) {
    localError.value = error.message || 'Failed to send verification email'
  } finally {
    isSending.value = false
  }
}

async function handleSignOut() {
  try {
    await authStore.signOut()
    router.push({ name: 'Login' })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Sign out error:', error)
    }
  }
}

function checkVerification() {
  // Reload user to check verification status
  window.location.reload()
}

const displayError = computed(() => localError.value || authStore.error)
const buttonText = computed(() => {
  if (cooldown.value > 0) return `Resend in ${cooldown.value}s`
  if (emailSent.value) return 'Email Sent'
  return 'Resend Verification Email'
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail class="h-8 w-8 text-primary" />
        </div>
        <CardTitle class="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We've sent a verification email to
          <span class="font-medium text-foreground">{{ authStore.email }}</span>
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <Alert v-if="emailSent" variant="default" class="border-green-500">
          <CheckCircle2 class="h-4 w-4 text-green-500" />
          <AlertDescription>
            Verification email sent! Check your inbox and spam folder.
          </AlertDescription>
        </Alert>

        <Alert v-if="displayError" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ displayError }}</AlertDescription>
        </Alert>

        <div class="rounded-lg border p-4 space-y-3">
          <h4 class="text-sm font-medium">Next steps:</h4>
          <ol class="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Check your email inbox</li>
            <li>Click the verification link in the email</li>
            <li>Return here and click "I've verified my email"</li>
          </ol>
        </div>

        <div class="space-y-2">
          <Button
            variant="outline"
            class="w-full"
            @click="sendVerification"
            :disabled="isSending || cooldown > 0"
          >
            <Loader2
              v-if="isSending"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ buttonText }}
          </Button>

          <Button
            class="w-full"
            @click="checkVerification"
          >
            I've verified my email
          </Button>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col space-y-2">
        <div class="text-center text-sm text-muted-foreground">
          Signed in as {{ authStore.email }}
        </div>
        <Button
          variant="ghost"
          class="text-sm"
          @click="handleSignOut"
        >
          Sign out
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
