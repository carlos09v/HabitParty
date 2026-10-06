"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";

export function useCompactMode() {
  const compactMode = useUIStore((state) => state.compactMode);
  const toggleCompactMode = useUIStore((state) => state.toggleCompactMode);
  const setCompactMode = useUIStore((state) => state.setCompactMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    isCompact: mounted ? compactMode : false,
    compactMode,
    toggleCompactMode,
    setCompactMode,
    mounted,
  };
}
