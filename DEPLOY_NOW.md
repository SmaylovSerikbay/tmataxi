# 🚀 Быстрый деплой на Vercel

## Шаг 1: Подготовка

Убедитесь, что у вас есть:
- ✅ Аккаунт на [vercel.com](https://vercel.com)
- ✅ Проект загружен в GitHub/GitLab/Bitbucket (или используйте Vercel CLI)

## Шаг 2: Деплой через Vercel Dashboard

### Вариант A: Через веб-интерфейс

1. Зайдите на [vercel.com](https://vercel.com) и войдите
2. Нажмите **"Add New..."** → **"Project"**
3. Импортируйте ваш репозиторий (или загрузите через GitHub)
4. Настройте проект:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (оставьте пустым или укажите корень)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install` (или оставьте пустым)

5. **НЕ добавляйте переменные окружения пока** - сделаем это после первого деплоя

6. Нажмите **"Deploy"**

### Вариант B: Через Vercel CLI

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# В корне проекта
vercel

# Следуйте инструкциям:
# - Логин (если первый раз)
# - Выберите проект или создайте новый
# - Подтвердите настройки
```

## Шаг 3: После первого деплоя

После успешного деплоя вы получите URL вида: `https://ваш-проект.vercel.app`

### Добавьте переменные окружения:

1. В Vercel Dashboard откройте ваш проект
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте следующие переменные (пока можно оставить пустыми или временные значения):

```
SUPABASE_URL=https://ivanwvobxflixmxcrigk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ_из_supabase
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
JWT_SECRET=любая_случайная_строка_для_jwt
API_URL=https://ваш-проект.vercel.app
WEB_APP_URL=https://ваш-проект.vercel.app
REACT_APP_API_URL=https://ваш-проект.vercel.app/api
```

**Важно**: После добавления переменных окружения нужно сделать **Redeploy** проекта!

## Шаг 4: Проверка работы

1. Откройте ваш проект: `https://ваш-проект.vercel.app`
2. Проверьте health check: `https://ваш-проект.vercel.app/api/health`
   - Должен вернуть: `{"status":"ok"}`

## Шаг 5: Настройка Telegram Bot

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/setmenubutton` или `/newapp`
3. Выберите вашего бота
4. Укажите URL: `https://ваш-проект.vercel.app`

## Если есть ошибки

### Ошибка сборки frontend
- Проверьте, что все зависимости установлены
- Убедитесь, что `frontend/package.json` содержит все нужные пакеты

### Ошибка API
- Проверьте логи в Vercel Dashboard → Functions
- Убедитесь, что переменные окружения добавлены
- Проверьте, что Supabase настроен (можно сделать позже)

### Ошибка подключения к Supabase
- Это нормально на первом этапе
- Настроим Supabase после успешного деплоя

## Что дальше?

После успешного деплоя:
1. ✅ Проверьте, что сайт открывается
2. ✅ Проверьте API health check
3. ⏳ Настроим Supabase (если будут ошибки с БД)
4. ⏳ Настроим Telegram Bot

## Полезные команды

```bash
# Локальная проверка сборки
cd frontend
npm install
npm run build

# Проверка через Vercel CLI
vercel --prod

# Просмотр логов
vercel logs
```

## Структура проекта для Vercel

```
tmataxi/
├── api/
│   └── index.js          # Serverless function
├── frontend/
│   └── build/             # Собранный frontend (генерируется)
├── vercel.json           # Конфигурация Vercel
└── package.json
```

---

**Готово!** После деплоя сообщите, если будут ошибки - разберемся! 🚀

