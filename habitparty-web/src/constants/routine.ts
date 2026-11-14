import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Apple,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  CheckSquare,
  Coffee,
  Crown,
  Droplet,
  Dumbbell,
  Flame,
  Gem,
  Heart,
  Home,
  Hourglass,
  Key,
  Laptop,
  type LucideIcon,
  Medal,
  Moon,
  Mountain,
  Pill,
  Rocket,
  Shield,
  Skull,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Trophy,
  Wallet,
  Wand2,
  Zap,
} from "lucide-react";

import type { BoardAlignment, ColumnWidthPreset } from "@/types/task-ui";
import type { IconOption } from "@/types/ui";

/** Máximo de colunas exibidas simultaneamente no quadro. */
export const MAX_VISIBLE_COLUMNS = 4;

/** Máximo de colunas (listas) permitidas no plano Premium. */
export const MAX_COLUMNS_PREMIUM = 6;

export type ColumnIconOption = IconOption;

/** Classes de largura das colunas do quadro Kanban por preset. */
export const COLUMN_WIDTH_CLASSES: Readonly<Record<ColumnWidthPreset, string>> =
  {
    compact: "w-[250px] min-w-[240px] max-w-[270px]",
    normal: "w-[300px] min-w-[270px] max-w-[320px]",
    wide: "w-[420px] min-w-[380px] max-w-[460px]",
  };

/** Opções de alinhamento horizontal do quadro Kanban. */
export const ALIGNMENT_OPTIONS: ReadonlyArray<{
  id: BoardAlignment;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "left", label: "Alinhar à esquerda", icon: AlignLeft },
  { id: "center", label: "Centralizar quadro", icon: AlignCenter },
  { id: "right", label: "Alinhar à direita", icon: AlignRight },
] as const;

/** Ícones pré-configurados para seleção de listas/colunas. */
export const COLUMN_ICONS: readonly IconOption[] = [
  // Ícones Gratuitos Essenciais (Os 6 primeiros alimentam QUICK_COLUMN_TEMPLATES)
  { id: "sun", label: "Manhã", icon: Sun },
  { id: "moon", label: "Noite", icon: Moon },
  { id: "target", label: "Metas", icon: Target },
  { id: "heart", label: "Saúde", icon: Heart },
  { id: "dumbbell", label: "Treino", icon: Dumbbell },
  { id: "book", label: "Estudos", icon: BookOpen },

  // Saúde & Atividade Física
  { id: "activity", label: "Esporte", icon: Activity },
  { id: "bike", label: "Ciclismo", icon: Bike },
  { id: "apple", label: "Nutrição", icon: Apple },
  { id: "water", label: "Água", icon: Droplet },
  { id: "meds", label: "Remédios", icon: Pill },

  // Trabalho, Casa & Rotina Prática
  { id: "briefcase", label: "Trabalho", icon: Briefcase },
  { id: "laptop", label: "Notebook", icon: Laptop },
  { id: "home", label: "Casa", icon: Home },
  { id: "wallet", label: "Finanças", icon: Wallet },
  { id: "sparkles", label: "Hábitos", icon: Sparkles },
  { id: "coffee", label: "Pausa", icon: Coffee },
  { id: "check", label: "Geral", icon: CheckSquare },

  // Ícones Exclusivos VIP Premium (RPG, Foco & Glória)
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "star", label: "Estrela Dourada", icon: Star, isPremium: true },
  { id: "flame", label: "Em Chamas", icon: Flame, isPremium: true },
  { id: "zap", label: "Super Raio", icon: Zap, isPremium: true },
  { id: "trophy", label: "Campeão", icon: Trophy, isPremium: true },
  { id: "medal", label: "Medalha de Honra", icon: Medal, isPremium: true },
  { id: "swords", label: "Batalha RPG", icon: Swords, isPremium: true },
  { id: "shield", label: "Defesa Mítica", icon: Shield, isPremium: true },
  { id: "wand", label: "Arcano", icon: Wand2, isPremium: true },
  { id: "gem", label: "Tesouros", icon: Gem, isPremium: true },
  { id: "rocket", label: "Sprint Épico", icon: Rocket, isPremium: true },
  { id: "brain", label: "Super Mente", icon: Brain, isPremium: true },
  {
    id: "mountain",
    label: "Alta Performance",
    icon: Mountain,
    isPremium: true,
  },
  { id: "skull", label: "Boss / Hardcore", icon: Skull, isPremium: true },
  { id: "hourglass", label: "Tempo Épico", icon: Hourglass, isPremium: true },
  { id: "key", label: "Chave Mestra", icon: Key, isPremium: true },
] as const;

