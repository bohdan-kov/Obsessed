# CLAUDE.md - Nutrition Bot

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nutrition Bot** - це Telegram-бот для генерації персоналізованого плану харчування на основі профілю користувача з використанням AI (Google Gemini 1.5 Flash). Бот створює меню (сніданок, обід, вечеря) з розрахунком КБЖУ, враховуючи цілі користувача, вагу, стиль готування та інші вподобання.

**Майбутня інтеграція:** У версії 2.0 бот буде підключений до мобільного застосунку **Obsessed** (Vue 3 + Firebase) для синхронізації даних про харчування та тренування.

## Technology Stack

### Core
- **Runtime**: Node.js v20+ (ESM modules)
- **Telegram Bot Framework**: grammY v1.30+ (сучасна альтернатива Telegraf)
- **AI Provider**: Google Generative AI (Gemini 1.5 Flash)
- **Language**: JavaScript (ESM, Node.js native)

### Libraries
- **@grammyjs/conversations**: Діалогові сценарії (анкети, крокові форми)
- **@grammyjs/menu**: Інлайн-клавіатури та меню
- **@google/generative-ai**: Google Gemini API SDK
- **dotenv**: Управління змінними оточення
- **firebase-admin** (v2.0): Для майбутньої інтеграції (поки не використовується в MVP)

### Development
- **Testing**: Jest або Vitest (TBD)
- **Linting**: ESLint з airbnb-base config
- **Formatting**: Prettier

## Development Commands

```bash
# Install dependencies
npm install

# Start bot in development mode (with nodemon)
npm run dev

# Start bot in production mode
npm start

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint:fix

# Format code
npm run format

# Run tests (after implementation)
npm test
```

## Project Architecture

### High-Level Structure

```
nutrition-bot/
├── src/
│   ├── bot/                    # Telegram bot core
│   │   ├── index.js            # Bot initialization & middleware setup
│   │   ├── commands/           # Command handlers (/start, /menu, /profile)
│   │   ├── conversations/      # grammY conversations (profile wizard)
│   │   └── keyboards/          # Inline keyboards & menus
│   ├── services/               # Business logic
│   │   ├── ai/                 # Google Gemini integration
│   │   │   ├── gemini.js       # Gemini client setup
│   │   │   ├── prompts.js      # System & user prompts
│   │   │   └── menu-generator.js # Menu generation logic
│   │   ├── profile/            # User profile management
│   │   │   ├── profile-service.js  # CRUD operations
│   │   │   └── validation.js       # Profile data validation
│   │   └── session/            # Session storage abstraction
│   │       ├── session-adapter.js  # Interface for storage
│   │       └── memory-storage.js   # In-memory (MVP)
│   ├── models/                 # Data models & schemas
│   │   ├── user-profile.js     # User profile schema
│   │   └── menu.js             # Menu & meal schemas
│   ├── utils/                  # Utilities
│   │   ├── logger.js           # Logging (console or Winston)
│   │   ├── error-handler.js    # Centralized error handling
│   │   └── formatters.js       # Text formatting helpers
│   └── config/                 # Configuration
│       ├── env.js              # Environment variables validation
│       └── constants.js        # Magic numbers & defaults
└── index.js                    # Application entry point
```

### Data Flow Architecture

```
User Message → grammY Bot → Conversation Handler
                                    ↓
                            Profile Service
                                    ↓
                            Session Storage (Memory/Firebase)
                                    ↓
User Input Complete → AI Service → Google Gemini API (1.5 Flash)
                                    ↓
                            Menu Response → Format & Send
```

## Core Modules

### 1. Bot Initialization (`src/bot/index.js`)

**Responsibilities:**
- Initialize grammY bot with API token
- Register middleware (error handling, logging, session)
- Register conversations (profile wizard)
- Register commands (/start, /menu, /profile, /help)
- Export bot instance

**Critical Pattern:**
```javascript
import { Bot, session } from 'grammy'
import { conversations, createConversation } from '@grammyjs/conversations'
import { profileConversation } from './conversations/profile.js'
import { memoryStorage } from '../services/session/memory-storage.js'

export function createBot(token) {
  const bot = new Bot(token)

  // Session middleware MUST be before conversations
  bot.use(session({
    initial: () => ({ profile: null }),
    storage: memoryStorage, // Easy to replace with Firebase later
  }))

  // Conversations plugin
  bot.use(conversations())
  bot.use(createConversation(profileConversation))

  // Error handling (global catch)
  bot.catch((err) => {
    console.error('Bot error:', err)
  })

  return bot
}
```

### 2. Profile Conversation (`src/bot/conversations/profile.js`)

**Pattern:** grammY conversations for multi-step wizards

**Steps:**
1. Ціль (набір маси / схуднення / підтримка ваги)
2. Вага (кг)
3. Зріст (см)
4. Вік (років)
5. Рівень активності (сидячий / помірний / активний)
6. Стиль готування (швидко / традиційно / без варки)
7. Дієтичні обмеження (алергії, релігійні, вегетаріанство)
8. Підтвердження

**Implementation Pattern:**
```javascript
export async function profileConversation(conversation, ctx) {
  // Step 1: Goal
  await ctx.reply('Яка ваша ціль?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💪 Набір маси', callback_data: 'goal_bulk' }],
        [{ text: '🔥 Схуднення', callback_data: 'goal_cut' }],
        [{ text: '⚖️ Підтримка ваги', callback_data: 'goal_maintain' }],
      ],
    },
  })

  const goalResponse = await conversation.waitForCallbackQuery(/^goal_/)
  const goal = goalResponse.match[0].replace('goal_', '')
  await goalResponse.answerCallbackQuery()

  // Step 2: Weight
  await ctx.reply('Яка ваша вага? (кг)')
  const weightResponse = await conversation.waitFor('message:text')
  const weight = parseFloat(weightResponse.message.text)

  // Validation
  if (isNaN(weight) || weight < 30 || weight > 300) {
    await ctx.reply('❌ Некоректна вага. Спробуйте ще раз.')
    return // Restart conversation
  }

  // ... continue with other steps ...

  // Save profile
  conversation.session.profile = {
    goal,
    weight,
    height,
    age,
    activityLevel,
    cookingStyle,
    restrictions,
  }

  await ctx.reply('✅ Профіль збережено! Використовуйте /menu для генерації меню.')
}
```

