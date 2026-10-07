USE financeflow;

ALTER TABLE transactions
  ADD COLUMN inventory_item_id BIGINT UNSIGNED NULL AFTER category_detail,
  ADD KEY idx_transactions_inventory_item (inventory_item_id),
  ADD CONSTRAINT fk_transactions_inventory_item
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE SET NULL;