/** Limite máximo de caracteres para o nome de uma coluna/lista. */
export const MAX_COLUMN_NAME_LENGTH = 30;

/** Sugestões rápidas de ícones e nomes exibidas ao criar uma coluna/lista. */
export const QUICK_COLUMN_TEMPLATES = COLUMN_ICONS.filter(
  (i) => !i.isPremium,
).slice(0, 6);

/** Retorna o ícone Lucide correspondente ao ID da coluna, com fallback para Sun. */
export function getColumnIcon(iconId?: string | null): LucideIcon {
  if (iconId) {
    const normalized = iconId.trim().toLowerCase();
    if (normalized === "droplet") return Droplet;
    if (normalized === "pill") return Pill;
    const found = COLUMN_ICONS.find(
      (item) => item.id.toLowerCase() === normalized,
    );
    if (found) return found.icon;
  }
  return Sun;
}

export { TASK_TYPE_FILTER_OPTIONS } from "@/constants/task";

/** Opções de filtro por Status no quadro Kanban. */
export const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendentes" },
  { id: "completed", label: "Concluídas" },
] as const;

/** Mapeamento de palavras-chave para sugestão automática de ícone de coluna. */
export const COLUMN_ICON_KEYWORD_MAP: Readonly<Record<string, string>> = {
  // Turnos & Períodos
  manha: "sun",
  matutina: "sun",
  dia: "sun",
  acordar: "sun",
  morning: "sun",
  dawn: "sun",
  day: "sun",
  wake: "sun",
  noite: "moon",
  noturna: "moon",
  dormir: "moon",
  sono: "moon",
  night: "moon",
  evening: "moon",
  sleep: "moon",

  // Foco & Metas
  foco: "flame",
  urgente: "flame",
  prioridade: "flame",
  focus: "flame",
  urgent: "flame",
  priority: "flame",
  meta: "target",
  metas: "target",
  objetivo: "target",
  alvo: "target",
  goal: "target",
  goals: "target",
  target: "target",

  // Treino & Academia
  treino: "dumbbell",
  academia: "dumbbell",
  exercicio: "dumbbell",
  exercicios: "dumbbell",
  fitness: "dumbbell",
  workout: "dumbbell",
  gym: "dumbbell",
  exercise: "dumbbell",
  musculacao: "dumbbell",

  // Saúde, Vida & Bem-estar
  saude: "heart",
  health: "heart",
  vida: "heart",
  coracao: "heart",
  autocuidado: "heart",
  selfcare: "heart",
  medico: "heart",
  exame: "heart",
  exames: "heart",

  // Esportes, Cardio & Corrida
  esporte: "activity",
  esportes: "activity",
  sport: "activity",
  sports: "activity",
  cardio: "activity",
  corrida: "activity",
  correr: "activity",
  running: "activity",
  aerobico: "activity",

  // Ciclismo & Pedal
  bike: "bike",
  bicicleta: "bike",
  ciclismo: "bike",
  pedal: "bike",
  pedalar: "bike",
  cycling: "bike",

  // Nutrição, Dieta & Alimentação
  nutricao: "apple",
  nutrition: "apple",
  dieta: "apple",
  diet: "apple",
  alimentacao: "apple",
  alimentar: "apple",
  refeicao: "apple",
  comida: "apple",
  maca: "apple",
  apple: "apple",

  // Hidratação & Água
  agua: "water",
  water: "water",
  hidratacao: "water",
  hidratação: "water",
  beber: "water",
  copo: "water",

  // Remédios, Vitaminas & Medicamentos
  remedio: "meds",
  remedios: "meds",
  medicamento: "meds",
  medicamentos: "meds",
  med: "meds",
  meds: "meds",
  pilula: "meds",
  pilulas: "meds",
  vitamina: "meds",
  vitaminas: "meds",
  suplemento: "meds",
  suplementos: "meds",

  // Casa, Lar & Doméstico
  casa: "home",
  lar: "home",
  home: "home",
  domestico: "home",
  domestica: "home",
  faxina: "home",
  limpeza: "home",

  // Finanças & Dinheiro
  financas: "wallet",
  financa: "wallet",
  finance: "wallet",
  dinheiro: "wallet",
  money: "wallet",
  conta: "wallet",
  contas: "wallet",
  pagamento: "wallet",
  pagamentos: "wallet",
  boleto: "wallet",
  boletos: "wallet",
  banco: "wallet",
  carteira: "wallet",
  wallet: "wallet",
  investimento: "wallet",

  // Estudos & Leitura
  estudo: "book",
  estudos: "book",
  livro: "book",
  leitura: "book",
  faculdade: "book",
  curso: "book",
  study: "book",
  studies: "book",
  book: "book",
  read: "book",
  reading: "book",
  college: "book",
  course: "book",

  // Trabalho, Dev & Projetos
  trabalho: "briefcase",
  work: "briefcase",
  job: "briefcase",
  projeto: "briefcase",
  project: "briefcase",
  projects: "briefcase",
  codigo: "code",
  code: "code",
  dev: "code",
  programacao: "code",
  software: "code",
  laptop: "laptop",
  computador: "laptop",
  notebook: "laptop",
  escrita: "pencil",
  escrever: "pencil",
  redacao: "pencil",
  anotacoes: "pencil",
  mente: "brain",
  cerebro: "brain",
  brain: "brain",
  design: "palette",
  arte: "palette",
  rocket: "rocket",
  foguete: "rocket",
  lancamento: "rocket",
  sprint: "rocket",

  // Geral, Hábitos & Pausas
  tarefa: "check",
  geral: "check",
  todo: "check",
  afazeres: "check",
  task: "check",
  tasks: "check",
  general: "check",
  habito: "sparkles",
  habitos: "sparkles",
  rotina: "sparkles",
  habit: "sparkles",
  habits: "sparkles",
  routine: "sparkles",
  pausa: "coffee",
  cafe: "coffee",
  descanso: "coffee",
  intervalo: "coffee",
  break: "coffee",
  coffee: "coffee",
  rest: "coffee",
  pause: "coffee",

  // Ícones Especiais & VIPs
  raio: "zap",
  zap: "zap",
  turbo: "zap",
  energia: "zap",
  coroa: "crown",
  crown: "crown",
  realeza: "crown",
  estrela: "star",
  star: "star",
  destaque: "star",
  favorito: "star",
  medalha: "medal",
  medal: "medal",
  honra: "medal",
  premio: "medal",
  trofeu: "trophy",
  trophy: "trophy",
  campeao: "trophy",
  espada: "swords",
  espadas: "swords",
  swords: "swords",
  batalha: "swords",
  escudo: "shield",
  shield: "shield",
  defesa: "shield",
  varinha: "wand",
  wand: "wand",
  magia: "wand",
  arcano: "wand",
  joia: "gem",
  gema: "gem",
  gem: "gem",
  tesouro: "gem",
  caveira: "skull",
  skull: "skull",
  boss: "skull",
  hardcore: "skull",
  desafio: "skull",
  chave: "key",
  key: "key",
  segredo: "key",
  ampulheta: "hourglass",
  hourglass: "hourglass",
  prazo: "hourglass",
  montanha: "mountain",
  mountain: "mountain",
  topo: "mountain",
  escalada: "mountain",
  pico: "mountain",
};

