import { create } from "zustand";

/**
 * Store global de operações em andamento que devem acionar a barra fina de
 * progresso no topo (`TopProgressBar`).
 *
 * Cada operação é registrada por um `id` (ex.: "locale") com um rótulo
 * acessível opcional, anunciado por leitores de tela enquanto estiver ativa.
 */
interface ProgressState {
  tasks: Record<string, string>;
  start: (id: string, label?: string) => void;
  done: (id: string) => void;
}

export const useProgressStore = create<ProgressState>()((set) => ({
  tasks: {},
  start: (id, label = "") =>
    set((state) => ({ tasks: { ...state.tasks, [id]: label } })),
  done: (id) =>
    set((state) => {
      if (!(id in state.tasks)) return state;
      const { [id]: _removed, ...rest } = state.tasks;
      return { tasks: rest };
    }),
}));
