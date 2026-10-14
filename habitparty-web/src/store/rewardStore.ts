import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";
import type { Reward } from "@/types/reward";

interface RewardState {
  items: Reward[];
  backupItems: Reward[];
  setInitialData: (items: Reward[]) => void;
  reorderItems: (oldIndex: number, newIndex: number) => void;
  rollback: () => void;
  commitReorder: () => void;
  addReward: (reward: Reward) => void;
  updateRewardItem: (id: string, updated: Partial<Reward>) => void;
  deleteRewardItem: (id: string) => void;
}

export const useRewardStore = create<RewardState>((set) => ({
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

  addReward: (reward) =>
    set((state) => {
      const newItems = [reward, ...state.items];
      return { items: newItems, backupItems: newItems };
    }),

  updateRewardItem: (id, updated) =>
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, ...updated } : item,
      );
      return { items: newItems, backupItems: newItems };
    }),

  deleteRewardItem: (id) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id);
      return { items: newItems, backupItems: newItems };
    }),
}));
