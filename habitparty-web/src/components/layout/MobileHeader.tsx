"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { components } from "@/api/schema";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Sidebar, type SidebarBadgeCounts } from "./Sidebar";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

type User = components["schemas"]["UserResponseDTO"];

interface MobileHeaderProps {
  user?: User | null;
  badgeCounts?: SidebarBadgeCounts;
}

export function MobileHeader({ user, badgeCounts }: MobileHeaderProps) {
  const t = useTranslations("nav");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer automaticamente ao navegar para outra página
  useEffect(() => {
    if (pathname) {
      setIsDrawerOpen(false);
    }
  }, [pathname]);

  // Previne rolagem do fundo e fecha com a tecla Escape quando o drawer estiver aberto
  useEffect(() => {
    if (!isDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Header Mobile no topo (< lg) */}
      <header className="lg:hidden h-14 w-full bg-card dark:bg-background border-b border-neutral-700 dark:border-primary/25 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={t("openMenu")}
            className="p-1.5 -ml-1 text-neutral-200 dark:text-neutral-300 hover:text-neutral-50 dark:hover:text-white rounded-lg hover:bg-surface dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 cursor-pointer"
          >
            <Menu size={22} />
          </button>

          <Link href="/dashboard" className="flex items-center shrink-0">
            <BrandLogo
              alt="Logo HabitParty"
              width={118}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>
        </div>

        {/* Seletor de Workspace no Header */}
        <div className="flex items-center max-w-[150px] sm:max-w-[200px]">
          <WorkspaceSwitcher className="w-full text-xs" />
        </div>
      </header>

      {/* Drawer Deslizante da Esquerda Cobrindo a Tela */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop escuro */}
          <div
            className="fixed inset-0 bg-black/60 animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Painel do Drawer */}
          <div
            className="fixed inset-y-0 left-0 w-[280px] sm:w-[320px] max-w-[85vw] bg-card dark:bg-surface border-r border-neutral-700 dark:border-primary/30 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label={t("mobileDrawerAria")}
          >
            <Sidebar
              user={user}
              badgeCounts={badgeCounts}
              isMobile={true}
              onClose={() => setIsDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
