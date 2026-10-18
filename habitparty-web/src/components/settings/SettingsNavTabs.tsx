"use client";

import Link from "next/link";
import { SETTINGS_TABS } from "@/constants/settings";
import type { SettingsTabId } from "@/types/settings";
import { cn } from "@/utils";

interface SettingsNavTabsProps {
  activeTab: SettingsTabId;
  isCompact?: boolean;
}

export function SettingsNavTabs({
  activeTab,
  isCompact = false,
}: SettingsNavTabsProps) {
  return (
    <nav
      aria-label="Navegação de Configurações"
      className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/60 border border-primary/20 backdrop-blur-md overflow-x-auto custom-scrollbar w-full"
    >
      {SETTINGS_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;

        return (
          <Link
            key={tab.id}
            href={`/settings?tab=${tab.id}`}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
              isCompact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              isActive
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs"
                : "text-neutral-400 hover:text-neutral-100 hover:bg-white/5",
            )}
          >
            <Icon
              size={isCompact ? 14 : 16}
              className={cn(
                "shrink-0",
                isActive ? "text-neutral-900" : "text-neutral-400",
              )}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
