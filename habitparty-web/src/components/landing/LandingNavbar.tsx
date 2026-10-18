"use client";

import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { LANDING_NAV_LINKS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/85 backdrop-blur-md border-b border-neutral-700/80 dark:border-white/10 shadow-xs dark:shadow-lg dark:shadow-black/20 py-3"
          : "bg-transparent py-5",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-95"
        >
          <Image
            src="/assets/logo.png"
            alt="HabitParty"
            width={160}
            height={36}
            className="w-auto h-9 object-contain"
            priority
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggleBtn variant="icon" />
          <Link
            href="/signIn"
            className="px-4 py-2 text-sm font-medium text-neutral-200 hover:text-neutral-50 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signUp"
            className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-glow-gold hover:border-gold/50 transition-all duration-300 hover:scale-[1.02] border border-primary-light/40"
          >
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <span>Começar Grátis</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mobile Actions & Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggleBtn variant="icon" />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-neutral-50 focus:outline-none cursor-pointer"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
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
        <div className="md:hidden bg-card/95 dark:bg-surface/95 backdrop-blur-xl border-b border-neutral-700 dark:border-white/10 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <nav className="flex flex-col space-y-3 text-base font-medium text-neutral-200">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 hover:text-gold transition-colors"
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
              Entrar na Conta
            </Link>
            <Link
              href="/signUp"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-bold text-neutral-900 bg-gold hover:bg-gold-hover rounded-xl shadow-glow-gold transition-colors"
            >
              Começar Aventura Grátis ⚔️
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
