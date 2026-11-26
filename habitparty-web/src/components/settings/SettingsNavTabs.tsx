"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useSettingsDirtyState } from "@/components/settings/SettingsDirtyContext";
import { SETTINGS_TABS } from "@/constants/settings";
import type { SettingsTabId } from "@/types/settings";
import { cn } from "@/utils/cn";

interface SettingsNavTabsProps {
  activeTab: SettingsTabId;
}

export function SettingsNavTabs({ activeTab }: SettingsNavTabsProps) {
  const t = useTranslations("settings.tabs");
  const tGuard = useTranslations("settings.unsavedGuard");
  const { hasUnsavedChanges, clearAllDirty, guardLinkClick } =
    useSettingsDirtyState();
  const prevActiveTabRef = useRef(activeTab);

  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      clearAllDirty();
    }
  }, [activeTab, clearAllDirty]);

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
            onClick={(e) => {
              if (tab.id !== activeTab) {
                guardLinkClick(e, href, "replace");
              }
            }}
            className={cn(
              "relative flex items-center gap-2 rounded-lg font-bold transition-colors whitespace-nowrap shrink-0 select-none px-4 py-2 text-sm border-b-2",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
              isActive
                ? "bg-gold text-on-gold border-on-gold/40 shadow-glow-gold-xs forced-colors:outline-2 forced-colors:outline-offset-[-2px]"
                : "border-transparent text-neutral-300 hover:text-neutral-50 hover:bg-card/80 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-white/5",
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
            {isActive && hasUnsavedChanges && (
              <>
                <span
                  aria-hidden="true"
                  title={tGuard("unsavedDotAria")}
                  className="w-2 h-2 rounded-full bg-red-600 dark:bg-neutral-950 ring-2 ring-white/70 shrink-0"
                />
                <span className="sr-only">{tGuard("unsavedDotAria")}</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
