import { HELP_FAQS_EN } from "@/constants/help.en";
import { HELP_TABLES, HELP_TABLES_EN } from "@/constants/helpTables";
import type { AppLocale } from "@/i18n/config";
import type {
  HelpCategory,
  HelpFaqItem,
  HelpProductivityStep,
  HelpTableEntry,
} from "@/types/help";

export { HELP_TABLES };

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
      "bg-magenta/15 dark:bg-magenta/20 border-magenta/35 dark:border-magenta/40 text-magenta dark:text-fuchsia-300",
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
      "Qual a diferença entre o Modo Essencial (Foco & Produtividade) e o Modo Aventura (Imersão RPG)?",
    answer:
      "O HabitParty oferece dois modos com 100% de paridade funcional — ambos rodam sobre exatamente o mesmo motor matemático, projeções de rendimento, regra 3:1–4:1, quadros Kanban, Pomodoro/Foco (com teto ultradiano de 90m e sustentabilidade diária de 8h) e sorteios na Loja — adaptando apenas a estética, a nomenclatura e a calibração sonora:",
    bullets: [
      "Modo Essencial (Foco & Produtividade Limpa): Estética executiva, sóbria e direta ao ponto. Usa Créditos com equivalência prática em tempo livre (4 min/Crédito • 15 Créditos = 1h de lazer) e Pontos (pts), exibe patentes profissionais (Iniciante a Alta Performance), indicadores discretos de Esforço (sem espadas), 'Prazo Rígido' / 'Compromisso Diário', Inventário, Sorteio de Pausa (roleta de intervalos/pausas na Loja) e alarme sonoro Zen suave.",
      "Modo Aventura (Imersão RPG): Experiência temática de jogo com feedback visual de recompensa e fantasia. Converte suas entregas em Moedas de Ouro (🪙) e XP, exibe patentes de aventureiro (Novato a Lenda), ícones de espadas para dificuldade, Modo Hardcore, Caixas Misteriosas (sorteios RNG por raridade) na Loja, Mochila e efeitos sonoros Arcade comemorativos.",
      "Conversão 1:1 e Alternância Livre: 1 Moeda de Ouro = 1 Crédito (≈ 4 min de lazer) e 1 XP = 1 Ponto (pts). Você escolhe seu modo no onboarding e pode alternar quando quiser em Configurações > Aparência > Estilo de Experiência em 1 clique, sem perder histórico, nível nem saldo.",
    ],
    tags: [
      "experiência",
      "modo essencial",
      "modo aventura",
      "produtividade",
      "imersão",
      "gamificação",
      "créditos",
      "pontos",
      "moedas",
      "xp",
      "rpg",
      "sorteio de pausa",
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
      "O HabitParty divide sua rotina em três modalidades complementares e permite organizá-las com Tags Hierárquicas (ex: 'Estudos > Inglês' usando '>') para filtrar do macro ao detalhe:",
    bullets: [
      "Hábitos: Ações contínuas que podem ser positivas (+), negativas (-) ou mistas. Não possuem data fixa, usam Importância (Baixa, Normal, Alta) e contam com botão de Foco Rápido na própria linha.",
      "Diárias (Dailies): Rotinas recorrentes programadas para dias específicos da semana (ex: segundas e quartas). Renovam automaticamente na virada do dia no seu fuso horário (incluindo seus checklists), mantêm 100% do valor base sem decaimento e desbloqueiam +10% de bônus de consistência após 14 execuções seguidas nos dias agendados.",
      "Afazeres (To-Dos): Tarefas pontuais com prazo de entrega (data e horário limite gratuitos), lembretes programados, checklists de subtarefas e descrições em Rich-Text (listas, negrito e links) de até 2.000 caracteres. Assinantes Premium também podem agendar Afazeres como Eventos (com horário de início e término ou dia inteiro) e acompanhar o selo pulsante 'Em andamento' no quadro.",
      "Etapas Recompensadas (Diárias e Afazeres Difíceis): Em blocos extensos (+2h), em vez de dividir em 'Parte 1' e 'Parte 2', você pode marcar até 4 subtarefas como Etapas Recompensadas (ou Etapas de Esforço no Essencial). Cada etapa adiciona +100% da recompensa base (+30 XP/pts e +5 🪙/Créditos) e soma +1 unidade de entrega nas estatísticas e conquistas — tudo entregue de uma só vez ao concluir o card.",
    ],
    tags: [
      "tarefas",
      "hábitos",
      "diárias",
      "to-do",
      "rotina",
      "tags",
      "rich-text",
      "etapas recompensadas",
      "subtarefas",
      "checklist",
    ],
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
      "Penalidade Noturna & Proteção de Etapas Concluídas: Se a atividade não for cumprida até as 23:59 do dia/prazo, o sistema deduz 50% do valor da tarefa em Moedas/XP (Aventura) ou Créditos/Pontos (Essencial). Em tarefas Difíceis com Etapas Recompensadas, a multa incide apenas sobre a base e as etapas ainda pendentes — etapas já marcadas no prazo ficam protegidas.",
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
    question:
      "Por que os valores de moedas são rigorosos? Como funciona a proporção 3:1 a 4:1 (Dever vs. Recompensa)?",
    answer:
      "A economia fechada do HabitParty segue a proporção real de 3:1 a 4:1 entre dever produtivo e recompensa de lazer. Um dia produtivo padrão rende cerca de 15 a 20 moedas (com referência oficial de 15 🪙/dia):",
    bullets: [
      "Proporção 3:1 a 4:1 (Esforço vs. Lazer): Cerca de 3 a 4 horas de produtividade real (combinando tarefas médias/difíceis, hábitos e blocos de foco) geram ~15 🪙 — exatamente o preço sugerido para 1 hora de lazer livre na Loja (15 🪙). Já ~1h30 a 2h de esforço rendem ~8 🪙, suficientes para 30 minutos de pausa sem culpa.",
      "Prevenção de Inflação Artificial: Se tarefas triviais ou fáceis pagassem dezenas de moedas, 1 hora de descanso ficaria artificialmente barata e o app perderia o efeito psicológico de recompensa merecida.",
      "Mesma Proporção no Modo Essencial: No Modo Essencial, o mesmo cálculo aparece como Créditos e Pontos (1 🪙 = 1 Crédito), preservando intacta a relação 3:1 a 4:1. A honestidade ao pontuar cada entrega é o motor central da sua evolução.",
    ],
    tags: [
      "economia",
      "matemática",
      "3:1",
      "4:1",
      "dever",
      "recompensa",
      "ouro",
      "créditos",
      "inflação",
      "regras",
    ],
    highlightBadge: "Proporção 3:1–4:1",
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
      "Você cria seus próprios produtos, pausas e pacotes de lazer da vida real. O HabitParty disponibiliza três modelos de recompensa:",
    bullets: [
      "Uso Único: Itens diretos para consumir uma vez (ex: pedir uma pizza, comprar um livro, tomar um café especial).",
      "Baseado em Tempo: Pacotes com tempo pré-definido (ex: 30 minutos de videogame, 1 hora de pausa livre).",
      "Caixa Misteriosa (Aventura) / Sorteio de Pausa (Essencial): Recompensas com roleta aleatória ponderada para sortear um item ou pausa dentre suas opções cadastradas.",
    ],
    tags: ["loja", "recompensas", "produtos", "tempo", "compras", "sorteio"],
    actionLink: { label: "Explorar a Loja", href: "/rewards" },
  },
  {
    id: "mystery-box-system",
    category: "REWARDS",
    question:
      "Como funcionam as Caixas Misteriosas (Modo Aventura) e os Sorteios de Pausa (Modo Essencial)?",
    answer:
      "Ao cadastrar ou comprar um pacote de sorteio na Loja (Caixa Misteriosa no Modo Aventura ou Sorteio de Pausa no Modo Essencial), você escolhe entre 4 faixas de custo e probabilidade equilibradas: Básica/Essencial (5), Premium/Moderado (15), Épica/Avançado (35) e Lendária/Executivo (80). A roleta segue a tabela de probabilidades daquele nível e o item sorteado vai direto para a sua Mochila (ou Inventário)!",
    tags: [
      "caixa misteriosa",
      "sorteio de pausa",
      "sorteio",
      "rng",
      "loot table",
      "prêmios",
    ],
    actionLink: { label: "Ver na Loja", href: "/rewards" },
  },
  {
    id: "inventory-usage",
    category: "INVENTORY",
    question: "Para onde vão os itens após serem comprados na Loja?",
    answer:
      "Todos os produtos comprados vão imediatamente para a sua Mochila (Modo Aventura) ou Inventário (Modo Essencial). Lá você pode visualizar o estoque disponível, consumir quando for usufruir da recompensa no mundo real, ou iniciar uma sessão de foco atrelada àquele item.",
    tags: ["mochila", "inventário", "consumo", "itens"],
    actionLink: { label: "Abrir Mochila / Inventário", href: "/inventory" },
  },
  {
    id: "focus-sessions",
    category: "FOCUS",
    question: "Como funcionam as ferramentas de Foco (Pomodoro & Cronômetro)?",
    answer:
      "O HabitParty traz um cronômetro e pomodoro nativos integrados. Você pode iniciar sessões de foco dedicadas a atividades de estudo ou trabalho, registrando os minutos concluídos diretamente no seu histórico e recebendo recompensas calibradas em XP/Pontos (pts) e Moedas/Créditos.",
    bullets: [
      "Pomodoro: Ciclos pré-definidos de foco (15 a 50 min) intercalados por pausas. Ao concluir o ciclo, você ganha a bonificação completa do bloco.",
      "Cronômetro Livre (Stopwatch): Para quem trabalha em fluxo contínuo. Bonifica proporcionalmente ao tempo focado até o teto ultradiano de 90 minutos por sessão.",
      "Mochila / Inventário no Foco: Você pode ativar cupons de tempo comprados na Loja (ex: descanso ou lazer). O timer deduz seu saldo de pausa, mas não gera novos rendimentos.",
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
      "Para manter a produtividade justa, sustentável e protegida contra esquecimento do timer ligado ou mineração ociosa (em ambos os modos):",
    bullets: [
      "Tempo Mínimo: Sessões com menos de 10 minutos são descartadas e geram 0 pontos e 0 moedas/créditos.",
      "Teto Anti-AFK / Ciclo Ultradiano (90m): Se o timer ficar rodando por horas, a remuneração é limitada ao máximo de 90 minutos contínuos (um ciclo ultradiano saudável).",
      "Teto Diário & Sustentabilidade Anti-Burnout (Soft Cap de 8h): As primeiras 4 horas diárias de foco pagam 100%. Entre 4h e 6h pagam 50%, e entre 6h e 8h pagam 25% (fadiga natural). Acima de 8h de foco diário, novas sessões não geram moedas/créditos nem XP/pts para evitar burnout e hiperinflação (o tempo continua registrado nas métricas).",
      "Lazer Não Gera Renda: Sessões de itens da Mochila / Inventário têm rendimento fixo de 0.",
    ],
    tags: [
      "foco",
      "economia",
      "anti-afk",
      "teto diário",
      "ciclo ultradiano",
      "recompensas",
    ],
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
      "Capacidade Expandida: Até 4 Ambientes/Workspaces (o dobro do free), até 6 colunas por quadro, até 6 atividades personalizadas no Modo Foco, mochila expandida para 100 itens e até 50 cards de recompensas na loja (contra 12 no plano gratuito, com até 4 pacotes por card).",
      "7 Temas Visuais Atmosféricos: A conta gratuita já inclui 4 temas completos (Dark Cósmico, Cosmic Daylight, Cavaleiro das Trevas e Pergaminho Solar). O plano Premium desbloqueia mais 3 temas exclusivos VIP: Cyberpunk Neon, Guardião da Floresta e Ouro Real.",
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
      "Conquistas Comportamentais & Etapas Recompensadas: Além de volume, algumas medalhas premiam como você trabalha — entregar 20 Afazeres antes do prazo (Pontualidade Real), concluir 7 ciclos de Hábitos Negativos/Mistos sem recaídas (Domínio do Impulso), bater 10 metas de tempo de Atividades no Focus (Mira Certeira), concluir 50 tarefas com 100% do checklist marcado (Checklist Impecável), esgotar cupons de tempo da Mochila, manter 500 moedas na carteira, preencher os 4 espaços da Vitrine ou criar 2 Workspaces. Em tarefas Difíceis, cada Etapa Recompensada marcada também conta proporcionalmente (+1 unidade de entrega) nos marcos de tarefas, difíceis, Hardcore e na Retrospectiva.",
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
  {
    id: "friends-privacy-network",
    category: "OVERVIEW",
    question:
      "Como funcionam a Rede de Amigos (/friends), o Código HP-XXXXXX e a Privacidade?",
    answer:
      "Na tela Amigos (/friends), você pode se conectar com amigos mantendo total controle sobre o que compartilha e sem expor suas listas privadas de tarefas ou financeiro:",
    bullets: [
      "Busca & Código Único: Encontre pessoas por @username, nome ou pelo Código de Amigo exclusivo (HP-XXXXXX). Você também define nas Configurações quem pode enviar solicitações (Todos, Apenas por Código de Amigo ou Ninguém).",
      "Alertas Sociais em Tempo Real: Pedidos de amizade recebidos, aceites e marcos de amigos aparecem no sino de notificações da Sidebar.",
      "Vitrine Pública & Privacidade Granular: Ao visitar o perfil de um amigo, você vê apenas os destaques públicos permitidos por ele. Em Configurações > Privacidade, é possível ocultar separadamente XP/nível, ofensivas, horas de foco ou até remover seu perfil das buscas.",
    ],
    tags: [
      "amigos",
      "social",
      "privacidade",
      "código",
      "hp-",
      "username",
      "vitrine",
      "notificações",
    ],
    highlightBadge: "Novo • 1.4",
    actionLink: { label: "Abrir Rede de Amigos", href: "/friends" },
  },
  {
    id: "retrospective-and-customization",
    category: "OVERVIEW",
    question:
      "Como funcionam a Retrospectiva Anual, os Cards PNG, os 7 Temas e o Fuso Horário?",
    answer:
      "Além do controle de rotina diário, a v1.4 trouxe recursos sazonais e de personalização profunda para refletir sua jornada no seu próprio ritmo e horário:",
    bullets: [
      "Retrospectiva Anual & Cards PNG: Entre 20 de dezembro e 31 de janeiro, um banner sazonal no seu Perfil (/profile) gera seu resumo do ano com 1 de 5 arquétipos comportamentais (baseados em consistência, foco e execução). Você pode baixar Cards PNG colecionáveis da Retrospectiva e do seu Perfil a qualquer momento.",
      "Fuso Horário & Virada de Dia Local: O app sincroniza seu fuso horário automaticamente para que a virada da meia-noite (renovação de Diárias, ofensivas e alertas) respeite sempre o relógio da sua região.",
      "7 Temas & Foco Rápido nas Tarefas: Alterne entre 4 temas gratuitos (2 escuros e 2 claros) e 3 temas VIP em Configurações > Aparência, e inicie um Pomodoro/Cronômetro diretamente pelo ícone de play nas linhas de Hábitos, Diárias e Afazeres.",
    ],
    tags: [
      "retrospectiva",
      "png",
      "card",
      "arquétipos",
      "temas",
      "fuso horário",
      "meia-noite",
      "foco rápido",
    ],
    highlightBadge: "Novo • 1.4",
    actionLink: { label: "Personalizar Aparência", href: "/settings" },
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
