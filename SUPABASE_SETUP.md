# 🔧 Настройка Supabase

## Ваши данные проекта

- **Project URL**: `https://ivanwvobxflixmxcrigk.supabase.co`
- **Publishable API Key**: `sb_publishable_C3A8dhsLWWpTbD5JWaRRGQ_k8dpohH4`

## Шаг 1: Создание таблиц

1. Откройте ваш проект Supabase: https://ivanwvobxflixmxcrigk.supabase.co
2. Перейдите в **SQL Editor**
3. Создайте новый запрос
4. Скопируйте и выполните SQL из файла `supabase/migrations/001_initial_schema.sql`

Или выполните этот SQL:

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

-- Создание индексов для оптимизации
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

-- Политики безопасности (разрешаем все операции через service_role ключ)
CREATE POLICY "Enable all operations for service role" ON passengers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON drivers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON orders
  FOR ALL USING (true) WITH CHECK (true);
```

## Шаг 2: Получение Service Role Key

1. В проекте Supabase перейдите в **Settings** → **API**
2. Найдите секцию **Project API keys**
3. Скопируйте **service_role** ключ (секретный ключ)
   - ⚠️ **Важно**: Этот ключ имеет полный доступ к базе данных, не публикуйте его в клиентском коде!

## Шаг 3: Переменные окружения для Vercel

Добавьте следующие переменные окружения в Vercel:

```
SUPABASE_URL=https://ivanwvobxflixmxcrigk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ_здесь
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
JWT_SECRET=случайная_строка_для_jwt_токенов
API_URL=https://ваш-проект.vercel.app
WEB_APP_URL=https://ваш-проект.vercel.app
```

## Проверка работы

После настройки проверьте:

1. Таблицы созданы: **Table Editor** → должны быть `passengers`, `drivers`, `orders`
2. Индексы созданы: **Database** → **Indexes**
3. RLS включен: **Authentication** → **Policies**

## Важные замечания

- **Service Role Key** используется только на backend (serverless functions)
- **Anon Key** можно использовать на frontend, но для этого нужны правильные RLS политики
- В текущей конфигурации используется Service Role Key для упрощения

## Troubleshooting

### Ошибка "relation does not exist"
- Убедитесь, что SQL миграция выполнена полностью
- Проверьте, что вы находитесь в правильной схеме (public)

### Ошибка "permission denied"
- Проверьте, что RLS политики созданы
- Убедитесь, что используете service_role ключ на backend

### Ошибка подключения
- Проверьте правильность SUPABASE_URL
- Убедитесь, что ключ скопирован полностью (без пробелов)

