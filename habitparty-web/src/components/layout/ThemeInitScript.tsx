"use client";

import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

let hasHydratedDocument = false;

interface ThemeInitScriptProps {
  script: string;
}

/**
 * Renderiza o script bloqueante anti-FOUC apenas no SSR e na hidratação inicial.
 * Em navegações client-side (ex: troca de `[locale]` na landing page `/en` <-> `/pt-BR`),
 * evita montar `<script>` dinamicamente no cliente (erro React 19).
 */
export function ThemeInitScript({ script }: ThemeInitScriptProps) {
  useIsomorphicLayoutEffect(() => {
    hasHydratedDocument = true;
  }, []);

  if (typeof window !== "undefined" && hasHydratedDocument) {
    return null;
  }

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Script estático e controlado para evitar FOUC de tema antes do first paint
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
