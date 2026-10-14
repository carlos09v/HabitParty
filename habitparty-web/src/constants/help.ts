import type {
  HelpCategoryTab,
  HelpFaqItem,
  HelpProductivityStep,
  HelpTableEntry,
} from "@/types/help";

export const HELP_PRODUCTIVITY_STEPS: readonly HelpProductivityStep[] = [
  {
    step: 1,
    title: "Planeje sua Rotina",
    description:
      "Organize seus afazeres em Hábitos contínuos, Diárias recorrentes e To-Dos pontuais com checklists.",
    badgeClassName: "bg-primary/20 border-primary/40 text-primary-light",
  },
  {
    step: 2,
    title: "Execute e Farme Ouro",
    description:
      "Conclua tarefas reais. A dificuldade matemática credita moedas (🪙) e XP vitalício imediatamente.",
    badgeClassName: "bg-gold/20 border-gold/40 text-gold",
  },
  {
    step: 3,
    title: "Compre Recompensas",
    description:
      "Use suas moedas suadas na Loja para adquirir lazer, pacotes de tempo ou Caixas Misteriosas.",
    badgeClassName: "bg-magenta/20 border-magenta/40 text-magenta",
  },
  {
    step: 4,
    title: "Desfrute sem Culpa",
    description:
      "Abra a Mochila, consuma seu descanso merecido e mantenha seu cérebro recompensado e motivado.",
    badgeClassName: "bg-success-500/20 border-success-500/40 text-success-500",
  },
] as const;

export const HELP_CATEGORIES: HelpCategoryTab[] = [
  { id: "ALL", label: "Tudo" },
  { id: "OVERVIEW", label: "Visão Geral" },
  { id: "TASKS", label: "Tarefas & Hábitos" },
  { id: "ECONOMY", label: "Economia & Ouro" },
  { id: "REWARDS", label: "Loja & Caixas" },
  { id: "INVENTORY", label: "Mochila" },
  { id: "FOCUS", label: "Foco & Pomodoro" },
  { id: "LEVELS", label: "Níveis & XP" },
];

