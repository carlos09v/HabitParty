import { HELP_FAQS_EN, HELP_TABLES_EN } from "@/constants/help.en";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import { DIFFICULTY_REWARDS } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type {
  HelpCategory,
  HelpFaqItem,
  HelpProductivityStep,
  HelpTableEntry,
} from "@/types/help";
import { formatCoins } from "@/utils";
import { LEVEL_TITLES_PRODUCTIVITY_PT, USER_LEVELS } from "@/utils/levels";

export const HELP_PRODUCTIVITY_STEPS: readonly HelpProductivityStep[] = [
  {
    step: 1,
    badgeClassName:
      "bg-primary/15 dark:bg-primary/20 border-primary/30 dark:border-primary/40 text-primary dark:text-primary-light",
  },
  {
    step: 2,
    badgeClassName:
      "bg-amber-500/15 dark:bg-gold/20 border-amber-500/35 dark:border-gold/40 text-amber-700 dark:text-gold",
  },
  {
    step: 3,
    badgeClassName:
      "bg-magenta/15 dark:bg-magenta/20 border-magenta/35 dark:border-magenta/40 text-magenta",
  },
  {
    step: 4,
    badgeClassName:
      "bg-emerald-500/15 dark:bg-success-500/20 border-emerald-500/35 dark:border-success-500/40 text-emerald-700 dark:text-success-500",
  },
] as const;

export const HELP_CATEGORY_IDS: readonly HelpCategory[] = [
  "ALL",
  "OVERVIEW",
  "TASKS",
  "ECONOMY",
  "REWARDS",
  "INVENTORY",
  "FOCUS",
  "LEVELS",
] as const;

const LEVEL_PROGRESSION_META: Record<
  string,
  { englishName: string; tasksEstimate: string; timeEstimate: string }
> = {
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
};

const MYSTERY_BOX_EMOJI: Record<string, string> = {
  Básico: "📦 Básico (Basic)",
  Premium: "🎁 Premium",
  Épico: "💎 Épico (Epic)",
  Lendário: "👑 Lendário (Legendary)",
};

