CREATE DATABASE IF NOT EXISTS financeflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE financeflow;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  transaction_date DATE NOT NULL,
  description VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  category_detail VARCHAR(100) NULL,
  inventory_item_id BIGINT UNSIGNED NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  type ENUM('income', 'expense') NOT NULL,
  payment_method ENUM('cash', 'qris') NOT NULL DEFAULT 'cash',
  amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_user_date (user_id, transaction_date),
  KEY idx_transactions_inventory_item (inventory_item_id),
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_inventory_item
    FOREIGN KEY (inventory_item_id) REFERENCES inventory(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS monthly_financial_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  income_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  balance_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  transaction_count INT UNSIGNED NOT NULL DEFAULT 0,
  closed_at DATE NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_monthly_reports_user_period (user_id, period_start),
  KEY idx_monthly_reports_period (period_start),
  CONSTRAINT fk_monthly_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_type VARCHAR(100) NOT NULL,
  period CHAR(7) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_delivery_period (notification_type, period)
);
