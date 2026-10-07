USE financeflow;

CREATE TABLE IF NOT EXISTS inventory_financial_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  transaction_id INT UNSIGNED NOT NULL,
  inventory_item_id BIGINT UNSIGNED NULL,
  transaction_date DATE NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_financial_transaction (transaction_id),
  KEY idx_inventory_financial_user_date (user_id, transaction_date),
  KEY idx_inventory_financial_item (inventory_item_id),
  CONSTRAINT fk_inventory_financial_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_financial_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  CONSTRAINT fk_inventory_financial_item
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE SET NULL
);