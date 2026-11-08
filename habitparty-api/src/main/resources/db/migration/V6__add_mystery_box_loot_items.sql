-- Migration V6: Loot Items personalizados em Caixas Misteriosas + Sistema de Conquistas (Achievements) & Vitrine (Profile Highlights)

-- 1. Campos de Loot Items para Caixas Misteriosas
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS loot_items JSONB;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS loot_items_snapshot JSONB;

-- 2. Campos de Perfil Público / Vitrine em users (bio e moldura equipada)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio VARCHAR(160),
  ADD COLUMN IF NOT EXISTS avatar_frame VARCHAR(40) NOT NULL DEFAULT 'none';

-- 3. Contadores vitalícios de performance em user_stats (avaliação O(1) de conquistas e métricas da vitrine)
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS total_tasks_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hard_tasks_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hardcore_tasks_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_focus_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_focus_sessions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_focus_session_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pomodoros_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rewards_redeemed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_mystery_boxes_opened INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievement_points INT NOT NULL DEFAULT 0,
  -- Contadores comportamentais das conquistas expandidas (Coruja, Madrugador, Cupons, Workspaces, Checklist, Pontualidade, Impulsos e Metas de Atividade)
  ADD COLUMN IF NOT EXISTS total_night_focus_sessions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_early_focus_sessions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_coupons_depleted INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_workspaces_created INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_checklist_tasks_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_on_time_todos_completed INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_clean_habit_cycles INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_activity_goals_met INT NOT NULL DEFAULT 0;

-- Backfill retroativo dos contadores de user_stats a partir de transaction_history e focus_records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'transaction_history'
  ) THEN
    UPDATE user_stats us
    SET
      total_tasks_completed = COALESCE((
        SELECT COUNT(*)
        FROM transaction_history th
        WHERE th.user_id = us.user_id
          AND th.transaction_type IN ('HABIT_COMPLETED', 'DAILY_COMPLETED', 'TODO_COMPLETED', 'TASK_COMPLETED')
      ), 0),
      total_hard_tasks_completed = COALESCE((
        SELECT COUNT(*)
        FROM transaction_history th
        WHERE th.user_id = us.user_id
          AND th.transaction_type IN ('HABIT_COMPLETED', 'DAILY_COMPLETED', 'TODO_COMPLETED', 'TASK_COMPLETED')
          AND th.difficulty_snapshot = 'HARD'
      ), 0),
      total_rewards_redeemed = COALESCE((
        SELECT COUNT(*)
        FROM transaction_history th
        WHERE th.user_id = us.user_id
          AND th.transaction_type = 'REWARD_BOUGHT'
      ), 0),
      total_mystery_boxes_opened = COALESCE((
        SELECT COUNT(*)
        FROM transaction_history th
        WHERE th.user_id = us.user_id
          AND th.transaction_type = 'ITEM_CONSUMED'
          AND th.name_snapshot LIKE 'Caixa Aberta:%'
      ), 0);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'focus_records'
  ) THEN
    UPDATE user_stats us
    SET
      total_focus_minutes = COALESCE((
        SELECT SUM(fr.duration_minutes)
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
          AND fr.duration_minutes >= 10
      ), 0),
      total_focus_sessions = COALESCE((
        SELECT COUNT(*)
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
          AND fr.duration_minutes >= 10
      ), 0),
      longest_focus_session_minutes = COALESCE((
        SELECT MAX(fr.duration_minutes)
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
          AND fr.duration_minutes >= 10
      ), 0),
      total_pomodoros_completed = COALESCE((
        SELECT SUM(COALESCE(fr.completed_pomos, 0))
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
      ), 0),
      -- Coruja da Meia-Noite: sessões (>= 10 min) que terminaram entre 23:00 e 04:59
      total_night_focus_sessions = COALESCE((
        SELECT COUNT(*)
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
          AND fr.duration_minutes >= 10
          AND (EXTRACT(HOUR FROM fr.end_time) >= 23 OR EXTRACT(HOUR FROM fr.end_time) < 5)
      ), 0),
      -- Madrugador: sessões (>= 10 min) que começaram entre 05:00 e 06:59
      total_early_focus_sessions = COALESCE((
        SELECT COUNT(*)
        FROM focus_records fr
        WHERE fr.user_id = us.user_id
          AND fr.inventory_item_id IS NULL
          AND fr.duration_minutes >= 10
          AND EXTRACT(HOUR FROM fr.start_time) >= 5
          AND EXTRACT(HOUR FROM fr.start_time) < 7
      ), 0);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'workspaces'
  ) THEN
    UPDATE user_stats us
    SET total_workspaces_created = GREATEST(us.total_workspaces_created, COALESCE((
      SELECT COUNT(*) FROM workspaces w WHERE w.user_id = us.user_id
    ), 0));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'todo'
  ) THEN
    UPDATE user_stats us
    SET total_on_time_todos_completed = GREATEST(us.total_on_time_todos_completed, COALESCE((
      SELECT COUNT(*)
      FROM tasks t
      JOIN todo td ON td.task_id = t.task_id
      WHERE t.user_id = us.user_id
        AND t.status = 'COMPLETED'
        AND t.due_date IS NOT NULL
        AND td.is_penalty_applied = false
        AND (td.completed_at IS NULL OR CAST(td.completed_at AS DATE) <= t.due_date)
    ), 0));
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'focus_activity'
  ) THEN
    UPDATE user_stats us
    SET total_activity_goals_met = GREATEST(us.total_activity_goals_met, COALESCE((
      SELECT COUNT(*)
      FROM focus_records fr
      JOIN focus_activity fa ON fa.focus_activity_id = fr.focus_activity_id
      WHERE fr.user_id = us.user_id
        AND fr.inventory_item_id IS NULL
        AND (COALESCE(fr.completed_pomos, 0) >= 1 OR fr.duration_minutes >= COALESCE(fa.pomo_time_minutes, 25))
    ), 0));
  END IF;
