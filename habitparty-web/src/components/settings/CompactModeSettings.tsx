"use client";

import { COMPACT_OPTIONS } from "@/constants/settings";
import { useCompactMode } from "@/hooks/useCompactMode";
import { SettingsOptionGrid } from "./SettingsOptionGrid";

interface CompactModeSettingsProps {
  isCompact?: boolean;
}

export function CompactModeSettings({
  isCompact: propIsCompact,
}: CompactModeSettingsProps = {}) {
  const { isCompact: storeIsCompact, setCompactMode } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  const statusMessage = (
    <>
      <span className="font-bold">Status atual: </span>
      {isCompact
        ? "O Modo Compacto está ativo (recomendado para maior produtividade e densidade de informação)."
        : "O Modo Confortável está ativo (espaçamento expandido padrão)."}
    </>
  );

  return (
    <SettingsOptionGrid
      statusMessage={statusMessage}
      options={COMPACT_OPTIONS}
      selectedValue={isCompact}
      onSelect={(val) => setCompactMode(val)}
      isCompact={isCompact}
    />
  );
}
