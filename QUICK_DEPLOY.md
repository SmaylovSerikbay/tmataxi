# ⚡ Быстрый деплой на Vercel

## 1. Через Vercel Dashboard (самый простой способ)

1. Зайдите на **vercel.com** и войдите
2. Нажмите **"Add New..."** → **"Project"**
3. Импортируйте ваш репозиторий
4. Настройки проекта:
   ```
   Framework Preset: Other
   Root Directory: ./
   Build Command: cd frontend && npm install && npm run build
   Output Directory: frontend/build
   ```
5. Нажмите **"Deploy"** (переменные окружения добавим потом)

## 2. После деплоя

Вы получите URL: `https://ваш-проект.vercel.app`

### Добавьте переменные окружения:

**Settings** → **Environment Variables** → добавьте:

```
SUPABASE_URL=https://ivanwvobxflixmxcrigk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_ключ_из_supabase
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
JWT_SECRET=любая_случайная_строка
API_URL=https://ваш-проект.vercel.app
WEB_APP_URL=https://ваш-проект.vercel.app
REACT_APP_API_URL=https://ваш-проект.vercel.app/api
```

**Важно**: После добавления → **Redeploy**!

## 3. Проверка

- Сайт: `https://ваш-проект.vercel.app`
- API Health: `https://ваш-проект.vercel.app/api/health` (должен вернуть `{"status":"ok"}`)

## 4. Настройка Telegram Bot

1. Откройте [@BotFather](https://t.me/BotFather)
2. `/setmenubutton` → выберите бота
3. URL: `https://ваш-проект.vercel.app`

## Готово! 🎉

Если будут ошибки с Supabase - настроим после деплоя.

