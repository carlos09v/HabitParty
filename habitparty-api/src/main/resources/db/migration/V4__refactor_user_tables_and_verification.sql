-- Migration V4: Refatoração de Tabelas de Usuário (user_stats, user_subscriptions, user_tokens, processed_payment_events),
-- Verificação Progressiva de E-mail, Limite de Nome de Workspace e Colunas do Quadro e Atualização de Logs de E-mail

-- 1. Adicionar campos de verificação de e-mail e modo de experiência em users
-- Contas preexistentes recebem email_verified = true na migração para não quebrar acessos antigos; novas contas terão default false.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS experience_mode VARCHAR(30) NOT NULL DEFAULT 'PRODUCTIVITY';

ALTER TABLE users
  ALTER COLUMN email_verified SET DEFAULT false,
  ALTER COLUMN experience_mode SET DEFAULT 'PRODUCTIVITY';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birthday'
  ) THEN
    ALTER TABLE users ALTER COLUMN birthday DROP NOT NULL;
    UPDATE users SET birthday = NULL WHERE birthday = '2000-01-01';
    ALTER TABLE users RENAME COLUMN birthday TO birth_date;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE users ALTER COLUMN birth_date DROP NOT NULL;
    UPDATE users SET birth_date = NULL WHERE birth_date = '2000-01-01';
  END IF;
END $$;

-- 2. Criar tabela user_stats (1:1 com PK compartilhada) e migrar dados de gamificação
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  current_coins NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_gold_earned NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_xp INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  highest_streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_coins'
  ) THEN
    INSERT INTO user_stats (user_id, current_coins, total_gold_earned, total_xp, current_streak, highest_streak, updated_at)
    SELECT user_id,
           COALESCE(current_coins, 0),
           COALESCE(total_gold_earned, 0),
           COALESCE(total_xp, 0),
           COALESCE(current_streak, 0),
           COALESCE(highest_streak, 0),
           COALESCE(created_at, CURRENT_TIMESTAMP)
    FROM users
    ON CONFLICT (user_id) DO NOTHING;

    ALTER TABLE users
      DROP COLUMN IF EXISTS current_coins,
      DROP COLUMN IF EXISTS total_gold_earned,
      DROP COLUMN IF EXISTS total_xp,
      DROP COLUMN IF EXISTS current_streak,
      DROP COLUMN IF EXISTS highest_streak;
  END IF;
END $$;

-- 3. Criar tabela user_subscriptions (1:1 com PK compartilhada) e migrar dados do Stripe e planos
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_founder BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'FREE',
  subscription_ends_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_premium'
  ) THEN
    INSERT INTO user_subscriptions (
      user_id, is_premium, is_founder, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_ends_at, updated_at
    )
    SELECT user_id,
           COALESCE(is_premium, false),
           COALESCE(is_founder, false),
           stripe_customer_id,
           stripe_subscription_id,
           COALESCE(subscription_status, 'FREE'),
           subscription_ends_at,
           COALESCE(created_at, CURRENT_TIMESTAMP)
    FROM users
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    INSERT INTO user_subscriptions (
      user_id, is_premium, is_founder, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_ends_at, updated_at
    )
    SELECT user_id,
           false,
           false,
           stripe_customer_id,
           stripe_subscription_id,
           COALESCE(subscription_status, 'FREE'),
           subscription_ends_at,
           COALESCE(created_at, CURRENT_TIMESTAMP)
    FROM users
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  DROP INDEX IF EXISTS idx_users_stripe_customer_id;
  DROP INDEX IF EXISTS idx_users_stripe_subscription_id;

  ALTER TABLE users
    DROP COLUMN IF EXISTS is_premium,
    DROP COLUMN IF EXISTS is_founder,
    DROP COLUMN IF EXISTS stripe_customer_id,
    DROP COLUMN IF EXISTS stripe_subscription_id,
    DROP COLUMN IF EXISTS subscription_status,
    DROP COLUMN IF EXISTS subscription_ends_at;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_premium_founder ON user_subscriptions(is_premium, is_founder);

-- 4. Criar tabela unificada user_tokens (PASSWORD_RESET + EMAIL_VERIFICATION) e migrar password_reset_tokens
CREATE TABLE IF NOT EXISTS user_tokens (
  token_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_type VARCHAR(40) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiration_date TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
  ) THEN
    INSERT INTO user_tokens (token_id, user_id, token_type, token, expiration_date, used, used_at, created_at)
    SELECT reset_token_id,
           user_id,
           'PASSWORD_RESET',
           token,
           expiration_date,
           used,
           CASE WHEN used = true THEN CURRENT_TIMESTAMP ELSE NULL END,
           created_at
    FROM password_reset_tokens
    ON CONFLICT (token_id) DO NOTHING;

    DROP TABLE password_reset_tokens;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_type_active ON user_tokens(user_id, token_type, used);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expiration ON user_tokens(expiration_date);

-- 5. Evoluir tabela processed_payment_events para suportar user_id (FK Nullable), stripe_event_id, status e error_message
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'processed_payment_events'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'processed_payment_events' AND column_name = 'stripe_event_id'
  ) THEN
    DROP TABLE processed_payment_events;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS processed_payment_events (
  event_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  stripe_event_id VARCHAR(120) NOT NULL UNIQUE,
  event_type VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
  error_message VARCHAR(500),
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processed_payment_events_stripe_id ON processed_payment_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_processed_payment_events_user_id ON processed_payment_events(user_id);

-- 6. Atualizar CHECK constraint de email_type em email_dispatch_logs para incluir EMAIL_VERIFICATION
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'email_dispatch_logs'
  ) THEN
    ALTER TABLE email_dispatch_logs DROP CONSTRAINT IF EXISTS email_dispatch_logs_email_type_check;

    ALTER TABLE email_dispatch_logs ADD CONSTRAINT email_dispatch_logs_email_type_check
    CHECK (email_type::text = ANY (ARRAY[
      'TASK_REMINDER',
      'PASSWORD_RESET',
      'EMAIL_VERIFICATION',
      'SYSTEM'
    ]::text[]));
  END IF;
END $$;

-- 7. Aumentar limite de nome de workspace para 25 caracteres
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'name'
  ) THEN
    ALTER TABLE workspaces ALTER COLUMN name TYPE VARCHAR(25);
  END IF;
END $$;

-- 8. Aumentar limite de nome de coluna do quadro (board_columns) para 30 caracteres
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'board_columns' AND column_name = 'name'
  ) THEN
    ALTER TABLE board_columns ALTER COLUMN name TYPE VARCHAR(30);
  END IF;
END $$;
