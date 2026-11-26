import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  LandingNavbarClientShell,
  type ResolvedLandingNavLink,
} from "@/components/landing/LandingNavbarClientShell";
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

  const logoSlot = (
    <Link
      href={`/${locale}`}
      aria-label={t("homeAria")}
      className="flex items-center gap-2 shrink-0 group transition-opacity hover:opacity-95 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
    >
      <BrandLogo
        alt="HabitParty"
        width={160}
        height={36}
        className="w-auto h-8 xl:h-9"
        priority
      />
    </Link>
  );

  const desktopNavSlot = (
    <nav
      aria-label={t("navAria")}
      className="hidden lg:flex items-center gap-4 xl:gap-7 text-sm font-medium text-neutral-300"
    >
      {resolvedLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="whitespace-nowrap transition-colors hover:text-primary dark:hover:text-gold outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded px-1 py-0.5"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );

  const desktopAuthActionsSlot = (
    <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
      <Link
        href="/signIn"
        className="px-3 xl:px-4 py-2 whitespace-nowrap text-sm font-medium text-neutral-200 hover:text-neutral-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-lg"
      >
        {t("signIn")}
      </Link>
      <Link
        href="/signUp"
        className="relative group inline-flex items-center gap-2 whitespace-nowrap px-4 xl:px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light dark:from-primary-dark dark:to-primary text-white font-semibold text-sm shadow-sm dark:shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] dark:hover:shadow-glow-gold hover:border-primary dark:hover:border-gold/50 transition-[transform,border-color,box-shadow] duration-300 hover:scale-[1.02] border border-primary-light/40 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Sparkles
          className="w-4 h-4 text-white dark:text-gold motion-safe:animate-pulse"
          aria-hidden="true"
        />
        <span>{t("startFree")}</span>
        <ArrowRight
          className="w-4 h-4 text-white transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );

  return (
    <LandingNavbarClientShell
      logoSlot={logoSlot}
      desktopNavSlot={desktopNavSlot}
      desktopAuthActionsSlot={desktopAuthActionsSlot}
      links={resolvedLinks}
      labels={{
        openMenu: t("openMenu"),
        closeMenu: t("closeMenu"),
        mobileNavAria: t("mobileNavAria"),
        signInAccount: t("signInAccount"),
        startFreeAdventure: t("startFreeAdventure"),
      }}
    />
  );
}
