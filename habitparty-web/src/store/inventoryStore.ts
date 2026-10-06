import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import type { InventoryItem } from "@/types/inventory";

interface InventoryState {
  items: InventoryItem[];
  backupItems: InventoryItem[];
  setInitialData: (items: InventoryItem[]) => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;
  rollback: () => void;
  commitReorder: () => void;
  consumeItem: (id: string) => void; // For the local mock use
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  backupItems: [],

  setInitialData: (items) => set({ items, backupItems: items }),

  reorderItems: (oldIndex, newIndex) =>
    set((state) => {
      const currentItems = state.items;
      const newItems = arrayMove(currentItems, oldIndex, newIndex);
      return {
        items: newItems,
        backupItems: currentItems,
      };
    }),

  rollback: () => set((state) => ({ items: state.backupItems })),

  commitReorder: () => set((state) => ({ backupItems: state.items })),

  consumeItem: (id) =>
    set((state) => {
      const newItems = state.items
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      return { items: newItems, backupItems: newItems };
    }),
}));