### 3. AI Service (`src/services/ai/menu-generator.js`)

**Responsibilities:**
- Generate system prompt from user profile
- Call Google Gemini API with structured prompt
- Parse AI response into menu structure
- Calculate total КБЖУ

**Google Gemini Integration Pattern:**
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildPrompt } from './prompts.js'
import { logger } from '../../utils/logger.js'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

export async function generateMenu(userProfile) {
  try {
    // Get Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    })

    // Build prompt with user profile
    const prompt = buildPrompt(userProfile)

    logger.debug('Generating menu with Gemini', { userId: userProfile.userId })

    // Generate content
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    logger.debug('Received Gemini response', { textLength: text.length })

    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response')
    }

    const menuData = JSON.parse(jsonMatch[0])
    return formatMenu(menuData)
  } catch (error) {
    logger.error('Menu generation failed', { error: error.message })
    throw new Error(`Failed to generate menu: ${error.message}`)
  }
}

function formatMenu(rawMenu) {
  return {
    breakfast: parseMeal(rawMenu.breakfast),
    lunch: parseMeal(rawMenu.lunch),
    dinner: parseMeal(rawMenu.dinner),
    totals: calculateTotals(rawMenu),
  }
}

function parseMeal(meal) {
  return {
    name: meal.name,
    ingredients: meal.ingredients || [],
    recipe: meal.recipe || '',
    nutrition: {
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      fats: meal.fats || 0,
      carbs: meal.carbs || 0,
    },
  }
}

function calculateTotals(menu) {
  const meals = [menu.breakfast, menu.lunch, menu.dinner]
  return {
    calories: meals.reduce((sum, m) => sum + (m.calories || 0), 0),
    protein: meals.reduce((sum, m) => sum + (m.protein || 0), 0),
    fats: meals.reduce((sum, m) => sum + (m.fats || 0), 0),
    carbs: meals.reduce((sum, m) => sum + (m.carbs || 0), 0),
  }
}
```

**Alternative: Using Gemini Client Setup File (`src/services/ai/gemini.js`):**

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiClient {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    })
  }

  async generateContent(prompt, options = {}) {
    const generationConfig = {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.maxOutputTokens || 2048,
      topP: options.topP || 0.95,
      topK: options.topK || 40,
    }

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    })

    return result.response.text()
  }

  async generateJSON(prompt, options = {}) {
    const text = await this.generateContent(prompt, options)

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    return JSON.parse(jsonMatch[0])
  }
}

export const geminiClient = new GeminiClient(process.env.GOOGLE_API_KEY)
```

### 4. Prompt Engineering (`src/services/ai/prompts.js`)

**CRITICAL: Gemini Prompt Structure**

Unlike OpenAI, Gemini doesn't have separate system/user messages. All instructions must be in a single prompt. JSON output is achieved through explicit instructions, not API parameters.

```javascript
/**
 * Build complete prompt for Gemini API
 * Combines system instructions + user context into single prompt
 */
export function buildPrompt(profile) {
  const { goal, weight, height, age, activityLevel, cookingStyle, restrictions } = profile

  // Calculate recommended calories (Mifflin-St Jeor formula)
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5 // For male (add gender later)
  const activityMultiplier = getActivityMultiplier(activityLevel)
  const tdee = bmr * activityMultiplier

  let targetCalories = tdee
  if (goal === 'bulk') targetCalories += 300
  if (goal === 'cut') targetCalories -= 500

  const proteinTarget = getProteinTarget(goal, weight)
  const fatTarget = getFatTarget(goal, weight)
  const cookingHint = getCookingStyleHint(cookingStyle)
  const goalLabel = goal === 'bulk' ? 'набір маси' : goal === 'cut' ? 'схуднення' : 'підтримка ваги'

  return `Ти - професійний дієтолог та кухар. Твоє завдання - створити персоналізований план харчування.

**ПРОФІЛЬ КЛІЄНТА:**
- Ціль: ${goalLabel}
- Вага: ${weight} кг
- Зріст: ${height} см
- Вік: ${age} років
- Рівень активності: ${activityLevel}
- Стиль готування: ${cookingStyle}
- Дієтичні обмеження: ${restrictions || 'немає'}

**ЦІЛЬОВІ ПОКАЗНИКИ:**
- Калорійність: ${Math.round(targetCalories)} ккал/день (±100 ккал)
- Білки: ${proteinTarget}г/день
- Жири: ${fatTarget}г/день
- Вуглеводи: решта калорій

**ЗАВДАННЯ:**
Створи план харчування на 1 день (сніданок, обід, вечеря).

**ВИМОГИ:**
1. Загальна калорійність має відповідати цільовій (±100 ккал)
2. Дотримуйся цільового розподілу БЖВ
3. Рецепти мають відповідати стилю готування: ${cookingHint}
4. Обов'язково враховуй дієтичні обмеження: ${restrictions || 'немає'}
5. Використовуй продукти, доступні в Україні
6. Інгредієнти з точною кількістю (грами, мл, штуки)
7. Рецепт - 2-3 речення, покрокові інструкції
8. Точний розрахунок КБЖУ для кожної страви

