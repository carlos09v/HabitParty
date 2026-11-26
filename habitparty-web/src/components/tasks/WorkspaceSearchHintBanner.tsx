"use client";

import { ArrowRightLeft, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  searchTasksAcrossWorkspacesAction,
  type TaskSearchWorkspaceCountDTO,
} from "@/actions/taskActions";
import { useSwitchWorkspace } from "@/hooks/useSwitchWorkspace";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { replaceUrlSearchParams } from "@/utils/urlParams";

interface WorkspaceSearchHintBannerProps {
  searchQuery: string;
  localMatchCount: number;
}

/**
 * Dica contextual exibida apenas durante buscas quando não há resultados no Ambiente atual
 * ou quando existem tarefas correspondentes em outros Ambientes/Workspaces do usuário.
 */
export function WorkspaceSearchHintBanner({
  searchQuery,
  localMatchCount,
}: WorkspaceSearchHintBannerProps) {
  const t = useTranslations("tasks.workspaceSearchHint");
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { switchWorkspace } = useSwitchWorkspace();

  const trimmedQuery = searchQuery.trim();
  const normalizedQueryKey = trimmedQuery.toLowerCase();
  const searchCacheRef = useRef<Map<string, TaskSearchWorkspaceCountDTO[]>>(
    new Map(),
  );
  const [remoteMatches, setRemoteMatches] = useState<
    TaskSearchWorkspaceCountDTO[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invalida cache de busca entre workspaces sempre que tarefas são mutadas
  useEffect(() => {
    const handleTasksChanged = () => {
      searchCacheRef.current.clear();
    };
    window.addEventListener("habitparty:tasks-changed", handleTasksChanged);
    return () => {
      window.removeEventListener(
        "habitparty:tasks-changed",
        handleTasksChanged,
      );
    };
  }, []);

  // Limpa ?q= da URL quando o usuário esvazia o campo de busca
  useEffect(() => {
    if (trimmedQuery !== "") return;
    replaceUrlSearchParams((params) => {
      params.delete("q");
    });
  }, [trimmedQuery]);

  useEffect(() => {
    if (trimmedQuery.length < 2 || workspaces.length <= 1) {
      setRemoteMatches([]);
      setIsSearching(false);
      return;
    }

    const cached = searchCacheRef.current.get(normalizedQueryKey);
    if (cached) {
      setRemoteMatches(cached);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchTasksAcrossWorkspacesAction(trimmedQuery);
        if (!cancelled) {
          searchCacheRef.current.set(normalizedQueryKey, results);
          setRemoteMatches(results);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery, normalizedQueryKey, workspaces.length]);

  const otherWorkspaces = useMemo(
    () =>
      workspaces.filter(
        (w): w is { id: string; name?: string } =>
          Boolean(w.id) && w.id !== activeWorkspaceId,
      ),
    [workspaces, activeWorkspaceId],
  );

  const otherWorkspacesWithMatches = useMemo(
    () =>
      remoteMatches.filter(
        (m) => m.workspaceId !== activeWorkspaceId && m.count > 0,
      ),
    [remoteMatches, activeWorkspaceId],
  );

  if (trimmedQuery.length < 2 || isSearching || otherWorkspaces.length === 0) {
    return null;
  }

  const hasRemoteHits = otherWorkspacesWithMatches.length > 0;
  if (localMatchCount > 0 && !hasRemoteHits) {
    return null;
  }

  const handleSwitchWorkspace = (targetWorkspaceId: string) => {
    switchWorkspace(targetWorkspaceId, {
      extraParams: { q: trimmedQuery || null },
    });
  };

  return (
    <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-surface/80 dark:border-gold/30 dark:bg-primary-dark/25 text-xs animate-in fade-in duration-150">
      <div className="flex items-center gap-2 text-neutral-200 min-w-0">
        {hasRemoteHits ? (
          <Sparkles
            size={14}
            className="shrink-0 text-amber-800 dark:text-gold"
          />
        ) : (
          <ArrowRightLeft
            size={14}
            className="shrink-0 text-primary dark:text-gold"
          />
        )}
        <span>
          {hasRemoteHits
            ? localMatchCount === 0
              ? t("foundInOtherWorkspacesEmptyLocal")
              : t("foundInOtherWorkspacesAlso")
            : t("notFoundSwitchPrompt")}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {hasRemoteHits
          ? otherWorkspacesWithMatches.map((item) => (
              <button
                key={item.workspaceId}
                type="button"
                onClick={() => handleSwitchWorkspace(item.workspaceId)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:bg-gold/15 dark:hover:bg-gold/25 dark:border-gold/40 dark:text-gold transition-colors cursor-pointer"
              >
                <span>{item.workspaceName}</span>
                <span className="px-1.5 py-0.5 rounded-full text-tiny font-bold bg-amber-500/20 dark:bg-gold/20">
                  {item.count}
                </span>
              </button>
            ))
          : otherWorkspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSwitchWorkspace(ws.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary dark:bg-white/8 dark:hover:bg-gold/20 dark:border-white/15 dark:hover:border-gold/40 dark:text-neutral-100 dark:hover:text-gold transition-colors cursor-pointer"
              >
                <ArrowRightLeft size={11} className="shrink-0" />
                <span>
                  {t("switchToWorkspaceButton", {
                    workspace: ws.name || t("defaultWorkspaceName"),
                  })}
                </span>
              </button>
            ))}
      </div>
    </div>
  );
}
