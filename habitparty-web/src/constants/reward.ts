import type { PackageLevel, RewardType, RewardCategory } from "@/types/reward";

export interface SelectOption {
  label: string;
  value: string;
}

export const REWARD_TYPE_META: Record<
  RewardType,
  { label: string; color: string }
> = {
  SingleUse: {
    label: "Uso Único",
    color: "text-neutral-200 bg-white/10 border-white/20",
  },
  TimeBased: {
    label: "Cupom",
    color: "text-success-500 bg-success-500/15 border-success-500/30",
  },
  MysteryBox: {
    label: "Caixa Misteriosa",
    color: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  },
};

export const PACKAGE_LEVEL_COLOR: Record<PackageLevel, string> = {
  Básico: "text-success-500 bg-success-500/15 border-success-500/30",
  Premium: "text-info bg-info/15 border-info/30",
  Épico: "text-magenta bg-magenta/15 border-magenta/30",
  Lendário: "text-gold bg-gold/15 border-gold/30",
};

export const REWARD_TYPE_OPTIONS: SelectOption[] = [
  { label: "Todos os Tipos", value: "" },
  ...Object.entries(REWARD_TYPE_META).map(([value, { label }]) => ({
    label,
    value,
  })),
];

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  Entretenimento: "Entretenimento",
  "Bem-estar": "Bem-estar",
  Compras: "Compras",
  Desenvolvimento: "Desenvolvimento",
  Sorte: "Sorte",
  Hobbies: "Hobbies",
};

export const REWARD_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Todas as Categorias", value: "" },
  ...Object.keys(CATEGORY_LABELS).map((cat) => ({
    label: cat,
    value: cat,
  })),
];

export const REWARD_TAG_OPTIONS: SelectOption[] = [
  { label: "Todas as Tags", value: "" },
  { label: "Tempo", value: "Tempo" },
  { label: "Digital", value: "Digital" },
  { label: "Físico", value: "Físico" },
];

export const REWARD_PACKAGE_OPTIONS: SelectOption[] = [
  { label: "Todos os Pacotes", value: "" },
  ...(Object.keys(PACKAGE_LEVEL_COLOR) as PackageLevel[]).map((level) => ({
    label: level,
    value: level,
  })),
];