**КРИТИЧНО ВАЖЛИВО - ФОРМАТ ВІДПОВІДІ:**
Твоя відповідь ОБОВ'ЯЗКОВО має бути валідним JSON об'єктом без markdown форматування.
НЕ огортай JSON у \`\`\`json або інші теги.
Відповідай ТІЛЬКИ JSON, без додаткового тексту до чи після.

**СТРУКТУРА JSON:**
{
  "breakfast": {
    "name": "Назва страви українською",
    "ingredients": [
      "інгредієнт 1 - точна кількість",
      "інгредієнт 2 - точна кількість"
    ],
    "recipe": "Покроковий рецепт приготування (2-3 речення)",
    "calories": 500,
    "protein": 25,
    "fats": 15,
    "carbs": 60
  },
  "lunch": {
    "name": "...",
    "ingredients": ["..."],
    "recipe": "...",
    "calories": 0,
    "protein": 0,
    "fats": 0,
    "carbs": 0
  },
  "dinner": {
    "name": "...",
    "ingredients": ["..."],
    "recipe": "...",
    "calories": 0,
    "protein": 0,
    "fats": 0,
    "carbs": 0
  }
}

ЗГЕНЕРУЙ ПЛАН ХАРЧУВАННЯ ЗАРАЗ У ВКАЗАНОМУ JSON ФОРМАТІ:`
}

/**
 * Activity level multipliers for TDEE calculation
 */
function getActivityMultiplier(level) {
  const multipliers = {
    sedentary: 1.2,    // Сидячий спосіб життя
    moderate: 1.55,    // Помірна активність (тренування 3-5 разів/тиждень)
    active: 1.9,       // Висока активність (тренування 6-7 разів/тиждень)
  }
  return multipliers[level] || 1.55
}

/**
 * Calculate protein target based on goal and weight
 */
function getProteinTarget(goal, weight) {
  if (goal === 'bulk') return Math.round(weight * 2.2) // 2.2g/kg для набору маси
  if (goal === 'cut') return Math.round(weight * 2.5)  // 2.5g/kg для схуднення (збереження м'язів)
  return Math.round(weight * 2.0) // 2.0g/kg для підтримки
}

/**
 * Calculate fat target (constant across all goals)
 */
function getFatTarget(goal, weight) {
  return Math.round(weight * 1.0) // ~1g/kg для всіх цілей
}

/**
 * Get cooking style hints for AI
 */
function getCookingStyleHint(style) {
  const hints = {
    quick: 'Швидке приготування (до 15 хвилин), мінімум інгредієнтів, прості техніки',
    traditional: 'Традиційне приготування, можна готувати довше, класичні рецепти',
    no_cooking: 'БЕЗ термічної обробки - тільки салати, сендвічі, готові продукти, смузі',
  }
  return hints[style] || hints.quick
}
```

**Key Differences from OpenAI:**
- ✅ Single unified prompt (no separate system/user messages)
- ✅ JSON format enforced through explicit instructions in prompt
- ✅ Multiple reminders to output ONLY JSON (Gemini sometimes adds explanations)
- ✅ Clear warning against markdown code blocks (```json)
- ✅ Uses `buildPrompt()` instead of `buildSystemPrompt()` + `buildUserPrompt()`

### 5. Session Storage Abstraction (`src/services/session/`)

**Why Abstraction?**
MVP uses in-memory storage, but v2.0 will use Firebase. Abstraction layer makes migration seamless.

**Interface (`session-adapter.js`):**
```javascript
/**
 * Abstract session storage interface
 * Implementations: MemoryStorage (MVP), FirebaseStorage (v2.0)
 */
export class SessionAdapter {
  async get(key) {
    throw new Error('Not implemented')
  }

  async set(key, value) {
    throw new Error('Not implemented')
  }

  async delete(key) {
    throw new Error('Not implemented')
  }
}
```

**Memory Implementation (`memory-storage.js`):**
```javascript
import { SessionAdapter } from './session-adapter.js'

class MemoryStorage extends SessionAdapter {
  constructor() {
    super()
    this.storage = new Map()
  }

  async get(key) {
    return this.storage.get(key)
  }

  async set(key, value) {
    this.storage.set(key, value)
  }

  async delete(key) {
    this.storage.delete(key)
  }
}

export const memoryStorage = new MemoryStorage()
```

**Future Firebase Implementation (v2.0):**
```javascript
import { SessionAdapter } from './session-adapter.js'
import { getFirestore } from 'firebase-admin/firestore'

class FirebaseStorage extends SessionAdapter {
  constructor() {
    super()
    this.db = getFirestore()
  }

  async get(key) {
    const doc = await this.db.collection('bot_sessions').doc(key).get()
    return doc.exists ? doc.data() : undefined
  }

  async set(key, value) {
    await this.db.collection('bot_sessions').doc(key).set(value)
  }

  async delete(key) {
    await this.db.collection('bot_sessions').doc(key).delete()
  }
}

export const firebaseStorage = new FirebaseStorage()
```

## Data Models

### User Profile Schema (`src/models/user-profile.js`)

```javascript
/**
 * User profile data structure
 * Stored in session (memory or Firebase)
 */
export const UserProfileSchema = {
  userId: 'string',        // Telegram user ID
  goal: 'bulk|cut|maintain',
  weight: 'number',        // kg
  height: 'number',        // cm
  age: 'number',           // years
  gender: 'male|female',   // Add in v1.1
  activityLevel: 'sedentary|moderate|active',
  cookingStyle: 'quick|traditional|no_cooking',
  restrictions: 'string',  // Comma-separated or array
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
}

export function validateProfile(profile) {
  const errors = []

  if (!profile.goal || !['bulk', 'cut', 'maintain'].includes(profile.goal)) {
    errors.push('Invalid goal')
  }

  if (!profile.weight || profile.weight < 30 || profile.weight > 300) {
    errors.push('Weight must be between 30-300 kg')
  }

  if (!profile.height || profile.height < 100 || profile.height > 250) {
    errors.push('Height must be between 100-250 cm')
  }

  if (!profile.age || profile.age < 14 || profile.age > 100) {
    errors.push('Age must be between 14-100 years')
  }

  return { valid: errors.length === 0, errors }
}
```

