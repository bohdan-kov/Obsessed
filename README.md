# obsessed

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Database Setup

### Seeding Default Exercises

The application comes with a comprehensive library of 68 default exercises covering all major muscle groups. To populate your Firestore database with these exercises, run:

```sh
npm run seed:exercises
```

This seed script will:
- Add 68 bilingual (Ukrainian & English) exercises to your database
- Skip exercises that already exist (safe to run multiple times)
- Use efficient batch operations for fast seeding
- Provide detailed progress and statistics

**When to run this:**
- First time setting up the project
- After creating a new Firebase project
- When you want to restore default exercises

**Prerequisites:**
- Ensure your `.env.local` file is configured with Firebase credentials
- Firestore database must be enabled in your Firebase project

**Exercise Coverage:**
- Chest: 9 exercises
- Back: 10 exercises
- Shoulders: 8 exercises
- Biceps: 7 exercises
- Triceps: 6 exercises
- Legs: 14 exercises (quads, hamstrings, glutes)
- Calves: 3 exercises
- Core: 8 exercises

All exercises include proper muscle group categorization, equipment types, and bilingual names.
