-- Migration V21: Adiciona suporte a Etapas Recompensadas (is_rewarded),
-- ordenação determinística (order_index) e rastreio de auto-conclusão (auto_completed) em checklist_item,
-- além do snapshot imutável de checklist completo (checklist_completed_snapshot) em transaction_history
ALTER TABLE checklist_item
  ADD COLUMN IF NOT EXISTS is_rewarded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE checklist_item
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

ALTER TABLE checklist_item
  ADD COLUMN IF NOT EXISTS auto_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE checklist_item c
SET order_index = (
  SELECT COUNT(*)
  FROM checklist_item c2
  WHERE c2.task_id = c.task_id
    AND c2.checklist_item_id < c.checklist_item_id
)
WHERE c.order_index = 0;

ALTER TABLE transaction_history
  ADD COLUMN IF NOT EXISTS checklist_completed_snapshot BOOLEAN;
