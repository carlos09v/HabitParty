import { create } from "zustand";
import type { AppLocale } from "@/types/ui";

/**
 * Estado global da troca de idioma em andamento.
 *
 * É global (e não por instância do hook) porque a mesma tela pode ter vários
 * seletores de idioma montados ao mesmo tempo (ex.: Navbar desktop + mobile +
 * Footer na landing). Enquanto `pendingLocale` estiver definido, todos eles
 * ficam bloqueados — evitando ações concorrentes e o "pisca" EN → PT → EN.
 */
interface LocaleSwitchState {
  pendingLocale: AppLocale | null;
  setPendingLocale: (locale: AppLocale | null) => void;
}

export const useLocaleSwitchStore = create<LocaleSwitchState>()((set) => ({
  pendingLocale: null,
  setPendingLocale: (pendingLocale) => set({ pendingLocale }),
}));
