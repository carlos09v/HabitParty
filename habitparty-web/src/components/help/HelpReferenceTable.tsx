import type { ReactNode } from "react";
import type { HelpTableEntry } from "@/types/help";
import { cn } from "@/utils";

interface HelpReferenceTableProps {
  entry: HelpTableEntry;
  icon: ReactNode;
  highlightColumnIndex?: number;
  highlightColorClass?: string;
}

export function HelpReferenceTable({
  entry,
  icon,
  highlightColumnIndex = 2,
  highlightColorClass = "text-gold",
}: HelpReferenceTableProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-surface/30 backdrop-blur-md p-5 sm:p-6">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-body-m font-bold text-neutral-100">
          {entry.title}
        </h3>
      </div>
      <p className="text-body-s text-neutral-400">{entry.description}</p>

      <div className="overflow-x-auto custom-scrollbar mt-2 border border-white/10 rounded-xl">
        <table className="w-full text-left text-body-s border-collapse">
          <thead>
            <tr className="bg-primary-dark/40 border-b border-white/10 text-neutral-300 font-semibold text-xs">
              {entry.columns.map((col) => (
                <th key={col} className="p-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-neutral-200">
            {entry.rows.map((row, rowIndex) => (
              <tr
                key={`${row[0]}-${rowIndex}`}
                className="hover:bg-white/5 transition-colors"
              >
                {row.map((cell, colIndex) => {
                  const isFirstCol = colIndex === 0;
                  const isHighlighted = colIndex === highlightColumnIndex;

                  return (
                    <td
                      key={`${colIndex}-${cell}`}
                      className={cn(
                        "p-3",
                        isFirstCol && "font-bold text-neutral-100",
                        isHighlighted && cn("font-bold", highlightColorClass),
                        !isFirstCol &&
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
