import { BookOpen, Code2, Gamepad2, GraduationCap } from "lucide-react";
import type {
  ActivityItem,
  DayItem,
  EconomyBarData,
  PartyMember,
} from "@/types/dashboard";

/** Lista de atividades padrão para o widget de Atividades do Dashboard. */
export const DEFAULT_ACTIVITIES: readonly ActivityItem[] = [
  {
    id: "1",
    title: "Leitura (Books, Kindle)",
    timeSpent: "1h32min",
    icon: BookOpen,
    href: "/focus?activity=reading",
  },
  {
    id: "2",
    title: "Studying (Anki, Class)",
    timeSpent: "45min",
    icon: GraduationCap,
    href: "/focus?activity=studying",
  },
  {
    id: "3",
    title: "Developing / Coding",
    timeSpent: "2h15min",
    icon: Code2,
    href: "/focus?activity=coding",
  },
  {
    id: "4",
    title: "Entertainment",
    timeSpent: "30min",
    icon: Gamepad2,
    href: "/focus?activity=entertainment",
  },
] as const;

/** Lista de membros padrão para o widget da Party no Dashboard. */
export const DEFAULT_MEMBERS: readonly PartyMember[] = [
  { id: "1", name: "Carlos V.", level: 5, role: "Líder", status: "online" },
  {
    id: "2",
    name: "Mariana S.",
    level: 7,
    role: "Guerreira",
    status: "online",
  },
  { id: "3", name: "Lucas P.", level: 4, role: "Mago", status: "idle" },
] as const;

/** Histórico semanal padrão exibido no calendário do Dashboard. */
export const DEFAULT_DAYS: readonly DayItem[] = [
  { shortName: "Seg", dayNumber: 17, hasActivity: false },
  { shortName: "Ter", dayNumber: 18, hasActivity: true },
  { shortName: "Qua", dayNumber: 19, hasActivity: true },
  { shortName: "Qui", dayNumber: 20, hasActivity: false },
  { shortName: "Sex", dayNumber: 21, hasActivity: true },
  { shortName: "Sab", dayNumber: 22, hasActivity: false },
  { shortName: "Dom", dayNumber: 23, hasActivity: false },
] as const;

/** Barras padrão para o gráfico de Economia do Dashboard. */
export const DEFAULT_ECONOMY_BARS: readonly EconomyBarData[] = [
  {
    label: "-3 sem",
    periodLabel: "3 semanas atrás",
    gold: 0,
    heightPercent: 10,
    isHighlight: false,
  },
  {
    label: "-2 sem",
    periodLabel: "2 semanas atrás",
    gold: 0,
    heightPercent: 10,
    isHighlight: false,
  },
  {
    label: "Passada",
    periodLabel: "Semana passada",
    gold: 0,
    heightPercent: 10,
    isHighlight: false,
  },
  {
    label: "Atual",
    periodLabel: "Esta semana",
    gold: 0,
    heightPercent: 10,
    isHighlight: true,
  },
] as const;
