USE financeflow;

ALTER TABLE transactions
  ADD COLUMN payment_method ENUM('cash', 'qris') NOT NULL DEFAULT 'cash' AFTER type;