-- V24: Versionamento otimista (@Version), trava anti-exploit de recompensas de foco (reward_locked),
-- controle de tentativas de lembrete (reminder_attempts), tabela ShedLock para jobs distribuídos,
-- limpeza de índices duplicados da V4 e criação de índices de performance.

-- 1. Coluna anti-exploit de shrink/expand no foco (Fase 1)
ALTER TABLE focus_records
  ADD COLUMN IF NOT EXISTS reward_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Colunas de controle de concorrência otimista (@Version) nas entidades mais concorridas
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

-- 3. Contador de tentativas de envio de lembretes por e-mail em tarefas
ALTER TABLE todo
  ADD COLUMN IF NOT EXISTS reminder_attempts INT NOT NULL DEFAULT 0;

-- 4. Tabela de controle de locks distribuídos do ShedLock para jobs agendados (multi-réplica)
CREATE TABLE IF NOT EXISTS shedlock (
  name VARCHAR(64) NOT NULL,
  lock_until TIMESTAMP NOT NULL,
  locked_at TIMESTAMP NOT NULL,
  locked_by VARCHAR(255) NOT NULL,
  PRIMARY KEY (name)
);

-- 5. Remoção de índices redundantes da V4 (já cobertos por constraints UNIQUE nas respectivas colunas)
DROP INDEX IF EXISTS idx_user_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_processed_payment_events_stripe_id;

-- 6. Novos índices de performance para queries reais identificadas na auditoria
CREATE INDEX IF NOT EXISTS idx_users_lower_username
  ON users (LOWER(username));

CREATE INDEX IF NOT EXISTS idx_tx_history_user_type_created
  ON transaction_history (user_id, transaction_type, created_at);

CREATE INDEX IF NOT EXISTS idx_tx_history_focus_reference
  ON transaction_history (reference_id)
  WHERE transaction_type = 'FOCUS_COMPLETED';

CREATE INDEX IF NOT EXISTS idx_social_notifications_actor_id
  ON social_notifications (actor_id);

CREATE INDEX IF NOT EXISTS idx_social_notifications_ref_type_unseen
  ON social_notifications (reference_id, notification_type)
  WHERE is_seen = FALSE;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiration_date
  ON refresh_tokens (expiration_date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_task_type
  ON tasks (user_id, task_type);

CREATE INDEX IF NOT EXISTS idx_focus_records_user_end_productive
  ON focus_records (user_id, end_time DESC)
  WHERE inventory_item_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_dispatch_logs_user_sent
  ON email_dispatch_logs (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_dispatch_logs_status_sent
  ON email_dispatch_logs (status, sent_at);

CREATE INDEX IF NOT EXISTS idx_checklist_item_task_order
  ON checklist_item (task_id, order_index, checklist_item_id);
