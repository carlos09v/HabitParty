import { RARITY_THEMES } from "@/constants/achievements";
import { FOCUS_REWARD_RULES } from "@/constants/focus";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import { DIFFICULTY_REWARDS } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import rewardsEn from "@/messages/en/rewards.json";
import type { HelpTableEntry } from "@/types/help";
import type { AchievementRarity } from "@/types/showcase";
import { formatCoins } from "@/utils";
import {
  LEVEL_TITLES_EN,
  LEVEL_TITLES_PRODUCTIVITY_EN,
  LEVEL_TITLES_PRODUCTIVITY_PT,
  USER_LEVELS,
} from "@/utils/levels";

interface LevelProgressionMeta {
  englishName?: string;
  tasksEstimate: string;
  timeEstimate: string;
}

const LEVEL_PROGRESSION_META: Record<
  AppLocale,
  Record<string, LevelProgressionMeta>
> = {
  "pt-BR": {
    NOVICE: {
      englishName: "Novice",
      tasksEstimate: "Ponto de partida",
      timeEstimate: "Primeiro acesso",
    },
    APPRENTICE: {
      englishName: "Apprentice",
      tasksEstimate: "~7 tarefas médias",
      timeEstimate: "1º a 2º dia",
    },
    ADVENTURER: {
      englishName: "Adventurer",
      tasksEstimate: "~20 tarefas médias",
      timeEstimate: "1ª semana",
    },
    CHALLENGER: {
      englishName: "Challenger",
      tasksEstimate: "~50 tarefas médias",
      timeEstimate: "2 a 3 semanas",
    },
    AMATEUR: {
      englishName: "Amateur",
      tasksEstimate: "~100 tarefas médias",
      timeEstimate: "1 mês de consistência",
    },
    PROFESSIONAL: {
      englishName: "Professional",
      tasksEstimate: "~200 tarefas médias",
      timeEstimate: "Trimestral",
    },
    EXPERT: {
      englishName: "Expert",
      tasksEstimate: "~400 tarefas médias",
      timeEstimate: "Semestral",
    },
    VETERAN: {
      englishName: "Veteran",
      tasksEstimate: "~800 tarefas médias",
      timeEstimate: "Maturidade alta",
    },
    MASTER: {
      englishName: "Master",
      tasksEstimate: "~1.600 tarefas médias",
      timeEstimate: "Constância rigorosa",
    },
    LEGEND: {
      englishName: "Legend",
      tasksEstimate: "+4.000 tarefas médias",
      timeEstimate: "Mais de 1 ano diário",
    },
  },
  en: {
    NOVICE: { tasksEstimate: "Starting point", timeEstimate: "First login" },
    APPRENTICE: {
      tasksEstimate: "~7 medium tasks",
      timeEstimate: "Day 1 to 2",
    },
    ADVENTURER: { tasksEstimate: "~20 medium tasks", timeEstimate: "Week 1" },
    CHALLENGER: {
      tasksEstimate: "~50 medium tasks",
      timeEstimate: "2 to 3 weeks",
    },
    AMATEUR: {
      tasksEstimate: "~100 medium tasks",
      timeEstimate: "1 month of consistency",
    },
    PROFESSIONAL: {
      tasksEstimate: "~200 medium tasks",
      timeEstimate: "Quarterly",
    },
    EXPERT: { tasksEstimate: "~400 medium tasks", timeEstimate: "Semiannual" },
    VETERAN: {
      tasksEstimate: "~800 medium tasks",
      timeEstimate: "High maturity",
    },
    MASTER: {
      tasksEstimate: "~1,600 medium tasks",
      timeEstimate: "Rigorous consistency",
    },
    LEGEND: {
      tasksEstimate: "4,000+ medium tasks",
      timeEstimate: "Over 1 year daily",
    },
  },
};

const MYSTERY_BOX_PACKAGE_LABELS: Record<AppLocale, Record<string, string>> = {
  "pt-BR": {
    BASIC: "📦 Básico (Basic)",
    PREMIUM: "🎁 Premium",
    EPIC: "💎 Épico (Epic)",
    LEGENDARY: "👑 Lendário (Legendary)",
  },
  en: {
    BASIC: "📦 Basic",
    PREMIUM: "🎁 Premium",
    EPIC: "💎 Epic",
    LEGENDARY: "👑 Legendary",
  },
};

type TierDrops = Record<string, { label: string }>;

