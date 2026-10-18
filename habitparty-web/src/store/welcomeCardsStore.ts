"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface WelcomeCardsStoreState {
  hiddenCards: string[];
  hideCard: (key: string) => void;
  showCard: (key: string) => void;
  toggleCard: (key: string) => void;
  showAllCards: () => void;
}

export const useWelcomeCardsStore = create<WelcomeCardsStoreState>()(
  persist(
    (set) => ({
      hiddenCards: [],
      hideCard: (key: string) =>
        set((state) => ({
          hiddenCards: state.hiddenCards.includes(key)
            ? state.hiddenCards
            : [...state.hiddenCards, key],
        })),
      showCard: (key: string) =>
        set((state) => ({
          hiddenCards: state.hiddenCards.filter((k) => k !== key),
        })),
      toggleCard: (key: string) =>
        set((state) => ({
          hiddenCards: state.hiddenCards.includes(key)
            ? state.hiddenCards.filter((k) => k !== key)
            : [...state.hiddenCards, key],
        })),
      showAllCards: () => set({ hiddenCards: [] }),
    }),
    {
      name: "habitparty_hidden_welcome_cards",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Hook seguro para renderização client-side com garantia contra hydration mismatch
 */
export function useWelcomeCards() {
  const hiddenCards = useWelcomeCardsStore((state) => state.hiddenCards);
  const hideCard = useWelcomeCardsStore((state) => state.hideCard);
  const showCard = useWelcomeCardsStore((state) => state.showCard);
  const toggleCard = useWelcomeCardsStore((state) => state.toggleCard);
  const showAllCards = useWelcomeCardsStore((state) => state.showAllCards);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCardHidden = (key?: string) => {
    if (!mounted || !key) return false;
    return hiddenCards.includes(key);
  };

  return {
    hiddenCards: mounted ? hiddenCards : [],
    isCardHidden,
    hideCard,
    showCard,
    toggleCard,
    showAllCards,
    mounted,
  };
}
