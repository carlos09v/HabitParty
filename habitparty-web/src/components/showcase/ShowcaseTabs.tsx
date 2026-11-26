import type { LucideIcon } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/utils/cn";
import { handleTabListKeyDown } from "@/utils/showcaseUtils";

export function ShowcaseTabPanelFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading size="lg" />
    </div>
  );
}

export interface ShowcaseTabItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
  badge?: string;
  onPreload?: () => void;
}

export function getShowcaseTabIds(baseId: string, tab: string) {
  return {
    tabId: `${baseId}-tab-${tab}`,
    panelId: `${baseId}-panel-${tab}`,
  };
}

interface ShowcaseTabsProps<T extends string = string> {
  baseId: string;
  ariaLabel: string;
  tabs: readonly ShowcaseTabItem<T>[];
  activeTab: T;
  onSelectTab: (tab: T) => void;
  className?: string;
}

export function ShowcaseTabs<T extends string = string>({
  baseId,
  ariaLabel,
  tabs,
  activeTab,
  onSelectTab,
  className,
}: ShowcaseTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-2 p-1.5 rounded-2xl bg-surface dark:bg-surface/90 border border-neutral-700 dark:border-primary/20 overflow-x-auto custom-scrollbar",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = activeTab === tab.id;
        const { tabId, panelId } = getShowcaseTabIds(baseId, tab.id);

        return (
          <button
            key={tab.id}
            id={tabId}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            onKeyDown={(e) =>
              handleTabListKeyDown(e, { activateOnFocus: false })
            }
            onClick={() => onSelectTab(tab.id)}
            onMouseEnter={tab.onPreload}
            onFocus={tab.onPreload}
            className={cn(
              "relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              isSelected
                ? "bg-gold text-on-gold shadow-glow-gold-xs after:content-[''] after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-on-gold/70 forced-colors:outline-2 forced-colors:outline-solid forced-colors:outline-[Highlight]"
                : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
            )}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
                  isSelected
                    ? "bg-black/20 text-on-gold"
                    : "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40",
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
