-- Índice composto para leitura ordenada de board_columns por workspace no Dashboard (todas as colunas)
CREATE INDEX IF NOT EXISTS idx_board_columns_workspace_order
    ON board_columns(workspace_id, order_index);
