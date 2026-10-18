import { CheckSquare, Gift, History, Package, Timer } from "lucide-react";
import type { WelcomeCardConfig } from "@/types/settings";

export type { WelcomeCardConfig };

export const CONFIGURABLE_WELCOME_CARDS: readonly WelcomeCardConfig[] = [
  {
    key: "tasks",
    title: "Gerencie suas Tarefas!",
    pageName: "Quadro de Tarefas",
    route: "/tasks",
    description:
      "Orientações sobre organização de tarefas, colunas e criação de hábitos no quadro.",
    icon: CheckSquare,
  },
  {
    key: "inventory",
    title: "Sua Mochila!",
    pageName: "Mochila / Inventário",
    route: "/inventory",
    description:
      "Instruções sobre itens adquiridos na loja e consumo no inventário.",
    icon: Package,
  },
  {
    key: "rewards",
    title: "Colete sua recompensa!",
    pageName: "Vitrine de Recompensas",
    route: "/rewards",
    description:
      "Dicas sobre troca de moedas por cupons e recompensas personalizadas.",
    icon: Gift,
  },
  {
    key: "focus",
    title: "Seu ambiente de Foco!",
    pageName: "Sessão de Foco",
    route: "/focus",
    description:
      "Instruções do timer Pomodoro, cronômetro contínuo e sessões guiadas.",
    icon: Timer,
  },
  {
    key: "history",
    title: "Extrato de Transações",
    pageName: "Histórico de Transações",
    route: "/history",
    description:
      "Resumo sobre moedas, XP e auditoria de transações realizadas.",
    icon: History,
  },
] as const;

export interface WelcomeCardDetail {
  title: string;
  subtitle: string;
  bullets: string[];
  imageSrc: string;
  compactWidth?: number;
  compactHeight?: number;
  normalWidth?: number;
  normalHeight?: number;
}

export const WELCOME_CARD_DETAILS: Record<string, WelcomeCardDetail> = {
  inventory: {
    title: "Sua Mochila!",
    subtitle: "Gerencie seus itens e recompensas adquiridas.",
    bullets: [
      "Guarde e organize todos os itens e cupons resgatados na Vitrine.",
      "Use itens consumíveis diretamente ou envie poções para o Palco de Foco.",
      "Itens de uso único desaparecem da mochila após o consumo total.",
    ],
    imageSrc: "/assets/undraw/inventory/undraw_camping_1hz9.svg",
    compactWidth: 130,
    compactHeight: 70,
    normalWidth: 162,
    normalHeight: 87,
  },
  rewards: {
    title: "Colete sua recompensa!",
    subtitle: "Gerencie sua Vitrine e troque suas moedas.",
    bullets: [
      "Troque suas moedas de ouro por recompensas reais e personalizadas.",
      "Cadastre novos prêmios na Vitrine: Cupons, Uso Único ou Caixas Misteriosas.",
      "Todo produto resgatado é transferido diretamente para a sua Mochila.",
    ],
    imageSrc: "/assets/undraw/reward/undraw_gift-card_sfy8 1.svg",
    compactWidth: 130,
    compactHeight: 70,
    normalWidth: 162,
    normalHeight: 87,
  },
  focus: {
    title: "Seu ambiente de Foco!",
    subtitle:
      "Aumente sua produtividade diária através de sessões guiadas e recompensas gamificadas.",
    bullets: [
      "Crie atividades importantes no seu dia a dia.",
      "Faça registros utilizando Pomodoro ou Cronômetro.",
      "Visualize metadados estratégicos para otimizar sua rotina.",
    ],
    imageSrc: "/assets/undraw/transaction/undraw_time-change_lyxp 1.svg",
    compactWidth: 130,
    compactHeight: 70,
    normalWidth: 162,
    normalHeight: 87,
  },
  tasks: {
    title: "Gerencie suas Tarefas!",
    subtitle: "Organize seu Layout e mantenha o ritmo.",
    bullets: [
      "Organize seu Layout e arraste colunas para a melhor ordem.",
      "Crie colunas apropriadas para cada contexto de tarefa.",
      "Classifique entre Diário, Hábito e Afazer (ToDo).",
    ],
    imageSrc: "/assets/undraw/task/undraw_next-task_jtbr 1.svg",
    compactWidth: 115,
    compactHeight: 75,
    normalWidth: 136,
    normalHeight: 93,
  },
  history: {
    title: "Extrato de Transações",
    subtitle: "Consulte o histórico detalhado de moedas, XP e resgates.",
    bullets: [
      "Conclusões de tarefas, diárias e hábitos registram ganhos de moedas e XP.",
      "Penalidades de hábitos negativos e falhas computam deduções no saldo.",
      "Resgates na loja e consumo de itens da mochila ficam arquivados neste extrato.",
    ],
    imageSrc: "/assets/undraw/reward/undraw_treasure_a4j2.svg",
    compactWidth: 130,
    compactHeight: 70,
    normalWidth: 162,
    normalHeight: 87,
  },
};
