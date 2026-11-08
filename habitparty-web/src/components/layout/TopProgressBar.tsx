"use client";

import { useProgressStore } from "@/store/progressStore";

/**
 * Barra fina e indeterminada no topo da página, exibida enquanto houver
 * alguma operação registrada no `progressStore` (ex.: troca de idioma).
 *
 * - Aparece com um pequeno atraso (150ms) para não "piscar" em respostas rápidas.
 * - Anuncia o rótulo da operação para leitores de tela via região `status`.
 * - Respeita `prefers-reduced-motion` (barra estática, sem deslizar).
 */
export function TopProgressBar() {
  const tasks = useProgressStore((state) => state.tasks);
  const labels = Object.values(tasks);
  const isActive = labels.length > 0;
  const label = labels.find(Boolean) ?? "";

  return (
    <>
      {isActive && (
        <div
          role="progressbar"
          aria-label={label || undefined}
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-gold/15 animate-in fade-in duration-150 [animation-delay:50ms]"
        >
          <div className="animate-top-progress h-full w-1/3 rounded-full bg-gold shadow-[0_0_8px_var(--color-gold)]" />
        </div>
      )}
      <output className="sr-only" aria-live="polite">
        {label}
      </output>
    </>
  );
}
