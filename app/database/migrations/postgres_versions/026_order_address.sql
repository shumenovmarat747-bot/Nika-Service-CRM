-- 026: адрес выезда/приёма относится к конкретной заявке.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
