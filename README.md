# 🚖 Междугороднее такси - Telegram Mini App

Telegram Mini App для междугородних такси-перевозок. Позволяет пассажирам создавать заказы, а таксистам - принимать или отклонять их.

## 🚀 Возможности

- 👤 **Для пассажиров:**
  - Создание заказов на междугородние поездки
  - Просмотр своих заказов
  - Отслеживание статуса заказа

- 🚗 **Для таксистов:**
  - Регистрация в системе
  - Просмотр доступных заказов в реальном времени
  - Принятие или отклонение заказов
  - Управление статусом (онлайн/офлайн)

- ⚡ **Технические особенности:**
  - Real-time обновления через WebSocket (Socket.io)
  - Интеграция с Telegram Bot API
  - Адаптивный дизайн для Telegram WebApp

## 📋 Требования

- Node.js 16+
- MongoDB
- Telegram Bot Token

## 🛠 Установка

1. Клонируйте репозиторий или скачайте файлы

2. Установите зависимости:
```bash
npm run install-all
```

3. Настройте переменные окружения:

Скопируйте `backend/.env.example` в `backend/.env` и заполните:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tmataxi
TELEGRAM_BOT_TOKEN=your_bot_token_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

4. Создайте Telegram бота:
   - Откройте [@BotFather](https://t.me/BotFather) в Telegram
   - Создайте нового бота командой `/newbot`
   - Скопируйте токен в `TELEGRAM_BOT_TOKEN`

5. Настройте Web App URL в BotFather:
   - Используйте команду `/newapp` или `/setmenubutton`
   - Укажите URL вашего приложения (например, `https://yourdomain.com`)

## 🚀 Запуск

### Режим разработки (одновременно backend и frontend):
```bash
npm run dev
```

### Или отдельно:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm start
```

## 📁 Структура проекта

```
tmataxi/
├── backend/
│   ├── models/          # Модели MongoDB
│   │   ├── Order.js
│   │   ├── Driver.js
│   │   └── Passenger.js
│   ├── routes/          # API маршруты
│   │   ├── orders.js
│   │   ├── drivers.js
│   │   ├── passengers.js
│   │   └── auth.js
│   ├── bot.js           # Telegram Bot
│   ├── server.js        # Express сервер
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # Страницы приложения
│   │   ├── utils/       # Утилиты (API, Telegram)
│   │   └── App.js
│   └── package.json
└── package.json
```

## 🔌 API Endpoints

### Заказы
- `POST /api/orders/create` - Создать заказ
- `GET /api/orders/passenger/:passengerId` - Заказы пассажира
- `GET /api/orders/available` - Доступные заказы
- `POST /api/orders/:orderId/accept` - Принять заказ
- `POST /api/orders/:orderId/reject` - Отклонить заказ
- `PATCH /api/orders/:orderId/status` - Обновить статус

### Таксисты
- `POST /api/drivers/register` - Регистрация таксиста
- `GET /api/drivers/:telegramId` - Информация о таксисте
- `PATCH /api/drivers/:driverId/status` - Изменить статус
- `GET /api/drivers/:driverId/orders` - Заказы таксиста

### Пассажиры
- `POST /api/passengers/register` - Регистрация пассажира
- `GET /api/passengers/:telegramId` - Информация о пассажире

## 🔐 Безопасность

⚠️ **Важно:** В продакшене необходимо:
- Добавить проверку подписи Telegram WebApp данных
- Настроить CORS правильно
- Использовать HTTPS
- Добавить rate limiting
- Валидировать все входные данные

## 📱 Использование

1. Откройте бота в Telegram
2. Нажмите кнопку "Открыть приложение"
3. Выберите роль (пассажир или таксист)
4. Для таксиста: зарегистрируйтесь и перейдите в онлайн
5. Для пассажира: создайте заказ
6. Таксисты получат уведомление о новом заказе и могут принять его

## 🛣 Roadmap

- [ ] Геолокация и карты
- [ ] Система рейтингов
- [ ] Платежная интеграция
- [ ] Push-уведомления
- [ ] История поездок
- [ ] Чат между пассажиром и таксистом

## 📄 Лицензия

ISC

