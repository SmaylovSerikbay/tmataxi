-- Add currency to orders and per-driver order rejections (dismiss)

-- 1) Currency column (default KZT)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KZT';

-- Optional check (won't fail if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_currency_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_currency_check
      CHECK (currency IN ('KZT', 'UZS'));
  END IF;
END $$;

-- 2) Order rejections table (hide order for a specific driver)
CREATE TABLE IF NOT EXISTS order_rejections (
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (order_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_order_rejections_driver_id ON order_rejections(driver_id);
CREATE INDEX IF NOT EXISTS idx_order_rejections_order_id ON order_rejections(order_id);

-- 3) RLS + policy (service role)
ALTER TABLE order_rejections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_rejections'
      AND policyname = 'Enable all operations for service role'
  ) THEN
    CREATE POLICY "Enable all operations for service role"
      ON order_rejections
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


