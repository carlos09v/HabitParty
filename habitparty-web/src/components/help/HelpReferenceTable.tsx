import type { ReactNode } from "react";
import type { HelpTableEntry } from "@/types/help";
import { cn } from "@/utils";

interface HelpReferenceTableProps {
  entry: HelpTableEntry;
  icon: ReactNode;
  highlightColumnIndex?: number;
  highlightColorClass?: string;
  secondaryBoldColumnIndex?: number;
  isCompact?: boolean;
}

export function HelpReferenceTable({
  entry,
  icon,
  highlightColumnIndex = 2,
  highlightColorClass = "text-gold",
  secondaryBoldColumnIndex,
  isCompact = false,
}: HelpReferenceTableProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/30 shadow-xs dark:shadow-none",
        isCompact ? "gap-2.5 p-4" : "gap-3 p-5 sm:p-6",
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-body-m font-bold text-neutral-100">
          {entry.title}
        </h3>
      </div>
      <p className="text-body-s text-neutral-400">{entry.description}</p>

      <div className="overflow-x-auto custom-scrollbar mt-1.5 border border-neutral-700 dark:border-white/10 rounded-xl">
        <table className="w-full text-left text-body-s border-collapse">
          <thead>
            <tr className="bg-surface/80 dark:bg-primary-dark/40 border-b border-neutral-700 dark:border-white/10 text-neutral-300 font-semibold text-xs">
              {entry.columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={cn(isCompact ? "p-2.5" : "p-3")}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700 dark:divide-white/5 text-neutral-200">
            {entry.rows.map((row, rowIndex) => (
              <tr
                key={`${row[0]}-${rowIndex}`}
                className="hover:bg-surface/60 dark:hover:bg-white/5 transition-colors"
              >
                {row.map((cell, colIndex) => {
                  const isFirstCol = colIndex === 0;
                  const isSecondaryBold = colIndex === secondaryBoldColumnIndex;
                  const isHighlighted = colIndex === highlightColumnIndex;

                  return (
                    <td
                      key={`${colIndex}-${cell}`}
                      className={cn(
                        isCompact ? "p-2.5" : "p-3",
                        isFirstCol && "font-bold text-neutral-100",
                        isSecondaryBold && "font-semibold text-neutral-100",
                        isHighlighted && cn("font-bold", highlightColorClass),
                        !isFirstCol &&
                          !isSecondaryBold &&
                          !isHighlighted &&
                          "text-neutral-300 text-xs",
                      )}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
