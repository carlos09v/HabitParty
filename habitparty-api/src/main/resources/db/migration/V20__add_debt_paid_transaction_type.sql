-- V20: Adiciona tipo DEBT_PAID ao transaction_history e converte quitações de dívidas já registradas
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transaction_history'
  ) THEN
    FOR constraint_record IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'transaction_history'
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) ILIKE '%transaction_type%'
    LOOP
      EXECUTE format('ALTER TABLE public.transaction_history DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;

    ALTER TABLE public.transaction_history DROP CONSTRAINT IF EXISTS transaction_history_transaction_type_check;

    ALTER TABLE public.transaction_history ADD CONSTRAINT transaction_history_transaction_type_check
    CHECK (transaction_type::text = ANY (ARRAY[
      'REWARD_BOUGHT',
      'DEBT_PAID',
      'HABIT_COMPLETED',
      'DAILY_COMPLETED',
      'TODO_COMPLETED',
      'TASK_COMPLETED',
      'TASK_FAILED',
      'BAD_HABIT_PENALTY',
      'ITEM_CONSUMED',
      'ITEM_DISCARDED',
      'FOCUS_COMPLETED',
      'MANUAL_ADJUSTMENT'
    ]::text[]));

    -- Backfill retroativo: quitações de dívida nunca geram linha em inventory_items
    -- (recompensas ainda ativas com category='DEBT' ou dívidas já auto-excluídas após pagamento desde a V12)
    UPDATE public.transaction_history th
    SET transaction_type = 'DEBT_PAID',
        package_level_snapshot = CASE
          WHEN th.package_level_snapshot = 'NONE' THEN NULL
          ELSE th.package_level_snapshot
        END
    WHERE th.transaction_type = 'REWARD_BOUGHT'
      AND th.reference_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.inventory_items ii
        WHERE ii.user_id = th.user_id
          AND ii.reward_id = th.reference_id
      )
      AND (
        EXISTS (
          SELECT 1
          FROM public.rewards r
          WHERE r.reward_id = th.reference_id
            AND r.category = 'DEBT'
        )
        OR (
          NOT EXISTS (
            SELECT 1
            FROM public.rewards r
            WHERE r.reward_id = th.reference_id
          )
          AND (th.package_level_snapshot IS NULL OR th.package_level_snapshot = 'NONE')
          AND th.created_at >= TIMESTAMP '2026-11-16 00:00:00'
        )
      );
  END IF;
END $$;
