-- Adiciona coluna opcional pomo_target_minutes em focus_records para preservar a duração configurada do ciclo Pomodoro
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'focus_records'
  ) THEN
    ALTER TABLE public.focus_records
      ADD COLUMN IF NOT EXISTS pomo_target_minutes INTEGER;
  END IF;
END $$;
