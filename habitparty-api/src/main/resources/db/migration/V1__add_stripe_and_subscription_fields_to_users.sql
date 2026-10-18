-- Migration: Adicionar campos de integração do Stripe e gerenciamento de assinaturas
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'FREE' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

-- Criação de índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
