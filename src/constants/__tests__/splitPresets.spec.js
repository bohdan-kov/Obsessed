import { describe, it, expect } from 'vitest'
import {
  SPLIT_PRESETS,
  getAllPresets,
  getPresetsByDifficulty,
  getPresetById,
  getPresetDifficulty,
  getPresetName,
  getPresetDescription,
  getTemplateName,
} from '@/constants/splitPresets'

describe('splitPresets', () => {
  describe('SPLIT_PRESETS structure', () => {
    it('should have beginner, intermediate, and advanced categories', () => {
      expect(SPLIT_PRESETS).toHaveProperty('beginner')
      expect(SPLIT_PRESETS).toHaveProperty('intermediate')
      expect(SPLIT_PRESETS).toHaveProperty('advanced')
      expect(Array.isArray(SPLIT_PRESETS.beginner)).toBe(true)
      expect(Array.isArray(SPLIT_PRESETS.intermediate)).toBe(true)
      expect(Array.isArray(SPLIT_PRESETS.advanced)).toBe(true)
    })

    it('should have correct number of presets per difficulty', () => {
      expect(SPLIT_PRESETS.beginner.length).toBe(2) // Full Body 3x, Upper/Lower 4x
      expect(SPLIT_PRESETS.intermediate.length).toBe(1) // PPL 6x
      expect(SPLIT_PRESETS.advanced.length).toBe(1) // Arnold Split
    })

    it('should have valid preset structure', () => {
      const allPresets = getAllPresets()

      allPresets.forEach((preset) => {
        // Required fields
        expect(preset).toHaveProperty('id')
        expect(preset).toHaveProperty('name')
        expect(preset).toHaveProperty('description')
        expect(preset).toHaveProperty('frequency')
        expect(preset).toHaveProperty('difficulty')
        expect(preset).toHaveProperty('templates')

        // Name and description should be bilingual objects
        expect(preset.name).toHaveProperty('en')
        expect(preset.name).toHaveProperty('uk')
        expect(preset.description).toHaveProperty('en')
        expect(preset.description).toHaveProperty('uk')

        // Frequency should be a number
        expect(typeof preset.frequency).toBe('number')
        expect(preset.frequency).toBeGreaterThan(0)
        expect(preset.frequency).toBeLessThanOrEqual(7)

        // Difficulty should be valid
        expect(['beginner', 'intermediate', 'advanced']).toContain(preset.difficulty)

        // Templates should be an array with at least one template
        expect(Array.isArray(preset.templates)).toBe(true)
        expect(preset.templates.length).toBeGreaterThan(0)
      })
    })

    it('should have valid template structure', () => {
      const allPresets = getAllPresets()

      allPresets.forEach((preset) => {
        preset.templates.forEach((template) => {
          // Template should have name and exercises
          expect(template).toHaveProperty('name')
          expect(template).toHaveProperty('exercises')

          // Name should be bilingual
          expect(template.name).toHaveProperty('en')
          expect(template.name).toHaveProperty('uk')

          // Exercises should be an array
          expect(Array.isArray(template.exercises)).toBe(true)
          expect(template.exercises.length).toBeGreaterThan(0)

          // Each exercise should have required fields
          template.exercises.forEach((exercise) => {
            expect(exercise).toHaveProperty('exerciseId')
            expect(exercise).toHaveProperty('sets')
            expect(exercise).toHaveProperty('reps')
            expect(exercise).toHaveProperty('restTime')

            // Validate exercise data types
            expect(typeof exercise.exerciseId).toBe('string')
            expect(typeof exercise.sets).toBe('number')
            expect(typeof exercise.reps).toBe('number')
            expect(typeof exercise.restTime).toBe('number')

            // Validate ranges
            expect(exercise.sets).toBeGreaterThan(0)
            expect(exercise.sets).toBeLessThanOrEqual(10)
            expect(exercise.reps).toBeGreaterThan(0)
            expect(exercise.reps).toBeLessThanOrEqual(100)
            expect(exercise.restTime).toBeGreaterThanOrEqual(30)
            expect(exercise.restTime).toBeLessThanOrEqual(300)
          })
        })
      })
    })

    it('should use valid exercise IDs', () => {
      // List of known valid exercise slugs from defaultExercises
      const validExerciseIds = [
        'barbell-squat',
        'barbell-bench-press',
        'barbell-row',
        'overhead-press',
        'lat-pulldown',
        'plank',
        'deadlift',
        'incline-dumbbell-press',
        'pull-ups',
        'seated-dumbbell-press',
        'leg-press',
        'bicycle-crunch',
        'front-squat',
        'dumbbell-bench-press',
        'seated-cable-row',
        'arnold-press',
        'romanian-deadlift',
        'russian-twist',
        'dumbbell-curl',
        'tricep-pushdown',
        'leg-curl',
        'standing-calf-raise',
        'hammer-curl',
        'overhead-dumbbell-extension',
        'walking-lunges',
        'leg-extension',
        'seated-calf-raise',
        'lateral-raise',
        'face-pull',
        'barbell-curl',
        'dumbbell-fly',
        'preacher-curl',
        'dips',
        'close-grip-bench-press',
      ]

      const allPresets = getAllPresets()
      const usedExerciseIds = new Set()

      allPresets.forEach((preset) => {
        preset.templates.forEach((template) => {
          template.exercises.forEach((exercise) => {
            usedExerciseIds.add(exercise.exerciseId)
            expect(validExerciseIds).toContain(exercise.exerciseId)
          })
        })
      })

      // Ensure we're actually using multiple exercises
      expect(usedExerciseIds.size).toBeGreaterThan(10)
    })
  })

  describe('getAllPresets', () => {
    it('should return all presets from all difficulty levels', () => {
      const allPresets = getAllPresets()
      expect(allPresets.length).toBe(4) // 2 beginner + 1 intermediate + 1 advanced
    })

    it('should return array with correct preset IDs', () => {
      const allPresets = getAllPresets()
      const presetIds = allPresets.map((p) => p.id)
      expect(presetIds).toContain('full-body-3x')
      expect(presetIds).toContain('upper-lower-4x')
      expect(presetIds).toContain('ppl-6x')
      expect(presetIds).toContain('arnold-split')
    })
  })

  describe('getPresetsByDifficulty', () => {
    it('should return beginner presets', () => {
      const beginnerPresets = getPresetsByDifficulty('beginner')
      expect(beginnerPresets.length).toBe(2)
      expect(beginnerPresets.every((p) => p.difficulty === 'beginner')).toBe(true)
    })

    it('should return intermediate presets', () => {
      const intermediatePresets = getPresetsByDifficulty('intermediate')
      expect(intermediatePresets.length).toBe(1)
      expect(intermediatePresets[0].id).toBe('ppl-6x')
    })

    it('should return advanced presets', () => {
      const advancedPresets = getPresetsByDifficulty('advanced')
      expect(advancedPresets.length).toBe(1)
      expect(advancedPresets[0].id).toBe('arnold-split')
    })

    it('should return empty array for invalid difficulty', () => {
      const result = getPresetsByDifficulty('invalid')
      expect(result).toEqual([])
    })
  })

  describe('getPresetById', () => {
    it('should return preset for valid ID', () => {
      const preset = getPresetById('full-body-3x')
      expect(preset).toBeTruthy()
      expect(preset.id).toBe('full-body-3x')
      expect(preset.difficulty).toBe('beginner')
    })

    it('should return PPL preset', () => {
      const preset = getPresetById('ppl-6x')
      expect(preset).toBeTruthy()
      expect(preset.id).toBe('ppl-6x')
      expect(preset.difficulty).toBe('intermediate')
      expect(preset.templates.length).toBe(3) // Push, Pull, Legs
    })

    it('should return null for invalid ID', () => {
      const preset = getPresetById('non-existent')
      expect(preset).toBeNull()
    })
  })

  describe('getPresetDifficulty', () => {
    it('should return correct difficulty for preset IDs', () => {
      expect(getPresetDifficulty('full-body-3x')).toBe('beginner')
      expect(getPresetDifficulty('upper-lower-4x')).toBe('beginner')
      expect(getPresetDifficulty('ppl-6x')).toBe('intermediate')
      expect(getPresetDifficulty('arnold-split')).toBe('advanced')
    })

    it('should return null for invalid preset ID', () => {
      expect(getPresetDifficulty('non-existent')).toBeNull()
    })
  })

  describe('getPresetName', () => {
    const preset = getPresetById('full-body-3x')

    it('should return Ukrainian name by default', () => {
      const name = getPresetName(preset)
      expect(name).toBe('Все тіло 3р/тиждень')
    })

    it('should return English name when locale is en', () => {
      const name = getPresetName(preset, 'en')
      expect(name).toBe('Full Body 3x/week')
    })

    it('should return Ukrainian name when locale is uk', () => {
      const name = getPresetName(preset, 'uk')
      expect(name).toBe('Все тіло 3р/тиждень')
    })

    it('should fallback to en if locale not found', () => {
      const customPreset = {
        name: { en: 'English Only' },
      }
      const name = getPresetName(customPreset, 'fr')
      expect(name).toBe('English Only')
    })
  })

  describe('getPresetDescription', () => {
    const preset = getPresetById('ppl-6x')

    it('should return Ukrainian description by default', () => {
      const desc = getPresetDescription(preset)
      expect(desc).toContain('Класичний спліт')
    })

    it('should return English description when locale is en', () => {
      const desc = getPresetDescription(preset, 'en')
      expect(desc).toContain('Classic bodybuilding split')
    })
  })

  describe('getTemplateName', () => {
    const preset = getPresetById('ppl-6x')
    const pushTemplate = preset.templates[0]

    it('should return Ukrainian template name by default', () => {
      const name = getTemplateName(pushTemplate)
      expect(name).toBe('День жиму')
    })

    it('should return English template name when locale is en', () => {
      const name = getTemplateName(pushTemplate, 'en')
      expect(name).toBe('Push Day')
    })
  })

  describe('Preset-specific validations', () => {
    it('Full Body 3x should have 3 different templates', () => {
      const preset = getPresetById('full-body-3x')
      expect(preset.templates.length).toBe(3)
      expect(preset.frequency).toBe(3)
    })

    it('Upper/Lower 4x should have 4 templates', () => {
      const preset = getPresetById('upper-lower-4x')
      expect(preset.templates.length).toBe(4)
      expect(preset.frequency).toBe(4)
    })

    it('PPL should have 3 templates (Push, Pull, Legs)', () => {
      const preset = getPresetById('ppl-6x')
      expect(preset.templates.length).toBe(3)
      expect(preset.frequency).toBe(6)
    })

    it('Arnold Split should have 3 templates', () => {
      const preset = getPresetById('arnold-split')
      expect(preset.templates.length).toBe(3)
      expect(preset.frequency).toBe(6)
    })

    it('Beginner presets should have lower volume', () => {
      const beginnerPresets = getPresetsByDifficulty('beginner')
      beginnerPresets.forEach((preset) => {
        preset.templates.forEach((template) => {
          template.exercises.forEach((exercise) => {
            // Beginner sets should be 3-4
            expect(exercise.sets).toBeLessThanOrEqual(4)
          })
        })
      })
    })

    it('Advanced presets should have higher volume', () => {
      const advancedPresets = getPresetsByDifficulty('advanced')
      const arnoldPreset = advancedPresets[0]

      // Arnold split has some exercises with 5 sets
      const hasHighVolume = arnoldPreset.templates.some((template) =>
        template.exercises.some((exercise) => exercise.sets >= 5)
      )
      expect(hasHighVolume).toBe(true)
    })

    it('PPL Push day should include chest and shoulder exercises', () => {
      const pplPreset = getPresetById('ppl-6x')
      const pushTemplate = pplPreset.templates.find((t) => t.name.en === 'Push Day')

      const exerciseIds = pushTemplate.exercises.map((e) => e.exerciseId)
      expect(exerciseIds).toContain('barbell-bench-press') // Chest
      expect(exerciseIds).toContain('overhead-press') // Shoulders
      expect(exerciseIds).toContain('tricep-pushdown') // Triceps
    })

    it('PPL Pull day should include back and bicep exercises', () => {
      const pplPreset = getPresetById('ppl-6x')
      const pullTemplate = pplPreset.templates.find((t) => t.name.en === 'Pull Day')

      const exerciseIds = pullTemplate.exercises.map((e) => e.exerciseId)
      expect(exerciseIds).toContain('deadlift') // Back
      expect(exerciseIds).toContain('barbell-row') // Back
      expect(exerciseIds).toContain('barbell-curl') // Biceps
    })

    it('PPL Leg day should include squat and leg exercises', () => {
      const pplPreset = getPresetById('ppl-6x')
      const legTemplate = pplPreset.templates.find((t) => t.name.en === 'Leg Day')

      const exerciseIds = legTemplate.exercises.map((e) => e.exerciseId)
      expect(exerciseIds).toContain('barbell-squat')
      expect(exerciseIds).toContain('leg-press')
      expect(exerciseIds).toContain('leg-curl')
    })
  })
})
