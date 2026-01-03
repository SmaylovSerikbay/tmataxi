# 🔧 Исправление ошибки с таблицей orders

## Проблема
Ошибка: `column "passenger_id" does not exist` возникает, когда таблица `orders` уже существует, но с другой структурой.

## Решение

У вас есть два варианта:

### Вариант 1: Пересоздать таблицы (если данных нет)

Выполните миграцию `001_initial_schema.sql`. Она удалит существующую таблицу `orders` и создаст её заново с правильной структурой.

**⚠️ Внимание: Это удалит все существующие данные в таблице orders!**

### Вариант 2: Исправить существующую таблицу (если есть данные)

Если у вас уже есть данные, которые нужно сохранить, выполните миграцию `002_fix_existing_tables.sql`. Она:
- Проверит существование всех необходимых колонок
- Добавит недостающие колонки
- Сохранит существующие данные

## Инструкция

### В Supabase SQL Editor:

1. Откройте **SQL Editor** в вашем проекте Supabase
2. Выберите один из вариантов:

#### Если данных нет или можно удалить:
```sql
-- Выполните файл: 001_initial_schema.sql
```

#### Если нужно сохранить данные:
```sql
-- Выполните файл: 002_fix_existing_tables.sql
```

### Быстрое решение (удалить и пересоздать):

Если вы только начинаете и данных нет, выполните этот SQL:

```sql
-- Удаляем существующую таблицу
DROP TABLE IF EXISTS orders CASCADE;

-- Создаем таблицу заказов заново
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

-- Создаем индексы
CREATE INDEX idx_orders_passenger_id ON orders(passenger_id);
CREATE INDEX idx_orders_driver_id ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включаем RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Политика безопасности
CREATE POLICY "Enable all operations for service role" ON orders
  FOR ALL USING (true) WITH CHECK (true);
```

## Проверка

После выполнения миграции проверьте:

1. Откройте **Table Editor** в Supabase
2. Выберите таблицу `orders`
3. Убедитесь, что все колонки присутствуют:
   - `id`
   - `passenger_id`
   - `driver_id`
   - `from_city`, `from_address`, `from_lat`, `from_lng`
   - `to_city`, `to_address`, `to_lat`, `to_lng`
   - `date`
   - `passengers_count`
   - `luggage`
   - `price`
   - `status`
   - `phone`
   - `comment`
   - `created_at`
   - `updated_at`

Если все колонки на месте, миграция выполнена успешно! ✅

