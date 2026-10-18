import {
  CloudRain,
  Coffee,
  Flame,
  type LucideIcon,
  MonitorSmartphone,
  Moon,
  Music,
  ShieldAlert,
  Sun,
  UserCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  AmbientSoundOption,
  AmbientSoundType,
  GenderOption,
  SettingsOptionItem,
  SettingsTabItem,
} from "@/types/settings";

export const GENDER_OPTIONS: readonly GenderOption[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Feminino" },
  { value: "NON_BINARY", label: "Não-binário" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiro não informar" },
] as const;

export const SETTINGS_TABS: readonly SettingsTabItem[] = [
  {
    id: "profile",
    label: "Perfil",
    description: "Identidade cósmica, fotos e molduras",
    icon: UserCircle,
  },
  {
    id: "appearance",
    label: "Aparência",
    description: "Tema claro/escuro, densidade e boas-vindas",
    icon: MonitorSmartphone,
  },
  {
    id: "audio",
    label: "Áudio & Avisos",
    description: "Sons de clique, alarmes e ambiente VIP",
    icon: Volume2,
  },
  {
    id: "security",
    label: "Segurança",
    description: "Senha da conta e zona de perigo",
    icon: ShieldAlert,
  },
] as const;

export const THEME_OPTIONS: readonly SettingsOptionItem<"dark" | "light">[] = [
  {
    value: "dark",
    title: "Tema Escuro",
    badge: "Padrão",
    icon: Moon,
    description:
      "Atmosfera noturna cósmica inspirada em RPG e galáxias. Fundo roxo profundo com orbes etéreos, ideal para ambientes escuros e menor fadiga visual.",
  },
  {
    value: "light",
    title: "Tema Claro",
    icon: Sun,
    description:
      "Visual arejado e luminoso. Fundo em tom suave de lavanda perolada, cards brancos com sombras limpas e paleta de ouro quente para alta legibilidade.",
  },
] as const;

export const COMPACT_OPTIONS: readonly SettingsOptionItem<boolean>[] = [
  {
    value: true,
    title: "Modo Compacto",
    description:
      "Cards, calendários e listas menores. Otimiza o espaço de tela para visualização simultânea de mais tarefas e itens de recompensa. Recomendado para maior produtividade.",
  },
  {
    value: false,
    title: "Modo Confortável",
    badge: "Padrão",
    description:
      "Paddings mais generosos e tipografia padrão. Ideal para telas grandes ou para quem prefere espaçamentos mais relaxados e elementos maiores.",
  },
] as const;

export const AMBIENT_SOUND_OPTIONS: readonly AmbientSoundOption[] = [
  {
    id: "none",
    label: "Desligado",
    description: "Sem ruído ambiente de fundo.",
    icon: VolumeX,
  },
  {
    id: "rain",
    label: "Chuva Suave",
    description: "Som relaxante de chuva leve e contínua.",
    icon: CloudRain,
  },
  {
    id: "cafe",
    label: "Cafeteria",
    description: "Murmúrio acolhedor e aconchegante de café.",
    icon: Coffee,
  },
  {
    id: "lofi",
    label: "Lofi Zen",
    description: "Acorde harmônico etéreo e meditativo para foco profundo.",
    icon: Music,
  },
  {
    id: "fire",
    label: "Fogueira",
    description: "Crepitar acolhedor de lenha e brasas na lareira.",
    icon: Flame,
  },
] as const;

export const AMBIENT_ICONS: Record<AmbientSoundType, LucideIcon> = {
  none: VolumeX,
  rain: CloudRain,
  cafe: Coffee,
  lofi: Music,
  fire: Flame,
};

export {
  PASSWORD_MIN_LENGTH,
  validatePasswordRequirements,
} from "@/utils/validators";
