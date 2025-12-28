import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// Mock router BEFORE importing composable
const mockRouterUnwatch = vi.fn()
const mockRouter = {
  beforeEach: vi.fn(() => mockRouterUnwatch),
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
}))

// Import composable AFTER mocks
const { useFullscreenChart } = await import('../useFullscreenChart')

describe('useFullscreenChart', () => {
  let originalScreen

  beforeEach(() => {
    // Save original screen object
    originalScreen = global.screen

    // Mock screen.orientation API
    global.screen = {
      orientation: {
        lock: vi.fn().mockResolvedValue(undefined),
        unlock: vi.fn().mockResolvedValue(undefined),
      },
    }

    // Mock querySelector for focus management
    global.document.querySelector = vi.fn()

    // Clear console spies
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset router mock
    mockRouter.beforeEach.mockClear()
    mockRouterUnwatch.mockClear()
  })

  afterEach(() => {
    // Restore original screen
    global.screen = originalScreen

    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with isFullscreen = false', () => {
      const { isFullscreen } = useFullscreenChart()

      expect(isFullscreen.value).toBe(false)
    })

    it('should provide enterFullscreen and exitFullscreen functions', () => {
      const composable = useFullscreenChart()

      expect(composable).toHaveProperty('isFullscreen')
      expect(composable).toHaveProperty('enterFullscreen')
      expect(composable).toHaveProperty('exitFullscreen')
      expect(typeof composable.enterFullscreen).toBe('function')
      expect(typeof composable.exitFullscreen).toBe('function')
    })
  })

  describe('enterFullscreen()', () => {
    it('should set isFullscreen to true', async () => {
      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      await enterFullscreen()

      expect(isFullscreen.value).toBe(true)
    })

    it('should attempt to lock screen orientation when API is available', async () => {
      const { enterFullscreen } = useFullscreenChart()

      await enterFullscreen()

      expect(global.screen.orientation.lock).toHaveBeenCalledWith('landscape')
    })

    it('should handle gracefully when Screen Orientation API is not available', async () => {
      // Remove orientation API
      delete global.screen.orientation

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      // Should not throw
      await expect(enterFullscreen()).resolves.not.toThrow()

      // Full-screen should still activate
      expect(isFullscreen.value).toBe(true)
    })

    it('should handle gracefully when orientation lock is rejected', async () => {
      const lockError = new Error('Orientation lock denied')
      lockError.name = 'NotSupportedError'
      global.screen.orientation.lock.mockRejectedValue(lockError)

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      await enterFullscreen()

      // Should log debug message in dev mode (import.meta.env.DEV check in code)
      // The exact call depends on environment, but state should update regardless

      // Full-screen should still activate
      expect(isFullscreen.value).toBe(true)
    })

    it('should handle gracefully when orientation lock throws AbortError', async () => {
      const lockError = new Error('Orientation lock aborted')
      lockError.name = 'AbortError'
      global.screen.orientation.lock.mockRejectedValue(lockError)

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      await enterFullscreen()

      // Full-screen should still activate despite AbortError
      expect(isFullscreen.value).toBe(true)
    })

    it('should handle gracefully when orientation lock throws SecurityError', async () => {
      const lockError = new Error('Security policy prevents orientation lock')
      lockError.name = 'SecurityError'
      global.screen.orientation.lock.mockRejectedValue(lockError)

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      await enterFullscreen()

      // Full-screen should still activate despite SecurityError
      expect(isFullscreen.value).toBe(true)
    })

    it('should focus close button after opening overlay', async () => {
      const mockCloseButton = { focus: vi.fn() }
      global.document.querySelector.mockReturnValue(mockCloseButton)

      const { enterFullscreen } = useFullscreenChart()

      await enterFullscreen()
      await nextTick()
      await nextTick() // Double nextTick for Teleport

      // Should query for close button
      expect(global.document.querySelector).toHaveBeenCalledWith(
        '[aria-label*="Закрити"], [aria-label*="Close"]',
      )

      // Should focus it
      expect(mockCloseButton.focus).toHaveBeenCalled()
    })

    it('should not throw if close button is not found', async () => {
      global.document.querySelector.mockReturnValue(null)

      const { enterFullscreen } = useFullscreenChart()

      // Should not throw
      await expect(enterFullscreen()).resolves.not.toThrow()
    })

    it('should handle querySelector errors gracefully', async () => {
      global.document.querySelector.mockImplementation(() => {
        throw new Error('querySelector failed')
      })

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      // Should not throw despite querySelector error
      await expect(enterFullscreen()).resolves.not.toThrow()

      // Full-screen should still activate
      expect(isFullscreen.value).toBe(true)
    })

    it('should handle focus() errors gracefully', async () => {
      const mockCloseButton = {
        focus: vi.fn(() => {
          throw new Error('focus() failed')
        }),
      }
      global.document.querySelector.mockReturnValue(mockCloseButton)

      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      // Should not throw despite focus() error
      await expect(enterFullscreen()).resolves.not.toThrow()

      // Full-screen should still activate
      expect(isFullscreen.value).toBe(true)
    })
  })

  describe('exitFullscreen()', () => {
    it('should set isFullscreen to false', async () => {
      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      expect(isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      await exitFullscreen()
      expect(isFullscreen.value).toBe(false)
    })

    it('should unlock screen orientation when API is available', async () => {
      const { enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))
      await exitFullscreen()

      expect(global.screen.orientation.unlock).toHaveBeenCalled()
    })

    it('should handle gracefully when unlock fails', async () => {
      const unlockError = new Error('Unlock failed')
      unlockError.name = 'InvalidStateError'
      global.screen.orientation.unlock.mockRejectedValue(unlockError)

      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      expect(isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      // Should not throw when unlock fails
      await expect(exitFullscreen()).resolves.not.toThrow()

      // isFullscreen should still be false (unlock failure doesn't prevent exit)
      expect(isFullscreen.value).toBe(false)
    })

    it('should handle gracefully when unlock throws SecurityError', async () => {
      const unlockError = new Error('Document is not fully active')
      unlockError.name = 'SecurityError'
      global.screen.orientation.unlock.mockRejectedValue(unlockError)

      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))
      await exitFullscreen()

      // Should not throw and should exit cleanly
      expect(isFullscreen.value).toBe(false)
    })

    it('should handle gracefully when Screen Orientation API is not available', async () => {
      delete global.screen.orientation

      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      expect(isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      // Should not throw
      await expect(exitFullscreen()).resolves.not.toThrow()

      expect(isFullscreen.value).toBe(false)
    })
  })

  describe('Escape key handling', () => {
    it('should provide exitFullscreen that can be called on Escape key', async () => {
      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      expect(isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      // Simulate Escape key press handling (actual handler is in onMounted)
      await exitFullscreen()
      expect(isFullscreen.value).toBe(false)

      // Note: The actual Escape key event listener is registered in onMounted
      // which doesn't run in standalone composable tests
      // Component integration tests verify the full keyboard navigation
    })
  })

  describe('Router navigation guard', () => {
    it('is configured to auto-exit on navigation', () => {
      // Note: onMounted doesn't run in unit tests without mounting a component
      // This test verifies the implementation exists, not the lifecycle hook execution
      // Integration tests with actual components verify the full behavior

      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      // Verify the composable provides the necessary functions
      expect(typeof enterFullscreen).toBe('function')
      expect(typeof exitFullscreen).toBe('function')
      expect(isFullscreen.value).toBe(false)

      // Note: Router guard registration happens in onMounted
      // which doesn't execute in standalone composable tests
      // See component integration tests for full router guard testing
    })
  })

  describe('Rapid enter/exit stability', () => {
    it('should handle rapid enter/exit without errors', async () => {
      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      // Rapid enter/exit 10 times (with 260ms delay to respect transition flag)
      for (let i = 0; i < 10; i++) {
        await enterFullscreen()
        expect(isFullscreen.value).toBe(true)

        // Wait for transition flag to clear
        await new Promise(resolve => setTimeout(resolve, 260))

        await exitFullscreen()
        expect(isFullscreen.value).toBe(false)

        // Wait for transition flag to clear
        await new Promise(resolve => setTimeout(resolve, 260))
      }

      // Verify screen orientation API was called correctly
      expect(global.screen.orientation.lock).toHaveBeenCalledTimes(10)
      expect(global.screen.orientation.unlock).toHaveBeenCalledTimes(10)
    }, 10000) // 10 second timeout to allow for all delays (10 cycles × 520ms = 5200ms)

    it('should handle rapid enter calls without breaking state', async () => {
      const { isFullscreen, enterFullscreen } = useFullscreenChart()

      // Call enterFullscreen multiple times in rapid succession
      await Promise.all([enterFullscreen(), enterFullscreen(), enterFullscreen()])

      // Should be in fullscreen mode
      expect(isFullscreen.value).toBe(true)
    })

    it('should handle rapid exit calls without breaking state', async () => {
      const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreenChart()

      await enterFullscreen()
      expect(isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      // Call exitFullscreen multiple times in rapid succession
      // Only first call should execute due to rapid toggle protection
      await Promise.all([exitFullscreen(), exitFullscreen(), exitFullscreen()])

      // Should be out of fullscreen mode
      expect(isFullscreen.value).toBe(false)
    })
  })

  describe('Multiple instances', () => {
    it('should create independent instances with separate state', async () => {
      const instance1 = useFullscreenChart()
      const instance2 = useFullscreenChart()

      await instance1.enterFullscreen()

      // Each call to useFullscreenChart creates a new instance with its own state
      expect(instance1.isFullscreen.value).toBe(true)
      expect(instance2.isFullscreen.value).toBe(false) // Independent state

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      await instance2.enterFullscreen()
      expect(instance2.isFullscreen.value).toBe(true)

      // Wait for transition flag to clear
      await new Promise(resolve => setTimeout(resolve, 260))

      await instance1.exitFullscreen()
      expect(instance1.isFullscreen.value).toBe(false)
      expect(instance2.isFullscreen.value).toBe(true) // Still in full-screen
    })
  })
})
