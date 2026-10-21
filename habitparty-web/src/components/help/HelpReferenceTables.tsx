import { BookOpen, Coins, Flame, Sparkles, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { HelpReferenceTable } from "@/components/help/HelpReferenceTable";
import { HELP_TABLES } from "@/constants/help";
import type { HelpCategory, HelpTableEntry } from "@/types/help";

interface HelpReferenceTablesProps {
  isCompact?: boolean;
  searchQuery?: string;
  activeCategory?: HelpCategory;
}

interface TableConfig {
  id: string;
  entry: HelpTableEntry;
  icon: ReactNode;
  highlightColumnIndex: number;
  highlightColorClass: string;
}

export function HelpReferenceTables({
  isCompact = false,
  searchQuery = "",
  activeCategory = "ALL",
}: HelpReferenceTablesProps) {
  const tables: TableConfig[] = [
    {
      id: "difficulties",
      entry: HELP_TABLES.difficulties,
      icon: <Coins className="text-gold" size={18} />,
      highlightColumnIndex: 2,
      highlightColorClass: "text-gold",
    },
    {
      id: "habitDecay",
      entry: HELP_TABLES.habitDecay,
      icon: <Flame className="text-warning-500" size={18} />,
      highlightColumnIndex: 2,
      highlightColorClass: "text-gold",
    },
    {
      id: "focusRewards",
      entry: HELP_TABLES.focusRewards,
      icon: <Timer className="text-primary-light" size={18} />,
      highlightColumnIndex: 2,
      highlightColorClass: "text-gold",
    },
    {
      id: "mysteryBoxes",
      entry: HELP_TABLES.mysteryBoxes,
      icon: <Sparkles className="text-magenta" size={18} />,
      highlightColumnIndex: 1,
      highlightColorClass: "text-gold",
    },
    {
      id: "userLevels",
      entry: HELP_TABLES.userLevels,
      icon: <Trophy className="text-gold" size={18} />,
      highlightColumnIndex: 1,
      highlightColorClass: "text-magenta",
    },
  ];

  const query = searchQuery.trim().toLowerCase();

  const filteredTables = tables
    .map((table) => {
      const matchesCategory =
        activeCategory === "ALL" ||
        activeCategory === "OVERVIEW" ||
        table.entry.category === activeCategory ||
        (activeCategory === "ECONOMY" &&
          (table.id === "habitDecay" ||
            table.id === "focusRewards" ||
            table.id === "mysteryBoxes"));

      if (!matchesCategory) return null;
      if (!query) return table;

      const titleMatch =
        table.entry.title.toLowerCase().includes(query) ||
        table.entry.description.toLowerCase().includes(query);

      if (titleMatch) return table;

      const matchingRows = table.entry.rows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(query)),
      );

      if (matchingRows.length === 0) return null;

      return {
        ...table,
        entry: {
          ...table.entry,
          rows: matchingRows,
        },
      };
    })
    .filter((t): t is TableConfig => t !== null);

  if (filteredTables.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-5 pt-6 border-t border-primary/20">
      <div className="flex items-center gap-2">
        <BookOpen className="text-gold" size={20} />
        <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
          Tabelas de Referência & Economia Matemática
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
          {filteredTables.length}{" "}
          {filteredTables.length === 1 ? "tabela" : "tabelas"}
        </span>
      </div>

      {filteredTables.map((table) => (
        <HelpReferenceTable
          key={table.id}
          entry={table.entry}
          icon={table.icon}
          highlightColumnIndex={table.highlightColumnIndex}
          highlightColorClass={table.highlightColorClass}
          isCompact={isCompact}
        />
      ))}
    </section>
  );
}