### Menu Schema (`src/models/menu.js`)

```javascript
export const MealSchema = {
  name: 'string',
  ingredients: ['string'],
  recipe: 'string',
  nutrition: {
    calories: 'number',
    protein: 'number',
    fats: 'number',
    carbs: 'number',
  },
}

export const MenuSchema = {
  userId: 'string',
  date: 'timestamp',
  breakfast: 'MealSchema',
  lunch: 'MealSchema',
  dinner: 'MealSchema',
  totals: {
    calories: 'number',
    protein: 'number',
    fats: 'number',
    carbs: 'number',
  },
}
```

## Commands Implementation

### /start - Welcome & Onboarding
```javascript
bot.command('start', async (ctx) => {
  await ctx.reply(
    `👋 Вітаю! Я бот для генерації персонального плану харчування.

Що я вмію:
✅ Створювати меню з розрахунком КБЖУ
✅ Враховувати ваші цілі (набір маси, схуднення)
✅ Адаптувати рецепти під ваш стиль готування
✅ Враховувати дієтичні обмеження

Почнімо! Використовуйте /profile для налаштування профілю.`,
  )
})
```

### /profile - Profile Setup
```javascript
bot.command('profile', async (ctx) => {
  await ctx.conversation.enter('profileConversation')
})
```

### /menu - Generate Menu
```javascript
import { generateMenu } from '../services/ai/menu-generator.js'

bot.command('menu', async (ctx) => {
  const profile = ctx.session.profile

  if (!profile) {
    return ctx.reply('❌ Спочатку налаштуйте профіль: /profile')
  }

  await ctx.reply('⏳ Генерую меню... Це може зайняти 10-15 секунд.')

  try {
    const menu = await generateMenu(profile)
    const formattedMenu = formatMenuMessage(menu)
    await ctx.reply(formattedMenu, { parse_mode: 'Markdown' })
  } catch (error) {
    console.error('Menu generation error:', error)
    await ctx.reply('❌ Помилка генерації меню. Спробуйте пізніше.')
  }
})

function formatMenuMessage(menu) {
  return `
🍳 **СНІДАНОК: ${menu.breakfast.name}**
Калорії: ${menu.breakfast.nutrition.calories} | Б: ${menu.breakfast.nutrition.protein}г | Ж: ${menu.breakfast.nutrition.fats}г | В: ${menu.breakfast.nutrition.carbs}г

Інгредієнти:
${menu.breakfast.ingredients.map(i => `• ${i}`).join('\n')}

Приготування: ${menu.breakfast.recipe}

---

🍽 **ОБІД: ${menu.lunch.name}**
Калорії: ${menu.lunch.nutrition.calories} | Б: ${menu.lunch.nutrition.protein}г | Ж: ${menu.lunch.nutrition.fats}г | В: ${menu.lunch.nutrition.carbs}г

Інгредієнти:
${menu.lunch.ingredients.map(i => `• ${i}`).join('\n')}

Приготування: ${menu.lunch.recipe}

---

🌙 **ВЕЧЕРЯ: ${menu.dinner.name}**
Калорії: ${menu.dinner.nutrition.calories} | Б: ${menu.dinner.nutrition.protein}г | Ж: ${menu.dinner.nutrition.fats}г | В: ${menu.dinner.nutrition.carbs}г

Інгредієнти:
${menu.dinner.ingredients.map(i => `• ${i}`).join('\n')}

Приготування: ${menu.dinner.recipe}

---

📊 **ВСЬОГО ЗА ДЕНЬ:**
Калорії: ${menu.totals.calories} | Білки: ${menu.totals.protein}г | Жири: ${menu.totals.fats}г | Вуглеводи: ${menu.totals.carbs}г
`
}
```

## Configuration & Environment

### .env.example Template

Create this file as `.env.example` for documentation (commit to git):
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=

# Google Gemini AI Configuration
GOOGLE_API_KEY=

# Application Environment
NODE_ENV=development
```

### Required Environment Variables (`.env`)

```bash
# Telegram Bot API
TELEGRAM_BOT_TOKEN=your_bot_token_from_@BotFather

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_from_google_ai_studio

# Environment
NODE_ENV=development # or production

# Firebase (v2.0 - not used in MVP)
# FIREBASE_PROJECT_ID=
# FIREBASE_CLIENT_EMAIL=
# FIREBASE_PRIVATE_KEY=
```

**How to Get Google API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API key" or "Create API key"
3. Copy the API key
4. Paste into `.env` file as `GOOGLE_API_KEY=...`

**Free Tier Limits (Google AI Studio):**
- ✅ 15 requests per minute (RPM)
- ✅ 1,000,000 tokens per minute (TPM)
- ✅ 1,500 requests per day (RPD)
- ✅ **Completely FREE** within these limits (perfect for MVP)

### Environment Validation (`src/config/env.js`)

```javascript
import 'dotenv/config'

const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'GOOGLE_API_KEY',
]

export function validateEnv() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Additional validation for Google API key format
  if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.startsWith('AIza')) {
    console.warn('⚠️  Warning: GOOGLE_API_KEY might be invalid (should start with "AIza")')
  }
}

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-1.5-flash',
    maxOutputTokens: 2048,
    temperature: 0.7,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
}
```

### Constants Configuration (`src/config/constants.js`)

```javascript
/**
 * Application-wide constants
 * All magic numbers and configuration values
 */

