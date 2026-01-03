-- Альтернативная миграция: исправление существующих таблиц
-- Используйте эту миграцию, если не хотите удалять существующие данные

-- Проверяем и добавляем недостающие колонки в таблицу orders
-- Если таблица не существует, создаем её
DO $$
BEGIN
  -- Проверяем существование таблицы orders
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    -- Создаем таблицу orders
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
  ELSE
    -- Добавляем недостающие колонки, если они не существуют
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'passenger_id') THEN
      ALTER TABLE orders ADD COLUMN passenger_id UUID REFERENCES passengers(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_id') THEN
      ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'from_city') THEN
      ALTER TABLE orders ADD COLUMN from_city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'from_address') THEN
      ALTER TABLE orders ADD COLUMN from_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'from_lat') THEN
      ALTER TABLE orders ADD COLUMN from_lat NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'from_lng') THEN
      ALTER TABLE orders ADD COLUMN from_lng NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'to_city') THEN
      ALTER TABLE orders ADD COLUMN to_city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'to_address') THEN
      ALTER TABLE orders ADD COLUMN to_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'to_lat') THEN
      ALTER TABLE orders ADD COLUMN to_lat NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'to_lng') THEN
      ALTER TABLE orders ADD COLUMN to_lng NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'date') THEN
      ALTER TABLE orders ADD COLUMN date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'passengers_count') THEN
      ALTER TABLE orders ADD COLUMN passengers_count INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'luggage') THEN
      ALTER TABLE orders ADD COLUMN luggage BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'price') THEN
      ALTER TABLE orders ADD COLUMN price NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
      ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'phone') THEN
      ALTER TABLE orders ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'comment') THEN
      ALTER TABLE orders ADD COLUMN comment TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_at') THEN
      ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'updated_at') THEN
      ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Создание индексов (если их еще нет)
CREATE INDEX IF NOT EXISTS idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
DROP POLICY IF EXISTS "Enable all operations for service role" ON orders;
CREATE POLICY "Enable all operations for service role" ON orders
  FOR ALL USING (true) WITH CHECK (true);

