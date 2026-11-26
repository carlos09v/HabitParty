-- V23: Soft-delete para o extrato de histórico (preservando integridade de caps diários, streaks e retrospectiva),
-- flag explícita de senha cadastrada (para distinguir contas criadas apenas via Google OAuth) e índices compostos.

ALTER TABLE transaction_history
  ADD COLUMN IF NOT EXISTS hidden_from_history BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS has_password BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tx_history_user_visible_created
  ON transaction_history (user_id, hidden_from_history, created_at DESC, transaction_history_id DESC);

CREATE INDEX IF NOT EXISTS idx_tx_history_user_visible_type_created
  ON transaction_history (user_id, hidden_from_history, transaction_type, created_at DESC, transaction_history_id DESC);