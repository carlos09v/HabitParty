-- Migration V17: Recorde histórico de ofensiva (highest_streak) em Diárias e Hábitos
ALTER TABLE daily
  ADD COLUMN IF NOT EXISTS highest_streak INT NOT NULL DEFAULT 0;

ALTER TABLE habit
  ADD COLUMN IF NOT EXISTS highest_streak INT NOT NULL DEFAULT 0;

UPDATE daily
SET highest_streak = GREATEST(highest_streak, current_streak)
WHERE highest_streak < current_streak;

UPDATE habit
SET highest_streak = GREATEST(highest_streak, current_streak)
WHERE highest_streak < current_streak;
