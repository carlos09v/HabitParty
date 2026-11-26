"use client";

import { useExperienceMode } from "@/hooks/useExperienceMode";

interface PartyWidgetModeLabelProps {
  initialIsGamified: boolean;
  gamifiedText: string;
  productivityText: string;
}

/**
 * Leaf client component para reatividade instantânea dos rótulos do PartyWidget
 * quando o usuário alterna o Estilo de Experiência sem revalidar o Server Component.
 */
export function PartyWidgetModeLabel({
  initialIsGamified,
  gamifiedText,
  productivityText,
}: PartyWidgetModeLabelProps) {
  const { isGamified } = useExperienceMode(
    initialIsGamified ? "GAMIFIED" : "PRODUCTIVITY",
  );

  return <span>{isGamified ? gamifiedText : productivityText}</span>;
}
