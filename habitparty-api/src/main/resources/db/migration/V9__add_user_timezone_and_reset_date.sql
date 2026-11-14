-- Migration V9: Suporte a fuso horário IANA por usuário, cooldown de troca, controle idempotente de reset diário e tema visual (VIP)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
      ADD COLUMN IF NOT EXISTS timezone_updated_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS last_daily_reset_date DATE NULL,
      ADD COLUMN IF NOT EXISTS next_daily_reset_at TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS theme VARCHAR(40) NOT NULL DEFAULT 'dark';

    -- Backfill para usuários existentes: marca o dia atual de São Paulo como processado
    -- e agenda a próxima virada para a próxima meia-noite em America/Sao_Paulo.
    UPDATE users
    SET
      last_daily_reset_date = COALESCE(last_daily_reset_date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date),
      next_daily_reset_at = COALESCE(
        next_daily_reset_at,
        (((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo')
      )
    WHERE last_daily_reset_date IS NULL
       OR next_daily_reset_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_users_next_daily_reset_at ON users(next_daily_reset_at);
  END IF;
END $$;