// Google Gemini API Free Tier Limits
export const GEMINI_LIMITS = {
  REQUESTS_PER_MINUTE: 15,        // RPM limit
  REQUESTS_PER_DAY: 1500,         // RPD limit
  TOKENS_PER_MINUTE: 1_000_000,   // TPM limit
}

// User Rate Limiting
export const USER_LIMITS = {
  MAX_MENUS_PER_DAY: 5,           // Prevent abuse
  MAX_PROFILE_UPDATES_PER_HOUR: 3,
}

// Nutrition Calculation Constants
export const NUTRITION = {
  MIN_CALORIES: 1200,             // Minimum safe daily calories
  MAX_CALORIES: 5000,             // Maximum reasonable daily calories
  PROTEIN_MULTIPLIERS: {
    bulk: 2.2,    // g/kg body weight
    cut: 2.5,     // Higher during deficit
    maintain: 2.0,
  },
  FAT_MULTIPLIER: 1.0,            // g/kg body weight (constant)
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.9,
  },
  CALORIE_ADJUSTMENTS: {
    bulk: 300,    // Surplus
    cut: -500,    // Deficit
    maintain: 0,
  },
}

// User Input Validation Ranges
export const VALIDATION = {
  WEIGHT: { min: 30, max: 300 },      // kg
  HEIGHT: { min: 100, max: 250 },     // cm
  AGE: { min: 14, max: 100 },         // years
}

// Retry Configuration
export const RETRY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,    // 1 second
  BACKOFF_FACTOR: 2,      // Exponential: 1s, 2s, 4s
}

// Conversation Timeouts
export const TIMEOUTS = {
  PROFILE_WIZARD: 300_000,  // 5 minutes
  MENU_GENERATION: 30_000,  // 30 seconds
}
```

## Error Handling Strategy

### Global Error Handler (`src/utils/error-handler.js`)

```javascript
export function handleBotError(err, ctx) {
  console.error('Bot error:', {
    error: err.message,
    stack: err.stack,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  })

  // User-friendly message
  const userMessage = getUserErrorMessage(err)
  ctx.reply(userMessage).catch(console.error)
}

function getUserErrorMessage(err) {
  // Gemini API errors
  if (err.message.includes('API key') || err.message.includes('GOOGLE_API_KEY')) {
    return '❌ Помилка налаштування API. Зверніться до адміністратора.'
  }

  if (err.message.includes('quota') || err.message.includes('rate limit')) {
    return '❌ Перевищено ліміт запитів. Спробуйте через 1 хвилину.'
  }

  if (err.message.includes('Gemini') || err.message.includes('generateContent')) {
    return '❌ Проблема з AI-сервісом. Спробуйте пізніше.'
  }

  if (err.message.includes('network') || err.message.includes('fetch')) {
    return '❌ Проблема з інтернетом. Перевірте з\'єднання.'
  }

  if (err.message.includes('JSON')) {
    return '❌ Помилка обробки даних. Спробуйте ще раз.'
  }

  return '❌ Щось пішло не так. Спробуйте ще раз.'
}

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AIServiceError extends Error {
  constructor(message, originalError) {
    super(message)
    this.name = 'AIServiceError'
    this.originalError = originalError
  }
}
```

## Logging Strategy

### Logger (`src/utils/logger.js`)

```javascript
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
}

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, meta)
    // TODO v2.0: Send to Firebase/Sentry
  }

  warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, meta)
  }

  info(message, meta = {}) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, meta)
    }
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, meta)
    }
  }
}

export const logger = new Logger()
```

## Testing Strategy (Future)

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── ai/
│   │   │   └── menu-generator.test.js
│   │   └── profile/
│   │       └── validation.test.js
│   └── utils/
│       └── formatters.test.js
└── integration/
    └── bot/
        └── commands.test.js
```

### Example Test (Menu Generator)
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateMenu } from '../../src/services/ai/menu-generator.js'

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              breakfast: {
                name: 'Вівсянка з бананом',
                ingredients: ['вівсяні пластівці - 80г', 'банан - 1 шт', 'мед - 10г'],
                recipe: 'Залити пластівці окропом, додати нарізаний банан та мед.',
                calories: 350,
                protein: 12,
                fats: 8,
                carbs: 55,
              },
              lunch: {
                name: 'Курка з рисом та овочами',
                ingredients: ['куряче філе - 200г', 'рис - 100г', 'броколі - 150г'],
                recipe: 'Відварити рис, смажити курку, приготувати броколі на парі.',
                calories: 600,
                protein: 45,
                fats: 15,
                carbs: 60,
              },
              dinner: {
                name: 'Риба з овочами',
                ingredients: ['філе лосося - 180г', 'спаржа - 100г', 'лимон - 1/2 шт'],
                recipe: 'Запекти рибу в духовці з лимоном, приготувати спаржу.',
                calories: 450,
                protein: 35,
                fats: 20,
                carbs: 30,
              },
            }),
          },
        }),
      }),
    })),
  }
})

