-- V19: Integridade de streak global (last_streak_date), Stripe (prepaid_ends_at, cancel_at_period_end)
-- e índice composto para agregação de foco por end_time.

ALTER TABLE user_stats
    ADD COLUMN IF NOT EXISTS last_streak_date DATE;

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS prepaid_ends_at TIMESTAMP;

ALTER TABLE user_subscriptions
    ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserva saldo pré-pago de usuários Pix ativos (sem assinatura recorrente no Stripe)
UPDATE user_subscriptions
SET prepaid_ends_at = subscription_ends_at
WHERE stripe_subscription_id IS NULL
  AND subscription_ends_at IS NOT NULL
  AND is_premium = TRUE
  AND prepaid_ends_at IS NULL;

-- Índice composto para agregação e consulta de foco por end_time (índice de task_id já existe na V7 e o de histórico em V12)
CREATE INDEX IF NOT EXISTS idx_focus_records_user_end
    ON focus_records (user_id, end_time DESC);
