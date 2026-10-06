import { create } from "zustand";
import type { components } from "@/api/schema";

type Column = components["schemas"]["BoardColumnSummaryDTO"];

interface BoardState {
  columns: Column[];
  init: (data: { columns: Column[] }) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  init: ({ columns }) => set({ columns }),
}));
