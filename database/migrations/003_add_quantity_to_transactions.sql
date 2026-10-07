USE financeflow;

ALTER TABLE transactions
  ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1 AFTER inventory_item_id;