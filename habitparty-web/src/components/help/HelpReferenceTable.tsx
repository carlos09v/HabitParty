import { type ReactNode, useId } from "react";
import type { HelpTableEntry } from "@/types/help";
import { cn } from "@/utils";

interface HelpReferenceTableProps {
  entry: HelpTableEntry;
  icon: ReactNode;
  highlightColumnIndex?: number;
  highlightColorClass?: string;
  secondaryBoldColumnIndex?: number;
}

function resolveCellTextClass(
  colIndex: number,
  highlightColumnIndex: number,
  highlightColorClass: string,
  secondaryBoldColumnIndex?: number,
) {
  const isFirstCol = colIndex === 0;
  const isSecondaryBold = colIndex === secondaryBoldColumnIndex;
  const isHighlighted = colIndex === highlightColumnIndex;

  return cn(
    isFirstCol && "font-bold text-neutral-100",
    isSecondaryBold && "font-semibold text-neutral-100",
    isHighlighted && cn("font-bold", highlightColorClass),
    !isFirstCol &&
      !isSecondaryBold &&
      !isHighlighted &&
      "text-neutral-300 text-xs",
  );
}

/**
 * Tabela de referência com 1× DOM: uma única `<table>` semântica que permanece tabular
 * em containers amplos (`@2xl`) e empilha em cards com rótulos injetados via CSS puro
 * (`@container (width < 42rem)` + `data-label`).
 */
export function HelpReferenceTable({
  entry,
  icon,
  highlightColumnIndex = 2,
  highlightColorClass = "text-gold-ink dark:text-gold",
  secondaryBoldColumnIndex,
}: HelpReferenceTableProps) {
  const headingId = useId();
  const minTableWidthClass =
    entry.columns.length >= 5 ? "@2xl:min-w-[640px]" : "@2xl:min-w-[540px]";

  return (
    <div className="@container flex flex-col gap-3 p-4 sm:p-6 rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/30 shadow-xs dark:shadow-none">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="shrink-0 flex items-center justify-center"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3 id={headingId} className="text-body-m font-bold text-neutral-100">
          {entry.title}
        </h3>
      </div>
      <p className="text-body-s text-neutral-400">{entry.description}</p>

      <section
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Região rolável acessível por teclado para tabelas amplas
        tabIndex={0}
        aria-labelledby={headingId}
        className="overflow-x-auto custom-scrollbar mt-1.5 rounded-xl border border-neutral-700 dark:border-white/10 @max-2xl:border-0 @max-2xl:overflow-visible outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <table
          className={cn(
            "responsive-table-2xl w-full text-left text-body-s border-collapse",
            minTableWidthClass,
          )}
        >
          <thead>
            <tr className="bg-surface/80 dark:bg-primary-dark/40 border-b border-neutral-700 dark:border-white/10 text-neutral-300 font-semibold text-xs">
              {entry.columns.map((col) => (
                <th key={col} scope="col" className="p-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700 dark:divide-white/5 @max-2xl:divide-y-0 text-neutral-200">
            {entry.rows.map((row, rowIndex) => (
              <tr
                key={`${row[0]}-${rowIndex}`}
                className="hover:bg-surface/60 dark:hover:bg-white/5 transition-colors"
              >
                {row.map((cell, colIndex) => {
                  const cellClass = cn(
                    "p-3 break-words",
                    resolveCellTextClass(
                      colIndex,
                      highlightColumnIndex,
                      highlightColorClass,
                      secondaryBoldColumnIndex,
                    ),
                  );

                  if (colIndex === 0) {
                    return (
                      <th
                        key={`${colIndex}-${cell}`}
                        scope="row"
                        data-label={entry.columns[0]}
                        className={cellClass}
                      >
                        {cell}
                      </th>
                    );
                  }

                  return (
                    <td
                      key={`${colIndex}-${cell}`}
                      data-label={entry.columns[colIndex]}
                      className={cellClass}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
