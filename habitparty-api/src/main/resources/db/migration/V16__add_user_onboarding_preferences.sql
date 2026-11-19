-- Migration V16: Preferências estruturadas de onboarding para personalização inicial da experiência
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS usage_mode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS primary_goals JSONB,
  ADD COLUMN IF NOT EXISTS main_obstacle VARCHAR(30),
  ADD COLUMN IF NOT EXISTS daily_focus_goal_minutes INT,
  ADD COLUMN IF NOT EXISTS peak_period VARCHAR(20),
  ADD COLUMN IF NOT EXISTS discipline_style VARCHAR(20);