function getEnglishTierDropLabel(tierKey: string, index: number): string {
  const tiers = rewardsEn.mysteryBox.tiers as Record<
    string,
    { drops: TierDrops }
  >;
  return tiers[tierKey]?.drops[String(index)]?.label ?? "";
}

interface DifficultyCopyItem {
  key: keyof typeof DIFFICULTY_REWARDS;
  icon: string;
  label: string;
  description: string;
}

interface AchievementRarityCopyItem {
  rarity: AchievementRarity;
  label: string;
  countLabel: string;
  examples: string;
}

interface HelpTablesLocaleCopy {
  difficulties: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    items: DifficultyCopyItem[];
  };
  habitDecay: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };
  mysteryBoxes: {
    title: string;
    description: string;
    columns: [string, string, string, string];
  };
  userLevels: {
    title: string;
    description: string;
    columns: [string, string, string, string, string];
  };
  focusRewards: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    shortPomo: [string, string, string];
    standardPomo: [string, string, string];
    deepWorkPomo: [string, string, string];
    stopwatch: [string, string, string];
    safetyLocks: [string, string, string, string];
  };
  achievementRarities: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    items: AchievementRarityCopyItem[];
  };
}

const HELP_TABLES_COPY: Record<AppLocale, HelpTablesLocaleCopy> = {
  "pt-BR": {
    difficulties: {
      title: "Economia Rígida: Dificuldades e Recompensas",
      description:
        "Ganhos de XP e moedas (🪙) baseados na carga de esforço real e duração estimada de cada atividade.",
      columns: [
        "Nível",
        "Dificuldade",
        "Recompensa Base",
        "Descrição & Exemplos de Uso",
      ],
      items: [
        {
          key: "TRIVIAL",
          icon: "🟦",
          label: "Trivial (Muito Fácil)",
          description:
            "Tarefas quase automáticas de curtíssima duração (ex: beber água, tomar remédio, arrumar a cama).",
        },
        {
          key: "EASY",
          icon: "🟩",
          label: "Fácil",
          description:
            "Tarefas rápidas que exigem intenção básica (ex: responder e-mails, 10 min de leitura, lavar louça).",
        },
        {
          key: "MEDIUM",
          icon: "🟨",
          label: "Médio (Padrão)",
          description:
            "A base da economia: 30 a 60 minutos de esforço moderado (ex: treino físico, tarefa de trabalho).",
        },
        {
          key: "HARD",
          icon: "🟪",
          label: "Difícil",
          description:
            "Esforço cognitivo ou físico intenso: 1 a 2 horas (ex: sessão de estudo pesado, projeto de programação).",
        },
      ],
    },
    habitDecay: {
      title: "Hábitos: Importância e Decaimento por Ofensiva (Streak)",
      description:
        "Conforme você repete um hábito, ele exige menos esforço cerebral. Para evitar inflação e estimular novos desafios, a recompensa decai com o streak.",
      columns: [
        "Fase do Hábito",
        "Dias Consecutivos (Streak)",
        "% da Recompensa",
        "Objetivo Psicológico",
      ],
      rows: [
        [
          "Fase de Resistência",
          "Dias 1 a 6",
          "100% da Recompensa",
          "Energia máxima de ativação para engajamento e quebra da inércia inicial.",
        ],
        [
          "Fase de Adaptação",
          "Dias 7 a 20",
          "75% da Recompensa",
          "Consolidação da rotina; o cérebro começa a automatizar o processo.",
        ],
        [
          "Hábito Formado",
          "Dias 21 ou mais",
          "50% da Recompensa",
          "Comportamento automatizado; incentiva assumir novos desafios e metas.",
        ],
      ],
    },
    mysteryBoxes: {
      title: "🎁 Caixas Misteriosas (Loot Tables & Probabilidades RNG)",
      description:
        "Caixas da sorte equilibradas matematicamente para proporcionar dopamina e surpresa sem desbalancear a economia do jogo.",
      columns: [
        "Pacote",
        "Custo (🪙)",
        "Chances de Prêmio Comum / Bom",
        "Chances de Prêmio Épico / Lendário",
      ],
    },
    userLevels: {
      title: "🏆 Níveis de Usuário (UserLevel & XP Vitalício)",
      description:
        "Seu XP/Pontos total acumulado nunca é gasto ou resetado ao comprar recompensas. O título exibido adapta-se automaticamente ao seu estilo (Modo Aventura vs. Modo Essencial).",
      columns: [
        "Modo Aventura (RPG)",
        "Modo Essencial (Produtividade)",
        "XP / Pontos Necessários",
        "Tarefas Médias Estimadas",
        "Tempo Estimado",
      ],
    },
    focusRewards: {
      title: "⏱️ Ferramentas de Foco: Pomodoro, Cronômetro & Economia",
      description:
        "O foco premia sua jornada e esforço contínuo com XP e pequenas frações de moedas (🪙), mantendo as tarefas como a principal fonte de riqueza.",
      columns: [
        "Modalidade",
        "Duração / Ciclo",
        "Recompensa Base",
        "Regras & Travas de Economia",
      ],
      shortPomo: [
        "🍅 Pomodoro Curto",
        "15 a 24 min",
        "Quebra rápida de inércia (1/3 de 1 Tarefa Fácil). Requer ciclo completado.",
      ],
      standardPomo: [
        "🍅 Pomodoro Padrão",
        "25 a 40 min",
        "O padrão de ouro do foco. Equivale a ~30%–40% de uma entrega de tarefa.",
      ],
      deepWorkPomo: [
        "🍅 Pomodoro Deep Work",
        "Mais de 40 min",
        "Imersão profunda prolongada. Equivale a 40% da moeda e 100% do XP de 1 Tarefa Média.",
      ],
      stopwatch: [
        "⏱️ Cronômetro Livre",
        "A cada 30 min",
        "Cálculo contínuo proporcional. Limitado ao teto de 90 min por sessão.",
      ],
      safetyLocks: [
        "🛡️ Travas de Segurança",
        "Geral",
        "Teto Diário: 6h",
        "Mínimo 10m para pontuar. 4h-6h diárias pagam 50%. Acima de 6h paga 0%. Mochila não pontua.",
      ],
    },
    achievementRarities: {
      title:
        "🏅 Catálogo de Conquistas, Raridades & Pontos de Troféu (/profile)",
      description:
        "As 63 conquistas permanentes (4.170 pts no total) premiam marcos de execução, ofensivas, foco, economia, organização e comportamentos secretos com Pontos de Conquista (Trophy Score) e podem ser exibidas nos 4 espaços de destaque da sua Vitrine.",
      columns: [
        "Raridade / Tier",
        "Pontos de Conquista",
        "Medalhas no Catálogo",
        "Exemplos de Marcos Desbloqueáveis",
      ],
      items: [
        {
          rarity: "COMMON",
          label: "⚪ Comum (Common)",
          countLabel: "12 conquistas",
          examples:
            "1ª Tarefa, 10 Tarefas, Ofensivas de 3 e 7 dias, 1ª e 10 Sessões de Foco, 100 Moedas, 1º Resgate, 100 / 300 / 750 XP, 1ª Caixa Misteriosa (Secreta).",
        },
        {
          rarity: "UNCOMMON",
          label: "🟢 Incomum (Uncommon)",
          countLabel: "14 conquistas",
          examples:
            "50 e 100 Tarefas, 5 Tarefas Difíceis, Ofensivas de 14 e 21 dias, Deep Work de 45m, 25 Pomodoros, 500 Moedas, 25 Resgates, 3.000 XP, 2 Workspaces, Estante Real Completa (4 Destaques), 1º Hardcore (Secreta), 5 Caixas Misteriosas (Secreta).",
        },
        {
          rarity: "RARE",
          label: "🔵 Rara (Rare)",
          countLabel: "18 conquistas",
          examples:
            "250 Tarefas, Checklist Impecável (20), Pontualidade Real (20 To-Dos no Prazo), Ofensivas de 30 e 60 dias, Domínio do Impulso (7 Ciclos sem Recaída), Estado de Fluxo (90m), 10h de Foco, Mira Certeira (10 Metas de Atividade), 1.000 Moedas, Carteira com 500 Moedas, 5 Cupons de Tempo Esgotados, 6.000 / 12.000 XP, Vitrine Personalizada, 10 Hardcore, Coruja da Meia-Noite e Madrugador (Secretas).",
        },
        {
          rarity: "EPIC",
          label: "🟣 Épica (Epic)",
          countLabel: "13 conquistas",
          examples:
            "500 Tarefas, 25 Tarefas Difíceis, Ofensivas de 90 e 180 dias, 50h / 100h de Foco, 100 Pomodoros, 5.000 Moedas, 100 Resgates, 25.000 XP, 1.000 Pontos de Conquista, 50 Hardcore e 25 Caixas Misteriosas (Secretas).",
        },
        {
          rarity: "LEGENDARY",
          label: "🟡 Lendária (Legendary)",
          countLabel: "6 conquistas",
          examples:
            "1.000 Tarefas, 100 Tarefas Difíceis, Ofensiva de 365 dias, 200h de Foco, 15.000 Moedas Acumuladas, Patente Lenda (60.000 XP).",
        },
      ],
    },
  },
  en: {
    difficulties: {
      title: "Strict Economy: Difficulties & Rewards",
      description:
        "XP and coin (🪙) earnings based on the real effort load and estimated duration of each activity.",
      columns: [
        "Level",
        "Difficulty",
        "Base Reward",
        "Description & Usage Examples",
      ],
      items: [
        {
          key: "TRIVIAL",
          icon: "🟦",
          label: "Trivial (Very Easy)",
          description:
            "Almost automatic, very short tasks (e.g., drink water, take medicine, make the bed).",
        },
        {
          key: "EASY",
          icon: "🟩",
          label: "Easy",
          description:
            "Quick tasks that require basic intention (e.g., answer emails, 10 min of reading, wash the dishes).",
        },
        {
          key: "MEDIUM",
          icon: "🟨",
          label: "Medium (Standard)",
          description:
            "The backbone of the economy: 30 to 60 minutes of moderate effort (e.g., workout, a work task).",
        },
        {
          key: "HARD",
          icon: "🟪",
          label: "Hard",
          description:
            "Intense cognitive or physical effort: 1 to 2 hours (e.g., heavy study session, programming project).",
        },
      ],
    },
    habitDecay: {
      title: "Habits: Importance & Streak Decay",
      description:
        "As you repeat a habit, it demands less mental effort. To avoid inflation and encourage new challenges, the reward decays with the streak.",
      columns: [
        "Habit Phase",
        "Consecutive Days (Streak)",
        "% of Reward",
        "Psychological Goal",
      ],
      rows: [
        [
          "Resistance Phase",
          "Days 1 to 6",
          "100% of Reward",
          "Maximum activation energy to engage and break initial inertia.",
        ],
        [
          "Adaptation Phase",
          "Days 7 to 20",
          "75% of Reward",
          "Routine consolidation; the brain starts automating the process.",
        ],
        [
          "Habit Formed",
          "Day 21 or more",
          "50% of Reward",
          "Automated behavior; encourages taking on new challenges and goals.",
        ],
      ],
    },
    mysteryBoxes: {
      title: "🎁 Mystery Boxes (Loot Tables & RNG Odds)",
      description:
        "Lucky boxes mathematically balanced to deliver dopamine and surprise without unbalancing the game economy.",
      columns: [
        "Package",
        "Cost (🪙)",
        "Common / Good Prize Odds",
        "Epic / Legendary Prize Odds",
      ],
    },
    userLevels: {
      title: "🏆 User Levels (UserLevel & Lifetime XP)",
      description:
        "Your total accumulated XP/Points is never spent or reset when buying rewards. The displayed rank title automatically adapts to your chosen style (Adventure Mode vs. Essential Mode).",
      columns: [
        "Adventure Mode (RPG)",
        "Essential Mode (Productivity)",
        "Required XP / Points",
        "Estimated Medium Tasks",
        "Estimated Time",
      ],
    },
    focusRewards: {
      title: "⏱️ Focus Tools: Pomodoro, Stopwatch & Economy",
      description:
        "Focus rewards your journey and continuous effort with XP and small fractions of coins (🪙), keeping tasks as the main source of wealth.",
      columns: [
        "Mode",
        "Duration / Cycle",
        "Base Reward",
        "Economy Rules & Locks",
      ],
      shortPomo: [
        "🍅 Short Pomodoro",
        "15 to 24 min",
        "Quick inertia breaker (1/3 of 1 Easy Task). Requires a completed cycle.",
      ],
      standardPomo: [
        "🍅 Standard Pomodoro",
        "25 to 40 min",
        "The gold standard of focus. Worth ~30%–40% of a task deliverable.",
      ],
      deepWorkPomo: [
        "🍅 Deep Work Pomodoro",
        "Over 40 min",
        "Prolonged deep immersion. Worth 40% of the coins and 100% of the XP of 1 Medium Task.",
      ],
      stopwatch: [
        "⏱️ Free Stopwatch",
        "Every 30 min",
        "Continuous proportional calculation. Capped at 90 min per session.",
      ],
      safetyLocks: [
        "🛡️ Safety Locks",
        "General",
        "Daily Cap: 6h",
        "Minimum 10m to score. 4h–6h daily pays 50%. Above 6h pays 0%. Backpack items don't score.",
      ],
    },
    achievementRarities: {
      title: "🏅 Achievements Catalog, Rarities & Trophy Score (/profile)",
      description:
        "All 63 permanent achievements (4,170 pts in total) reward execution milestones, streaks, deep focus, economy goals, organization, and secret behaviors with Achievement Points (Trophy Score) and can be pinned to the 4 highlight slots on your Showcase.",
      columns: [
        "Rarity / Tier",
        "Achievement Points",
        "Medals in Catalog",
        "Examples of Unlockable Milestones",
      ],
      items: [
        {
          rarity: "COMMON",
          label: "⚪ Common",
          countLabel: "12 achievements",
          examples:
            "1st Task, 10 Tasks, 3 and 7-day Streaks, 1st and 10 Focus Sessions, 100 Coins, 1st Reward, 100 / 300 / 750 XP, 1st Mystery Box (Secret).",
        },
        {
          rarity: "UNCOMMON",
          label: "🟢 Uncommon",
          countLabel: "14 achievements",
          examples:
            "50 and 100 Tasks, 5 Hard Tasks, 14 and 21-day Streaks, 45m Deep Work, 25 Pomodoros, 500 Coins, 25 Rewards, 3,000 XP, 2 Workspaces, Complete Trophy Shelf (4 Highlights), 1st Hardcore (Secret), 5 Mystery Boxes (Secret).",
        },
        {
          rarity: "RARE",
          label: "🔵 Rare",
          countLabel: "18 achievements",
          examples:
            "250 Tasks, Flawless Checklist (20), Royal Punctuality (20 On-Time To-Dos), 30 and 60-day Streaks, Impulse Mastery (7 Clean Habit Cycles), 90m Flow State, 10h Focus, Bullseye Focus (10 Activity Goals Met), 1,000 Coins, 500-coin Wallet, 5 Depleted Time Coupons, 6,000 / 12,000 XP, Curated Showcase, 10 Hardcore, Midnight Owl & Early Bird (Secret).",
        },
        {
          rarity: "EPIC",
          label: "🟣 Epic",
          countLabel: "13 achievements",
          examples:
            "500 Tasks, 25 Hard Tasks, 90 and 180-day Streaks, 50h / 100h Focus, 100 Pomodoros, 5,000 Coins, 100 Rewards, 25,000 XP, 1,000 Trophy Points, 50 Hardcore & 25 Mystery Boxes (Secret).",
        },
        {
          rarity: "LEGENDARY",
          label: "🟡 Legendary",
          countLabel: "6 achievements",
          examples:
            "1,000 Tasks, 100 Hard Tasks, 365-day Streak, 200h Focus, 15,000 Coins Earned, Legend Rank (60,000 XP).",
        },
      ],
    },
  },
};

