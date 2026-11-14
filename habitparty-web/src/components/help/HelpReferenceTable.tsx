import { type ReactNode, useId } from "react";
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

export function HelpReferenceTable({
  entry,
  icon,
  highlightColumnIndex = 2,
  highlightColorClass = "text-gold",
  secondaryBoldColumnIndex,
  isCompact = false,
}: HelpReferenceTableProps) {
  const headingId = useId();
  const minTableWidthClass =
    entry.columns.length >= 5 ? "min-w-[640px]" : "min-w-[540px]";

  return (
    <div
      className={cn(
        "@container flex flex-col rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/30 shadow-xs dark:shadow-none",
        isCompact ? "gap-2.5 p-4" : "gap-3 p-4 sm:p-6",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 flex items-center justify-center">
          {icon}
        </span>
        <h3 id={headingId} className="text-body-m font-bold text-neutral-100">
          {entry.title}
        </h3>
      </div>
      <p className="text-body-s text-neutral-400">{entry.description}</p>

      {/* VISÃO EM CARDS PARA MOBILE / CONTAINERS ESTREITOS */}
      <div className="flex flex-col gap-2.5 mt-1 @2xl:hidden">
        {entry.rows.map((row, rowIndex) => (
          <article
            key={`card-${row[0]}-${rowIndex}`}
            className={cn(
              "rounded-xl border border-neutral-700 dark:border-white/10 bg-surface/60 dark:bg-white/[0.03] flex flex-col gap-2",
              isCompact ? "p-3" : "p-3.5",
            )}
          >
            <div className="flex items-baseline justify-between gap-2 border-b border-neutral-700/70 dark:border-white/10 pb-2">
              {entry.columns[0] && (
                <span className="text-label-g uppercase tracking-wider text-neutral-400 font-semibold shrink-0">
                  {entry.columns[0]}
                </span>
              )}
              <span
                className={cn(
                  "text-body-s text-right break-words",
                  resolveCellTextClass(
                    0,
                    highlightColumnIndex,
                    highlightColorClass,
                    secondaryBoldColumnIndex,
                  ),
                )}
              >
                {row[0]}
              </span>
            </div>

            <dl className="flex flex-col gap-1.5 text-xs">
              {row.slice(1).map((cell, offsetIndex) => {
                const colIndex = offsetIndex + 1;
                const colLabel = entry.columns[colIndex];

                return (
                  <div
                    key={`${colIndex}-${cell}`}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
                  >
                    {colLabel && (
                      <dt className="text-label-g font-semibold text-neutral-400 shrink-0">
                        {colLabel}
                      </dt>
                    )}
                    <dd
                      className={cn(
                        "leading-relaxed sm:text-right break-words",
                        resolveCellTextClass(
                          colIndex,
                          highlightColumnIndex,
                          highlightColorClass,
                          secondaryBoldColumnIndex,
                        ),
                      )}
                    >
                      {cell}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </div>

      {/* TABELA SEMÂNTICA PARA CONTAINERS AMPLOS */}
      <section
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Região rolável acessível por teclado para tabelas amplas
        tabIndex={0}
        aria-labelledby={headingId}
        className="hidden @2xl:block overflow-x-auto custom-scrollbar mt-1.5 border border-neutral-700 dark:border-white/10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <table
          className={cn(
            "w-full text-left text-body-s border-collapse",
            minTableWidthClass,
          )}
        >
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
                {row.map((cell, colIndex) => (
                  <td
                    key={`${colIndex}-${cell}`}
                    className={cn(
                      isCompact ? "p-2.5" : "p-3",
                      resolveCellTextClass(
                        colIndex,
                        highlightColumnIndex,
                        highlightColorClass,
                        secondaryBoldColumnIndex,
                      ),
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
