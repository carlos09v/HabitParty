-- Migration V22: Snapshot de unidades de entrega (effort_units_snapshot) em transaction_history
-- e recalibração da conquista CHECKLIST_PERFECTIONIST para o novo fluxo de subtarefas

ALTER TABLE transaction_history
  ADD COLUMN IF NOT EXISTS effort_units_snapshot INT;

UPDATE achievements
SET description = 'Conclua 50 tarefas com todos os itens do checklist marcados.',
    target_value = 50
WHERE code = 'CHECKLIST_PERFECTIONIST';