describe('Menu Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate menu for bulk goal', async () => {
    const profile = {
      userId: 'test-user',
      goal: 'bulk',
      weight: 80,
      height: 180,
      age: 25,
      activityLevel: 'moderate',
      cookingStyle: 'quick',
    }

    const menu = await generateMenu(profile)

    expect(menu).toHaveProperty('breakfast')
    expect(menu).toHaveProperty('lunch')
    expect(menu).toHaveProperty('dinner')
    expect(menu).toHaveProperty('totals')
    expect(menu.totals.calories).toBeGreaterThan(1200)
    expect(menu.breakfast.name).toBe('Вівсянка з бананом')
  })

  it('should calculate correct totals', async () => {
    const profile = {
      userId: 'test-user',
      goal: 'maintain',
      weight: 70,
      height: 175,
      age: 30,
      activityLevel: 'moderate',
      cookingStyle: 'traditional',
    }

    const menu = await generateMenu(profile)

    expect(menu.totals.calories).toBe(1400) // 350 + 600 + 450
    expect(menu.totals.protein).toBe(92)    // 12 + 45 + 35
    expect(menu.totals.fats).toBe(43)       // 8 + 15 + 20
    expect(menu.totals.carbs).toBe(145)     // 55 + 60 + 30
  })

  it('should handle Gemini API errors gracefully', async () => {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
      }),
    }))

    const profile = {
      userId: 'test-user',
      goal: 'cut',
      weight: 80,
      height: 180,
      age: 25,
      activityLevel: 'moderate',
      cookingStyle: 'quick',
    }

    await expect(generateMenu(profile)).rejects.toThrow('Failed to generate menu')
  })
})
```

## Code Style & Best Practices

### JavaScript Style
- **ESM modules**: Use `import/export`, NOT `require`
- **Async/await**: Prefer over `.then()` chains
- **Error handling**: Always wrap async operations in try-catch
- **Destructuring**: Use for cleaner code
- **Template literals**: For string interpolation
- **Arrow functions**: For callbacks and short functions

### grammY Best Practices
- **Session middleware FIRST**: Always register session before conversations
- **Error boundaries**: Use `bot.catch()` for global error handling
- **Conversation cleanup**: Exit conversations properly to avoid memory leaks
- **Callback query answers**: Always call `answerCallbackQuery()` to remove loading state
- **Rate limiting**: Consider adding in v1.1 to prevent spam

### Google Gemini Best Practices
- **JSON output**: Enforce through explicit prompt instructions (Gemini doesn't have `response_format` parameter)
- **JSON extraction**: Always use regex to extract JSON from response (Gemini might wrap in markdown)
- **Temperature control**: 0.7 for creative menus, 0.3-0.5 for consistency
- **Token limits**: Set `maxOutputTokens: 2048` to control response length
- **Retry logic**: Implement exponential backoff for rate limit errors (v1.1)
- **Prompt versioning**: Keep prompt templates in separate file for easy updates
- **Model selection**: Use `gemini-1.5-flash` for free tier, `gemini-1.5-pro` for production (paid)
- **Safety settings**: Configure if needed (default is balanced)
- **Rate limiting awareness**: 15 RPM free tier - add user-side throttling

### Security
- **Environment variables**: NEVER commit `.env` to git
- **Input validation**: Always validate user inputs before processing
- **Rate limiting**: Prevent abuse (add in v1.1)
- **User data**: Hash sensitive data if storing (GDPR compliance for v2.0)

## Future Roadmap

### v1.1 (After MVP)
- [ ] Add gender selection to profile
- [ ] Implement retry logic for Gemini API rate limit errors
- [ ] Add rate limiting to prevent spam (respect 15 RPM free tier)
- [ ] Add /settings command to edit profile
- [ ] Add /history command to see past menus
- [ ] Implement menu regeneration button (inline keyboard)
- [ ] Add daily menu generation counter (track 1500 RPD limit)

### v2.0 (Firebase Integration)
- [ ] Replace MemoryStorage with FirebaseStorage
- [ ] Sync user profile with Obsessed mobile app (Vue 3 + Firebase)
- [ ] Add meal logging (save eaten meals to Firestore)
- [ ] Add analytics (calories consumed per day/week/month)
- [ ] Add nutrition dashboard (link to Obsessed app)
- [ ] Add Firebase Cloud Functions for scheduled menu generation

### v2.1 (Advanced Features)
- [ ] Multi-day meal plans (weekly planner)
- [ ] Shopping list generation
- [ ] Macro tracking and progress charts
- [ ] Integration with workout data from Obsessed app
- [ ] AI suggestions based on workout intensity

## Development Workflow

### Starting a New Feature
1. Create feature branch: `git checkout -b feature/menu-regeneration`
2. Update constants in `src/config/constants.js` if needed
3. Write unit tests FIRST (TDD approach)
4. Implement feature
5. Test manually in Telegram
6. Run linter: `npm run lint:fix`
7. Commit with conventional commits: `feat: add menu regeneration button`
8. Create PR

### Conventional Commits
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation updates
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

### Pre-commit Checklist
- [ ] All tests pass
- [ ] No console.logs (use logger instead)
- [ ] No hardcoded values (use constants.js)
- [ ] Error handling implemented
- [ ] ESLint passes
- [ ] Prettier formatting applied

## Integration with Obsessed App (v2.0)

### Data Sync Strategy

**Firestore Collections:**
```
users/{userId}/
├── profile         # Synced from bot
├── meals_log       # Daily meal entries
├── nutrition_stats # Aggregated data
└── workouts        # From Obsessed app
```

**Sync Flow:**
1. User updates profile in bot → Firebase
2. Obsessed app subscribes to `users/{userId}/profile`
3. Meal generation in bot → Save to `meals_log`
4. Obsessed app shows nutrition dashboard with meals + workouts

**Future Features:**
- "Generate menu based on today's workout" (high carbs after intense training)
- "Adjust calories for rest days vs training days"
- Integration with weight tracking from Obsessed app

## Performance Considerations

### Google Gemini API Costs (FREE TIER!)
- **Gemini 1.5 Flash**: ✅ **100% FREE** in Google AI Studio limits
- **Free tier limits:**
  - 15 requests per minute (RPM)
  - 1,000,000 tokens per minute (TPM)
  - 1,500 requests per day (RPD)
- **Expected usage for MVP:**
  - 100 users × 3 menus/day = 300 requests/day ✅ Well within limits
  - Average 2000 tokens/response × 300 = 600K tokens/day ✅ Within 1M TPM
- **Cost for MVP: $0/month** 🎉
- **When to upgrade to paid tier:**
  - When daily users exceed ~500 (1500 RPD limit)
  - When minute traffic spikes exceed 15 RPM
  - Consider switching to `gemini-1.5-pro` for production (paid, better quality)

### Rate Limiting Strategy (v1.1)
- **User-side limits**: 5 menu generations per user per day (prevent abuse)
- **Global throttling**: Implement queue system if approaching 15 RPM
- **Retry logic**: Exponential backoff on rate limit errors (429 status)
- **Monitoring**: Track daily request count to stay under 1500 RPD

### Bot Scalability
- Current: In-memory storage (single instance)
- v2.0: Firebase (unlimited scale)
- Gemini free tier scales to ~500 daily active users
- For 500+ users: Migrate to Gemini Pro API (paid) or implement request queuing

## Key Takeaways

**DO:**
- ✅ Use ESM modules (`import/export`)
- ✅ Validate ALL user inputs
- ✅ Use session middleware BEFORE conversations
- ✅ Extract JSON from Gemini responses using regex (handle markdown wrapping)
- ✅ Use explicit JSON format instructions in prompts (no `response_format` in Gemini)
- ✅ Abstract storage layer (MemoryStorage → FirebaseStorage)
- ✅ Log errors with context (userId, chatId)
- ✅ Use constants for magic numbers
- ✅ Write descriptive commit messages
- ✅ Monitor Gemini API rate limits (15 RPM, 1500 RPD)
- ✅ Implement retry logic for rate limit errors

**DON'T:**
- ❌ Don't hardcode API keys (use .env)
- ❌ Don't forget to call `answerCallbackQuery()`
- ❌ Don't use `console.log` in production (use logger)
- ❌ Don't store sensitive data without encryption
- ❌ Don't commit `.env` file
- ❌ Don't mix CommonJS and ESM
- ❌ Don't skip input validation
- ❌ Don't assume Gemini returns pure JSON (always extract with regex)
- ❌ Don't exceed free tier limits without implementing rate limiting
- ❌ Don't use `response_format` parameter (doesn't exist in Gemini API)

## Gemini vs OpenAI API - Key Differences

**CRITICAL:** If you're familiar with OpenAI API, here are the key differences when using Gemini:

| Feature | OpenAI (GPT-4o) | Google Gemini 1.5 Flash |
|---------|-----------------|-------------------------|
| **Package** | `openai` | `@google/generative-ai` |
| **Initialization** | `new OpenAI({ apiKey })` | `new GoogleGenerativeAI(apiKey)` |
| **Model** | `'gpt-4o'` | `'gemini-1.5-flash'` |
| **Method** | `chat.completions.create()` | `generateContent()` |
| **Messages** | Array: `[{role, content}]` | Single prompt string |
| **JSON Mode** | `response_format: {type: 'json_object'}` | ❌ Not supported - use prompt instructions |
| **Response** | `choices[0].message.content` | `response.text()` |
| **JSON Extraction** | Direct parse | ❌ Use regex: `/\{[\s\S]*\}/` |
| **System Message** | Separate `role: 'system'` | ❌ Combine with user prompt |
| **Temperature** | 0-2 (default 0.7) | 0-2 (default 0.7) |
| **Max Tokens** | `max_tokens` | `maxOutputTokens` |
| **Cost** | ~$0.005 per request | ✅ **FREE** (15 RPM, 1500 RPD) |
| **Rate Limits** | Higher (paid) | 15 RPM, 1M TPM, 1500 RPD |

**Code Comparison:**

**OpenAI:**
```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: { type: 'json_object' },
})
const data = JSON.parse(completion.choices[0].message.content)
```

**Gemini:**
```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
const result = await model.generateContent(combinedPrompt) // Single prompt!
const text = result.response.text()
const jsonMatch = text.match(/\{[\s\S]*\}/) // Extract JSON
const data = JSON.parse(jsonMatch[0])
```

## Gemini API Specifics & Troubleshooting

### Common Issues & Solutions

**Issue 1: Gemini wraps JSON in markdown code blocks**
```
Response: ```json\n{...}\n```
```
**Solution:** Use regex extraction in `menu-generator.js`:
```javascript
const jsonMatch = text.match(/\{[\s\S]*\}/)
```

**Issue 2: Rate limit exceeded (429 error)**
```
Error: Resource has been exhausted (e.g. check quota)
```
**Solution:** Implement exponential backoff:
```javascript
async function generateWithRetry(profile, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await generateMenu(profile)
    } catch (err) {
      if (err.message.includes('quota') && i < maxRetries - 1) {
        await sleep(2 ** i * 1000) // 1s, 2s, 4s
        continue
      }
      throw err
    }
  }
}
```

**Issue 3: Gemini returns explanation text + JSON**
```
Response: "Here's your menu:\n{...}\nEnjoy!"
```
**Solution:** Same regex extraction handles this automatically.

**Issue 4: Invalid API key format**
```
Error: API key not valid
```
**Solution:** Google API keys start with `AIza` - verify in `.env`:
```bash
GOOGLE_API_KEY=AIzaSyD...  # ✅ Correct
GOOGLE_API_KEY=sk-...      # ❌ Wrong (OpenAI format)
```

### Safety Settings (Optional)

To disable Gemini's safety filters for food content:
```javascript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
})
```

### Response Validation

Always validate Gemini's JSON structure:
```javascript
function validateMenuResponse(menu) {
  const required = ['breakfast', 'lunch', 'dinner']
  for (const meal of required) {
    if (!menu[meal]) throw new Error(`Missing ${meal}`)
    if (!menu[meal].name || !menu[meal].calories) {
      throw new Error(`Invalid ${meal} structure`)
    }
  }
  return true
}
```

## Package.json Dependencies

```json
{
  "name": "nutrition-bot",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "test": "vitest"
  },
  "dependencies": {
    "grammy": "^1.30.0",
    "@grammyjs/conversations": "^1.2.0",
    "@grammyjs/menu": "^1.2.2",
    "@google/generative-ai": "^0.21.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "eslint": "^9.15.0",
    "prettier": "^3.4.2",
    "vitest": "^2.1.8"
  }
}
```

**CRITICAL:** Use `"type": "module"` in package.json for ESM support.

## Quick Start Guide

```bash
# 1. Create project
mkdir nutrition-bot
cd nutrition-bot
npm init -y

