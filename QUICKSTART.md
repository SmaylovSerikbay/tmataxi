# 🚀 Быстрый старт

## Шаг 1: Установка зависимостей

```bash
npm run install-all
```

## Шаг 2: Настройка MongoDB

Убедитесь, что MongoDB запущен локально или используйте MongoDB Atlas.

## Шаг 3: Настройка переменных окружения

### Backend

Создайте файл `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tmataxi
TELEGRAM_BOT_TOKEN=your_bot_token_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
API_URL=http://localhost:3000
WEB_APP_URL=http://localhost:3001
```

### Frontend

Создайте файл `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Шаг 4: Создание Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте токен и вставьте в `backend/.env` как `TELEGRAM_BOT_TOKEN`

## Шаг 5: Настройка Web App

1. В BotFather отправьте команду `/newapp` или `/setmenubutton`
2. Выберите вашего бота
3. Укажите URL вашего приложения:
   - Для разработки: `http://localhost:3001` (нужно использовать ngrok или аналогичный сервис)
   - Для продакшена: ваш домен

## Шаг 6: Запуск

### Режим разработки (оба сервера одновременно):

```bash
npm run dev
```

### Или отдельно:

Backend:
```bash
cd backend
npm run dev
```

Frontend (в другом терминале):
```bash
cd frontend
npm start
```

## Шаг 7: Тестирование

1. Откройте вашего бота в Telegram
2. Отправьте команду `/start`
3. Нажмите кнопку "Открыть приложение"
4. Выберите роль (пассажир или таксист)

## ⚠️ Важно для разработки

Для локальной разработки Telegram Mini App нужен HTTPS. Используйте:
- [ngrok](https://ngrok.com/) для туннелирования
- [localtunnel](https://localtunnel.github.io/www/)
- Или разверните на сервере с HTTPS

Пример с ngrok:
```bash
ngrok http 3001
# Используйте полученный HTTPS URL в BotFather
```

## 📝 Примечания

- Backend работает на порту 3000
- Frontend работает на порту 3001
- MongoDB должна быть запущена перед запуском backend
- Telegram Bot Token обязателен для работы уведомлений

