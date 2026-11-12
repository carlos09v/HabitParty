import { useUIStore } from "@/store/uiStore";

export function useTimeFormat() {
  const timeFormat = useUIStore((s) => s.timeFormat);
  const setTimeFormat = useUIStore((s) => s.setTimeFormat);

  return {
    timeFormat,
    setTimeFormat,
  };
}
