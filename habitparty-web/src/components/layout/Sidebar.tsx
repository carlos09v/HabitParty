"use client";

import { LogOut, Shield, X } from "lucide-react";
import Image from "next/image";
import { signOut } from "@/actions/auth";
import type { components } from "@/api/schema";
import { NAV_FOOTER, NAV_SECTIONS } from "@/constants/navigation";
import { cn } from "@/utils";
import { SidebarFocusWidget } from "./SidebarFocusWidget";
import { SidebarLink } from "./SidebarLink";
import { SidebarNotificationsPopover } from "./SidebarNotificationsPopover";
import { SidebarUserProfile } from "./SidebarUserProfile";
import { ThemeToggleBtn } from "./ThemeToggleBtn";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type User = components["schemas"]["UserResponseDTO"];

export interface SidebarBadgeCounts {
  tasks?: number;
  inventory?: number;
}

interface SidebarProps {
  user?: User | null;
  badgeCounts?: SidebarBadgeCounts;
  onClose?: () => void;
  isMobile?: boolean;
  className?: string;
}

export function Sidebar({
  user,
  badgeCounts,
  onClose,
  isMobile = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        isMobile
          ? "w-full h-full flex flex-col relative z-20"
          : "hidden lg:flex w-64 shrink-0 h-screen border-r border-primary/30 bg-background/80 backdrop-blur-xl flex-col relative z-20",
        className,
      )}
      aria-label={isMobile ? "Sidebar Mobile" : "Sidebar"}
    >
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
      <header className="px-4 pt-5 pb-4 flex flex-col gap-4 relative z-30 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div
            className={cn(
              "flex w-full items-center",
              isMobile ? "justify-between" : "justify-center",
            )}
          >
            <Image
              src="/assets/logo.png"
              alt="Logo HabitParty"
              width={142}
              height={40}
              priority
              className="object-contain"
            />
            {isMobile && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 cursor-pointer"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        <WorkspaceSwitcher />
      </header>

      {/* ÁREA DE NAVEGAÇÃO PRINCIPAL */}
      <nav
        className="flex-1 overflow-y-auto px-3 pt-2 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-10"
        aria-label="Navegação Principal"
      >
        {NAV_SECTIONS.map((section, idx) => (
          <div
            key={section.title || `nav-sec-${idx}`}
            className="flex flex-col gap-0.5"
          >
            {section.title && (
              <h2 className="px-3 text-label-m uppercase tracking-wider text-gold-pressed font-bold mb-0.5">
                {section.title}
              </h2>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge =
                  item.href === "/inventory"
                    ? badgeCounts?.inventory
                    : item.href === "/tasks"
                      ? badgeCounts?.tasks
                      : undefined;

                return (
                  <SidebarLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    badge={badge}
                    onClick={onClose}
                  >
                    <Icon size={18} />
                  </SidebarLink>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="flex-1 min-h-1" />

        {/* ÁREA INFERIOR: UTILIDADES, SISTEMA E SUPORTE */}
        <div className="flex flex-col gap-1.5 pb-1 shrink-0 pt-2 border-t border-white/10">
          {/* Widget de Foco Ativo */}
          <SidebarFocusWidget />

          {/* Preferências / Ações Rápidas */}
          <ul className="flex flex-col gap-0.5">
            <li className="hidden">
              <ThemeToggleBtn />
            </li>

            <li>
              <SidebarNotificationsPopover />
            </li>
          </ul>

          <div className="h-px w-full bg-white/5 my-0.5" />

          {/* Links de Suporte, Histórico e Conta */}
          <ul className="flex flex-col gap-0.5">
            {user?.role === "ADMIN" && (
              <SidebarLink href="/admin" label="Painel Admin" onClick={onClose}>
                <Shield size={18} className="text-purple-400" />
              </SidebarLink>
            )}

            {NAV_FOOTER.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClick={onClose}
                >
                  <Icon size={18} />
                </SidebarLink>
              );
            })}

            <li className="mt-0.5">
              <form action={signOut}>
                <button
                  type="submit"
                  onClick={onClose}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border-r-2 border-transparent text-left cursor-pointer group"
                >
                  <LogOut
                    size={18}
                    className="group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  />
                  Sair
                </button>
              </form>
            </li>
          </ul>
        </div>
      </nav>

      {/* FOOTER DO USUÁRIO */}
      <SidebarUserProfile initialUser={user} onClose={onClose} />
    </aside>
  );
}
