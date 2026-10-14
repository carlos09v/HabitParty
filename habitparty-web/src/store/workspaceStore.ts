import { create } from "zustand";
import type { components } from "@/api/schema";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  init: (data: { workspaces: Workspace[]; activeWorkspaceId: string }) => void;
  setActiveWorkspaceId: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  activeWorkspaceId: null,
  init: ({ workspaces, activeWorkspaceId }) =>
    set({ workspaces, activeWorkspaceId }),
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
}));