export const HELP_TABLES: Record<string, HelpTableEntry> = {
  difficulties: {
    title: "Economia Rígida: Dificuldades e Recompensas",
    description:
      "Ganhos de XP e moedas (🪙) baseados na carga de esforço real e duração estimada de cada atividade.",
    category: "ECONOMY",
    columns: [
      "Nível",
      "Dificuldade",
      "Recompensa Base",
      "Descrição & Exemplos de Uso",
    ],
    rows: [
      [
        "🟩",
        "Trivial (Muito Fácil)",
        `${DIFFICULTY_REWARDS.TRIVIAL.xp} XP • ${formatCoins(DIFFICULTY_REWARDS.TRIVIAL.gold)} 🪙`,
        "Tarefas quase automáticas de curtíssima duração (ex: beber água, tomar remédio, arrumar a cama).",
      ],
      [
        "🟦",
        "Fácil",
        `${DIFFICULTY_REWARDS.EASY.xp} XP • ${formatCoins(DIFFICULTY_REWARDS.EASY.gold)} 🪙`,
        "Tarefas rápidas que exigem intenção básica (ex: responder e-mails, 10 min de leitura, lavar louça).",
      ],
      [
        "🟨",
        "Médio (Padrão)",
        `${DIFFICULTY_REWARDS.MEDIUM.xp} XP • ${formatCoins(DIFFICULTY_REWARDS.MEDIUM.gold)} 🪙`,
        "A base da economia: 30 a 60 minutos de esforço moderado (ex: treino físico, tarefa de trabalho).",
      ],
      [
        "🟧",
        "Difícil",
        `${DIFFICULTY_REWARDS.HARD.xp} XP • ${formatCoins(DIFFICULTY_REWARDS.HARD.gold)} 🪙`,
        "Esforço cognitivo ou físico intenso: 1 a 2 horas (ex: sessão de estudo pesado, projeto de programação).",
      ],
    ],
  },
  habitDecay: {
    title: "Hábitos: Importância e Decaimento por Ofensiva (Streak)",
    description:
      "Conforme você repete um hábito, ele exige menos esforço cerebral. Para evitar inflação e estimular novos desafios, a recompensa decai com o streak.",
    category: "TASKS",
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
    category: "REWARDS",
    columns: [
      "Pacote",
      "Custo (🪙)",
      "Chances de Prêmio Comum / Bom",
      "Chances de Prêmio Épico / Lendário",
    ],
    rows: MYSTERY_BOX_TIERS.map((tier) => {
      const commonDrops = tier.dropRates
        .slice(0, 2)
        .map((d) => `${d.percentage}% ${d.label}`)
        .join(" • ");
      const rareDrops = tier.dropRates
        .slice(2)
        .map((d) => `${d.percentage}% ${d.label}`)
        .join(" • ");
      return [
        MYSTERY_BOX_EMOJI[tier.id] || tier.name,
        `${formatCoins(tier.recommendedPrice)} 🪙`,
        commonDrops,
        rareDrops,
      ];
    }),
  },
  userLevels: {
    title: "🏆 Níveis de Usuário (UserLevel & XP Vitalício)",
    description:
      "Seu XP/Pontos total acumulado nunca é gasto ou resetado ao comprar recompensas. O título exibido adapta-se automaticamente ao seu estilo (Modo Aventura vs. Modo Essencial).",
    category: "LEVELS",
    columns: [
      "Modo Aventura (RPG)",
      "Modo Essencial (Produtividade)",
      "XP / Pontos Necessários",
      "Tarefas Médias Estimadas",
      "Tempo Estimado",
    ],
    rows: USER_LEVELS.map((lvl) => {
      const meta = LEVEL_PROGRESSION_META[lvl.tier];
      return [
        `${lvl.title} (${meta?.englishName || lvl.tier})`,
        LEVEL_TITLES_PRODUCTIVITY_PT[lvl.tier],
        `${lvl.minXpRequired.toLocaleString("pt-BR")} XP / pts`,
        meta?.tasksEstimate || "-",
        meta?.timeEstimate || "-",
      ];
    }),
  },
  focusRewards: {
    title: "⏱️ Ferramentas de Foco: Pomodoro, Cronômetro & Economia",
    description:
      "O foco premia sua jornada e esforço contínuo com XP e pequenas frações de moedas (🪙), mantendo as tarefas como a principal fonte de riqueza.",
    category: "FOCUS",
    columns: [
      "Modalidade",
      "Duração / Ciclo",
      "Recompensa Base",
      "Regras & Travas de Economia",
    ],
    rows: [
      [
        "🍅 Pomodoro Curto",
        "15 a 24 min",
        `4 XP • ${formatCoins(0.1)} 🪙`,
        "Quebra rápida de inércia. Requer ciclo completado com sucesso.",
      ],
      [
        "🍅 Pomodoro Padrão",
        "25 a 40 min",
        `8 XP • ${formatCoins(0.25)} 🪙`,
        "O padrão de ouro do foco. Equivale a pouco mais de 1 Tarefa Fácil.",
      ],
      [
        "🍅 Pomodoro Deep Work",
        "Mais de 40 min",
        `15 XP • ${formatCoins(0.5)} 🪙`,
        "Imersão profunda prolongada. Equivale ao XP de 1 Tarefa Média.",
      ],
      [
        "⏱️ Cronômetro Livre",
        "A cada 30 min",
        `~7 XP • ${formatCoins(0.2)} 🪙`,
        "Cálculo contínuo proporcional. Limitado ao teto de 90 min por sessão.",
      ],
      [
        "🛡️ Travas de Segurança",
        "Geral",
        "Teto Diário: 6h",
        "Mínimo 10m para pontuar. 4h-6h diárias pagam 50%. Acima de 6h paga 0%. Mochila não pontua.",
      ],
    ],
  },
  achievementRarities: {
    title: "🏅 Catálogo de Conquistas, Raridades & Pontos de Troféu (/profile)",
    description:
      "As 63 conquistas permanentes (4.170 pts no total) premiam marcos de execução, ofensivas, foco, economia, organização e comportamentos secretos com Pontos de Conquista (Trophy Score) e podem ser exibidas nos 4 espaços de destaque da sua Vitrine.",
    category: "LEVELS",
    columns: [
      "Raridade / Tier",
      "Pontos de Conquista",
      "Medalhas no Catálogo",
      "Exemplos de Marcos Desbloqueáveis",
    ],
    rows: [
      [
        "⚪ Comum (Common)",
        "+10 pts",
        "12 conquistas",
        "1ª Tarefa, 10 Tarefas, Ofensivas de 3 e 7 dias, 1ª e 10 Sessões de Foco, 100 Moedas, 1º Resgate, 100 / 300 / 750 XP, 1ª Caixa Misteriosa (Secreta).",
      ],
      [
        "🟢 Incomum (Uncommon)",
        "+25 pts",
        "14 conquistas",
        "50 e 100 Tarefas, 5 Tarefas Difíceis, Ofensivas de 14 e 21 dias, Deep Work de 45m, 25 Pomodoros, 500 Moedas, 25 Resgates, 3.000 XP, 2 Workspaces, Estante Real Completa (4 Destaques), 1º Hardcore (Secreta), 5 Caixas Misteriosas (Secreta).",
      ],
      [
        "🔵 Rara (Rare)",
        "+50 pts",
        "18 conquistas",
        "250 Tarefas, Checklist Impecável (20), Pontualidade Real (20 To-Dos no Prazo), Ofensivas de 30 e 60 dias, Domínio do Impulso (7 Ciclos sem Recaída), Estado de Fluxo (90m), 10h de Foco, Mira Certeira (10 Metas de Atividade), 1.000 Moedas, Carteira com 500 Moedas, 5 Cupons de Tempo Esgotados, 6.000 / 12.000 XP, Vitrine Personalizada, 10 Hardcore, Coruja da Meia-Noite e Madrugador (Secretas).",
      ],
      [
        "🟣 Épica (Epic)",
        "+100 pts",
        "13 conquistas",
        "500 Tarefas, 25 Tarefas Difíceis, Ofensivas de 90 e 180 dias, 50h / 100h de Foco, 100 Pomodoros, 5.000 Moedas, 100 Resgates, 25.000 XP, 1.000 Pontos de Conquista, 50 Hardcore e 25 Caixas Misteriosas (Secretas).",
      ],
      [
        "🟡 Lendária (Legendary)",
        "+250 pts",
        "6 conquistas",
        "1.000 Tarefas, 100 Tarefas Difíceis, Ofensiva de 365 dias, 200h de Foco, 15.000 Moedas Acumuladas, Patente Lenda (60.000 XP).",
      ],
    ],
  },
};

