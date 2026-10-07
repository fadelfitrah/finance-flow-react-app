USE financeflow;

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notification_type VARCHAR(100) NOT NULL,
  period CHAR(7) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_delivery_period (notification_type, period)
);
