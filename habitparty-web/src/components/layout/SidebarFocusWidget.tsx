"use client";

import dynamic from "next/dynamic";
import { useIsClient } from "@/hooks/useIsClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";

const SidebarFocusWidgetBody = dynamic(
  () =>
    import("./SidebarFocusWidgetBody").then(
      (mod) => mod.SidebarFocusWidgetBody,
    ),
  { ssr: false },
);

interface SidebarFocusWidgetProps {
  /** Fecha o drawer mobile ao navegar para /focus a partir do widget. */
  onNavigate?: () => void;
  /** Identifica se o widget está montado no drawer mobile (visível sob demanda) ou na sidebar desktop (`lg:flex`). */
  isMobile?: boolean;
}

/**
 * Casca gate mínima do widget de foco na Sidebar.
 * Assina apenas booleanos baratos e carrega `SidebarFocusWidgetBody` sob demanda via `next/dynamic`
 * somente quando há sessão/som ativo e a sidebar correspondente está visível no viewport atual.
 */
export function SidebarFocusWidget({
  onNavigate,
  isMobile = false,
}: SidebarFocusWidgetProps = {}) {
  const isClient = useIsClient();
  const isDesktopViewport = useMediaQuery("(min-width: 1024px)", false);

  const hasTimerSession = useFocusTimerStore(
    (s) => (s.isActive || s.elapsedSeconds > 0) && Boolean(s.target),
  );
  const hasAmbientPref = useSoundPreferencesStore(
    (s) => s.isAmbientPlaying && s.ambientSoundType !== "none",
  );

  // Evita montar o widget (e rodar 1Hz) na sidebar desktop oculta (`hidden lg:flex`) em telas mobile
  const isVisibleContainer = isMobile || isDesktopViewport;

  if (
    !isClient ||
    !isVisibleContainer ||
    (!hasTimerSession && !hasAmbientPref)
  ) {
    return null;
  }

  return <SidebarFocusWidgetBody onNavigate={onNavigate} />;
}
