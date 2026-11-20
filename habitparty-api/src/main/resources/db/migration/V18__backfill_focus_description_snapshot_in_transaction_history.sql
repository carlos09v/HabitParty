-- Migration V18: Expande description_snapshot para 500 caracteres e preenche retroativamente as anotações (notes) de focus_records no histórico (FOCUS_COMPLETED)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transaction_history'
  ) THEN
    ALTER TABLE public.transaction_history
      ADD COLUMN IF NOT EXISTS description_snapshot VARCHAR(500);

    ALTER TABLE public.transaction_history
      ALTER COLUMN description_snapshot TYPE VARCHAR(500);

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'focus_records'
    ) THEN
      UPDATE public.transaction_history th
      SET description_snapshot = LEFT(TRIM(fr.notes), 500)
      FROM public.focus_records fr
      WHERE th.reference_id = fr.focus_record_id
        AND th.transaction_type = 'FOCUS_COMPLETED'
        AND th.description_snapshot IS NULL
        AND NULLIF(TRIM(fr.notes), '') IS NOT NULL;
    END IF;
  END IF;
END $$;