# 2. Install dependencies
npm install grammy @grammyjs/conversations @grammyjs/menu @google/generative-ai dotenv
npm install -D nodemon eslint prettier vitest

# 3. Update package.json
# Add "type": "module" to enable ESM
# Add scripts: dev, start, lint, test

# 4. Setup environment
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_bot_token_here
GOOGLE_API_KEY=AIzaSy...your_key_here
NODE_ENV=development
EOF

# 5. Create project structure
mkdir -p src/{bot/{commands,conversations,keyboards},services/{ai,profile,session},models,utils,config}
touch index.js

# 6. Copy CLAUDE.md to project root
# This ensures Claude Code understands the project architecture

# 7. Start development
npm run dev

# 8. Test in Telegram
# 1. Create bot via @BotFather
# 2. Get token and add to .env
# 3. Start bot: npm run dev
# 4. Open Telegram → Search for your bot → /start
```

### First-Time Setup Checklist

- [ ] Node.js 20+ installed
- [ ] Telegram bot created via @BotFather
- [ ] Google API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] `.env` file with both tokens
- [ ] `package.json` has `"type": "module"`
- [ ] Project structure matches `CLAUDE.md`
- [ ] Bot responds to `/start` command

## Migration Guide: OpenAI → Gemini

If you have existing code using OpenAI API and want to migrate to Gemini (free tier), follow these steps:

### Step 1: Update Dependencies

```bash
npm uninstall openai
npm install @google/generative-ai
```

### Step 2: Update Environment Variables

```diff
-.env:
-OPENAI_API_KEY=sk-...
+GOOGLE_API_KEY=AIza...
```

### Step 3: Update AI Service

**Before (OpenAI):**
```javascript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  response_format: { type: 'json_object' },
})

