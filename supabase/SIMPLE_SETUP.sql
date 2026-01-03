-- ============================================
-- ПРОСТАЯ УСТАНОВКА - СКОПИРУЙТЕ И ВЫПОЛНИТЕ ВСЁ
-- ============================================

-- Очистка (безопасно, удаляет только если существует)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 1. Создаем passengers ПЕРВОЙ
CREATE TABLE passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создаем drivers ВТОРОЙ
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

-- 3. Создаем orders ПОСЛЕДНЕЙ (ссылается на passengers и drivers)
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

-- Индексы
CREATE INDEX idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_drivers_telegram_id ON drivers(telegram_id);
CREATE INDEX idx_drivers_is_online ON drivers(is_online);
CREATE INDEX idx_passengers_telegram_id ON passengers(telegram_id);

-- Функция и триггер
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Enable all operations for service role" ON passengers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON drivers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for service role" ON orders
  FOR ALL USING (true) WITH CHECK (true);

