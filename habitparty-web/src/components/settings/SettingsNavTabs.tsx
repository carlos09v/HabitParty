"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";
import {
  isValidSettingsTab,
  SETTINGS_TABS,
  VALID_SETTINGS_TABS,
} from "@/constants/settings";
import type { SettingsTabId } from "@/types/settings";
import { cn } from "@/utils";

function syncSettingsTabUrl(nextTab: SettingsTabId) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.set("tab", nextTab);
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(window.history.state, "", nextUrl);
}

interface SettingsNavTabsProps {
  activeTab: SettingsTabId;
  isCompact?: boolean;
  panels?: Record<SettingsTabId, ReactNode>;
}

export function SettingsNavTabs({
  activeTab: initialTab,
  isCompact = false,
  panels,
}: SettingsNavTabsProps) {
  const t = useTranslations("settings.tabs");
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get("tab");

  const [currentTab, setCurrentTab] = useState<SettingsTabId>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<SettingsTabId>>(
    () => new Set([initialTab]),
  );

  // Sincroniza caso a URL seja alterada externamente (ex: navegação via link externo)
  useEffect(() => {
    if (isValidSettingsTab(urlTabParam)) {
      setCurrentTab(urlTabParam);
      setVisitedTabs((prev) => {
        if (prev.has(urlTabParam)) return prev;
        const next = new Set(prev);
        next.add(urlTabParam);
        return next;
      });
    }
  }, [urlTabParam]);

  const handleTabSelect = (tabId: SettingsTabId) => {
    if (tabId === currentTab) return;
    setCurrentTab(tabId);
    setVisitedTabs((prev) => {
      if (prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.add(tabId);
      return next;
    });
    syncSettingsTabUrl(tabId);
  };

  return (
    <>
      <nav
        aria-label={t("navAria")}
        className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/95 border border-neutral-700 dark:border-primary/20 overflow-x-auto custom-scrollbar w-full"
      >
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === currentTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabSelect(tab.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 select-none",
                isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
                isActive
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-300 hover:text-neutral-50 hover:bg-card/80 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-white/5",
              )}
            >
              <Icon
                size={isCompact ? 14 : 16}
                className={cn(
                  "shrink-0",
                  isActive ? "text-on-gold" : "text-neutral-400",
                )}
              />
              <span>{t(tab.id)}</span>
            </button>
          );
        })}
      </nav>

      {panels &&
        VALID_SETTINGS_TABS.map((tabId) => {
          if (!visitedTabs.has(tabId)) return null;
          const isActive = tabId === currentTab;

          return (
            <div
              key={tabId}
              aria-hidden={!isActive}
              className={cn(
                "flex flex-col gap-6 mt-1",
                !isActive && "settings-tab-inactive",
              )}
            >
              {panels[tabId]}
            </div>
          );
        })}
    </>
  );
}
