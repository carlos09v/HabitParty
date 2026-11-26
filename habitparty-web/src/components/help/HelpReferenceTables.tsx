import {
  BookOpen,
  Coins,
  Flame,
  type LucideIcon,
  Scale,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { HelpReferenceTable } from "@/components/help/HelpReferenceTable";
import type { HelpCategory, HelpTableEntry } from "@/types/help";
import { normalizeSearchText } from "@/utils";

interface HelpTableMeta {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  highlightColumnIndex: number;
  highlightColorClass: string;
  secondaryBoldColumnIndex?: number;
}

export interface ResolvedHelpTable extends HelpTableMeta {
  entry: HelpTableEntry;
}

const HELP_TABLE_DEFINITIONS: readonly HelpTableMeta[] = [
  {
    id: "experienceModes",
    icon: SlidersHorizontal,
    iconClassName: "text-primary dark:text-primary-light",
    highlightColumnIndex: 3,
    highlightColorClass: "text-gold-ink dark:text-gold",
    secondaryBoldColumnIndex: 0,
  },
  {
    id: "difficulties",
    icon: Coins,
    iconClassName: "text-gold-ink dark:text-gold",
    highlightColumnIndex: 2,
    highlightColorClass: "text-gold-ink dark:text-gold",
  },
  {
    id: "habitImportance",
    icon: Sparkles,
    iconClassName: "text-success-400",
    highlightColumnIndex: 2,
    highlightColorClass: "text-gold-ink dark:text-gold",
  },
  {
    id: "habitDecay",
    icon: Flame,
    iconClassName: "text-warning-500",
    highlightColumnIndex: 2,
    highlightColorClass: "text-gold-ink dark:text-gold",
  },
  {
    id: "rewardPricing",
    icon: Scale,
    iconClassName: "text-gold-ink dark:text-gold",
    highlightColumnIndex: 1,
    highlightColorClass: "text-gold-ink dark:text-gold",
    secondaryBoldColumnIndex: 0,
  },
  {
    id: "focusRewards",
    icon: Timer,
    iconClassName: "text-primary dark:text-primary-light",
    highlightColumnIndex: 2,
    highlightColorClass: "text-gold-ink dark:text-gold",
  },
  {
    id: "mysteryBoxes",
    icon: Sparkles,
    iconClassName: "text-magenta dark:text-fuchsia-300",
    highlightColumnIndex: 1,
    highlightColorClass: "text-gold-ink dark:text-gold",
  },
  {
    id: "userLevels",
    icon: Trophy,
    iconClassName: "text-gold-ink dark:text-gold",
    highlightColumnIndex: 2,
    highlightColorClass: "text-magenta dark:text-fuchsia-300",
    secondaryBoldColumnIndex: 1,
  },
  {
    id: "achievementRarities",
    icon: Trophy,
    iconClassName: "text-gold-ink dark:text-gold",
    highlightColumnIndex: 1,
    highlightColorClass: "text-gold-ink dark:text-gold",
    secondaryBoldColumnIndex: 0,
  },
] as const;

/**
 * Filtra as tabelas de referência por categoria e termo de busca normalizado (sem diacríticos).
 */
export function filterHelpTables(
  helpTables: Record<string, HelpTableEntry>,
  activeCategory: HelpCategory,
  normalizedQuery: string,
): ResolvedHelpTable[] {
  const results: ResolvedHelpTable[] = [];

  for (const def of HELP_TABLE_DEFINITIONS) {
    const entry = helpTables[def.id];
    if (!entry) continue;

    const matchesCategory =
      activeCategory === "ALL" ||
      entry.category === activeCategory ||
      (entry.categories?.includes(activeCategory) ?? false);

    if (!matchesCategory) continue;

    if (!normalizedQuery) {
      results.push({ ...def, entry });
      continue;
    }

    const titleMatch =
      normalizeSearchText(entry.title).includes(normalizedQuery) ||
      normalizeSearchText(entry.description).includes(normalizedQuery);

    if (titleMatch) {
      results.push({ ...def, entry });
      continue;
    }

    const matchingRows = entry.rows.filter((row) =>
      row.some((cell) =>
        normalizeSearchText(String(cell)).includes(normalizedQuery),
      ),
    );

    if (matchingRows.length > 0) {
      results.push({
        ...def,
        entry: {
          ...entry,
          rows: matchingRows,
        },
      });
    }
  }

  return results;
}

interface HelpReferenceTablesProps {
  /** Tabelas já filtradas conforme busca e categoria ativas. */
  tables: readonly ResolvedHelpTable[];
}

export function HelpReferenceTables({ tables }: HelpReferenceTablesProps) {
  const t = useTranslations("help.tables");

  if (tables.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-5 pt-6 border-t border-primary/20">
      <div className="flex items-center gap-2">
        <BookOpen
          className="text-gold-ink dark:text-gold shrink-0"
          size={20}
          aria-hidden="true"
        />
        <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
          {t("sectionTitle")}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-surface dark:bg-white/10 text-neutral-300 border border-neutral-700 dark:border-white/10">
          {tables.length}{" "}
          {tables.length === 1 ? t("tableSingular") : t("tablePlural")}
        </span>
      </div>

      {tables.map((table) => {
        const Icon = table.icon;
        return (
          <HelpReferenceTable
            key={table.id}
            entry={table.entry}
            icon={
              <Icon
                className={table.iconClassName}
                size={18}
                aria-hidden="true"
              />
            }
            highlightColumnIndex={table.highlightColumnIndex}
            highlightColorClass={table.highlightColorClass}
            secondaryBoldColumnIndex={table.secondaryBoldColumnIndex}
          />
        );
      })}
    </section>
  );
}
