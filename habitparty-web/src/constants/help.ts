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
      "Caixas da sorte equilibradas matematicamente para proporcionar dopamina e surpresa sem desbalancear a economia do jogo.",
    columns: [
      "Pacote",
      "Custo (🪙)",
      "Chances de Prêmio Comum / Bom",
      "Chances de Prêmio Épico / Lendário",
    ],
    rows: [
      [
        "📦 Básico (Basic)",
        "5,00 🪙",
        "60% Pausa Curta (10-15m) • 30% Lazer Médio (30m)",
        "10% Sessão Focada (45m de Hobby + 1 🪙 bônus)",
      ],
      [
        "🎁 Premium",
        "15,00 🪙",
        "50% Lazer Padrão (45-60m) • 35% Lazer Estendido (75-90m)",
        "15% Noite Gamer / Cinema (120m de Entretenimento)",
      ],
      [
        "💎 Épico (Epic)",
        "35,00 🪙",
        "50% Bloco Estendido (120m) • 35% Noite Livre (180m)",
        "15% Tarde Inteira de Desconexão (240m de Folga)",
      ],
      [
        "👑 Lendário (Legendary)",
        "80,00 🪙",
        "60% Day-Off Parcial de Elite (240m Livres)",
        "30% Day-Off Integral • 10% Celebração Absoluta (Final de Semana Livre)",
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
    rows: [
      [
        "🍅 Pomodoro Curto",
        "15 a 24 min",
        "4 XP • 0,10 🪙",
        "Quebra rápida de inércia. Requer ciclo completado com sucesso.",
      ],
      [
        "🍅 Pomodoro Padrão",
        "25 a 40 min",
        "8 XP • 0,25 🪙",
        "O padrão de ouro do foco. Equivale a pouco mais de 1 Tarefa Fácil.",
      ],
      [
        "🍅 Pomodoro Deep Work",
        "Mais de 40 min",
        "15 XP • 0,50 🪙",
        "Imersão profunda prolongada. Equivale ao XP de 1 Tarefa Média.",
      ],
      [
        "⏱️ Cronômetro Livre",
        "A cada 30 min",
        "~7 XP • 0,20 🪙",
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
      "O Modo Hardcore é um compromisso de alta responsabilidade disponível para Hábitos, Diárias e Afazeres (To-dos). Ao habilitá-lo, caso a atividade não seja concluída no prazo, o sistema aplica uma penalidade imediata deduzindo 50% de Moedas e XP do seu saldo na virada da meia-noite. Em Afazeres (To-dos), o prazo de entrega se torna obrigatório e, caso vença, a data fica congelada (não pode ser adiada) — restando concluir com atraso (rendendo apenas 50% da recompensa) ou excluir a tarefa. Use apenas em compromissos inegociáveis!",
    tags: [
      "hardcore",
      "penalidade",
      "compromisso",
      "perda de moedas",
      "prazo fatal",
      "to-do",
    ],
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
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question: "Como funcionam as Caixas Misteriosas (RNG)?",
    answer:
      "Ao cadastrar ou comprar uma Caixa Misteriosa na Loja, você escolhe entre 4 níveis gamificados com custos e probabilidades equilibrados: Básica (5 🪙), Premium (15 🪙), Épica (35 🪙) e Lendária (80 🪙). O sorteio segue a Loot Table do pacote correspondente e o prêmio sorteado vai direto para a sua Mochila, permitindo ganhar recompensas incríveis de acordo com a sua sorte!",
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
      "O HabitParty traz um cronômetro e pomodoro nativos integrados. Você pode iniciar sessões de foco dedicadas a atividades de estudo ou trabalho, registrando os minutos concluídos diretamente no seu histórico e recebendo recompensas calibradas em XP e moedas (🪙).",
    bullets: [
      "Pomodoro: Ciclos pré-definidos de foco (15 a 50 min) intercalados por pausas. Ao concluir o ciclo, você ganha a bonificação completa do bloco.",
      "Cronômetro Livre (Stopwatch): Para quem trabalha em fluxo contínuo. Bonifica proporcionalmente ao tempo focado até o teto de 90 minutos por sessão.",
      "Mochila / Lazer no Foco: Você pode ativar itens de tempo comprados na Loja (ex: videogame). O timer deduz seu saldo de lazer, mas não gera novos ganhos financeiros.",
    ],
    tags: ["foco", "pomodoro", "cronômetro", "estudo", "timer"],
    highlightBadge: "Foco",
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
      "Workspaces permitem segregar completamente seus fluxos de vida. Você pode manter um workspace para 'Trabalho / Carreira', outro para 'Faculdade / Concursos' e um para 'Vida Pessoal'. Cada workspace possui seu próprio quadro Kanban com colunas personalizadas.",
    tags: ["workspaces", "áreas", "kanban", "organização"],
  },
  {
    id: "user-plans",
    category: "OVERVIEW",
    question: "Qual a diferença entre a conta Gratuita e a assinatura Premium?",
    answer:
      "A conta Gratuita oferece acesso completo a todas as ferramentas essenciais de tarefas, hábitos, economia matemática, loja e mochila. O plano Guardião Cósmico (Premium) foi desenhado para quem gerencia rotinas avançadas e deseja máxima personalização estética e imersão:",
    bullets: [
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
    ],
    highlightBadge: "Planos",
  },
  {
    id: "avatar-frames",
    category: "OVERVIEW",
    question:
      "Como funcionam as Molduras de Avatar e a personalização de perfil?",
    answer:
      "Em Configurações > Perfil, você pode escolher molduras circulares animadas que envolvem seu avatar com efeitos de luz cósmica e gradientes estelares. Usuários gratuitos contam com a moldura clássica limpa, enquanto assinantes Guardião Cósmico têm acesso irrestrito às 5 molduras animadas: Guardião Cósmico (ouro estelar), Cyberpunk Neon (pulso ciano e magenta), Fogo da Fênix (chamas ardentes), Aura Esmeralda (místico verde) e Vácuo Ametista (arcano violeta).",
    tags: [
      "molduras",
      "avatar",
      "perfil",
      "personalização",
      "cosméticos",
      "vip",
    ],
    highlightBadge: "Visual",
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
];
