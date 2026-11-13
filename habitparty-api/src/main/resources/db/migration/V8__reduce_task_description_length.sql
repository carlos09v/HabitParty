-- Migration V8: Alinhar o limite máximo da descrição das tarefas para 2000 caracteres
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    UPDATE tasks
    SET description = LEFT(description, 2000)
    WHERE CHAR_LENGTH(description) > 2000;

    ALTER TABLE tasks ALTER COLUMN description TYPE VARCHAR(2000);
  END IF;
END $$;
