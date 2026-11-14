"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { cn } from "@/utils";

export interface ResolvedLandingNavLink {
  id: string;
  href: string;
  label: string;
}

interface LandingNavbarClientShellProps {
  desktopBarContent: ReactNode;
  links: ResolvedLandingNavLink[];
  labels: {
    openMenu: string;
    closeMenu: string;
    signInAccount: string;
    startFreeAdventure: string;
  };
}

export function LandingNavbarClientShell({
  desktopBarContent,
  links,
  labels,
}: LandingNavbarClientShellProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,padding,box-shadow] duration-300",
        isScrolled
          ? "bg-card/95 dark:bg-background/95 border-b border-neutral-700/80 dark:border-white/10 shadow-xs dark:shadow-lg dark:shadow-black/20 py-3"
          : "bg-card/95 dark:bg-transparent border-b border-neutral-700/60 dark:border-transparent py-4 md:py-5",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {desktopBarContent}

        {/* Mobile Actions & Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageToggleBtn variant="icon" />
          <ThemeToggleBtn variant="icon" />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 text-neutral-300 hover:text-neutral-50 focus:outline-none cursor-pointer"
            aria-label={isMobileMenuOpen ? labels.closeMenu : labels.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card dark:bg-surface border-b border-neutral-700 dark:border-white/10 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <nav className="flex flex-col space-y-3 text-base font-medium text-neutral-200">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-primary dark:hover:text-gold transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-neutral-700 dark:border-white/10 flex flex-col gap-3">
            <Link
              href="/signIn"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-medium text-neutral-100 bg-surface hover:bg-surface-hover dark:text-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors border border-neutral-700 dark:border-transparent"
            >
              {labels.signInAccount}
            </Link>
            <Link
              href="/signUp"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-bold text-on-gold bg-gold hover:bg-gold-hover rounded-xl shadow-glow-gold transition-colors"
            >
              {labels.startFreeAdventure}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
