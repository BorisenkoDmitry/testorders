ALTER TABLE orders
  ADD COLUMN discount_percent NUMERIC,
  ADD COLUMN amount_paid_kop BIGINT,
  ADD COLUMN pricing_version SMALLINT NOT NULL DEFAULT 0,
  ADD CONSTRAINT orders_discount_percent_valid
    CHECK (discount_percent IS NULL OR discount_percent BETWEEN 0 AND 100),
  ADD CONSTRAINT orders_amount_paid_nonnegative
    CHECK (amount_paid_kop IS NULL OR amount_paid_kop >= 0);
