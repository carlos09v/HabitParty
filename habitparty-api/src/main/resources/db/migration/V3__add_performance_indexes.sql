-- Migration: Índices de performance para eliminar Seq Scans em Kanban, Dashboard, Jobs de Reset/Lembretes e Métricas Admin
-- Preserva 100% da estrutura das classes *JpaEntity.

DO $$
BEGIN
  -- Tarefas (Kanban, Dashboard, DailyResetJob, Exclusões em Cascata e Métricas Admin)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_column_order ON tasks(board_column_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
    CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date ON tasks(status, due_date);
  END IF;

  -- Subtabela Todo (Disparo de lembretes por e-mail e penalidades hardcore)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'todo') THEN
    CREATE INDEX IF NOT EXISTS idx_todo_pending_reminders ON todo(reminder_at)
      WHERE send_email_reminder = true AND email_reminder_sent = false;
    CREATE INDEX IF NOT EXISTS idx_todo_penalty_applied ON todo(is_penalty_applied)
      WHERE is_penalty_applied = false;
  END IF;

  -- Checklist Items (Batch loading por task_id e limpeza/métricas por user_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklist_item') THEN
    CREATE INDEX IF NOT EXISTS idx_checklist_item_task_id ON checklist_item(task_id);
    CREATE INDEX IF NOT EXISTS idx_checklist_item_user_id ON checklist_item(user_id);
  END IF;

  -- Colunas do Kanban e Workspaces
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'board_columns') THEN
    CREATE INDEX IF NOT EXISTS idx_board_columns_workspace_visible_order ON board_columns(workspace_id, is_visible, order_index);
    CREATE INDEX IF NOT EXISTS idx_board_columns_user_id ON board_columns(user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workspaces') THEN
    CREATE INDEX IF NOT EXISTS idx_workspaces_user_created ON workspaces(user_id, created_at ASC);
  END IF;

  -- Recompensas e Inventário (Mochila)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
    CREATE INDEX IF NOT EXISTS idx_rewards_user_order ON rewards(user_id, order_index ASC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_items_user_status_order ON inventory_items(user_id, status, order_index ASC);
  END IF;

  -- Foco (Atividades e Registros de Sessão)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'focus_activity') THEN
    CREATE INDEX IF NOT EXISTS idx_focus_activity_user_order ON focus_activity(user_id, order_index ASC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'focus_records') THEN
    CREATE INDEX IF NOT EXISTS idx_focus_records_user_start_time ON focus_records(user_id, start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_focus_records_activity_start_time ON focus_records(focus_activity_id, start_time DESC);
  END IF;

  -- Histórico de Transações (Extrato paginado e exportação CSV)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaction_history') THEN
    CREATE INDEX IF NOT EXISTS idx_transaction_history_user_created ON transaction_history(user_id, created_at DESC);
  END IF;

  -- Tokens de Sessão e Recuperação de Senha
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refresh_tokens') THEN
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active ON refresh_tokens(user_id, revoked, expiration_date);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_used ON password_reset_tokens(user_id, used);
  END IF;
END $$;
