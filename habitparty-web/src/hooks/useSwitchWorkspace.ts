"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useProgressStore } from "@/store/progressStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import {
  replaceUrlSearchParams,
  setActiveWorkspaceCookie,
} from "@/utils/urlParams";

const WORKSPACE_SCOPED_URL_PARAMS = ["columnId", "createColumn", "page"];

export interface SwitchWorkspaceOptions {
  /** Parâmetros extras na URL (ex: `{ q: searchQuery }` ao migrar busca entre ambientes). */
  extraParams?: Record<string, string | null | undefined>;
  /** Força navegação server-side mesmo quando já estiver no Dashboard global. */
  forceNavigation?: boolean;
}

/**
 * Centraliza a troca de workspace ativo (Zustand + cookie + URL + barra de progresso).
 * No `/dashboard` (escopo global multi-ambiente), a troca atualiza o store e a URL
 * instantaneamente via `replaceState` sem acionar overlay de loading nem recarregar o RSC.
 */
export function useSwitchWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);

  const switchWorkspace = useCallback(
    (id: string, options?: SwitchWorkspaceOptions) => {
      if (!id) return;
      const isDashboardRoute = Boolean(pathname?.startsWith("/dashboard"));
      const isTasksRoute = Boolean(pathname?.startsWith("/tasks"));
      const isSame = id === activeWorkspaceId;
      if (isSame && !options?.extraParams && !options?.forceNavigation) return;

      setActiveWorkspaceId(id);
      setActiveWorkspaceCookie(id);

      const params = new URLSearchParams(
        searchParams ? searchParams.toString() : "",
      );
      for (const scopedKey of WORKSPACE_SCOPED_URL_PARAMS) {
        params.delete(scopedKey);
      }
      params.set("workspaceId", id);
      if (options?.extraParams) {
        for (const [key, value] of Object.entries(options.extraParams)) {
          if (value === null || value === undefined || value === "") {
            params.delete(key);
          } else {
            params.set(key, value);
          }
        }
      }
      const nextSearch = params.toString();

      // Dashboard já possui todos os workspaces carregados em memória: troca em 0ms sem RouteLoading
      if (isDashboardRoute && !options?.forceNavigation) {
        replaceUrlSearchParams((urlParams) => {
          for (const scopedKey of WORKSPACE_SCOPED_URL_PARAMS) {
            urlParams.delete(scopedKey);
          }
          urlParams.set("workspaceId", id);
          if (options?.extraParams) {
            for (const [key, value] of Object.entries(options.extraParams)) {
              if (value === null || value === undefined || value === "") {
                urlParams.delete(key);
              } else {
                urlParams.set(key, value);
              }
            }
          }
        });
        return;
      }

      if (isTasksRoute || options?.forceNavigation) {
        useWorkspaceStore.setState({ isSwitchingWorkspace: true });
        useProgressStore.getState().start("workspace-switch");
      }

      router.push(nextSearch ? `?${nextSearch}` : pathname || "/tasks");
    },
    [activeWorkspaceId, pathname, router, searchParams, setActiveWorkspaceId],
  );

  return {
    switchWorkspace,
    isDashboardRoute: Boolean(pathname?.startsWith("/dashboard")),
    isTasksRoute: Boolean(pathname?.startsWith("/tasks")),
  };
}
