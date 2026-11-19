"use client";

import { useEffect, useState } from "react";
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
  const { isGamified } = useExperienceMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveGamified = mounted ? isGamified : initialIsGamified;

  return <span>{effectiveGamified ? gamifiedText : productivityText}</span>;
}
