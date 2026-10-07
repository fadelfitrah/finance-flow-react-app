USE financeflow;

CREATE TABLE IF NOT EXISTS monthly_financial_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  income_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  transaction_count INT UNSIGNED NOT NULL DEFAULT 0,
  closed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_monthly_reports_user_period (user_id, period_start),
  KEY idx_monthly_reports_period (period_start),
  CONSTRAINT fk_monthly_reports_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);