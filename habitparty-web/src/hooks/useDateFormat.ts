"use client";

import { useUIStore } from "@/store/uiStore";

export function useDateFormat() {
  const dateFormat = useUIStore((s) => s.dateFormat);
  const setDateFormat = useUIStore((s) => s.setDateFormat);

  return {
    dateFormat,
    setDateFormat,
  };
}
