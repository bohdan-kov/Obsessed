#!/bin/bash

# Скрипт для виведення значень секретів із .env.local
# Використовуйте цей скрипт, щоб легко скопіювати значення для GitHub Secrets

echo "======================================"
echo "GitHub Secrets для CI/CD"
echo "======================================"
echo ""
echo "ВАЖЛИВО: НЕ діліться цими значеннями публічно!"
echo ""

if [ ! -f .env.local ]; then
    echo "ПОМИЛКА: Файл .env.local не знайдено!"
    echo "Переконайтеся, що ви запускаєте скрипт з кореневої директорії проєкту."
    exit 1
fi

echo "Скопіюйте наступні значення в GitHub Secrets:"
echo ""

echo "1. VITE_FIREBASE_API_KEY"
grep "VITE_FIREBASE_API_KEY=" .env.local | cut -d'=' -f2
echo ""

echo "2. VITE_FIREBASE_AUTH_DOMAIN"
grep "VITE_FIREBASE_AUTH_DOMAIN=" .env.local | cut -d'=' -f2
echo ""

echo "3. VITE_FIREBASE_PROJECT_ID"
grep "VITE_FIREBASE_PROJECT_ID=" .env.local | cut -d'=' -f2
echo ""

echo "4. VITE_FIREBASE_STORAGE_BUCKET"
grep "VITE_FIREBASE_STORAGE_BUCKET=" .env.local | cut -d'=' -f2
echo ""

echo "5. VITE_FIREBASE_MESSAGING_SENDER_ID"
grep "VITE_FIREBASE_MESSAGING_SENDER_ID=" .env.local | cut -d'=' -f2
echo ""

echo "6. VITE_FIREBASE_APP_ID"
grep "VITE_FIREBASE_APP_ID=" .env.local | cut -d'=' -f2
echo ""

echo "======================================"
echo "Додаткові кроки:"
echo "======================================"
echo ""
echo "7. FIREBASE_TOKEN"
echo "   Спочатку запустіть: firebase login:ci"
echo "   Потім скопіюйте отриманий токен як є (без будь-яких обгорток)"
echo "   Токен виглядає як: 1//0cLDAa44na7f..."
echo ""

echo "======================================"
echo "Куди додавати секрети:"
echo "======================================"
echo ""
echo "GitHub Repository → Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "Детальна інструкція: .github/DEPLOYMENT_SETUP.md"
echo "Швидкий старт: .github/QUICK_START.md"
echo ""
