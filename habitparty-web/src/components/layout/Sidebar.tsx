"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/utils";
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  Store,
  Backpack,
  Bell,
  LifeBuoy,
  History,
  Settings,
  ChevronsUpDown,
} from "lucide-react";

const NAV_ITEMS = {
  main: [{ label: "Painel", href: "/dashboard", icon: LayoutDashboard }],
  atividade: [
    { label: "Listas", href: "/tasks", icon: ListTodo },
    { label: "Foco", href: "/focus", icon: Timer },
  ],
  recompensa: [
    { label: "Loja", href: "/rewards", icon: Store },
    { label: "Mochila", href: "/inventory", icon: Backpack },
  ],
  footer: [
    { label: "Ajuda", href: "/help", icon: LifeBuoy },
    { label: "Histórico", href: "/history", icon: History },
    { label: "Configuração", href: "/settings", icon: Settings },
  ],
};

export function Sidebar() {
  const pathname = usePathname();

  const NavLink = ({
    item,
  }: {
    item: { label: string; href: string; icon: any };
  }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <li>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-body-s font-medium focus:outline-none focus:ring-2 focus:ring-gold/50",
            isActive
              ? "bg-primary-dark/50 text-neutral-50 border-r-2 border-gold font-bold"
              : "text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-50 border-r-2 border-transparent",
          )}
        >
          <Icon
            size={18}
            className={isActive ? "text-gold" : "text-neutral-300"}
            aria-hidden="true"
          />
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <aside className="w-60 shrink-0 h-screen border-r border-primary/30 bg-background/80 backdrop-blur-xl flex flex-col relative z-20" aria-label="Sidebar">
      {/* Fundo de Confetes */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/assets/Confetti.svg')",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      {/* HEADER */}
      <header className="p-5 flex flex-col gap-5 z-10">
        <div className="flex justify-center w-full">
          <Image
            src="/assets/logo.png"
            alt="Logo HabitParty"
            width={150}
            height={42}
            priority
            className="object-contain"
          />
        </div>

        <button
          type="button"
          aria-haspopup="listbox"
          className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary/40 bg-gradient-to-r from-primary/30 to-background/60 hover:border-primary-light/60 transition-colors focus:outline-none focus:ring-2 focus:ring-gold/50"
        >
          <div className="flex flex-col items-start">
            <span className="text-[9px] uppercase tracking-wider text-gold-pressed font-bold">
              Ambiente:
            </span>
            <span className="text-body-s text-neutral-50 font-bold">Vida!</span>
          </div>
          <ChevronsUpDown size={15} className="text-neutral-300" aria-hidden="true" />
        </button>
      </header>

      {/* ÁREA DE SCROLL */}
      <nav className="flex-1 overflow-y-auto px-3 flex flex-col gap-5 custom-scrollbar z-10" aria-label="Navegação Principal">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.main.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </ul>

        <div className="flex flex-col gap-1">
          <h2 className="px-3 text-[9px] uppercase tracking-wider text-gold-pressed font-bold mb-1">
            Atividade
          </h2>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.atividade.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="px-3 text-[9px] uppercase tracking-wider text-gold-pressed font-bold mb-1">
            Recompensa
          </h2>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.recompensa.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </ul>
        </div>

        <div className="flex-1 min-h-6"></div>

        <div className="flex flex-col gap-1 pb-3">
          <div className="px-3 py-1 flex justify-between items-center">
            <button type="button" aria-label="Notificações" className="focus:outline-none focus:ring-2 focus:ring-gold/50 rounded-md">
              <Bell size={18} className="text-neutral-300 hover:text-neutral-50 cursor-pointer transition-colors" />
            </button>
          </div>
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.footer.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </ul>
        </div>
      </nav>

      {/* FOOTER */}
      <footer className="p-3.5 border-t border-primary/30 bg-primary-dark/20 z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-neutral-300 border-2 border-neutral-50 shrink-0" aria-hidden="true"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-body-s font-bold text-neutral-50 truncate">
              Carlos Vinicius
            </span>
            <span className="text-[10px] text-neutral-300 truncate">
              Nível 5 - Novato
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex-1 min-w-0">
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden" role="progressbar" aria-valuenow={12} aria-valuemin={0} aria-valuemax={1200}>
              <div className="h-full bg-gold w-[10%] rounded-full"></div>
            </div>
            <p className="text-[10px] text-neutral-300 text-center mt-0.5">
              (12/1200)
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0" aria-label="26 moedas">
            <div className="w-3.5 h-3.5 rounded-full bg-gold border border-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-[7px] text-neutral-900 font-bold">H</span>
            </div>
            <span className="text-body-s font-bold text-neutral-50">26</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
