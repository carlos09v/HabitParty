"use client";

import { LogOut, Package, Shield, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/actions/auth";
import type { components } from "@/api/schema";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  NAV_FOOTER_CONFIGS,
  NAV_SECTION_CONFIGS,
} from "@/constants/navigation";
import { useExperienceMode } from "@/hooks/useExperienceMode";
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
  const t = useTranslations("nav");
  const { isGamified } = useExperienceMode();

  return (
    <aside
      className={cn(
        isMobile
          ? "w-full h-full flex-col relative z-20 flex"
          : "hidden lg:flex w-64 shrink-0 h-screen border-r border-neutral-700 dark:border-primary/30 bg-card/75 dark:bg-background/80 backdrop-blur-xl flex-col relative z-20",
        className,
      )}
      aria-label={isMobile ? t("sidebarMobileAria") : t("sidebarAria")}
    >
      {/* Fundo de Confetes */}
      <div
        className="sidebar-confetti absolute inset-0 pointer-events-none z-0"
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
            <BrandLogo alt="Logo HabitParty" width={142} height={40} priority />
            {isMobile && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 cursor-pointer"
                aria-label={t("closeMenu")}
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
        aria-label={t("mainNavAria")}
      >
        {NAV_SECTION_CONFIGS.map((section, idx) => (
          <div
            key={section.titleKey || `nav-sec-${idx}`}
            className="flex flex-col gap-0.5"
          >
            {section.titleKey && (
              <h2 className="px-3 text-label-m uppercase tracking-wider text-neutral-400 dark:text-gold-pressed font-bold mb-0.5">
                {t(section.titleKey)}
              </h2>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isInventory = item.href === "/inventory";
                const Icon = isInventory && !isGamified ? Package : item.icon;
                const label = isInventory
                  ? isGamified
                    ? t("inventoryGamified")
                    : t("inventoryProductivity")
                  : t(item.labelKey);

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
                    label={label}
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
        <div className="flex flex-col gap-1.5 pb-1 shrink-0 pt-2 border-t border-neutral-700 dark:border-white/10">
          {/* Widget de Foco Ativo */}
          <SidebarFocusWidget />

          {/* Notificações e Troca de Tema na mesma linha */}
          <div className="flex items-center gap-1.5">
            <SidebarNotificationsPopover className="flex-1 min-w-0" />
            <ThemeToggleBtn
              variant="icon"
              className="hidden shrink-0 rounded-lg border-neutral-700/80 dark:border-white/10"
            />
          </div>

          <div className="h-px w-full bg-neutral-700/70 dark:bg-white/5 my-0.5" />

          {/* Links de Suporte, Histórico e Conta */}
          <ul className="flex flex-col gap-0.5">
            {user?.role === "ADMIN" && (
              <SidebarLink
                href="/admin"
                label={t("adminPanel")}
                onClick={onClose}
              >
                <Shield size={18} className="text-purple-400" />
              </SidebarLink>
            )}

            {NAV_FOOTER_CONFIGS.map((item) => {
              const Icon = item.icon;
              const isHistory = item.href === "/history";
              const label = isHistory
                ? isGamified
                  ? t("historyGamified")
                  : t("historyProductivity")
                : t(item.labelKey);

              return (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={label}
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
                  {t("signOut")}
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