const data = JSON.parse(completion.choices[0].message.content)
```

**After (Gemini):**
```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// Combine system + user prompts
const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`

const result = await model.generateContent(combinedPrompt)
const text = result.response.text()

// Extract JSON from response
const jsonMatch = text.match(/\{[\s\S]*\}/)
const data = JSON.parse(jsonMatch[0])
```

### Step 4: Update Prompt Structure

**Before (OpenAI) - Separate System/User:**
```javascript
function buildSystemPrompt(profile) {
  return `You are a nutritionist...`
}

function buildUserPrompt() {
  return `Generate menu for today.`
}
```

**After (Gemini) - Single Combined Prompt:**
```javascript
function buildPrompt(profile) {
  return `You are a nutritionist...

**CLIENT PROFILE:**
...

**TASK:**
Generate menu for today.

**CRITICAL - RESPONSE FORMAT:**
Your response MUST be valid JSON without markdown formatting.
Do NOT wrap JSON in \`\`\`json tags.
Output ONLY JSON, no additional text.

{
  "breakfast": {...},
  "lunch": {...},
  "dinner": {...}
}
`
}
```

### Step 5: Update Config

```diff
// src/config/env.js
export const config = {
-  openai: {
-    apiKey: process.env.OPENAI_API_KEY,
-    model: 'gpt-4o',
-    maxTokens: 2000,
-  },
+  gemini: {
+    apiKey: process.env.GOOGLE_API_KEY,
+    model: 'gemini-1.5-flash',
+    maxOutputTokens: 2048,
+    temperature: 0.7,
+  },
}
```

### Step 6: Update Error Handling

```diff
function getUserErrorMessage(err) {
-  if (err.message.includes('OpenAI')) {
+  if (err.message.includes('Gemini') || err.message.includes('generateContent')) {
    return '❌ Проблема з AI-сервісом.'
  }
+
+  if (err.message.includes('quota') || err.message.includes('rate limit')) {
+    return '❌ Перевищено ліміт. Спробуйте через хвилину.'
+  }
}
```

### Step 7: Add Rate Limiting (Important!)

Gemini free tier has strict limits (15 RPM, 1500 RPD). Add rate limiting:

```javascript
// src/utils/rate-limiter.js
const requestCounts = new Map()

export function checkRateLimit(userId) {
  const now = Date.now()
  const userRequests = requestCounts.get(userId) || []

  // Remove requests older than 1 day
  const recentRequests = userRequests.filter(time => now - time < 86400000)

  if (recentRequests.length >= 5) { // 5 per day limit
    throw new Error('Daily limit exceeded (5 menus/day)')
  }

  recentRequests.push(now)
  requestCounts.set(userId, recentRequests)
}
```

### Migration Checklist

- [ ] Removed `openai` package
- [ ] Installed `@google/generative-ai`
- [ ] Updated `.env` with `GOOGLE_API_KEY`
- [ ] Combined system/user prompts into single prompt
- [ ] Added JSON extraction regex
- [ ] Updated error handling for Gemini errors
- [ ] Added rate limiting (15 RPM, 1500 RPD)
- [ ] Updated tests to mock Gemini instead of OpenAI
- [ ] Tested menu generation end-to-end

**Cost Savings:** $15/month → $0/month 🎉

---

**Last Updated:** 2026-01-03
**Author:** Claude Code
**Version:** 1.0.0 (MVP - Gemini Integration)
**AI Provider:** Google Gemini 1.5 Flash (Free Tier)
**Cost:** $0/month (within free tier limits)
