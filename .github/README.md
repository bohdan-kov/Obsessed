# CI/CD Deployment

## Що робити ЗАРАЗ

### 1. Отримати Firebase Token

```bash
npm install -g firebase-tools
firebase login
firebase projects:list  # Знайдіть ваш obsessed-f8ca1
firebase login:ci
```

Скопіюйте токен що з'явиться в консолі.

### 2. Додати GitHub Secrets

**Крок 1:** Відкрийте GitHub репозиторій:
```
GitHub → Ваш репозиторій → Settings → Secrets and variables → Actions
```

**Крок 2:** Натисніть **"New repository secret"**

**Крок 3:** Додайте ці 7 секретів (один за одним):

#### Секрет #1: FIREBASE_TOKEN
```
Name:   FIREBASE_TOKEN
Secret: (Ваш токен з команди firebase login:ci)
        Приклад: 1//0cLDAa44na7fMCgYI...
        Вставте його БЕЗ лапок, БЕЗ JSON, просто сам токен
```

#### Секрет #2-7: Firebase Configuration
Скопіюйте значення з вашого `.env.local` файлу:

```
Name:   VITE_FIREBASE_API_KEY
Secret: (Значення VITE_FIREBASE_API_KEY з .env.local)

Name:   VITE_FIREBASE_AUTH_DOMAIN
Secret: (Значення VITE_FIREBASE_AUTH_DOMAIN з .env.local)

Name:   VITE_FIREBASE_PROJECT_ID
Secret: (Значення VITE_FIREBASE_PROJECT_ID з .env.local)

Name:   VITE_FIREBASE_STORAGE_BUCKET
Secret: (Значення VITE_FIREBASE_STORAGE_BUCKET з .env.local)

Name:   VITE_FIREBASE_MESSAGING_SENDER_ID
Secret: (Значення VITE_FIREBASE_MESSAGING_SENDER_ID з .env.local)

Name:   VITE_FIREBASE_APP_ID
Secret: (Значення VITE_FIREBASE_APP_ID з .env.local)
```

**Важливо:**
- Кожен секрет додається окремо (натискаєте "Add secret" після кожного)
- Name пишіть ВЕЛИКИМИ ЛІТЕРАМИ точно як вказано
- Secret вставляйте БЕЗ лапок
- Після додавання всіх 7 секретів має бути 7 рядків в списку

**Швидкий спосіб (helper script):**
```bash
bash .github/copy-secrets.sh
```
Цей скрипт покаже всі ваші значення з .env.local - просто копіюйте і вставляйте.

### 3. Запустити Deploy

```bash
git add .
git commit -m "Deploy to Firebase Hosting"
git push origin main
```

Деплой запуститься автоматично. Перевірте статус в вкладці Actions на GitHub.

## Workflow Files

- **deploy.yml** - Деплой на Firebase при push в main
- **preview.yml** - Preview URL для pull requests
- **lint.yml** - Перевірка коду при push/PR

## Команди

```bash
# Локальний білд
npm run build

# Локальний preview
firebase hosting:channel:deploy preview --expires 1h

# Перевірка Firebase токена
firebase projects:list
```

## Firebase Hosting Info

- **Project ID:** obsessed-f8ca1
- **Live URL:** https://obsessed-f8ca1.web.app
- **Site:** obsessed-f8ca1

Після успішного деплою ваш додаток буде доступний за цією адресою.
