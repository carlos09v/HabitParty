import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SETTINGS_TABS } from "@/constants/settings";
import type { SettingsTabId } from "@/types/settings";
import { cn } from "@/utils";

interface SettingsNavTabsProps {
  activeTab: SettingsTabId;
}

export async function SettingsNavTabs({ activeTab }: SettingsNavTabsProps) {
  const t = await getTranslations("settings.tabs");

  return (
    <nav
      aria-label={t("navAria")}
      className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/95 border border-neutral-700 dark:border-primary/20 overflow-x-auto custom-scrollbar w-full"
    >
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        const href =
          tab.id === "profile" ? "/settings" : `/settings?tab=${tab.id}`;

        return (
          <Link
            key={tab.id}
            href={href}
            replace
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 select-none px-4 py-2 text-sm",
              isActive
                ? "bg-gold text-on-gold shadow-glow-gold-xs"
                : "text-neutral-300 hover:text-neutral-50 hover:bg-card/80 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-white/5",
            )}
          >
            <Icon
              size={16}
              aria-hidden="true"
              className={cn(
                "shrink-0",
                isActive ? "text-on-gold" : "text-neutral-400",
              )}
            />
            <span>{t(tab.id)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
