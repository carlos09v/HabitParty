"use client";

import { Flame, Hourglass, Swords, Trophy } from "lucide-react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils";

export type ShowcaseStatIconKey = "flame" | "swords" | "hourglass" | "trophy";

const STAT_ICONS = {
  flame: Flame,
  swords: Swords,
  hourglass: Hourglass,
  trophy: Trophy,
} as const;

export interface ShowcaseStatCardData {
  id: string;
  iconKey: ShowcaseStatIconKey;
  iconClass: string;
  gamifiedLabel: string;
  essentialLabel: string;
  value: string;
  sub: string;
}

interface ShowcaseStatsGridViewProps {
  sectionTitleGamified: string;
  sectionTitleEssential: string;
  cards: ShowcaseStatCardData[];
  initialIsGamified: boolean;
  isCompact?: boolean;
}

export function ShowcaseStatsGridView({
  sectionTitleGamified,
  sectionTitleEssential,
  cards,
  initialIsGamified,
  isCompact = false,
}: ShowcaseStatsGridViewProps) {
  const hydrated = useUIStore((s) => s.hydrated);
  const { isGamified } = useExperienceMode();
  const resolvedIsGamified = hydrated ? isGamified : initialIsGamified;

  return (
    <section className="@container flex flex-col gap-3">
      <h2 className="text-body-m font-extrabold text-neutral-100">
        {resolvedIsGamified ? sectionTitleGamified : sectionTitleEssential}
      </h2>

      <div
        className={cn(
          "grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-4",
          isCompact ? "gap-3" : "gap-4",
        )}
      >
        {cards.map((card) => {
          const Icon = STAT_ICONS[card.iconKey];
          return (
            <div
              key={card.id}
              className={cn(
                "rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex items-start gap-3.5 transition-colors hover:border-primary/40",
                isCompact ? "p-3.5" : "p-4",
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                  card.iconClass,
                )}
              >
                <Icon size={20} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-tiny font-bold uppercase tracking-wider text-neutral-400 block truncate">
                  {resolvedIsGamified
                    ? card.gamifiedLabel
                    : card.essentialLabel}
                </span>
                <span className="text-lg font-black text-neutral-50 tabular-nums block mt-0.5">
                  {card.value}
                </span>
                <span className="text-tiny text-neutral-400 block truncate mt-0.5">
                  {card.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