END $$;

-- 4. Tabela de Catálogo de Conquistas (ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS achievements (
  achievement_id UUID PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(300) NOT NULL,
  icon_name VARCHAR(60) NOT NULL,
  points INT NOT NULL DEFAULT 10,
  category VARCHAR(40) NOT NULL,
  rarity VARCHAR(30) NOT NULL,
  target_value INT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  is_secret BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_achievements_category_order ON achievements(category, display_order);

-- 5. Tabela Associativa de Conquistas do Usuário (USER_ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked ON user_achievements(user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unseen ON user_achievements(user_id, is_seen);

-- 6. Tabela de Vitrine de Destaques do Perfil (PROFILE_HIGHLIGHTS)
CREATE TABLE IF NOT EXISTS profile_highlights (
  highlight_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  display_order INT NOT NULL,
  highlight_type VARCHAR(40) NOT NULL,
  reference_id UUID REFERENCES achievements(achievement_id) ON DELETE CASCADE,
  highlight_key VARCHAR(60),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_profile_highlights_user_slot UNIQUE (user_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_profile_highlights_user_order ON profile_highlights(user_id, display_order ASC);

-- 7. Seed do Catálogo Oficial de Conquistas (Release 1.2 — 63 conquistas em 6 categorias)
-- ON CONFLICT DO UPDATE mantém o catálogo do banco sempre alinhado a este arquivo (título, ordem, pontos, metas)
INSERT INTO achievements (achievement_id, code, title, description, icon_name, points, category, rarity, target_value, display_order, is_secret)
VALUES
  -- CATEGORIA 1: TAREFAS & EXECUÇÃO (TASKS) — 12 conquistas
  ('a1000000-0000-4000-8000-000000000001', 'TASK_FIRST', 'Primeira Missão', 'Conclua sua primeira tarefa na plataforma.', 'CheckCircle2', 10, 'TASKS', 'COMMON', 1, 1, false),
  ('a1000000-0000-4000-8000-000000000002', 'TASK_10', 'Ritmo de Caçada', 'Conclua 10 tarefas acumuladas.', 'ListChecks', 10, 'TASKS', 'COMMON', 10, 2, false),
  ('a1000000-0000-4000-8000-000000000003', 'TASK_50', 'Exterminador de Pendências', 'Conclua 50 tarefas acumuladas.', 'Swords', 25, 'TASKS', 'UNCOMMON', 50, 3, false),
  ('a1000000-0000-4000-8000-000000000031', 'TASK_100', 'Centurião da Rotina', 'Conclua 100 tarefas acumuladas na sua jornada.', 'Target', 25, 'TASKS', 'UNCOMMON', 100, 4, false),
  ('a1000000-0000-4000-8000-000000000004', 'TASK_250', 'Veterano de Batalha', 'Conclua 250 tarefas acumuladas.', 'ShieldCheck', 50, 'TASKS', 'RARE', 250, 5, false),
  ('a1000000-0000-4000-8000-000000000032', 'TASK_500', 'Conquistador de Reinos', 'Conclua 500 tarefas acumuladas.', 'Castle', 100, 'TASKS', 'EPIC', 500, 6, false),
  ('a1000000-0000-4000-8000-000000000005', 'TASK_1000', 'Imparável', 'Conclua 1.000 tarefas acumuladas na sua jornada.', 'Crown', 250, 'TASKS', 'LEGENDARY', 1000, 7, false),
  ('a1000000-0000-4000-8000-000000000033', 'TASK_HARD_5', 'Primeira Provação', 'Conclua 5 tarefas de dificuldade Difícil.', 'Sword', 25, 'TASKS', 'UNCOMMON', 5, 8, false),
  ('a1000000-0000-4000-8000-000000000006', 'TASK_HARD_25', 'Caçador de Chefões', 'Conclua 25 tarefas de dificuldade Difícil.', 'Skull', 100, 'TASKS', 'EPIC', 25, 9, false),
  ('a1000000-0000-4000-8000-000000000034', 'TASK_HARD_100', 'Domador de Titãs', 'Conclua 100 tarefas de dificuldade Difícil.', 'Axe', 250, 'TASKS', 'LEGENDARY', 100, 10, false),
  ('a1000000-0000-4000-8000-000000000035', 'CHECKLIST_PERFECTIONIST', 'Checklist Impecável', 'Conclua 20 tarefas com todos os itens do checklist marcados.', 'ClipboardCheck', 50, 'TASKS', 'RARE', 20, 11, false),
  ('a1000000-0000-4000-8000-000000000060', 'PUNCTUAL_EXECUTOR_20', 'Pontualidade Real', 'Conclua 20 Afazeres com data de vencimento dentro do prazo.', 'CalendarClock', 50, 'TASKS', 'RARE', 20, 12, false),

  -- CATEGORIA 2: HÁBITOS & OFENSIVAS (STREAKS) — 10 conquistas
  ('a1000000-0000-4000-8000-000000000007', 'STREAK_3', 'Faísca Acesa', 'Alcance uma ofensiva de 3 dias consecutivos.', 'Flame', 10, 'STREAKS', 'COMMON', 3, 13, false),
  ('a1000000-0000-4000-8000-000000000008', 'STREAK_7', 'Chama Semanal', 'Alcance uma ofensiva de 7 dias consecutivos.', 'Flame', 10, 'STREAKS', 'COMMON', 7, 14, false),
  ('a1000000-0000-4000-8000-000000000036', 'STREAK_14', 'Quinzena Inabalável', 'Mantenha sua chama acesa por 14 dias consecutivos.', 'Footprints', 25, 'STREAKS', 'UNCOMMON', 14, 15, false),
  ('a1000000-0000-4000-8000-000000000009', 'STREAK_21', 'Hábito Forjado', 'Alcance 21 dias consecutivos de ofensiva (marco de consolidação cerebral).', 'Hammer', 25, 'STREAKS', 'UNCOMMON', 21, 16, false),
  ('a1000000-0000-4000-8000-000000000010', 'STREAK_30', 'Guardião do Mês', 'Alcance uma ofensiva de 30 dias consecutivos.', 'CalendarCheck', 50, 'STREAKS', 'RARE', 30, 17, false),
  ('a1000000-0000-4000-8000-000000000037', 'STREAK_60', 'Disciplina Blindada', 'Alcance uma ofensiva de 60 dias consecutivos.', 'CalendarRange', 50, 'STREAKS', 'RARE', 60, 18, false),
  ('a1000000-0000-4000-8000-000000000011', 'STREAK_90', 'Vontade de Ferro', 'Alcance uma ofensiva de 90 dias consecutivos.', 'Award', 100, 'STREAKS', 'EPIC', 90, 19, false),
  ('a1000000-0000-4000-8000-000000000038', 'STREAK_180', 'Guardião do Solstício', 'Alcance meio ano (180 dias) de ofensiva ininterrupta.', 'SunMedium', 100, 'STREAKS', 'EPIC', 180, 20, false),
  ('a1000000-0000-4000-8000-000000000012', 'STREAK_365', 'Chama Imortal', 'Alcance uma ofensiva histórica de 365 dias consecutivos.', 'Sun', 250, 'STREAKS', 'LEGENDARY', 365, 21, false),
  ('a1000000-0000-4000-8000-000000000061', 'IMPULSE_CONTROL_7', 'Domínio do Impulso', 'Complete 7 ciclos em Hábitos Negativos ou Mistos sem registrar recaídas.', 'ShieldBan', 50, 'STREAKS', 'RARE', 7, 22, false),

  -- CATEGORIA 3: IMERSÃO & PALCO DE FOCO (FOCUS) — 11 conquistas
  ('a1000000-0000-4000-8000-000000000013', 'FOCUS_FIRST', 'Mente Presente', 'Conclua sua primeira sessão produtiva no Palco de Foco.', 'Timer', 10, 'FOCUS', 'COMMON', 1, 23, false),
  ('a1000000-0000-4000-8000-000000000039', 'FOCUS_SESSIONS_10', 'Ritual de Concentração', 'Conclua 10 sessões produtivas no Palco de Foco.', 'Repeat', 10, 'FOCUS', 'COMMON', 10, 24, false),
  ('a1000000-0000-4000-8000-000000000014', 'FOCUS_DEEP_WORK', 'Mergulho Profundo', 'Conclua uma sessão contínua de foco com pelo menos 45 minutos.', 'Brain', 25, 'FOCUS', 'UNCOMMON', 45, 25, false),
  ('a1000000-0000-4000-8000-000000000015', 'FOCUS_POMO_25', 'Mestre do Relógio', 'Complete 25 ciclos de Pomodoro.', 'Hourglass', 25, 'FOCUS', 'UNCOMMON', 25, 26, false),
  ('a1000000-0000-4000-8000-000000000040', 'FOCUS_MARATHON_90', 'Estado de Fluxo', 'Conclua uma única sessão contínua de pelo menos 90 minutos.', 'Waves', 50, 'FOCUS', 'RARE', 90, 27, false),
  ('a1000000-0000-4000-8000-000000000016', 'FOCUS_HOURS_10', 'Aprendiz do Templo', 'Acumule 10 horas (600 minutos) de foco produtivo.', 'Clock', 50, 'FOCUS', 'RARE', 600, 28, false),
  ('a1000000-0000-4000-8000-000000000062', 'FOCUS_ACTIVITY_GOAL_10', 'Mira Certeira', 'Atinja a meta de tempo configurada em uma Atividade de Foco em 10 sessões.', 'Crosshair', 50, 'FOCUS', 'RARE', 10, 29, false),
  ('a1000000-0000-4000-8000-000000000017', 'FOCUS_HOURS_50', 'Monge da Concentração', 'Acumule 50 horas (3.000 minutos) de foco produtivo.', 'Sparkles', 100, 'FOCUS', 'EPIC', 3000, 30, false),
  ('a1000000-0000-4000-8000-000000000041', 'FOCUS_POMO_100', 'Arquiteto do Tempo', 'Complete 100 ciclos de Pomodoro acumulados.', 'AlarmClock', 100, 'FOCUS', 'EPIC', 100, 31, false),
  ('a1000000-0000-4000-8000-000000000042', 'FOCUS_HOURS_100', 'Sábio da Imersão', 'Acumule 100 horas (6.000 minutos) de foco produtivo.', 'Telescope', 100, 'FOCUS', 'EPIC', 6000, 32, false),
  ('a1000000-0000-4000-8000-000000000018', 'FOCUS_HOURS_200', 'Senhor do Tempo', 'Acumule 200 horas (12.000 minutos) de foco produtivo.', 'Infinity', 250, 'FOCUS', 'LEGENDARY', 12000, 33, false),

  -- CATEGORIA 4: ECONOMIA, LOJA & MOCHILA (ECONOMY) — 10 conquistas
  ('a1000000-0000-4000-8000-000000000019', 'GOLD_100', 'Bolsa de Moedas', 'Acumule 100 moedas/créditos ganhos através do seu esforço.', 'Coins', 10, 'ECONOMY', 'COMMON', 100, 34, false),
  ('a1000000-0000-4000-8000-000000000022', 'REWARD_FIRST', 'Descanso Merecido', 'Resgate sua primeira recompensa na Loja.', 'Gift', 10, 'ECONOMY', 'COMMON', 1, 35, false),
  ('a1000000-0000-4000-8000-000000000043', 'GOLD_500', 'Cofre Cheio', 'Acumule 500 moedas/créditos ganhos pelo seu esforço.', 'PiggyBank', 25, 'ECONOMY', 'UNCOMMON', 500, 36, false),
  ('a1000000-0000-4000-8000-000000000023', 'REWARD_25', 'Vida Equilibrada', 'Resgate 25 recompensas na Loja para celebrar suas entregas.', 'ShoppingBag', 25, 'ECONOMY', 'UNCOMMON', 25, 37, false),
  ('a1000000-0000-4000-8000-000000000020', 'GOLD_1000', 'Tesouro da Guilda', 'Acumule 1.000 moedas/créditos ganhos na carreira.', 'Gem', 50, 'ECONOMY', 'RARE', 1000, 38, false),
  ('a1000000-0000-4000-8000-000000000044', 'WALLET_SAVER_500', 'Dragão Guardião', 'Mantenha um saldo disponível de 500 moedas na carteira.', 'Wallet', 50, 'ECONOMY', 'RARE', 500, 39, false),
  ('a1000000-0000-4000-8000-000000000045', 'COUPON_MASTER', 'Alquimista do Tempo', 'Esgote 5 cupons de tempo da Mochila até o fim no Palco de Foco.', 'Ticket', 50, 'ECONOMY', 'RARE', 5, 40, false),
  ('a1000000-0000-4000-8000-000000000021', 'GOLD_5000', 'Magnata Cósmico', 'Acumule 5.000 moedas/créditos ganhos na carreira.', 'Landmark', 100, 'ECONOMY', 'EPIC', 5000, 41, false),
  ('a1000000-0000-4000-8000-000000000046', 'REWARD_100', 'Mestre do Equilíbrio', 'Resgate 100 recompensas na Loja.', 'Scale', 100, 'ECONOMY', 'EPIC', 100, 42, false),
  ('a1000000-0000-4000-8000-000000000047', 'GOLD_15000', 'Imperador Dourado', 'Acumule 15.000 moedas/créditos ganhos na sua jornada.', 'Banknote', 250, 'ECONOMY', 'LEGENDARY', 15000, 43, false),

  -- CATEGORIA 5: PROGRESSÃO DE NÍVEL (PROGRESSION) — 8 conquistas
  ('a1000000-0000-4000-8000-000000000048', 'LEVEL_APPRENTICE', 'Primeiros Passos', 'Alcance 100 XP/pts (Nível Aprendiz).', 'Sprout', 10, 'PROGRESSION', 'COMMON', 100, 44, false),
  ('a1000000-0000-4000-8000-000000000024', 'LEVEL_ADVENTURER', 'Jornada Iniciada', 'Alcance 300 XP/pts (Nível Aventureiro / Consistente).', 'Compass', 10, 'PROGRESSION', 'COMMON', 300, 45, false),
  ('a1000000-0000-4000-8000-000000000049', 'LEVEL_CHALLENGER', 'Espírito Desafiante', 'Alcance 750 XP/pts (Nível Desafiante).', 'Flag', 10, 'PROGRESSION', 'COMMON', 750, 46, false),
  ('a1000000-0000-4000-8000-000000000025', 'LEVEL_PROFESSIONAL', 'Força Reconhecida', 'Alcance 3.000 XP/pts (Nível Profissional / Produtivo).', 'TrendingUp', 25, 'PROGRESSION', 'UNCOMMON', 3000, 47, false),
  ('a1000000-0000-4000-8000-000000000050', 'LEVEL_EXPERT', 'Mestre de Ofício', 'Alcance 6.000 XP/pts (Nível Especialista).', 'GraduationCap', 50, 'PROGRESSION', 'RARE', 6000, 48, false),
  ('a1000000-0000-4000-8000-000000000051', 'LEVEL_VETERAN', 'Veterano de Guerra', 'Alcance 12.000 XP/pts (Nível Veterano).', 'BadgeCheck', 50, 'PROGRESSION', 'RARE', 12000, 49, false),
  ('a1000000-0000-4000-8000-000000000026', 'LEVEL_MASTER', 'Grão-Mestre', 'Alcance 25.000 XP/pts (Nível Mestre / Executivo).', 'Medal', 100, 'PROGRESSION', 'EPIC', 25000, 50, false),
  ('a1000000-0000-4000-8000-000000000027', 'LEVEL_LEGEND', 'Lenda Viva', 'Alcance o patamar supremo de 60.000 XP/pts (Nível Lenda / Alta Performance).', 'Trophy', 250, 'PROGRESSION', 'LEGENDARY', 60000, 51, false),

  -- CATEGORIA 6: ESPECIAIS & SECRETAS (SPECIAL) — 12 conquistas
  ('a1000000-0000-4000-8000-000000000030', 'SHOWCASE_CURATOR', 'Identidade Forjada', 'Personalize sua Vitrine de Destaques ou ostente a Insígnia de Fundador.', 'Shield', 50, 'SPECIAL', 'RARE', 1, 52, false),
  ('a1000000-0000-4000-8000-000000000063', 'SHOWCASE_FULL_SLOTS', 'Estante Real Completa', 'Preencha todos os 4 espaços de destaque na sua Vitrine de Perfil.', 'Frame', 25, 'SPECIAL', 'UNCOMMON', 4, 53, false),
  ('a1000000-0000-4000-8000-000000000052', 'WORKSPACE_ARCHITECT', 'Arquiteto de Mundos', 'Crie 2 ambientes de trabalho (Workspaces) para organizar suas áreas de vida.', 'LayoutGrid', 25, 'SPECIAL', 'UNCOMMON', 2, 54, false),
  ('a1000000-0000-4000-8000-000000000053', 'TROPHY_HUNTER_1000', 'Colecionador de Glórias', 'Acumule 1.000 Pontos de Conquista desbloqueando medalhas.', 'Star', 100, 'SPECIAL', 'EPIC', 1000, 55, false),
  ('a1000000-0000-4000-8000-000000000054', 'HARDCORE_FIRST', 'Sem Margem para Erro', 'Conclua sua primeira tarefa com Modo Hardcore / Prazo Rígido ativado.', 'Bomb', 25, 'SPECIAL', 'UNCOMMON', 1, 56, true),
  ('a1000000-0000-4000-8000-000000000028', 'HARDCORE_SURVIVOR', 'Sangue Frio', 'Conclua 10 tarefas com Modo Hardcore / Prazo Rígido ativado.', 'Zap', 50, 'SPECIAL', 'RARE', 10, 57, true),
  ('a1000000-0000-4000-8000-000000000055', 'HARDCORE_MASTER_50', 'Imune ao Caos', 'Conclua 50 tarefas com Modo Hardcore / Prazo Rígido ativado.', 'ShieldAlert', 100, 'SPECIAL', 'EPIC', 50, 58, true),
  ('a1000000-0000-4000-8000-000000000056', 'MYSTERY_BOX_FIRST', 'Curiosidade Premiada', 'Abra sua primeira Caixa Misteriosa na Mochila.', 'Package', 10, 'SPECIAL', 'COMMON', 1, 59, true),
  ('a1000000-0000-4000-8000-000000000029', 'MYSTERY_BOX_LUCK', 'Aposta do Destino', 'Abra 5 Caixas Misteriosas na sua Mochila.', 'PackageOpen', 25, 'SPECIAL', 'UNCOMMON', 5, 60, true),
  ('a1000000-0000-4000-8000-000000000057', 'MYSTERY_BOX_25', 'Senhor da Fortuna', 'Abra 25 Caixas Misteriosas na sua Mochila.', 'Dices', 100, 'SPECIAL', 'EPIC', 25, 61, true),
  ('a1000000-0000-4000-8000-000000000058', 'NIGHT_OWL', 'Coruja da Meia-Noite', 'Conclua 5 sessões de foco (10+ min) terminando entre 23h e 5h.', 'MoonStar', 50, 'SPECIAL', 'RARE', 5, 62, true),
  ('a1000000-0000-4000-8000-000000000059', 'EARLY_BIRD', 'Madrugador', 'Conclua 5 sessões de foco (10+ min) iniciadas entre 5h e 7h.', 'Sunrise', 50, 'SPECIAL', 'RARE', 5, 63, true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  points = EXCLUDED.points,
  category = EXCLUDED.category,
  rarity = EXCLUDED.rarity,
  target_value = EXCLUDED.target_value,
  display_order = EXCLUDED.display_order,
  is_secret = EXCLUDED.is_secret;
