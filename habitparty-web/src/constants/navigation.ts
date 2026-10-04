import {
  Backpack,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  type LucideIcon,
  Settings,
  Store,
  Timer,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  /** Título da categoria (omitido para seções sem cabeçalho). */
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  { items: [{ label: "Painel", href: "/dashboard", icon: LayoutDashboard }] },
  {
    title: "Atividade",
    items: [
      { label: "Listas", href: "/tasks", icon: ListTodo },
      { label: "Foco", href: "/focus", icon: Timer },
    ],
  },
  {
    title: "Recompensa",
    items: [
      { label: "Loja", href: "/rewards", icon: Store },
      { label: "Mochila", href: "/inventory", icon: Backpack },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { label: "Ajuda", href: "/help", icon: LifeBuoy },
  { label: "Histórico", href: "/history", icon: History },
  { label: "Configuração", href: "/settings", icon: Settings },
];