export const HELP_FAQS: HelpFaqItem[] = [
  {
    id: "philosophy",
    category: "OVERVIEW",
    question: "O que é o HabitParty e qual a sua filosofia?",
    answer:
      "O HabitParty é um motor de produtividade gamificado de economia fechada. Ao contrário de apps tradicionais de to-do, ele converte o esforço real do usuário em Moedas de Ouro (🪙) e Experiência (XP) no Modo Aventura — ou em Créditos e Pontos (pts) no Modo Essencial — com regras matemáticas rígidas. O saldo conquistado é usado para 'comprar' momentos reais de lazer na Loja (jogar videogame, assistir séries, pausas sem culpa), transformando o descanso em algo merecido e sem procrastinação.",
    tags: [
      "visão geral",
      "gamificação",
      "introdução",
      "filosofia",
      "moedas",
      "créditos",
      "pontos",
    ],
    highlightBadge: "Fundamental",
    actionLink: { label: "Ir para o Dashboard", href: "/dashboard" },
  },
  {
    id: "experience-modes",
    category: "OVERVIEW",
    question:
      "Qual a diferença entre o Modo Essencial (Produtividade) e o Modo Aventura (RPG)?",
    answer:
      "O HabitParty oferece dois perfis de experiência que compartilham o mesmo motor matemático de consistência, quadros Kanban, Pomodoro e extrato, adaptando a linguagem, os indicadores visuais e a mecânica de recompensas ao seu estilo:",
    bullets: [
      "Modo Essencial (Produtividade): Produtividade gamificada com estética executiva e limpa. Substitui Moedas de Ouro por Créditos e XP por Pontos (pts), adota títulos profissionais de evolução (Iniciante a Alta Performance), usa indicadores discretos de Esforço (em vez de espadas), foca em recompensas pessoais diretas na Loja (sem sorteios de Caixas Misteriosas) e utiliza termos corporativos/acadêmicos ('Prazo Rígido' em vez de 'Modo Hardcore' e 'Inventário' em vez de 'Mochila').",
      "Modo Aventura (Imersão RPG): Experiência gamificada completa com feedback imediato de dopamina. Converte suas entregas em Moedas de Ouro (🪙) e XP vitalício, exibe títulos de aventureiro (Novato a Lenda), ícones de espadas para dificuldade, Modo Hardcore com risco disciplinar, Caixas Misteriosas (Gacha/RNG) na Loja, Mochila de itens e efeitos sonoros comemorativos.",
      "Conversão 1:1 e Troca Livre: 1 Moeda de Ouro equivale exatamente a 1 Crédito, e 1 XP equivale a 1 Ponto (pts). Você escolhe seu perfil no primeiro acesso e pode alternar quando quiser em Configurações > Aparência > Estilo de Experiência com 1 clique, sem perder nenhum saldo, nível ou histórico.",
    ],
    tags: [
      "experiência",
      "modo essencial",
      "modo aventura",
      "produtividade",
      "gamificação",
      "créditos",
      "pontos",
      "moedas",
      "xp",
      "rpg",
      "configurações",
    ],
    highlightBadge: "Experiência",
    actionLink: { label: "Configurar Modo", href: "/settings" },
  },
  {
    id: "task-types",
    category: "TASKS",
    question: "Qual a diferença entre Hábitos, Diárias e Afazeres?",
    answer:
      "O HabitParty divide sua rotina em três modalidades bem definidas para manter sua mente focada:",
    bullets: [
      "Hábitos: Ações contínuas que podem ser positivas (+), negativas (-) ou mistas. Não possuem data fixa e operam com Importância (Baixa, Normal, Alta) e sistema de ofensiva (Streak).",
      "Diárias (Dailies): Rotinas recorrentes que devem ser feitas em dias específicos da semana (ex: segundas e quartas). Resetam periodicamente.",
      "Afazeres (To-Dos): Tarefas pontuais com prazo de entrega (data e horário limite gratuitos), lembretes programados, checklists de subtarefas e descrições de até 5.000 caracteres. Assinantes Premium também podem agendar Afazeres como Eventos (com horário de início e término ou dia inteiro) e acompanhar o selo pulsante 'Em andamento' ao vivo no quadro.",
    ],
    tags: ["tarefas", "hábitos", "diárias", "to-do", "rotina"],
    highlightBadge: "Estrutura",
    actionLink: { label: "Ver Minhas Tarefas", href: "/tasks" },
  },
  {
    id: "hardcore-mode",
    category: "TASKS",
    question:
      "O que é o Prazo Rígido / Compromisso Diário / Modo Hardcore nas tarefas?",
    answer:
      "É um compromisso de alta responsabilidade disponível para Hábitos, Diárias e Afazeres (To-dos). A nomenclatura se adapta ao seu Modo de Experiência e ao tipo da atividade: chama-se 'Prazo Rígido' (em Afazeres) ou 'Compromisso Diário' (em Hábitos/Diárias) no Modo Essencial (Produtividade), e 'Modo Hardcore' no Modo Aventura (RPG). Ao ativá-lo:",
    bullets: [
      "Afazeres (To-Dos): A data de entrega torna-se obrigatória e fica bloqueada contra adiamentos após o vencimento. Se atrasar, a entrega tardia rende apenas 50% da recompensa.",
      "Penalidade Noturna: Se a atividade não for cumprida até as 23:59 do dia/prazo, o sistema aplica uma penalidade imediata deduzindo 50% de Moedas/XP (no Modo Aventura) ou Créditos/Pontos (no Modo Essencial) do seu saldo.",
      "Hábitos e Diárias: Falhar na rotina marcada como inegociável reseta a ofensiva (Streak) para o Dia 1 e cobra a multa disciplinar.",
      "Quando usar: Reserve exclusivamente para os seus 1 ou 2 compromissos inegociáveis do dia ou da semana, evitando a autossabotagem.",
    ],
    tags: [
      "prazo rígido",
      "hardcore",
      "penalidade",
      "compromisso",
      "disciplina",
      "autossabotagem",
      "prazo fatal",
      "to-do",
    ],
    highlightBadge: "Disciplina",
  },
  {
    id: "email-reminders-quota",
    category: "TASKS",
    question:
      "Como funcionam os lembretes por e-mail para afazeres e quais os limites?",
    answer:
      "Ao cadastrar ou editar um Afazer (To-do) com prazo de entrega, você pode configurar alarmes de lembrete (1 dia antes, 2 dias antes, 3 dias antes, 1 semana antes ou data e hora personalizadas). Se você marcar 'Receber lembrete por e-mail', o HabitParty enviará um alerta diretamente na sua caixa de entrada no horário programado. Para garantir a estabilidade do serviço, os limites são:",
    bullets: [
      "Plano Aventureiro (Gratuito): Até 5 afazeres com lembretes por e-mail ativos simultaneamente e cota de até 20 disparos mensais. Ao concluir a tarefa ou disparar o alerta, a vaga simultânea é liberada automaticamente.",
      "Plano Guardião Cósmico (Premium): Até 30 afazeres com lembretes por e-mail ativos simultaneamente e cota expandida de até 100 disparos mensais (Política de Uso Justo).",
    ],
    tags: [
      "lembretes",
      "e-mail",
      "resend",
      "notificação",
      "to-do",
      "limites",
      "premium",
      "free",
    ],
    highlightBadge: "Importante",
  },
  {
    id: "economy-inflation",
    category: "ECONOMY",
    question: "Por que os valores de moedas e XP são rigorosos?",
    answer:
      "A economia do HabitParty foi calibrada para que você precise de um dia produtivo real (completando tarefas médias e difíceis) para acumular entre 60 e 80 moedas. Se o sistema pagasse centenas de moedas por qualquer ação simples, a sensação de conquista seria destruída por inflação artificial. A honestidade do usuário é o motor central da eficácia do app.",
    tags: ["economia", "matemática", "ouro", "inflação", "regras"],
  },
  {
    id: "habit-reset",
    category: "ECONOMY",
    question: "O que acontece se eu quebrar o Streak de um hábito?",
    answer:
      "Se você quebrar a sequência de um hábito, a ofensiva reseta para o Dia 1. O aspecto positivo é que a recompensa em moedas volta para 100% da sua capacidade máxima, oferecendo um impulso de incentivo renovado para você reconstruir a disciplina.",
    tags: ["streak", "ofensiva", "reset", "decaimento", "hábitos"],
  },
  {
    id: "rewards-store",
    category: "REWARDS",
    question: "Como funciona a Loja de Recompensas?",
    answer:
      "Você cria seus próprios produtos e pacotes de lazer da vida real. O HabitParty disponibiliza três modelos de recompensa:",
    bullets: [
      "Uso Único: Itens diretos para consumir uma vez (ex: pedir uma pizza, comprar um livro, tomar um café especial).",
      "Baseado em Tempo: Pacotes com tempo pré-definido (ex: 30 minutos de videogame, 1 hora de redes sociais).",
      "Caixa Misteriosa: Recompensas que realizam um sorteio de itens por raridade (Comum até Lendário).",
    ],
    tags: ["loja", "recompensas", "produtos", "tempo", "compras"],
    actionLink: { label: "Explorar a Loja", href: "/rewards" },
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question: "Como funcionam as Caixas Misteriosas (RNG)?",
    answer:
      "Ao cadastrar ou comprar uma Caixa Misteriosa na Loja, você escolhe entre 4 níveis gamificados com custos e probabilidades equilibrados: Básica (5 🪙), Premium (15 🪙), Épica (35 🪙) e Lendária (80 🪙). O sorteio segue a Loot Table do pacote correspondente e o prêmio sorteado vai direto para a sua Mochila, permitindo ganhar recompensas incríveis de acordo com a sua sorte!",
    tags: ["caixa misteriosa", "sorteio", "rng", "loot table", "prêmios"],
    actionLink: { label: "Ver Caixas na Loja", href: "/rewards" },
  },
  {
    id: "inventory-usage",
    category: "INVENTORY",
    question: "Para onde vão os itens após serem comprados na Loja?",
    answer:
      "Todos os produtos comprados vão imediatamente para a sua Mochila (Inventário). Lá você pode visualizar o estoque disponível, consumir quando for usufruir da recompensa no mundo real, ou iniciar uma sessão de foco atrelada àquele item.",
    tags: ["mochila", "inventário", "consumo", "itens"],
    actionLink: { label: "Abrir Minha Mochila", href: "/inventory" },
  },
  {
    id: "focus-sessions",
    category: "FOCUS",
    question: "Como funcionam as ferramentas de Foco (Pomodoro & Cronômetro)?",
    answer:
      "O HabitParty traz um cronômetro e pomodoro nativos integrados. Você pode iniciar sessões de foco dedicadas a atividades de estudo ou trabalho, registrando os minutos concluídos diretamente no seu histórico e recebendo recompensas calibradas em XP e moedas (🪙).",
    bullets: [
      "Pomodoro: Ciclos pré-definidos de foco (15 a 50 min) intercalados por pausas. Ao concluir o ciclo, você ganha a bonificação completa do bloco.",
      "Cronômetro Livre (Stopwatch): Para quem trabalha em fluxo contínuo. Bonifica proporcionalmente ao tempo focado até o teto de 90 minutos por sessão.",
      "Mochila / Lazer no Foco: Você pode ativar itens de tempo comprados na Loja (ex: videogame). O timer deduz seu saldo de lazer, mas não gera novos ganhos financeiros.",
    ],
    tags: ["foco", "pomodoro", "cronômetro", "estudo", "timer"],
    highlightBadge: "Foco",
    actionLink: { label: "Iniciar Sessão de Foco", href: "/focus" },
  },
  {
    id: "focus-economy",
    category: "FOCUS",
    question: "Como funciona a economia do Foco e as travas anti-abuso?",
    answer:
      "Para manter a gamificação justa, gratificante e protegida contra esquecimento do timer ligado ou mineração ociosa:",
    bullets: [
      "Tempo Mínimo: Sessões com menos de 10 minutos são consideradas descartadas e geram 0 XP e 0 moedas.",
      "Teto Anti-AFK: Se o timer for esquecido ligado por horas, a remuneração é limitada a no máximo 90 minutos contínuos.",
      "Teto Diário & Rendimento Decrescente (Soft Cap): As primeiras 4 horas diárias de foco pagam 100%. Entre 4h e 6h pagam 50% (fadiga natural). Acima de 6h de foco diário, novas sessões não geram XP nem moedas para evitar burnout e hiperinflação (o tempo continua registrado nas estatísticas).",
      "Lazer Não Gera Renda: Sessões de itens de inventário da mochila têm rendimento fixo de 0 XP e 0 moedas.",
    ],
    tags: ["foco", "economia", "anti-afk", "teto diário", "recompensas"],
  },
  {
    id: "workspaces-concept",
    category: "OVERVIEW",
    question: "O que são Workspaces e como devo organizá-los?",
    answer:
      "Workspaces permitem segregar completamente seus fluxos de vida. Você pode manter um workspace para 'Trabalho / Carreira', outro para 'Faculdade / Concursos' e um para 'Vida Pessoal'. Cada workspace possui seu próprio quadro Kanban com colunas personalizadas e conta com busca inteligente entre ambientes: ao pesquisar uma tarefa, o sistema avisa automaticamente se houver resultados em outros workspaces e permite alternar com 1 clique.",
    tags: ["workspaces", "áreas", "kanban", "organização", "busca"],
    actionLink: { label: "Gerenciar Quadro", href: "/tasks" },
  },
  {
    id: "user-plans",
    category: "OVERVIEW",
    question: "Qual a diferença entre a conta Gratuita e a assinatura Premium?",
    answer:
      "A conta Gratuita oferece acesso completo a todas as ferramentas essenciais de tarefas, hábitos, economia matemática, loja e mochila. O plano Guardião Cósmico (Premium) foi desenhado para quem gerencia rotinas avançadas e deseja máxima personalização estética e imersão:",
    bullets: [
      "Afazeres como Eventos: Agende tarefas com horário de início e término ou dia inteiro, contando com badge pulsante 'Em andamento' em tempo real no quadro.",
      "Molduras Cósmicas de Avatar: 5 molduras animadas exclusivas com aura e pulso de luz radiante para seu perfil.",
      "Sons Ambientes de Foco: Sons relaxantes sintetizados nativamente no Pomodoro (Chuva Suave, Cafeteria, Lofi Zen e Fogueira).",
      "Pacote de Ícones VIP: Coleção exclusiva de ícones dourados para colunas, rotinas, foco e itens da loja.",
      "Capacidade Expandida: Até 4 Ambientes/Workspaces (o dobro do free), até 6 colunas por quadro, até 6 atividades personalizadas no Modo Foco, mochila expandida para 100 itens e até 100 recompensas cadastradas.",
      "Destaque no Perfil: Emblema VIP de Guardião Cósmico e anel dourado estelar no avatar.",
      "Planos e Pagamento: R$ 9,90/mês ou R$ 99,00/ano (economia de ~17%), com suporte a Cartão de Crédito recorrente ou Pix Avulso de 30/365 dias sem renovação automática.",
    ],
    tags: [
      "plano",
      "gratuito",
      "premium",
      "vantagens",
      "benefícios",
      "guardião cósmico",
      "assinatura",
      "pix",
      "molduras",
      "sons ambiente",
      "eventos",
    ],
    highlightBadge: "Planos",
    actionLink: { label: "Ver Planos & Assinatura", href: "/settings" },
  },
  {
    id: "avatar-frames",
    category: "OVERVIEW",
    question:
      "Como funcionam as Molduras de Avatar e a personalização de perfil?",
    answer:
      "Na sua Vitrine do Perfil (/profile), ao clicar no ícone de moldura sobre o avatar, você pode escolher molduras circulares animadas que envolvem sua foto com efeitos de luz cósmica e gradientes estelares. Usuários gratuitos contam com a moldura clássica limpa, enquanto assinantes Guardião Cósmico têm acesso irrestrito às 5 molduras animadas: Guardião Cósmico (ouro estelar), Cyberpunk Neon (pulso ciano e magenta), Fogo da Fênix (chamas ardentes), Aura Esmeralda (místico verde) e Vácuo Ametista (arcano violeta).",
    tags: [
      "molduras",
      "avatar",
      "perfil",
      "personalização",
      "cosméticos",
      "vip",
    ],
    highlightBadge: "Visual",
    actionLink: { label: "Personalizar na Vitrine", href: "/profile" },
  },
  {
    id: "ambient-sounds",
    category: "FOCUS",
    question: "Como funcionam os Sons Ambientes no Modo Foco?",
    answer:
      "Os sons ambientes do HabitParty foram gerados usando a Web Audio API nativa do navegador, garantindo latência zero, consumo mínimo de memória e funcionamento 100% offline. Assinantes Premium podem alternar entre quatro paisagens sonoras relaxantes para silenciar distrações e entrar em estado de fluxo:",
    bullets: [
      "Chuva Suave: Ruído rosa com filtragem contínua para simular chuva suave e constante.",
      "Cafeteria: Filtragem acolhedora de frequências médias simulando o murmúrio calmo de um café.",
      "Lofi Zen: Acorde harmônico e contínuo (C3, G3, C4, E4) em ondas senoidais filtradas para foco profundo.",
      "Fogueira: Fundo acústico quente com estalidos aleatórios de brasas e lenha estalando.",
      "Controles: O som pode ser ativado e ajustado tanto no menu Configurações > Áudio quanto diretamente no popover de áudio durante o timer de Foco/Pomodoro.",
    ],
    tags: [
      "sons ambiente",
      "foco",
      "pomodoro",
      "chuva",
      "cafeteria",
      "lofi",
      "fogueira",
      "áudio",
    ],
    highlightBadge: "Foco",
    actionLink: { label: "Configurar Sons & Áudio", href: "/settings" },
  },
  {
    id: "payment-cancellation",
    category: "OVERVIEW",
    question: "Como funciona o pagamento da assinatura e o cancelamento?",
    answer:
      "O HabitParty utiliza a infraestrutura de pagamentos global e segura da Stripe. Você pode escolher entre duas modalidades transparentes:",
    bullets: [
      "Cartão de Crédito (Recorrente): Renovação automática mensal ou anual. Você pode cancelar quando quiser com 1 clique acessando Configurações > Perfil > Gerenciar Assinatura (Portal Stripe). Ao cancelar, seu acesso Premium permanece ativo até o fim do período já pago.",
      "Pix Avulso (Sem Recorrência): Pagamento único via QR Code que credita instantaneamente 30 dias (Mensal) ou 365 dias (Anual) de acesso. Não gera cobranças futuras automáticas no seu banco.",
    ],
    tags: [
      "pagamento",
      "stripe",
      "pix",
      "cancelamento",
      "cartão",
      "assinatura",
    ],
    actionLink: { label: "Gerenciar Assinatura", href: "/settings" },
  },
  {
    id: "premium-expiration-data",
    category: "OVERVIEW",
    question:
      "O que acontece com as minhas colunas, ambientes e dados quando o Premium expira?",
    answer:
      "Nenhum dado ou tarefa é excluído! O HabitParty tem compromisso absoluto de zero perda de dados. Quando seu período Premium expirar (ou voltar para o plano Free), todas as suas estruturas permanecem intactas no banco de dados e o sistema adota uma degradação suave e transparente:",
    bullets: [
      "Colunas do Quadro (Até 6 criadas): O quadro de rotinas passa a exibir até 4 colunas ativas ao mesmo tempo (limite Free). As outras colunas ficam preservadas e ocultas do quadro. Você pode abrir o gerenciador de colunas a qualquer momento e alternar livremente quais 4 colunas quer ativas no dia a dia.",
      "Atividades de Foco (Até 6 criadas): As 4 primeiras atividades permanecem ativas e ordenáveis; as últimas 2 ficam preservadas e pausadas até a renovação.",
      "Ambientes (Workspaces): Todos os ambientes criados continuam salvos e acessíveis em modo somente leitura (Bloqueado 👑), permitindo consultar tarefas a qualquer momento.",
      "Tarefas e Histórico: Todas as tarefas dentro das colunas ou ambientes continuam preservadas, permitindo concluí-las, movê-las ou editá-las.",
      "Mochila de Itens e Loja: Itens já comprados na sua mochila nunca são perdidos (direito adquirido). Você pode consumi-los normalmente.",
      "Aviso Prévio na Sidebar: Para que você nunca seja pego de surpresa, uma contagem regressiva aparece no rodapé da Sidebar avisando quando restam 7, 3 e 1 dia para renovar com 1 clique.",
      "Reativação Imediata: Ao renovar o Premium a qualquer momento, todos os seus recursos extras (6 colunas juntas com scroll, molduras animadas, sons ambiente e 4 ambientes) voltam instantaneamente sem você precisar reconfigurar nada.",
    ],
    tags: [
      "expiração",
      "premium",
      "colunas",
      "mochila",
      "dados",
      "segurança",
      "workspaces",
      "downgrade",
      "free",
      "aviso",
    ],
    highlightBadge: "Transparência",
  },
  {
    id: "profile-showcase",
    category: "LEVELS",
    question:
      "Como funciona a Vitrine do Perfil (/profile) e os 4 Espaços de Destaque?",
    answer:
      "Ao clicar no seu cartão de perfil no rodapé da barra lateral (Sidebar), você acessa sua Vitrine de Aventureiro (/profile). Ela funciona como seu cartão de visitas oficial, reunindo sua identidade visual, estatísticas vitalícias e uma estante personalizável no topo:",
    bullets: [
      "Identidade & Bio: Exiba seu Avatar com Moldura Animada, selo de Fundador Pioneiro ou VIP, patente de nível atual, pontuação total de conquistas (🏆 pts) e uma frase/bio personalizada de até 160 caracteres.",
      "4 Espaços de Destaque (Trophy Shelf): Escolha livremente até 4 itens para fixar no topo da sua vitrine — combinando Conquistas Desbloqueadas e Insígnias da Conta (Fundador, Guardião VIP, Conta Verificada e Patente de Nível). As estatísticas vitalícias (Ofensiva, Horas de Foco, Tarefas e XP) já ficam exibidas nos painéis dedicados logo abaixo.",
      "Modo Visão de Visitante: Alterne com 1 clique no botão 'Visão de Visitante' no topo da vitrine para pré-visualizar exatamente como seu perfil é exibido sem os botões de edição.",
    ],
    tags: [
      "vitrine",
      "perfil",
      "showcase",
      "destaques",
      "badges",
      "insígnias",
      "bio",
      "fundador",
    ],
    highlightBadge: "Novo • 1.2",
    actionLink: { label: "Abrir Minha Vitrine", href: "/profile" },
  },
  {
    id: "achievements-system",
    category: "LEVELS",
    question:
      "Como funcionam as 63 Conquistas, os Pontos de Conquista e as Medalhas Secretas?",
    answer:
      "O sistema de Conquistas do HabitParty conta com 63 medalhas permanentes (4.170 pts no total) distribuídas em 6 categorias (Missões & Execução, Ofensiva, Foco, Economia & Loja, Evolução e Especiais) e 5 graus de raridade (Comum a Lendária):",
    bullets: [
      "Desbloqueio Automático em Tempo Real: Sempre que você conclui uma tarefa, faz check-in em hábito, registra uma sessão de foco, resgata uma recompensa, abre uma Caixa Misteriosa ou cria um novo Workspace, o servidor avalia seu progresso e desbloqueia novas medalhas automaticamente com efeito sonoro cristalino de troféu.",
      "Pontos de Conquista (Trophy Score): Cada medalha concede de +10 pts (Comum) a +250 pts (Lendária), compondo seu placar de prestígio exibido na Sidebar e na Vitrine (sem alterar o equilíbrio de moedas da loja). Ao somar 1.000 pts você ainda desbloqueia a medalha 'Colecionador de Glórias'.",
      "Conquistas Comportamentais: Além de volume, algumas medalhas premiam como você trabalha — entregar 20 Afazeres antes do prazo (Pontualidade Real), concluir 7 ciclos de Hábitos Negativos/Mistos sem recaídas (Domínio do Impulso), bater 10 metas de tempo de Atividades no Focus (Mira Certeira), concluir tarefas com 100% do checklist marcado, esgotar cupons de tempo da Mochila, manter 500 moedas na carteira, preencher os 4 espaços da Vitrine ou criar 2 Workspaces.",
      "Conquistas Secretas (???): 8 medalhas especiais (Hardcore, Caixas Misteriosas, Coruja da Meia-Noite e Madrugador) permanecem ocultas com título e descrição mascarados até que você descubra e cumpra seu requisito especial na jornada. Os horários das sessões de foco usam o relógio local do seu dispositivo.",
    ],
    tags: [
      "conquistas",
      "medalhas",
      "troféus",
      "pontos de conquista",
      "secretas",
      "raridade",
      "som",
    ],
    highlightBadge: "Novo • 1.2",
    actionLink: { label: "Ver Galeria de Conquistas", href: "/profile" },
  },
  {
    id: "history-batch-and-time-format",
    category: "ECONOMY",
    question:
      "Como funcionam a Exclusão em Lote no Histórico, os Snapshots de Coluna e o Formato de Horário (12h/24h)?",
    answer:
      "Para manter seu extrato financeiro e sua visualização temporal sempre organizados ao seu gosto, o HabitParty oferece controles avançados de auditoria e exibição:",
    bullets: [
      "Seleção Múltipla e Exclusão em Lote: Na tela de Histórico (/history), selecione múltiplos registros (ou clique em 'Selecionar tudo') para remover transações indesejadas de uma só vez pela barra flutuante de ações.",
      "Exclusão Sincronizada: Ao excluir uma tarefa ou sessão de foco, você pode marcar a opção de também apagar do Histórico as transações de moedas e XP vinculadas a ela.",
      "Snapshot de Lista/Coluna: Cada transação de tarefa preserva o nome da coluna Kanban original no momento da conclusão, mantendo o contexto histórico mesmo se a coluna for renomeada ou removida depois.",
      "Formato de Horário (12h AM/PM ou 24h): Em Configurações > Aparência, alterne entre o relógio de 24 horas (ex: 14:30) e o formato de 12 horas (ex: 2:30 PM), sincronizando instantaneamente cards, popovers de detalhes, seletores de hora, histórico e sessões de foco.",
    ],
    tags: [
      "histórico",
      "extrato",
      "lote",
      "excluir",
      "horário",
      "12h",
      "24h",
      "am/pm",
      "snapshot",
    ],
    highlightBadge: "Novo • 1.3",
    actionLink: { label: "Abrir Histórico", href: "/history" },
  },
];

/** Retorna as perguntas frequentes no idioma solicitado. */
export function getHelpFaqs(locale: AppLocale): HelpFaqItem[] {
  return locale === "en" ? HELP_FAQS_EN : HELP_FAQS;
}

/** Retorna as tabelas de referência da economia no idioma solicitado. */
export function getHelpTables(
  locale: AppLocale,
): Record<string, HelpTableEntry> {
  return locale === "en" ? HELP_TABLES_EN : HELP_TABLES;
}
