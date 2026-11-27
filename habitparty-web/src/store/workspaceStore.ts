import { create } from "zustand";
import type { components } from "@/api/schema";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];

/**
 * Janela (ms) compatível com `private30` (`stale: 180s`) durante a qual o Router Cache
 * do cliente pode servir um snapshot RSC anterior a uma reordenação otimista via `/api/tasks/move`.
 */
const BOARD_CACHE_STALE_WINDOW_MS = 190_000;

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isSwitchingWorkspace: boolean;
  staleBoardWorkspaces: Record<string, number>;
  dashboardBoardStaleAt: number | null;
  init: (data: { workspaces: Workspace[]; activeWorkspaceId: string }) => void;
  setActiveWorkspaceId: (id: string) => void;
  setIsSwitchingWorkspace: (switching: boolean) => void;
  markBoardOrderDirty: (workspaceId?: string | null) => void;
  consumeWorkspaceBoardStale: (workspaceId?: string | null) => boolean;
  consumeDashboardBoardStale: () => boolean;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isSwitchingWorkspace: false,
  staleBoardWorkspaces: {},
  dashboardBoardStaleAt: null,
  init: ({ workspaces, activeWorkspaceId }) =>
    set({ workspaces, activeWorkspaceId }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  setIsSwitchingWorkspace: (isSwitchingWorkspace) =>
    set({ isSwitchingWorkspace }),
  markBoardOrderDirty: (workspaceId) => {
    const now = Date.now();
    set((state) => ({
      dashboardBoardStaleAt: now,
      staleBoardWorkspaces: workspaceId
        ? { ...state.staleBoardWorkspaces, [workspaceId]: now }
        : state.staleBoardWorkspaces,
    }));
  },
  consumeWorkspaceBoardStale: (workspaceId) => {
    if (!workspaceId) return false;
    const markedAt = get().staleBoardWorkspaces[workspaceId];
    if (!markedAt) return false;
    const isWithinWindow = Date.now() - markedAt < BOARD_CACHE_STALE_WINDOW_MS;
    set((state) => {
      const next = { ...state.staleBoardWorkspaces };
      delete next[workspaceId];
      return { staleBoardWorkspaces: next };
    });
    return isWithinWindow;
  },
  consumeDashboardBoardStale: () => {
    const markedAt = get().dashboardBoardStaleAt;
    if (!markedAt) return false;
    const isWithinWindow = Date.now() - markedAt < BOARD_CACHE_STALE_WINDOW_MS;
    set({ dashboardBoardStaleAt: null });
    return isWithinWindow;
  },
}));
