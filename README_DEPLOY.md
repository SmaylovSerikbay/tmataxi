# 🚀 Деплой на Vercel - Краткая инструкция

## Быстрый старт

1. **Зайдите на vercel.com** и войдите
2. **New Project** → импортируйте репозиторий
3. **Настройки**:
   - Framework: Other
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`
4. **Deploy**

## Переменные окружения (добавить после первого деплоя)

В Settings → Environment Variables:

```
SUPABASE_URL=https://ivanwvobxflixmxcrigk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_ключ
TELEGRAM_BOT_TOKEN=ваш_токен
JWT_SECRET=случайная_строка
API_URL=https://ваш-проект.vercel.app
WEB_APP_URL=https://ваш-проект.vercel.app
REACT_APP_API_URL=https://ваш-проект.vercel.app/api
```

После добавления → **Redeploy**

## Проверка

- Сайт: `https://ваш-проект.vercel.app`
- API: `https://ваш-проект.vercel.app/api/health`

Готово! 🎉

