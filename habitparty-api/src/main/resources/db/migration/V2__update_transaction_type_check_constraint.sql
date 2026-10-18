-- Migration: Atualizar CHECK constraint de transaction_type para incluir tipos específicos de tarefas
ALTER TABLE transaction_history DROP CONSTRAINT IF EXISTS transaction_history_transaction_type_check;

ALTER TABLE transaction_history ADD CONSTRAINT transaction_history_transaction_type_check 
CHECK (transaction_type::text = ANY (ARRAY[
  'REWARD_BOUGHT',
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

-- Remove a coluna redundante task_type_snapshot caso ela tenha sido criada
ALTER TABLE transaction_history DROP CONSTRAINT IF EXISTS transaction_history_task_type_snapshot_check;
ALTER TABLE transaction_history DROP COLUMN IF EXISTS task_type_snapshot;
