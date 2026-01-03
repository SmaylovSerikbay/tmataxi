# 🚀 Деплой на Vercel с Supabase

## Шаг 1: Настройка Supabase

1. Перейдите в ваш проект Supabase: https://ivanwvobxflixmxcrigk.supabase.co
2. Откройте SQL Editor
3. Выполните SQL миграцию из файла `supabase/migrations/001_initial_schema.sql`

Или скопируйте и выполните:

```sql
-- Создание таблицы пассажиров
CREATE TABLE IF NOT EXISTS passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы таксистов
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_number TEXT NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  current_location_city TEXT,
  current_location_lat NUMERIC,
  current_location_lng NUMERIC,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID REFERENCES passengers(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  from_city TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_lat NUMERIC,
  from_lng NUMERIC,
  to_city TEXT NOT NULL,
  to_address TEXT NOT NULL,
  to_lat NUMERIC,
  to_lng NUMERIC,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  passengers_count INTEGER NOT NULL DEFAULT 1,
  luggage BOOLEAN DEFAULT FALSE,
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in-progress', 'completed', 'cancelled')),
  phone TEXT NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_telegram_id ON drivers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_passengers_telegram_id ON passengers(telegram_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем Row Level Security (RLS)
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (разрешаем все операции через API ключ)
CREATE POLICY "Enable all operations for service role" ON passengers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON drivers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON orders
  FOR ALL USING (true) WITH CHECK (true);
```

## Шаг 2: Получение ключей Supabase

1. В проекте Supabase перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL**: `https://ivanwvobxflixmxcrigk.supabase.co`
   - **service_role key** (секретный ключ) - для backend операций
   - **anon key** (публичный ключ) - можно использовать для frontend, но лучше service_role для backend

## Шаг 3: Установка Vercel CLI (опционально)

```bash
npm i -g vercel
```

## Шаг 4: Деплой на Vercel

### Вариант 1: Через Vercel Dashboard

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **New Project**
3. Подключите ваш GitHub репозиторий
4. Настройте проект:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (корень проекта)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

5. Добавьте переменные окружения в **Settings** → **Environment Variables**:

```
SUPABASE_URL=https://ivanwvobxflixmxcrigk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
JWT_SECRET=случайная_строка_для_jwt
API_URL=https://ваш-проект.vercel.app
WEB_APP_URL=https://ваш-проект.vercel.app
```

6. Нажмите **Deploy**

### Вариант 2: Через Vercel CLI

```bash
# Войдите в Vercel
vercel login

# Деплой
vercel

# Добавьте переменные окружения
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add TELEGRAM_BOT_TOKEN
vercel env add JWT_SECRET
vercel env add API_URL
vercel env add WEB_APP_URL
```

## Шаг 5: Настройка Telegram Bot

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/setmenubutton` или `/newapp`
3. Выберите вашего бота
4. Укажите URL вашего приложения на Vercel: `https://ваш-проект.vercel.app`

## Шаг 6: Обновление frontend для production

Убедитесь, что в `frontend/.env.production` или переменных окружения Vercel указан:

```
REACT_APP_API_URL=https://ваш-проект.vercel.app/api
```

Или обновите `frontend/src/utils/api.js` чтобы использовать переменную окружения:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

## Структура проекта для Vercel

```
tmataxi/
├── api/
│   ├── index.js          # Serverless function entry point
│   └── utils/
│       └── supabase.js   # Supabase client
├── backend/
│   ├── routes/           # API routes
│   └── utils/
│       └── supabase.js
├── frontend/
│   └── build/            # Build output (генерируется)
├── vercel.json           # Vercel configuration
└── supabase/
    └── migrations/       # SQL миграции
```

## Проверка работы

1. Откройте вашего бота в Telegram
2. Отправьте `/start`
3. Нажмите кнопку "Открыть приложение"
4. Проверьте создание заказа и работу панели таксиста

## Troubleshooting

### Ошибка подключения к Supabase
- Проверьте правильность `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`
- Убедитесь, что RLS политики настроены правильно

### API не работает
- Проверьте логи в Vercel Dashboard → Functions
- Убедитесь, что маршруты в `vercel.json` настроены правильно

### Frontend не загружается
- Проверьте, что build прошел успешно
- Убедитесь, что `REACT_APP_API_URL` указан правильно

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

