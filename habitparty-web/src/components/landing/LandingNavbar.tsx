import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  LandingNavbarClientShell,
  type ResolvedLandingNavLink,
} from "@/components/landing/LandingNavbarClientShell";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LANDING_NAV_LINK_CONFIGS } from "@/constants/landing";

export async function LandingNavbar() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("landing.navbar"),
  ]);

  const resolvedLinks: ResolvedLandingNavLink[] = LANDING_NAV_LINK_CONFIGS.map(
    (link) => ({
      id: link.id,
      href: link.href,
      label: t(`links.${link.id}`),
    }),
  );

  const desktopBarContent = (
    <>
      {/* Logo */}
      <Link
        href={`/${locale}`}
        className="flex items-center gap-2 group transition-opacity hover:opacity-95"
      >
        <BrandLogo
          alt="HabitParty"
          width={160}
          height={36}
          className="w-auto h-9"
          priority
        />
      </Link>

      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
        {resolvedLinks.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className="transition-colors hover:text-primary dark:hover:text-gold"
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Action Buttons */}
      <div className="hidden md:flex items-center gap-2.5">
        <LanguageToggleBtn variant="icon" />
        <ThemeToggleBtn variant="icon" />
        <Link
          href="/signIn"
          className="px-4 py-2 text-sm font-medium text-neutral-200 hover:text-neutral-50 transition-colors"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/signUp"
          className="relative group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-sm dark:shadow-[0_0_20px_rgba(124,58,237,0.4)] dark:hover:shadow-glow-gold hover:border-primary dark:hover:border-gold/50 transition-[transform,border-color,box-shadow] duration-300 hover:scale-[1.02] border border-primary-light/40"
        >
          <Sparkles className="w-4 h-4 text-white dark:text-gold animate-pulse" />
          <span>{t("startFree")}</span>
          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </>
  );

  return (
    <LandingNavbarClientShell
      desktopBarContent={desktopBarContent}
      links={resolvedLinks}
      labels={{
        openMenu: t("openMenu"),
        closeMenu: t("closeMenu"),
        signInAccount: t("signInAccount"),
        startFreeAdventure: t("startFreeAdventure"),
      }}
    />
  );
}
