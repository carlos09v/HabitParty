-- Migration: Adicionar campos de integração do Stripe e gerenciamento de assinaturas
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP,
  profile_photo_url VARCHAR(255),
  birthday DATE,
  gender VARCHAR(50) NOT NULL,
  experience_mode VARCHAR(30) NOT NULL DEFAULT 'GAMIFIED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'FREE' NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP;

-- Criação de índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
