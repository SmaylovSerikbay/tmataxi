-- ============================================
-- ПОЛНАЯ МИГРАЦИЯ: СОЗДАНИЕ ВСЕХ ТАБЛИЦ
-- Выполните этот SQL полностью от начала до конца
-- ============================================

-- ШАГ 1: Удаление всех существующих таблиц (если есть)
-- Это безопасно, так как удаляет только если таблицы существуют
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;

-- ШАГ 2: Удаление функций, триггеров и политик (если есть)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP POLICY IF EXISTS "Enable all operations for service role" ON passengers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON drivers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON orders;

-- ШАГ 3: Создание таблицы пассажиров (ПЕРВОЙ!)
-- Эта таблица должна быть создана первой, так как на неё ссылается orders
CREATE TABLE passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ШАГ 4: Создание таблицы таксистов (ВТОРОЙ!)
-- Эта таблица должна быть создана второй, так как на неё ссылается orders
CREATE TABLE drivers (
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

-- ШАГ 5: Создание таблицы заказов (ПОСЛЕДНЕЙ!)
-- Эта таблица создается последней, так как ссылается на passengers и drivers
CREATE TABLE orders (
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

-- ШАГ 6: Создание индексов для оптимизации запросов
CREATE INDEX idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_drivers_telegram_id ON drivers(telegram_id);
CREATE INDEX idx_drivers_is_online ON drivers(is_online);
CREATE INDEX idx_passengers_telegram_id ON passengers(telegram_id);

-- ШАГ 7: Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ШАГ 8: Создание триггера для автоматического обновления updated_at
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ШАГ 9: Включение Row Level Security (RLS) для всех таблиц
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ШАГ 10: Создание политик безопасности
-- Эти политики разрешают все операции через service_role ключ
CREATE POLICY "Enable all operations for service role" 
    ON passengers
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" 
    ON drivers
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" 
    ON orders
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- ============================================
-- МИГРАЦИЯ ЗАВЕРШЕНА
-- Проверьте в Table Editor, что созданы 3 таблицы:
-- 1. passengers
-- 2. drivers  
-- 3. orders
-- ============================================
