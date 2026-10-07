USE financeflow;

ALTER TABLE transactions
  ADD COLUMN category_detail VARCHAR(100) NULL AFTER category;