/**
 * Constrói o mapa de tabelas de referência da Central de Ajuda para o idioma solicitado,
 * centralizando todas as fórmulas de economia, níveis, foco e caixas misteriosas em um único lugar.
 */
export function buildHelpTables(
  locale: AppLocale,
): Record<string, HelpTableEntry> {
  const copy = HELP_TABLES_COPY[locale];
  const numberLocale = locale === "en" ? "en-US" : "pt-BR";
  const formatCoinValue = (value: number) => formatCoins(value, { locale });
  const levelProgressionMeta = LEVEL_PROGRESSION_META[locale];
  const mysteryBoxLabels = MYSTERY_BOX_PACKAGE_LABELS[locale];

  return {
    difficulties: {
      title: copy.difficulties.title,
      description: copy.difficulties.description,
      category: "ECONOMY",
      columns: copy.difficulties.columns,
      rows: copy.difficulties.items.map((item) => {
        const reward = DIFFICULTY_REWARDS[item.key];
        return [
          item.icon,
          item.label,
          `${reward.xp} XP • ${formatCoinValue(reward.gold)} 🪙`,
          item.description,
        ];
      }),
    },
    habitDecay: {
      title: copy.habitDecay.title,
      description: copy.habitDecay.description,
      category: "TASKS",
      categories: ["TASKS", "ECONOMY"],
      columns: copy.habitDecay.columns,
      rows: copy.habitDecay.rows,
    },
    mysteryBoxes: {
      title: copy.mysteryBoxes.title,
      description: copy.mysteryBoxes.description,
      category: "REWARDS",
      categories: ["REWARDS", "ECONOMY"],
      columns: copy.mysteryBoxes.columns,
      rows: MYSTERY_BOX_TIERS.map((tier) => {
        const tierKey = tier.backendPackageLevel;
        const formatDrop = (
          drop: { percentage: number; label: string },
          index: number,
        ) => {
          const dropLabel =
            locale === "en"
              ? getEnglishTierDropLabel(tierKey, index)
              : drop.label;
          return `${drop.percentage}% ${dropLabel}`;
        };

        const commonDrops = tier.dropRates
          .slice(0, 2)
          .map((d, i) => formatDrop(d, i))
          .join(" • ");
        const rareDrops = tier.dropRates
          .slice(2)
          .map((d, i) => formatDrop(d, i + 2))
          .join(" • ");

        return [
          mysteryBoxLabels[tierKey] || tier.name,
          `${formatCoinValue(tier.recommendedPrice)} 🪙`,
          commonDrops,
          rareDrops,
        ];
      }),
    },
    userLevels: {
      title: copy.userLevels.title,
      description: copy.userLevels.description,
      category: "LEVELS",
      columns: copy.userLevels.columns,
      rows: USER_LEVELS.map((lvl) => {
        const meta = levelProgressionMeta[lvl.tier];
        const adventureTitle =
          locale === "en"
            ? LEVEL_TITLES_EN[lvl.tier]
            : `${lvl.title} (${meta?.englishName || lvl.tier})`;
        const productivityTitle =
          locale === "en"
            ? LEVEL_TITLES_PRODUCTIVITY_EN[lvl.tier]
            : LEVEL_TITLES_PRODUCTIVITY_PT[lvl.tier];

        return [
          adventureTitle,
          productivityTitle,
          `${lvl.minXpRequired.toLocaleString(numberLocale)} XP / pts`,
          meta?.tasksEstimate || "-",
          meta?.timeEstimate || "-",
        ];
      }),
    },
    focusRewards: {
      title: copy.focusRewards.title,
      description: copy.focusRewards.description,
      category: "FOCUS",
      categories: ["FOCUS", "ECONOMY"],
      columns: copy.focusRewards.columns,
      rows: [
        [
          copy.focusRewards.shortPomo[0],
          copy.focusRewards.shortPomo[1],
          `${FOCUS_REWARD_RULES.SHORT_POMO_XP_PER_CYCLE} XP • ${formatCoinValue(FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE)} 🪙`,
          copy.focusRewards.shortPomo[2],
        ],
        [
          copy.focusRewards.standardPomo[0],
          copy.focusRewards.standardPomo[1],
          `${FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE} XP • ${formatCoinValue(FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE)} 🪙`,
          copy.focusRewards.standardPomo[2],
        ],
        [
          copy.focusRewards.deepWorkPomo[0],
          copy.focusRewards.deepWorkPomo[1],
          `${FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE} XP • ${formatCoinValue(FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE)} 🪙`,
          copy.focusRewards.deepWorkPomo[2],
        ],
        [
          copy.focusRewards.stopwatch[0],
          copy.focusRewards.stopwatch[1],
          `~${FOCUS_REWARD_RULES.STOPWATCH_XP_PER_30_MIN} XP • ${formatCoinValue(FOCUS_REWARD_RULES.STOPWATCH_COINS_PER_30_MIN)} 🪙`,
          copy.focusRewards.stopwatch[2],
        ],
        copy.focusRewards.safetyLocks,
      ],
    },
    achievementRarities: {
      title: copy.achievementRarities.title,
      description: copy.achievementRarities.description,
      category: "LEVELS",
      columns: copy.achievementRarities.columns,
      rows: copy.achievementRarities.items.map((item) => [
        item.label,
        `+${RARITY_THEMES[item.rarity].points} pts`,
        item.countLabel,
        item.examples,
      ]),
    },
  };
}

export const HELP_TABLES = buildHelpTables("pt-BR");
export const HELP_TABLES_EN = buildHelpTables("en");