/** Sugere automaticamente o ícone com base nas palavras do nome da coluna. */
export function inferColumnIcon(name: string): string | null {
  if (!name.trim()) return null;
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, iconId] of Object.entries(COLUMN_ICON_KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      return iconId;
    }
  }
  return null;
}

/**
 * Resolve de forma determinística quais IDs de colunas devem estar visíveis no Kanban,
 * aplicando o limite do plano (gratuito vs premium) e garantindo que `targetColumnId`
 * (se fornecido e válido) esteja incluído na seleção.
 */
export function resolveVisibleColumnIds(
  allColumnIds: string[],
  savedIds: string[] | undefined | null,
  maxAllowed: number,
  targetColumnId?: string,
): string[] {
  const validSet = new Set(allColumnIds);
  const validSaved = Array.isArray(savedIds)
    ? savedIds.filter((id) => validSet.has(id))
    : [];

  let result =
    validSaved.length > 0
      ? validSaved.slice(0, maxAllowed)
      : allColumnIds.slice(0, maxAllowed);

  if (targetColumnId && validSet.has(targetColumnId)) {
    if (!result.includes(targetColumnId)) {
      result =
        result.length < maxAllowed
          ? [...result, targetColumnId]
          : [...result.slice(0, maxAllowed - 1), targetColumnId];
    }
  }

  return result;
}
