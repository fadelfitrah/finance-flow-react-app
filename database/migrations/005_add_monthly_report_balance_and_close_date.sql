USE financeflow;

ALTER TABLE monthly_financial_reports
  ADD COLUMN balance_total DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER expense_total;

UPDATE monthly_financial_reports
SET balance_total = income_total - expense_total;

ALTER TABLE monthly_financial_reports
  MODIFY COLUMN closed_at DATE NOT NULL;

UPDATE monthly_financial_reports
SET closed_at = LAST_DAY(period_start);
