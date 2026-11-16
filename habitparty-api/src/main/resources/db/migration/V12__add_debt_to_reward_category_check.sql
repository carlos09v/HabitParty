-- Garante que a constraint de categoria da tabela rewards aceite DEBT caso exista CHECK constraint em bancos legados
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rewards'
  ) THEN
    FOR constraint_record IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'rewards'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) ILIKE '%category%'
    LOOP
      EXECUTE format('ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;

    ALTER TABLE public.rewards ADD CONSTRAINT rewards_category_check
    CHECK (category IS NULL OR category::text = ANY (ARRAY[
      'NONE',
      'ENTERTAINMENT',
      'WELLNESS',
      'SHOPPING',
      'DEVELOPMENT',
      'LUCK',
      'HOBBIES',
      'DEBT'
    ]::text[]));
  END IF;
END $$;

-- Índices compostos para performance do Kanban/Dashboard e teto diário de recompensas de hábitos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_column_type_status_due
      ON public.tasks(board_column_id, task_type, status, due_date);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_history') THEN
    ALTER TABLE public.transaction_history
      ADD COLUMN IF NOT EXISTS description_snapshot VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_transaction_history_habit_daily_cap
      ON public.transaction_history(user_id, reference_id, transaction_type, created_at);

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
      UPDATE public.transaction_history th
      SET description_snapshot = LEFT(TRIM(r.description), 255)
      FROM public.rewards r
      WHERE th.reference_id = r.reward_id
        AND th.description_snapshot IS NULL
        AND th.transaction_type = 'REWARD_BOUGHT'
        AND NULLIF(TRIM(r.description), '') IS NOT NULL;
    END IF;
  END IF;
END $$;
