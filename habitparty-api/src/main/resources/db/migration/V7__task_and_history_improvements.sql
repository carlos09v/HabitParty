-- Migration V7: Melhorias de tarefas, foco vinculado a tarefas e histórico de transações
-- 1. Ampliar o limite da descrição das tarefas para 5000 caracteres (alinhado ao @Size dos DTOs)
-- 2. Adicionar colunas start_time, due_end_time e is_all_day (eventos e duração) na subtabela todo
-- 3. Adicionar métricas acumuladas de foco nas tarefas (total_focus_minutes e focus_cycles_count)
-- 4. Adicionar vínculo de tarefa (task_id e task_name_snapshot) nos registros de foco (focus_records)
-- 5. Adicionar snapshot do nome da lista (board column) no histórico de transações + backfill
DO $$
BEGIN
  -- 1. Descrição e métricas de foco das tarefas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    ALTER TABLE tasks ALTER COLUMN description TYPE VARCHAR(5000);
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_focus_minutes INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS focus_cycles_count INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- 2. Campos de Evento (início, término e dia inteiro) nos Afazeres
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todo') THEN
    ALTER TABLE todo ADD COLUMN IF NOT EXISTS start_time TIME;
    ALTER TABLE todo ADD COLUMN IF NOT EXISTS due_end_time TIME;
    ALTER TABLE todo ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- 3. Vínculo de Tarefa nos Registros de Foco (Macro Atividade -> Micro Tarefa)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'focus_records') THEN
    ALTER TABLE focus_records ADD COLUMN IF NOT EXISTS task_id UUID;
    ALTER TABLE focus_records ADD COLUMN IF NOT EXISTS task_name_snapshot VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_focus_records_task_id ON focus_records(task_id) WHERE task_id IS NOT NULL;
  END IF;

  -- 4. Snapshot do nome da lista no histórico
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_history') THEN
    ALTER TABLE transaction_history ADD COLUMN IF NOT EXISTS column_name_snapshot VARCHAR(255);

    -- Backfill retroativo: preenche o nome da lista atual das tarefas que ainda existem
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'board_columns') THEN
      UPDATE transaction_history th
      SET column_name_snapshot = bc.name
      FROM tasks t
      JOIN board_columns bc ON bc.board_column_id = t.board_column_id
      WHERE th.reference_id = t.task_id
        AND th.column_name_snapshot IS NULL
        AND th.transaction_type IN (
          'HABIT_COMPLETED', 'DAILY_COMPLETED', 'TODO_COMPLETED',
          'TASK_COMPLETED', 'TASK_FAILED', 'BAD_HABIT_PENALTY'
        );
    END IF;
  END IF;
END $$;
