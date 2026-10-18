import {
  Backpack,
  Gift,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  Settings,
  Timer,
} from "lucide-react";
import type { NavItem, NavSection } from "@/types/navigation";

export type { NavItem, NavSection };

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Painel", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Atividade",
    items: [
      { label: "Tarefas", href: "/tasks", icon: ListTodo },
      { label: "Foco", href: "/focus", icon: Timer },
    ],
  },
  {
    title: "Recompensa",
    items: [
      { label: "Recompensas", href: "/rewards", icon: Gift },
      { label: "Mochila", href: "/inventory", icon: Backpack },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { label: "Histórico", href: "/history", icon: History },
  { label: "Configurações", href: "/settings", icon: Settings },
  { label: "Ajuda", href: "/help", icon: LifeBuoy },
];
