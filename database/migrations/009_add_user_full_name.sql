USE financeflow;

ALTER TABLE users
  ADD COLUMN full_name VARCHAR(100) NOT NULL DEFAULT '' AFTER email;

UPDATE users
SET full_name = email
WHERE full_name = '';
