import {
  Award,
  CheckSquare,
  Flame,
  Gift,
  Languages,
  Layers,
  LineChart,
  Shield,
  ShoppingBag,
  Swords,
  Timer,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import type {
  LandingFaqItem,
  LandingFeatureItem,
  LandingHeroHighlight,
  LandingNavAnchor,
  LandingPlan,
  LandingRoadmapItem,
  LandingStepItem,
} from "@/types/landing";

export const LANDING_NAV_LINKS: readonly LandingNavAnchor[] = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Gamificação", href: "#gamificacao" },
  { label: "Recursos", href: "#recursos" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Planos", href: "#planos" },
  { label: "Dúvidas (FAQ)", href: "#faq" },
] as const;

export const LANDING_HERO_HIGHLIGHTS: readonly LandingHeroHighlight[] = [
  {
    label: "Níveis de Foco e XP",
    icon: Zap,
    colorClass: "text-gold",
  },
  {
    label: "Streaks e Dailies",
    icon: Flame,
    colorClass: "text-warning-500",
  },
  {
    label: "Pomodoro & Modo Zen",
    icon: Shield,
    colorClass: "text-info",
  },
  {
    label: "Loja de Recompensas",
    icon: Trophy,
    colorClass: "text-magenta",
  },
] as const;

export const LANDING_PRODUCTIVITY_STEPS: readonly LandingStepItem[] = [
  {
    number: "01",
    icon: CheckSquare,
    title: "Planeje suas Missões",
    tag: "Rotina & Hábitos",
    description:
      "Crie hábitos com gatilhos positivos e negativos (+/-), tarefas diárias com streaks de fogo e projetos organizados em quadros Kanban ágeis.",
    color: "from-primary to-primary-light",
    borderColor: "border-primary-light/30",
  },
  {
    number: "02",
    icon: Timer,
    title: "Ative o Hiperfoco Zen",
    tag: "Pomodoro & Foco",
    description:
      "Entre em estado de fluxo com o Focus Hero Stage. Cronômetro inteligente, intervalos revigorantes e sons ambientes para silenciar o ruído mental.",
    color: "from-blue to-info",
    borderColor: "border-info/30",
  },
  {
    number: "03",
    icon: Gift,
    title: "Colete Loot & Recompensas",
    tag: "Economia Pessoal",
    description:
      "Transforme disciplina em moeda de ouro. Compre recompensas reais da sua própria loja: jogos, pausas, passeios ou itens especiais do seu inventário.",
    color: "from-gold via-warning-500 to-gold",
    borderColor: "border-gold/40",
  },
] as const;

export const LANDING_FEATURES: readonly LandingFeatureItem[] = [
  {
    icon: ShoppingBag,
    title: "Loja de Recompensas Própria",
    description:
      "Cadastre os mimos da sua vida real (ex: 'Sessão de Cinema', '1h de Game', 'Comprar Livro') e só gaste seu ouro merecido.",
    badge: "Economia Real",
    badgeColor: "bg-gold/15 text-gold border-gold/30",
  },
  {
    icon: Users2,
    title: "Sistema de Party e Guilda",
    description:
      "Em breve: convide amigos para a sua guilda no seu ambiente, acompanhem o progresso mútuo e celebrem vitórias em equipe.",
    badge: "Em Breve",
    badgeColor: "bg-magenta/15 text-magenta border-magenta/30",
  },
  {
    icon: Flame,
    title: "Modo Hardcore em Tarefas e Rotinas",
    description:
      "Para compromissos inegociáveis. Falhar em suas diárias ou perder o prazo de afazeres debita moedas de ouro e penaliza seu XP.",
    badge: "Disciplina Real",
    badgeColor: "bg-danger-500/15 text-danger-500 border-danger-500/30",
  },
  {
    icon: Layers,
    title: "Ambientes Independentes",
    description:
      "Isole Projetos de Trabalho, Estudos e Vida Pessoal com 1 clique, cada um com seus próprios quadros e métricas.",
    badge: "Organização",
    badgeColor: "bg-info/15 text-info border-info/30",
  },
  {
    icon: LineChart,
    title: "Gráficos de Histórico & Economia",
    description:
      "Acompanhe relatórios visuais da sua semana: horas de foco acumuladas, fluxo de ouro ganho e evolução da consistência.",
    badge: "Métricas",
    badgeColor:
      "bg-primary-light/15 text-primary-light border-primary-light/30",
  },
  {
    icon: Swords,
    title: "Efeitos Sonoros Gratificantes",
    description:
      "Sinta a dopamina a cada conquista: áudios satisfatórios de vitória, tintilar de moedas e sino relaxante para o foco.",
    badge: "Imersão",
    badgeColor: "bg-gold/15 text-gold border-gold/30",
  },
] as const;

export const LANDING_ROADMAP_ITEMS: readonly LandingRoadmapItem[] = [
  {
    release: "Release 1.1",
    title: "Modo Claro & Internacionalização",
    tagline:
      "Acessibilidade visual de alto contraste e expansão global com suporte nativo a Inglês e Português.",
    status: "in_progress",
    statusLabel: "Em Desenvolvimento",
    statusBadgeColor: "bg-info/15 text-info border-info/30",
    icon: Languages,
    accentColor: "from-info to-blue",
    borderGlowColor: "hover:border-info/40",
    features: [
      "Modo Claro (Light Theme) com alto contraste e legibilidade impecável",
      "Internacionalização (i18n): Suporte completo a Inglês (EN) e Português (PT-BR)",
      "Alternância instantânea de idioma e tema sem recarregar a aplicação",
      "Acessibilidade visual aprimorada para ambientes diurnos e luminosos",
    ],
  },
  {
    release: "Release 1.2",
    title: "Conquistas, Temas VIP & Foco em Tarefas",
    tagline:
      "Deep work direcionado a cards do Kanban, atmosferas visuais exclusivas e os primeiros troféus da sua disciplina.",
    status: "next",
    statusLabel: "Próximo Marco",
    statusBadgeColor: "bg-gold/15 text-gold border-gold/30",
    icon: Trophy,
    accentColor: "from-gold to-warning-500",
    borderGlowColor: "hover:border-gold/40",
    features: [
      "Vinculação direta de sessões de Pomodoro/Foco a tarefas específicas do Kanban",
      "Métricas de esforço por card com histórico de tempo dedicado e conclusão automática",
      "Sistema de Conquistas Pessoais com dezenas de troféus e medalhas automáticas",
      "Nova tela 'Minhas Conquistas' para acompanhar sua evolução de aventureiro",
      "Temas Exclusivos VIP (Dark Knight, Cyberpunk Neon, Forest Ranger, Royal Gold)",
    ],
  },
  {
    release: "Release 1.3",
    title: "Perfil Público & Vitrine de Troféus",
    tagline:
      "Compartilhe sua jornada épica, conecte-se com amigos e exiba suas insígnias raras no topo do perfil.",
    status: "planned",
    statusLabel: "Planejado",
    statusBadgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    icon: Award,
    accentColor: "from-purple-500 to-indigo-500",
    borderGlowColor: "hover:border-purple-500/40",
    features: [
      "Páginas Públicas de Aventureiro para compartilhar nível, consistência e streaks",
      "Vitrine de Destaques para fixar sua Insígnia de Membro Fundador no topo do perfil",
      "Rede de Amizades com busca de jogadores por nome e código de amigo",
      "Controles granulares de privacidade para estatísticas e rotinas",
    ],
  },
  {
    release: "Release 1.4",
    title: "Party & Cooperação em Tempo Real",
    tagline:
      "A união faz a força: pequenos grupos de foco mútuo, metas cooperativas e bate-papo integrado.",
    status: "planned",
    statusLabel: "Planejado",
    statusBadgeColor: "bg-magenta/15 text-magenta border-magenta/30",
    icon: Users2,
    accentColor: "from-magenta to-primary-light",
    borderGlowColor: "hover:border-magenta/40",
    features: [
      "Formação de Parties (grupos de foco) via código de convite rápido",
      "Missões Diárias Cooperativas com bônus coletivo de ouro se todos cumprirem",
      "Chat Integrado em Tempo Real com alertas de foco e celebrações mútuas",
      "Notificações sonoras e visuais elegantes para marcos em equipe",
    ],
  },
  {
    release: "Release 2.0",
    title: "Guildas & O MMO Social Completo",
    tagline:
      "O ápice do HabitParty: mega guildas, guerras cooperativas contra chefões e rankings mundiais.",
    status: "epic",
    statusLabel: "Grande Marco MMO",
    statusBadgeColor: "bg-danger-500/15 text-danger-500 border-danger-500/30",
    icon: Swords,
    accentColor: "from-danger-500 to-warning-500",
    borderGlowColor: "hover:border-danger-500/40",
    features: [
      "Guildas Temáticas de grande porte (Concursos, Devs, Saúde, Academia, Idiomas)",
      "Quests & Raids contra Chefões Mundiais que perdem HP conforme você estuda e foca",
      "Leaderboards Globais de consistência (Global, entre Amigos e entre Guildas rivais)",
      "Temporadas competitivas com recompensas e títulos cosméticos lendários",
    ],
  },
] as const;

export const LANDING_PLANS: readonly LandingPlan[] = [
  {
    name: "Aventureiro",
    badge: "Gratuito",
    badgeColor: "bg-surface border-white/10 text-neutral-300",
    price: "R$ 0",
    period: "para sempre",
    description:
      "Tudo o que você precisa para vencer a procrastinação e transformar sua rotina com gamificação.",
    highlight: false,
    ctaText: "Começar Gratuitamente",
    ctaLink: "/signUp",
    features: [
      "Até 2 Ambientes independentes",
      "Até 4 Listas/Colunas por quadro em cada ambiente",
      "Até 4 Atividades personalizadas no Modo Foco",
      "Até 25 Recompensas cadastradas na sua loja",
      "Mochila com capacidade para até 20 itens guardados",
      "Lembretes por e-mail para afazeres (até 5 ativos e 20 disparos/mês)",
      "Pomodoro & Modo Zen ilimitados",
      "Streaks de Hábitos e Tarefas Diárias",
      "Modo Hardcore para Tarefas, Hábitos e Diárias",
      "Efeitos sonoros e comemorações com confetes",
    ],
  },
  {
    name: "Membro Fundador",
    badge: "Edição Limitada",
    badgeColor: "bg-gold/20 border-gold/60 text-gold",
    price: "R$ 59,90",
    originalPrice: "R$ 99,00",
    period: "ano (cobrança única/anual)",
    description:
      "Apenas para os primeiros 30 assinantes: plano anual com ~40% de desconto e Insígnia Vitalícia de Membro Fundador no perfil.",
    highlight: true,
    isFounder: true,
    slotsLimitBadge: "🔥 Apenas 30 Vagas de Lançamento",
    ctaText: "Garantir Vaga de Fundador 🛡️✨",
    ctaLink: "/signUp",
    features: [
      "🛡️ Insígnia Exclusiva Vitalícia de Membro Fundador no seu perfil para sempre",
      "👑 1 ano completo de Guardião Cósmico por R$ 59,90 (de R$ 99/ano)",
      "⭐ Reconhecimento perpétuo como pioneiro da história do HabitParty",
      "🚀 Acesso prioritário a todos os lançamentos do Roadmap (Temas, Vitrine, Party e Guildas)",
      "Molduras animadas exclusivas para seu perfil e avatar",
      "Sons ambiente no Pomodoro (Chuva, Cafeteria, Fogueira, Lofi)",
      "Pacote exclusivo de ícones VIP para atividades, colunas e loja",
      "Até 4 Ambientes independentes — o dobro do plano gratuito!",
      "Até 6 Listas/Colunas por quadro para fluxos completos",
      "Até 6 Atividades personalizadas no Modo Foco",
      "Até 100 Recompensas cadastradas na sua loja",
      "Mochila expandida com capacidade para até 100 itens",
      "Lembretes por e-mail expandidos (até 30 ativos e 100 disparos/mês)",
    ],
  },
  {
    name: "Guardião Cósmico",
    badge: "Assinatura Regular",
    badgeColor: "bg-primary/20 border-primary-light/40 text-primary-light",
    price: "R$ 9,90",
    period: "mês (ou R$ 99/ano)",
    description:
      "Capacidade expandida para quem gerencia múltiplos projetos, estudos avançados e quer foco sem barreiras.",
    highlight: false,
    ctaText: "Desbloquear Plano Mensal 👑",
    ctaLink: "/signUp",
    features: [
      "Lembretes por e-mail expandidos (até 30 ativos e 100 disparos/mês)",
      "Molduras animadas exclusivas para seu perfil e avatar",
      "Sons ambiente no Pomodoro (Chuva, Cafeteria, Fogueira, Lofi)",
      "Pacote exclusivo de ícones VIP para atividades, colunas e loja",
      "Até 4 Ambientes independentes — o dobro do plano gratuito!",
      "Até 6 Listas/Colunas por quadro para fluxos completos",
      "Até 6 Atividades personalizadas no Modo Foco",
      "Até 100 Recompensas cadastradas na sua loja",
      "Mochila expandida com capacidade para até 100 itens",
      "Emblema VIP de Guardião Cósmico no perfil e anel dourado",
      "Acesso antecipado a novos recursos (como a Guilda/Party)",
    ],
  },
] as const;

export const LANDING_FAQS: readonly LandingFaqItem[] = [
  {
    question: "Como funciona a promoção de lançamento 'Membros Fundadores'?",
    answer:
      "A promoção de Membros Fundadores é uma edição limitada exclusiva para os primeiros 30 assinantes do HabitParty. Ao garantir sua vaga, você desbloqueia o plano Anual com cerca de 40% de desconto (de R$ 99,00 por apenas R$ 59,90) e recebe a insígnia exclusiva e vitalícia de 'Membro Fundador' gravada no seu perfil. Essa insígnia é perpétua: ela permanece no seu perfil para sempre, mesmo se após 1 ano você optar por não renovar a assinatura.",
  },
  {
    question: "O HabitParty é gratuito? O que o plano Premium oferece?",
    answer:
      "O HabitParty possui um plano 100% gratuito com tudo o que você precisa: até 2 ambientes independentes, 4 colunas por ambiente, 4 atividades no Modo Foco, até 25 recompensas, mochila para 20 itens e até 5 lembretes por e-mail ativos simultaneamente (com cota de 20 disparos mensais) para seus afazeres. Para quem gerencia múltiplos projetos e busca foco profundo, o plano Guardião Cósmico traz capacidade expandida de lembretes por e-mail (até 30 ativos e 100 disparos mensais), molduras animadas para o perfil, geradores de sons ambiente (Chuva, Café, Lofi, Fogueira), pacote de ícones VIP, expansão para 4 ambientes, 6 colunas, 6 atividades de foco, até 100 recompensas e mochila para 100 itens.",
  },
  {
    question: "Como funciona a Loja e por que é baseada na minha honestidade?",
    answer:
      "A loja de recompensas é você quem abastece com os mimos da sua vida real (ex: ver um filme, pedir uma pizza, 1 hora de videogame). O HabitParty é um jogo de sinceridade: não há como hackear ou burlar a si mesmo. Se você marcar tarefas que não cumpriu, a recompensa perde todo o sabor. Quando você joga limpo, cada conquista traz satisfação genuína e sem culpa.",
  },
  {
    question: "O que é o Modo Hardcore?",
    answer:
      "O Modo Hardcore pode ser ativado para Afazeres (To-dos), Hábitos e Diárias. Se você falhar no compromisso do dia ou deixar o prazo fatal de um afazer expirar, o jogo desconta moedas da sua conta e reduz seu XP na virada da meia-noite. Além disso, em afazeres com prazo vencido a data fica congelada e a recompensa tardia é reduzida, criando uma consequência real que fortalece sua disciplina.",
  },
  {
    question: "O sistema de Party / Guilda com amigos já está disponível?",
    answer:
      "Atualmente você pode usar o HabitParty com foco total individual. O sistema de Guildas e Party em equipe está em fase final de desenvolvimento e será lançado em breve para você evoluir junto com amigos no mesmo ambiente.",
  },
  {
    question: "O que acontece com minhas colunas e dados se o Premium acabar?",
    answer:
      "Nenhum dado ou tarefa é apagado! No HabitParty garantimos zero perda de dados. Se você criou até 6 colunas ou 4 ambientes durante o Premium e voltar para o plano Free, tudo continua 100% preservado. O quadro exibe até 4 colunas ativas simultaneamente e as colunas extras ficam preservadas e ocultas do quadro, podendo ser alternadas pelo gerenciador quando quiser. Ambientes adicionais entram em modo de consulta sem riscos. Além disso, você recebe avisos prévios na sidebar (7, 3 e 1 dia antes) para renovar com calma.",
  },
  {
    question: "Funciona bem no celular?",
    answer:
      "Sim! O HabitParty foi desenvolvido com design responsivo para funcionar com extrema fluidez em qualquer smartphone, tablet ou computador.",
  },
] as const;
