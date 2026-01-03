-- Полная очистка и пересоздание всех таблиц
-- ВНИМАНИЕ: Это удалит ВСЕ данные из всех таблиц!
-- Используйте только если вы уверены, что хотите начать с чистого листа

-- Удаление всех таблиц в правильном порядке (сначала зависимые)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;

-- Удаление всех политик
DROP POLICY IF EXISTS "Enable all operations for service role" ON passengers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON drivers;
DROP POLICY IF EXISTS "Enable all operations for service role" ON orders;

-- Удаление триггеров
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Удаление функций
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Теперь выполните миграцию 001_initial_schema.sql

