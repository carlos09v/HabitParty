"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { cn } from "@/utils";

export interface ResolvedLandingNavLink {
  id: string;
  href: string;
  label: string;
}

interface LandingNavbarClientShellProps {
  logoSlot: ReactNode;
  desktopNavSlot: ReactNode;
  desktopAuthActionsSlot: ReactNode;
  links: ResolvedLandingNavLink[];
  labels: {
    openMenu: string;
    closeMenu: string;
    mobileNavAria: string;
    signInAccount: string;
    startFreeAdventure: string;
  };
}

export function LandingNavbarClientShell({
  logoSlot,
  desktopNavSlot,
  desktopAuthActionsSlot,
  links,
  labels,
}: LandingNavbarClientShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Sentinela invisível de 20px para alternar estado de rolagem sem scroll listener contínuo */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-5 w-px"
      />

      <header
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding,box-shadow] duration-300",
          isScrolled
            ? "bg-card/95 dark:bg-background/95 border-b border-neutral-700/80 dark:border-white/10 shadow-xs dark:shadow-lg dark:shadow-black/20 py-3"
            : "bg-card/95 dark:bg-transparent border-b border-neutral-700/60 dark:border-transparent py-4 lg:py-5",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {logoSlot}

          {desktopNavSlot}

          {/* Controles unificados (Idioma & Tema instanciados apenas uma vez) + Ações */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
            <LanguageToggleBtn variant="icon" />
            <ThemeToggleBtn variant="icon" />

            {desktopAuthActionsSlot}

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus-ring cursor-pointer"
              aria-label={isMobileMenuOpen ? labels.closeMenu : labels.openMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="landing-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div
            id="landing-mobile-menu"
            className="lg:hidden bg-card dark:bg-surface border-b border-neutral-700 dark:border-white/10 px-6 py-6 space-y-4 max-h-[calc(100dvh-4.5rem)] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl"
          >
            <nav
              aria-label={labels.mobileNavAria}
              className="flex flex-col space-y-1 text-base font-medium text-neutral-200"
            >
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 px-2 rounded-lg hover:text-primary dark:hover:text-gold hover:bg-surface/60 dark:hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-4 border-t border-neutral-700 dark:border-white/10 flex flex-col gap-3">
              <Link
                href="/signIn"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-medium text-neutral-100 bg-surface hover:bg-surface-hover dark:text-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors border border-neutral-700 dark:border-transparent outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {labels.signInAccount}
              </Link>
              <Link
                href="/signUp"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-bold text-on-gold bg-gold hover:bg-gold-hover rounded-xl shadow-glow-gold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {labels.startFreeAdventure}
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
