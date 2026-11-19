-- Migration V15: Coleção de Artefatos (Relíquias de Mérito & Exploração) + Títulos Equipáveis e Avatares Simbólicos

-- 1. Cosméticos de identidade equipáveis em users (título e avatar preset; avatar_frame já existe desde a V6)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS equipped_title VARCHAR(60),
  ADD COLUMN IF NOT EXISTS avatar_preset VARCHAR(40);

-- 2. Catálogo oficial de artefatos simbólicos (ARTIFACTS)
CREATE TABLE IF NOT EXISTS artifacts (
  artifact_id UUID PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  icon_name VARCHAR(60) NOT NULL,
  rarity VARCHAR(30) NOT NULL,
  source_type VARCHAR(30) NOT NULL,
  required_achievement_code VARCHAR(60),
  display_order INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_artifacts_rarity CHECK (rarity IN ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY')),
  CONSTRAINT chk_artifacts_source CHECK (source_type IN ('ACHIEVEMENT', 'MYSTERY_BOX', 'SPECIAL'))
);

CREATE INDEX IF NOT EXISTS idx_artifacts_order ON artifacts(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_artifacts_source_type ON artifacts(source_type);

-- 3. Tabela associativa de artefatos conquistados pelo usuário (USER_ARTIFACTS)
CREATE TABLE IF NOT EXISTS user_artifacts (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
  obtained_source VARCHAR(40) NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_seen BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_user_artifacts_user_unlocked ON user_artifacts(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_artifacts_user_unseen ON user_artifacts(user_id, is_seen) WHERE is_seen = FALSE;

-- 4. Seed do catálogo inicial oficial (20 artefatos simbólicos em 4 camadas)
INSERT INTO artifacts (artifact_id, code, icon_name, rarity, source_type, required_achievement_code, display_order)
VALUES
  -- CAMADA 1: Relíquias de Iniciação (4 Raras — Mérito de Curto/Médio Prazo)
  ('b1000000-0000-4000-8000-000000000001', 'ASTRO_COMPASS', 'Compass', 'RARE', 'ACHIEVEMENT', 'STREAK_30', 1),
  ('b1000000-0000-4000-8000-000000000002', 'QUARTZ_HOURGLASS', 'Hourglass', 'RARE', 'ACHIEVEMENT', 'FOCUS_HOURS_10', 2),
  ('b1000000-0000-4000-8000-000000000003', 'CENTURION_SCROLL', 'ScrollText', 'RARE', 'ACHIEVEMENT', 'TASK_250', 3),
  ('b1000000-0000-4000-8000-000000000004', 'GUILD_SAPPHIRE', 'Gem', 'RARE', 'ACHIEVEMENT', 'GOLD_1000', 4),

  -- CAMADA 2: Relíquias de Maestria (6 Épicas — Pilares de Consistência)
  ('b1000000-0000-4000-8000-000000000005', 'CITADEL_SEAL', 'Castle', 'EPIC', 'ACHIEVEMENT', 'TASK_500', 5),
  ('b1000000-0000-4000-8000-000000000006', 'SOLSTICE_LANTERN', 'Flame', 'EPIC', 'ACHIEVEMENT', 'STREAK_180', 6),
  ('b1000000-0000-4000-8000-000000000007', 'IMMERSION_ASTROLABE', 'Telescope', 'EPIC', 'ACHIEVEMENT', 'FOCUS_HOURS_100', 7),
  ('b1000000-0000-4000-8000-000000000008', 'ALCHEMIST_SCALE', 'Scale', 'EPIC', 'ACHIEVEMENT', 'REWARD_100', 8),
  ('b1000000-0000-4000-8000-000000000009', 'GRANDMASTER_CODEX', 'BookOpen', 'EPIC', 'ACHIEVEMENT', 'LEVEL_MASTER', 9),
  ('b1000000-0000-4000-8000-000000000010', 'OBSIDIAN_AEGIS', 'ShieldAlert', 'EPIC', 'ACHIEVEMENT', 'HARDCORE_MASTER_50', 10),

  -- CAMADA 3: Relíquias Primordiais (6 Lendárias — Endgame 1:1 com Conquistas Lendárias)
  ('b1000000-0000-4000-8000-000000000011', 'UNSTOPPABLE_CROWN', 'Crown', 'LEGENDARY', 'ACHIEVEMENT', 'TASK_1000', 11),
  ('b1000000-0000-4000-8000-000000000012', 'TITAN_CORE', 'Axe', 'LEGENDARY', 'ACHIEVEMENT', 'TASK_HARD_100', 12),
  ('b1000000-0000-4000-8000-000000000013', 'ETERNAL_SUNFLAME', 'Sun', 'LEGENDARY', 'ACHIEVEMENT', 'STREAK_365', 13),
  ('b1000000-0000-4000-8000-000000000014', 'INFINITY_CHRONOMETER', 'Infinity', 'LEGENDARY', 'ACHIEVEMENT', 'FOCUS_HOURS_200', 14),
  ('b1000000-0000-4000-8000-000000000015', 'EMPEROR_CHALICE', 'Trophy', 'LEGENDARY', 'ACHIEVEMENT', 'GOLD_15000', 15),
  ('b1000000-0000-4000-8000-000000000016', 'LEGEND_PHILOSOPHER_STONE', 'Sparkles', 'LEGENDARY', 'ACHIEVEMENT', 'LEVEL_LEGEND', 16),

  -- CAMADA 4: Artefatos de Exploração (4 Exclusivos de Caixa Misteriosa — Modo Aventura)
  ('b1000000-0000-4000-8000-000000000017', 'FATE_DICE', 'Dices', 'RARE', 'MYSTERY_BOX', NULL, 17),
  ('b1000000-0000-4000-8000-000000000018', 'HORIZON_KEY', 'KeyRound', 'RARE', 'MYSTERY_BOX', NULL, 18),
  ('b1000000-0000-4000-8000-000000000019', 'AETHER_PRISM', 'Pyramid', 'EPIC', 'MYSTERY_BOX', NULL, 19),
  ('b1000000-0000-4000-8000-000000000020', 'ASTRAL_RELIQUARY', 'Orbit', 'LEGENDARY', 'MYSTERY_BOX', NULL, 20)
ON CONFLICT (code) DO UPDATE SET
  icon_name = EXCLUDED.icon_name,
  rarity = EXCLUDED.rarity,
  source_type = EXCLUDED.source_type,
  required_achievement_code = EXCLUDED.required_achievement_code,
  display_order = EXCLUDED.display_order;

-- 5. Backfill retroativo: concede automaticamente os artefatos de mérito para usuários que já possuem as conquistas correspondentes
INSERT INTO user_artifacts (user_id, artifact_id, obtained_source, unlocked_at, is_seen)
SELECT ua.user_id, art.artifact_id, 'ACHIEVEMENT', ua.unlocked_at, TRUE
FROM user_achievements ua
JOIN achievements ach ON ach.achievement_id = ua.achievement_id
JOIN artifacts art ON art.required_achievement_code = ach.code
WHERE art.source_type = 'ACHIEVEMENT'
ON CONFLICT (user_id, artifact_id) DO NOTHING;
