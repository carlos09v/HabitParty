-- Migration: Adicionar coluna due_time (horário de vencimento opcional) na subtabela todo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todo') THEN
    ALTER TABLE todo ADD COLUMN IF NOT EXISTS due_time TIME;
  END IF;
END $$;