export const HELP_TABLES: Record<string, HelpTableEntry> = {
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
    rows: [
      [
        "🟩",
        "Trivial (Muito Fácil)",
        "2 XP • 0,25 🪙",
        "Tarefas quase automáticas de curtíssima duração (ex: beber água, tomar remédio, arrumar a cama).",
      ],
      [
        "🟦",
        "Fácil",
        "5 XP • 0,75 🪙",
        "Tarefas rápidas que exigem intenção básica (ex: responder e-mails, 10 min de leitura, lavar louça).",
      ],
      [
        "🟨",
        "Médio (Padrão)",
        "15 XP • 2,50 🪙",
        "A base da economia: 30 a 60 minutos de esforço moderado (ex: treino físico, tarefa de trabalho).",
      ],
      [
        "🟧",
        "Difícil",
        "30 XP • 5,00 🪙",
        "Esforço cognitivo ou físico intenso: 1 a 2 horas (ex: sessão de estudo pesado, projeto de programação).",
      ],
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
      "Compre caixas da sorte para resgatar recompensas aleatórias da sua lista personalizada de prêmios.",
    columns: [
      "Pacote",
      "Custo (🪙)",
      "Chances de Prêmio Comum / Bom",
      "Chances de Prêmio Épico / Lendário",
    ],
    rows: [
      [
        "📦 Básico (Basic)",
        "3,75 🪙",
        "60% Comum • 30% Bom",
        "10% Raro (ex: Episódio de Série)",
      ],
      [
        "🎁 Premium",
        "10,00 🪙",
        "40% Comum • 40% Bom",
        "20% Épico (ex: 1h de Jogos)",
      ],
      [
        "💎 Épico (Epic)",
        "25,00 🪙",
        "50% Bom",
        "40% Épico • 10% Lendário (ex: Comprar Livro/Jogo)",
      ],
      [
        "👑 Lendário (Legendary)",
        "62,50 🪙",
        "—",
        "70% Épico • 30% Santo Graal (ex: Day Off)",
      ],
    ],
  },
  userLevels: {
    title: "🏆 Níveis de Usuário (UserLevel & XP Vitalício)",
    description:
      "Seu XP total acumulado nunca é gasto ou resetado ao comprar recompensas. Ele serve como marco de consistência e maturidade.",
    columns: [
      "Nível",
      "XP Necessário",
      "Tarefas Médias Estimadas",
      "Tempo Estimado",
    ],
    rows: [
      ["Novato (Novice)", "0 XP", "Ponto de partida", "Primeiro acesso"],
      ["Aprendiz (Apprentice)", "100 XP", "~7 tarefas médias", "1º a 2º dia"],
      ["Aventureiro (Adventurer)", "300 XP", "~20 tarefas médias", "1ª semana"],
      [
        "Desafiante (Challenger)",
        "750 XP",
        "~50 tarefas médias",
        "2 a 3 semanas",
      ],
      [
        "Amador (Amateur)",
        "1.500 XP",
        "~100 tarefas médias",
        "1 mês de consistência",
      ],
      [
        "Profissional (Professional)",
        "3.000 XP",
        "~200 tarefas médias",
        "Trimestral",
      ],
      ["Especialista (Expert)", "6.000 XP", "~400 tarefas médias", "Semestral"],
      [
        "Veterano (Veteran)",
        "12.000 XP",
        "~800 tarefas médias",
        "Maturidade alta",
      ],
      [
        "Mestre (Master)",
        "25.000 XP",
        "~1.600 tarefas médias",
        "Constância rigorosa",
      ],
      [
        "Lenda (Legend)",
        "60.000 XP",
        "+4.000 tarefas médias",
        "Mais de 1 ano diário",
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
      "O HabitParty é um motor de produtividade gamificado de economia fechada. Ao contrário de apps tradicionais de to-do, ele converte o esforço real do usuário em moedas de ouro (🪙) e experiência (XP) com regras matemáticas rígidas. As moedas ganhas são usadas para 'comprar' momentos reais de lazer na Loja (jogar videogame, assistir séries, pausas sem culpa), transformando o descanso em algo merecido e sem procrastinação.",
    tags: ["visão geral", "gamificação", "introdução", "filosofia", "moedas"],
    highlightBadge: "Fundamental",
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
      "Afazeres (To-Dos): Tarefas pontuais com prazo definido (Due Date) e checklists de subtarefas. Ao serem concluídas, saem do fluxo ativo.",
    ],
    tags: ["tarefas", "hábitos", "diárias", "to-do", "rotina"],
    highlightBadge: "Estrutura",
  },
  {
    id: "hardcore-mode",
    category: "TASKS",
    question: "O que é o Modo Hardcore nas tarefas?",
    answer:
      "O Modo Hardcore é um compromisso de alta responsabilidade. Ao habilitá-lo em uma tarefa ou diária, caso ela não seja concluída até o prazo, o sistema aplica uma penalidade imediata deduzindo moedas do seu saldo. Use apenas em compromissos inegociáveis!",
    tags: ["hardcore", "penalidade", "compromisso", "perda de moedas"],
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
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question: "Como funcionam as Caixas Misteriosas (RNG)?",
    answer:
      "Ao comprar uma Caixa Misteriosa na Loja, o motor de sorteio avalia a tabela de probabilidades (Loot Table) do pacote (Básico, Premium, Épico ou Lendário). O prêmio sorteado é transferido diretamente para a sua Mochila, permitindo ganhar recompensas muito superiores ao valor gasto quando a sorte sorri!",
    tags: ["caixa misteriosa", "sorteio", "rng", "loot table", "prêmios"],
  },
  {
    id: "inventory-usage",
    category: "INVENTORY",
    question: "Para onde vão os itens após serem comprados na Loja?",
    answer:
      "Todos os produtos comprados vão imediatamente para a sua Mochila (Inventário). Lá você pode visualizar o estoque disponível, consumir quando for usufruir da recompensa no mundo real, ou iniciar uma sessão de foco atrelada àquele item.",
    tags: ["mochila", "inventário", "consumo", "itens"],
  },
  {
    id: "focus-sessions",
    category: "FOCUS",
    question: "Como funcionam as ferramentas de Foco (Pomodoro & Cronômetro)?",
    answer:
      "O HabitParty traz um cronômetro e pomodoro nativos integrados. Você pode iniciar sessões de foco dedicadas a atividades de estudo ou trabalho, registrando os minutos concluídos diretamente no seu histórico de produtividade.",
    tags: ["foco", "pomodoro", "cronômetro", "estudo", "timer"],
  },
  {
    id: "workspaces-concept",
    category: "OVERVIEW",
    question: "O que são Workspaces e como devo organizá-los?",
    answer:
      "Workspaces permitem segregar completamente seus fluxos de vida. Você pode manter um workspace para 'Trabalho / Carreira', outro para 'Faculdade / Concursos' e um para 'Vida Pessoal'. Cada workspace possui seu próprio quadro Kanban com colunas personalizadas.",
    tags: ["workspaces", "áreas", "kanban", "organização"],
  },
  {
    id: "user-plans",
    category: "OVERVIEW",
    question: "Qual a diferença entre a conta Gratuita e a conta Premium?",
    answer:
      "A conta Gratuita oferece acesso completo a todas as ferramentas essenciais de tarefas, hábitos, economia, loja e mochila. O plano Premium traz personalizações exclusivas de perfil, destaques visuais com aro dourado, relatórios analíticos aprofundados e suporte a recursos futuros do roadmap.",
    tags: ["plano", "gratuito", "premium", "vantagens", "benefícios"],
    highlightBadge: "Planos",
  },
];
