-- ============================================================
-- Debt Free - Supabase Migration
-- Run this in the Supabase SQL Editor to create tables
-- ============================================================

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  remaining NUMERIC NOT NULL,
  interest NUMERIC NOT NULL,
  min_payment NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  due_day INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#6366f1',
  icon TEXT NOT NULL DEFAULT 'fas fa-credit-card',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  debt_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  principal NUMERIC NOT NULL,
  interest NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT DEFAULT '',
  color TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debts_device_id ON debts(device_id);
CREATE INDEX IF NOT EXISTS idx_payments_device_id ON payments(device_id);
CREATE INDEX IF NOT EXISTS idx_payments_debt_id ON payments(debt_id);

-- Disable RLS for anonymous access (no auth required)
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to debts" ON debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to payments" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Recurring Bill Feature (v2)
-- ============================================================
-- frequency column supports: 'monthly', 'daily', 'recurring_bill'
-- For recurring_bill entries: total_amount=0, remaining=0, interest=0, min_payment=0
-- No schema change needed — the existing TEXT column and NUMERIC columns already support this.
