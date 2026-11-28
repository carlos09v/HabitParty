import { getRarityTheme } from "@/constants/achievements";
import { FOCUS_REWARD_RULES } from "@/constants/focusRules";
import {
  COUPON_PACKAGE_OPTIONS,
  MYSTERY_BOX_TIERS,
  SINGLE_USE_TIER_OPTIONS,
} from "@/constants/reward";
import { DIFFICULTY_REWARDS, HABIT_IMPORTANCE_REWARDS } from "@/constants/task";
import { type AppLocale, toIntlLocale } from "@/i18n/config";
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
import { DAILY_PRODUCTIVE_COINS_BENCHMARK } from "@/utils/rewardEconomy";

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

interface HabitImportanceCopyItem {
  key: keyof typeof HABIT_IMPORTANCE_REWARDS;
  icon: string;
  label: string;
  description: string;
}

interface RewardPricingMetaItem {
  modelLabel: string;
  effortEquivalent: string;
  balanceRule: string;
}

interface HelpTablesLocaleCopy {
  experienceModes: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };
  difficulties: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    items: DifficultyCopyItem[];
  };
  habitImportance: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    items: HabitImportanceCopyItem[];
  };
  habitDecay: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    rows: Array<[string, string, string, string]>;
  };
  rewardPricing: {
    title: string;
    description: string;
    columns: [string, string, string, string];
    coupons: Record<"30" | "60" | "180" | "480", RewardPricingMetaItem>;
    singleUseBasicPremium: RewardPricingMetaItem;
    singleUseEpicLegendary: RewardPricingMetaItem;
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
    experienceModes: {
      title:
        "⚖️ Comparativo: Modo Essencial (Foco & Produtividade) vs. Modo Aventura (Imersão RPG)",
      description:
        "Os dois modos têm 100% de paridade funcional e compartilham exatamente o mesmo motor matemático, projeções de rendimento, regra 3:1–4:1, Kanban e Foco — mudando apenas a estética, a terminologia e o timbre sonoro.",
      columns: [
        "Conceito no App",
        "Modo Essencial (Produtividade Limpa)",
        "Modo Aventura (Imersão RPG)",
        "Equivalência / Regra",
      ],
      rows: [
        [
          "Moeda de Troca",
          "Créditos (≈ 4 min de lazer / unid.)",
          "Moedas de Ouro (🪙)",
          "1 Crédito = 1 🪙 (15 Créditos = 1h livre)",
        ],
        [
          "Experiência / Nível",
          "Pontos (pts) & Patentes Executivas",
          "XP & Patentes RPG (Novato a Lenda)",
          "1 Ponto = 1 XP (nunca é gasto na Loja)",
        ],
        [
          "Nível de Esforço",
          "Esforço Discreto (Trivial a Difícil)",
          "Espadas de Dificuldade",
          "Mesma remuneração matemática + projeção",
        ],
        [
          "Compromisso Alto",
          "Prazo Rígido (Afazer) / Compromisso Diário",
          "Modo Hardcore",
          "Atraso paga 50%; falha noturna desconta 50%",
        ],
        [
          "Itens Resgatados",
          "Inventário",
          "Mochila",
          "Mesmos cupons e prêmios pessoais salvos",
        ],
        [
          "Loja de Recompensas",
          "Recompensas Diretas + Sorteio de Pausa (Roleta)",
          "Recompensas Diretas + Caixas Misteriosas (RNG)",
          "100% paridade + troca em 1 clique nas Configurações",
        ],
      ],
    },
    difficulties: {
      title: "Economia Rígida: Dificuldades e Recompensas",
      description:
        "Ganhos de XP e moedas (🪙) baseados na carga de esforço real e duração estimada. Diárias e Afazeres Difíceis suportam até 4 Etapas Recompensadas no checklist (+30 XP e +5 🪙 extras por etapa, até +150 XP e +25 🪙 por card, contando proporcionalmente nas conquistas).",
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
            "Esforço intenso (1–2h): estudo pesado, projeto ou prova. Acima de 2h, use até 4 Etapas Recompensadas no checklist (+30 XP e +5 🪙 cada).",
        },
      ],
    },
    habitImportance: {
      title: "Hábitos: Recompensas Base por Importância",
      description:
        "Hábitos contínuos usam Importância (em vez de dificuldade) para definir a recompensa base antes do ajuste progressivo por ofensiva.",
      columns: [
        "Nível",
        "Importância",
        "Recompensa Base (100%)",
        "Exemplos de Aplicação",
      ],
      items: [
        {
          key: "LOW",
          icon: "🟢",
          label: "Baixa",
          description:
            "Micro-ações de manutenção rápida (ex: beber água, alongar 2 min, tomar vitamina).",
        },
        {
          key: "NORMAL",
          icon: "🟡",
          label: "Normal",
          description:
            "Rotinas construtivas do dia a dia (ex: ler 15 min, caminhar, revisar agenda).",
        },
        {
          key: "HIGH",
          icon: "🟣",
          label: "Alta",
          description:
            "Hábitos-chave de alto atrito e impacto (ex: treino completo, zero redes sociais pela manhã, estudo diário).",
        },
      ],
    },
    habitDecay: {
      title: "Hábitos: Decaimento Progressivo por Ofensiva (Streak)",
      description:
        "Conforme você repete um hábito, ele exige menos esforço consciente. Para evitar inflação e estimular novos desafios, a recompensa reduz nas etapas de consolidação.",
      columns: [
        "Fase do Hábito",
        "Ofensiva (Diário / Semanal / Mensal)",
        "% da Recompensa",
        "Objetivo Psicológico",
      ],
      rows: [
        [
          "Fase de Resistência",
          "Diário: 1–6 dias • Semanal: < 2 sem. • Mensal: 1º mês",
          "100% da Recompensa",
          "Energia máxima de ativação para engajamento e quebra da inércia inicial.",
        ],
        [
          "Fase de Adaptação",
          "Diário: 7–20 dias • Semanal: 2–7 sem. • Mensal: 2–5 meses",
          "75% da Recompensa",
          "Consolidação da rotina; o cérebro começa a automatizar o processo.",
        ],
        [
          "Hábito Formado",
          "Diário: 21+ dias • Semanal: 8+ sem. • Mensal: 6+ meses",
          "50% da Recompensa",
          "Comportamento automatizado; incentiva assumir novos desafios e metas.",
        ],
      ],
    },
    rewardPricing: {
      title:
        "⚖️ Proporção 3:1 a 4:1: Preços Calibrados da Loja (Dever vs. Lazer)",
      description:
        "Um dia útil padrão bem focado rende cerca de 15 a 20 🪙 (referência diária de 15 🪙). Os presets da Loja seguem a proporção 3:1 a 4:1: cerca de 3 a 4 horas de esforço real financiam 1 hora de lazer sem culpa.",
      columns: [
        "Modelo / Pacote de Lazer",
        "Preço Sugerido",
        "Esforço Equivalente (Dever)",
        "Equilíbrio & Uso Recomendado (3:1 a 4:1)",
      ],
      coupons: {
        "30": {
          modelLabel: "⏱️ Cupom Básico (30 min de lazer)",
          effortEquivalent: "~1h30 a 2h produtivas (ex: 3 Tarefas Médias)",
          balanceRule:
            "Proporção ~3:1 a 4:1: ~metade da meta diária (~8 🪙) libera 30 min de pausa livre.",
        },
        "60": {
          modelLabel: "⏱️ Cupom Premium (60 min de lazer)",
          effortEquivalent: "3h a 4h produtivas (~1 dia padrão = 15 🪙)",
          balanceRule:
            "Referência 3:1–4:1 oficial: cumprir seu dever do dia garante 1h de lazer sem culpa.",
        },
        "180": {
          modelLabel: "⏱️ Cupom Épico (180 min / 3h de lazer)",
          effortEquivalent: "~2,5 a 3 dias produtivos consistentes",
          balanceRule:
            "Pacote com desconto (~11%) para sessões longas de jogos, filmes ou fim de semana.",
        },
        "480": {
          modelLabel: "⏱️ Cupom Lendário (480 min / 8h livres)",
          effortEquivalent: "~6 a 7 dias inteiros de alta disciplina",
          balanceRule:
            "Dia livre completo / folga estendida (economia de ~21% vs. cupons avulsos).",
        },
      },
      singleUseBasicPremium: {
        modelLabel: "🎁 Uso Único: Mimo Rápido / Diário",
        effortEquivalent: "1–2 tarefas médias a 1 dia produtivo",
        balanceRule:
          "Ex: café especial (4 🪙), episódio avulso ou doce (15 🪙) sem comprometer o saldo semanal.",
      },
      singleUseEpicLegendary: {
        modelLabel: "👑 Uso Único: Marco Semanal / Épico",
        effortEquivalent: "~3–4 dias (Semanal) a ~10 dias (Épico) de foco",
        balanceRule:
          "Ex: delivery especial, passeio, livro novo (50 🪙) ou grande recompensa pessoal (150 🪙).",
      },
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
        "25 a 49 min",
        "O padrão de ouro do foco. Equivale a ~30%–40% de uma entrega de tarefa.",
      ],
      deepWorkPomo: [
        "🍅 Pomodoro Deep Work",
        "50 min ou mais",
        "Imersão profunda prolongada. Equivale a 40% da moeda e 100% do XP de 1 Tarefa Média.",
      ],
      stopwatch: [
        "⏱️ Cronômetro Livre",
        "A cada 30 min",
        "Cálculo contínuo proporcional. Limitado ao teto de 120 min (2h) por sessão.",
      ],
      safetyLocks: [
        "🛡️ Travas de Segurança",
        "Geral",
        "Teto Diário: 8h",
        "Mínimo 10m para pontuar. 4h–6h pagam 50%, 6h–8h pagam 25% e acima de 8h paga 0%. Mochila não pontua.",
      ],
    },
    achievementRarities: {
      title:
        "🏅 Catálogo de Conquistas, Raridades & Pontos de Troféu (/profile)",
      description:
        "As 63 conquistas permanentes (4.170 pts no total) premiam marcos de execução, ofensivas, foco, economia, organização e comportamentos secretos com Pontos de Conquista (Trophy Score) e podem ser exibidas nos 4 espaços de destaque da sua Vitrine. Etapas Recompensadas em tarefas Difíceis também somam +1 unidade de entrega cada nos marcos de tarefas, difíceis e Hardcore.",
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
            "250 Tarefas, Checklist Impecável (50), Pontualidade Real (20 To-Dos no Prazo), Ofensivas de 30 e 60 dias, Domínio do Impulso (7 Ciclos sem Recaída), Estado de Fluxo (90m), 10h de Foco, Mira Certeira (10 Metas de Atividade), 1.000 Moedas, Carteira com 500 Moedas, 5 Cupons de Tempo Esgotados, 6.000 / 12.000 XP, Vitrine Personalizada, 10 Hardcore, Coruja da Meia-Noite e Madrugador (Secretas).",
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
    experienceModes: {
      title:
        "⚖️ Comparison: Essential Mode (Focus & Productivity) vs. Adventure Mode (RPG Immersion)",
      description:
        "Both modes have 100% functional parity and run on the exact same mathematical engine, yield projections, 3:1–4:1 economy rules, Kanban boards, and Focus timers — only visuals, wording, and audio timbre adapt.",
      columns: [
        "App Concept",
        "Essential Mode (Clean Productivity)",
        "Adventure Mode (RPG Immersion)",
        "Equivalence / Rule",
      ],
      rows: [
        [
          "Currency",
          "Credits (≈ 4 min leisure / unit)",
          "Gold Coins (🪙)",
          "1 Credit = 1 🪙 (15 Credits = 1h free)",
        ],
        [
          "Progression / Level",
          "Points (pts) & Executive Ranks",
          "XP & RPG Ranks (Novice to Legend)",
          "1 Point = 1 XP (never spent in the Store)",
        ],
        [
          "Effort Rating",
          "Clean Effort Tiers (Trivial to Hard)",
          "Difficulty Swords",
          "Identical payouts + pre-creation projection",
        ],
        [
          "High Accountability",
          "Strict Deadline / Daily Commitment",
          "Hardcore Mode",
          "Overdue yields 50%; missed deadline fines 50%",
        ],
        [
          "Redeemed Items",
          "Inventory",
          "Backpack",
          "Same saved coupons & personal rewards",
        ],
        [
          "Rewards Store",
          "Direct Rewards + Break Draws (Roulette)",
          "Direct Rewards + Mystery Boxes (RNG)",
          "100% parity + 1-click switch in Settings",
        ],
      ],
    },
    difficulties: {
      title: "Strict Economy: Difficulties & Rewards",
      description:
        "XP and coin (🪙) earnings based on real effort load and estimated duration. Hard Dailies and To-Dos support up to 4 Rewarded Checklist Steps (+30 XP and +5 🪙 extra per step, up to +150 XP and +25 🪙 per card, counting proportionally in achievements and stats).",
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
            "Intense effort (1–2h): heavy study, project, or exam. For 2h+ blocks, mark up to 4 Rewarded Checklist Steps (+30 XP and +5 🪙 each).",
        },
      ],
    },
    habitImportance: {
      title: "Habits: Base Rewards by Importance",
      description:
        "Ongoing habits use Importance (instead of difficulty) to set their base payout before streak consolidation decay applies.",
      columns: ["Level", "Importance", "Base Reward (100%)", "Usage Examples"],
      items: [
        {
          key: "LOW",
          icon: "🟢",
          label: "Low",
          description:
            "Quick maintenance micro-actions (e.g., drink water, 2-min stretch, take vitamins).",
        },
        {
          key: "NORMAL",
          icon: "🟡",
          label: "Normal",
          description:
            "Regular constructive routines (e.g., read 15 min, go for a walk, review planner).",
        },
        {
          key: "HIGH",
          icon: "🟣",
          label: "High",
          description:
            "High-friction keystone habits (e.g., full workout, no social media until noon, daily deep study).",
        },
      ],
    },
    habitDecay: {
      title: "Habits: Progressive Streak Decay",
      description:
        "As you repeat a habit, it requires less conscious willpower. To avoid inflation and encourage fresh challenges, rewards step down as the habit consolidates.",
      columns: [
        "Habit Phase",
        "Streak (Daily / Weekly / Monthly)",
        "% of Reward",
        "Psychological Goal",
      ],
      rows: [
        [
          "Resistance Phase",
          "Daily: 1–6d • Weekly: < 2 wks • Monthly: 1st mo",
          "100% of Reward",
          "Maximum activation energy to engage and break initial inertia.",
        ],
        [
          "Adaptation Phase",
          "Daily: 7–20d • Weekly: 2–7 wks • Monthly: 2–5 mos",
          "75% of Reward",
          "Routine consolidation; the brain starts automating the process.",
        ],
        [
          "Habit Formed",
          "Daily: 21+d • Weekly: 8+ wks • Monthly: 6+ mos",
          "50% of Reward",
          "Automated behavior; encourages taking on new challenges and goals.",
        ],
      ],
    },
    rewardPricing: {
      title: "⚖️ 3:1 to 4:1 Ratio: Calibrated Store Pricing (Duty vs. Leisure)",
      description:
        "A solid productive day typically earns around 15 to 20 🪙 (with a 15 🪙 daily benchmark). Store presets enforce a 3:1 to 4:1 ratio: roughly 3 to 4 hours of real effort buy 1 hour of guilt-free leisure.",
      columns: [
        "Leisure Model / Package",
        "Suggested Price",
        "Equivalent Productive Effort",
        "Balance & Usage (3:1 to 4:1 Rule)",
      ],
      coupons: {
        "30": {
          modelLabel: "⏱️ Basic Coupon (30 min leisure)",
          effortEquivalent: "~1.5h to 2h of effort (~3 Medium tasks)",
          balanceRule:
            "~3:1 to 4:1 ratio: ~half of the daily benchmark (~8 🪙) unlocks a 30-min break.",
        },
        "60": {
          modelLabel: "⏱️ Premium Coupon (60 min leisure)",
          effortEquivalent: "3h to 4h of deep work (~1 standard day = 15 🪙)",
          balanceRule:
            "Official 3:1–4:1 benchmark: hitting your daily benchmark earns 1h of guilt-free rest.",
        },
        "180": {
          modelLabel: "⏱️ Epic Coupon (180 min / 3h leisure)",
          effortEquivalent: "~2.5 to 3 consistent productive days",
          balanceRule:
            "Bundle discount (~11%) for weekend gaming, movie nights, or longer hobbies.",
        },
        "480": {
          modelLabel: "⏱️ Legendary Coupon (480 min / 8h free)",
          effortEquivalent: "~6 to 7 full days of disciplined execution",
          balanceRule:
            "Full day off / extended break (~21% savings compared to single blocks).",
        },
      },
      singleUseBasicPremium: {
        modelLabel: "🎁 Single-Use: Quick / Daily Treat",
        effortEquivalent: "1–2 medium tasks to 1 full productive day",
        balanceRule:
          "E.g., specialty coffee (4 🪙), one episode, or snack (15 🪙) without unbalancing your week.",
      },
      singleUseEpicLegendary: {
        modelLabel: "👑 Single-Use: Weekly / Epic Milestone",
        effortEquivalent: "~3–4 days (Weekly) to ~10 days (Epic) of focus",
        balanceRule:
          "E.g., dinner treat, outing, new book (50 🪙), or major personal reward (150 🪙).",
      },
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
        "25 to 49 min",
        "The gold standard of focus. Worth ~30%–40% of a task deliverable.",
      ],
      deepWorkPomo: [
        "🍅 Deep Work Pomodoro",
        "50 min or more",
        "Prolonged deep immersion. Worth 40% of the coins and 100% of the XP of 1 Medium Task.",
      ],
      stopwatch: [
        "⏱️ Free Stopwatch",
        "Every 30 min",
        "Continuous proportional calculation. Capped at 120 min (2h) per session.",
      ],
      safetyLocks: [
        "🛡️ Safety Locks",
        "General",
        "Daily Cap: 8h",
        "Minimum 10m to score. 4h–6h pays 50%, 6h–8h pays 25%, and above 8h pays 0%. Backpack items don't score.",
      ],
    },
    achievementRarities: {
      title: "🏅 Achievements Catalog, Rarities & Trophy Score (/profile)",
      description:
        "All 63 permanent achievements (4,170 pts in total) reward execution milestones, streaks, deep focus, economy goals, organization, and secret behaviors with Achievement Points (Trophy Score) and can be pinned to the 4 highlight slots on your Showcase. Rewarded Checklist Steps on Hard tasks also count proportionally (+1 delivery unit each) toward task, hard-task, and hardcore-mode milestones.",
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
            "250 Tasks, Flawless Checklist (50), Royal Punctuality (20 On-Time To-Dos), 30 and 60-day Streaks, Impulse Mastery (7 Clean Habit Cycles), 90m Flow State, 10h Focus, Bullseye Focus (10 Activity Goals Met), 1,000 Coins, 500-coin Wallet, 5 Depleted Time Coupons, 6,000 / 12,000 XP, Curated Showcase, 10 Hardcore, Midnight Owl & Early Bird (Secret).",
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
  const numberLocale = toIntlLocale(locale);
  const formatCoinValue = (value: number) => formatCoins(value, { locale });
  const levelProgressionMeta = LEVEL_PROGRESSION_META[locale];
  const mysteryBoxLabels = MYSTERY_BOX_PACKAGE_LABELS[locale];
  const couponPriceByMinutes = (minutes: number, fallback: number) =>
    COUPON_PACKAGE_OPTIONS.find((opt) => opt.suggestedMinutes === minutes)
      ?.suggestedPrice ?? fallback;
  const singleUsePriceById = (
    id: (typeof SINGLE_USE_TIER_OPTIONS)[number]["id"],
  ) =>
    SINGLE_USE_TIER_OPTIONS.find((opt) => opt.id === id)?.suggestedPrice ?? 0;

  return {
    experienceModes: {
      title: copy.experienceModes.title,
      description: copy.experienceModes.description,
      category: "OVERVIEW",
      columns: copy.experienceModes.columns,
      rows: copy.experienceModes.rows,
    },
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
    habitImportance: {
      title: copy.habitImportance.title,
      description: copy.habitImportance.description,
      category: "TASKS",
      categories: ["TASKS", "ECONOMY"],
      columns: copy.habitImportance.columns,
      rows: copy.habitImportance.items.map((item) => {
        const reward = HABIT_IMPORTANCE_REWARDS[item.key];
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
    rewardPricing: {
      title: copy.rewardPricing.title,
      description: copy.rewardPricing.description,
      category: "REWARDS",
      categories: ["REWARDS", "ECONOMY"],
      columns: copy.rewardPricing.columns,
      rows: [
        [
          copy.rewardPricing.coupons["30"].modelLabel,
          `${formatCoinValue(couponPriceByMinutes(30, 8))} 🪙`,
          copy.rewardPricing.coupons["30"].effortEquivalent,
          copy.rewardPricing.coupons["30"].balanceRule,
        ],
        [
          copy.rewardPricing.coupons["60"].modelLabel,
          `${formatCoinValue(couponPriceByMinutes(60, DAILY_PRODUCTIVE_COINS_BENCHMARK))} 🪙`,
          copy.rewardPricing.coupons["60"].effortEquivalent,
          copy.rewardPricing.coupons["60"].balanceRule,
        ],
        [
          copy.rewardPricing.coupons["180"].modelLabel,
          `${formatCoinValue(couponPriceByMinutes(180, 40))} 🪙`,
          copy.rewardPricing.coupons["180"].effortEquivalent,
          copy.rewardPricing.coupons["180"].balanceRule,
        ],
        [
          copy.rewardPricing.coupons["480"].modelLabel,
          `${formatCoinValue(couponPriceByMinutes(480, 95))} 🪙`,
          copy.rewardPricing.coupons["480"].effortEquivalent,
          copy.rewardPricing.coupons["480"].balanceRule,
        ],
        [
          copy.rewardPricing.singleUseBasicPremium.modelLabel,
          `${formatCoinValue(singleUsePriceById("BASIC"))} / ${formatCoinValue(singleUsePriceById("PREMIUM"))} 🪙`,
          copy.rewardPricing.singleUseBasicPremium.effortEquivalent,
          copy.rewardPricing.singleUseBasicPremium.balanceRule,
        ],
        [
          copy.rewardPricing.singleUseEpicLegendary.modelLabel,
          `${formatCoinValue(singleUsePriceById("EPIC"))} / ${formatCoinValue(singleUsePriceById("LEGENDARY"))} 🪙`,
          copy.rewardPricing.singleUseEpicLegendary.effortEquivalent,
          copy.rewardPricing.singleUseEpicLegendary.balanceRule,
        ],
      ],
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
        `+${getRarityTheme(item.rarity).points} pts`,
        item.countLabel,
        item.examples,
      ]),
    },
  };
}

const helpTablesCache: Partial<
  Record<AppLocale, Record<string, HelpTableEntry>>
> = {};

/** Constrói e memoriza as tabelas de referência sob demanda apenas para o idioma solicitado. */
export function getHelpTablesByLocale(
  locale: AppLocale,
): Record<string, HelpTableEntry> {
  const cached = helpTablesCache[locale];
  if (cached) {
    return cached;
  }
  const built = buildHelpTables(locale);
  helpTablesCache[locale] = built;
  return built;
}
