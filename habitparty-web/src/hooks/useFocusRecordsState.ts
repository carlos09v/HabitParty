"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getFocusActivityRecordsPage,
  getFocusRecordsPage,
  getFocusSummary,
} from "@/actions/focusActions";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { dispatchTaskFocusRecorded } from "@/hooks/useFocusTaskSync";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusRecord,
  FocusSummaryData,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { mapFocusRecords } from "@/utils/focusMapper";
import { executeDeleteFocusRecord } from "@/utils/focusRecordMutations";

const GLOBAL_SUMMARY_KEY = "__GLOBAL__";

interface UseFocusRecordsStateParams {
  initialActivities: FocusActivity[];
  initialAllInventoryItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
  initialSummary?: FocusSummaryData | null;
  initialSummaryActivityId?: string | null;
  initialTotalRecordsCount?: number;
  initialHasMoreRecords?: boolean;
  initialLoadedRecordsPage?: number;
  initialRecordsPageSize?: number;
  initialTimeZone?: string | null;
  selectedActivityId: string | null;
}

/**
 * Gerencia resumo agregado do backend (`GET /focus-records/summary`), paginação por escopo,
 * patches otimistas, reconciliação de registros e virada da meia-noite da tela de Foco.
 */
export function useFocusRecordsState({
  initialActivities,
  initialAllInventoryItems,
  initialRecords,
  initialSummary = null,
  initialSummaryActivityId = null,
  initialTotalRecordsCount,
  initialHasMoreRecords = false,
  initialLoadedRecordsPage = 0,
  initialRecordsPageSize = 20,
  initialTimeZone = null,
  selectedActivityId,
}: UseFocusRecordsStateParams) {
  const t = useTranslations("focus.container");
  const storeTimeZone = useUserStore((s) => s.user?.timezone);
  const effectiveTimeZone = storeTimeZone ?? initialTimeZone;
  const todayIso = useMidnightRollover(effectiveTimeZone);

  const initialScopeKey = initialSummaryActivityId ?? GLOBAL_SUMMARY_KEY;
  const activeScopeKey = selectedActivityId ?? GLOBAL_SUMMARY_KEY;

  const [summaryByScope, setSummaryByScope] = useState<
    Record<string, FocusSummaryData | null>
  >(() => (initialSummary ? { [initialScopeKey]: initialSummary } : {}));
  const summaryByScopeRef = useRef(summaryByScope);
  useEffect(() => {
    summaryByScopeRef.current = summaryByScope;
  }, [summaryByScope]);

  const [extraRecords, setExtraRecords] = useState<FocusRecord[]>([]);
  const [editedRecordsById, setEditedRecordsById] = useState<
    Record<string, FocusRecord>
  >({});
  const [deletedActivityIds, setDeletedActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletedRecordIds, setDeletedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [preservedActivityIds, setPreservedActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadedRecordsPage, setLoadedRecordsPage] = useState(
    initialLoadedRecordsPage,
  );
  const [hasMoreServerRecords, setHasMoreServerRecords] = useState(
    initialHasMoreRecords,
  );
  const [totalServerRecords, setTotalServerRecords] = useState(
    initialTotalRecordsCount ?? initialRecords.length,
  );
  const [activityPagination, setActivityPagination] = useState<
    Record<
      string,
      {
        nextPage: number;
        hasMore: boolean;
        totalElements: number;
        initialized: boolean;
      }
    >
  >({});
  const activityPaginationRef = useRef(activityPagination);
  useEffect(() => {
    activityPaginationRef.current = activityPagination;
  }, [activityPagination]);

  const [isLoadingMoreRecords, setIsLoadingMoreRecords] = useState(false);
  const hasPaginatedBeyondInitialRef = useRef(false);
  const filterRequestSeqRef = useRef(0);
  const loadMoreSeqRef = useRef(0);

  // Reconcilia estado otimista, cache de resumo e páginas extras sempre que o servidor revalidar
  useEffect(() => {
    filterRequestSeqRef.current += 1;
    loadMoreSeqRef.current += 1;
    setEditedRecordsById({});
    setDeletedActivityIds(new Set());
    setDeletedRecordIds(new Set());
    setPreservedActivityIds(new Set());
    setActivityPagination({});
    setTotalServerRecords(initialTotalRecordsCount ?? initialRecords.length);
    setSummaryByScope(
      initialSummary ? { [initialScopeKey]: initialSummary } : {},
    );

    if (!hasPaginatedBeyondInitialRef.current) {
      setExtraRecords([]);
      setLoadedRecordsPage(initialLoadedRecordsPage);
      setHasMoreServerRecords(initialHasMoreRecords);
    } else {
      const freshInitialIds = new Set(initialRecords.map((rec) => rec.id));
      setExtraRecords((prev) =>
        prev.filter((rec) => !freshInitialIds.has(rec.id)),
      );
      setLoadedRecordsPage((prev) => Math.max(prev, initialLoadedRecordsPage));
      setHasMoreServerRecords((prev) => prev || initialHasMoreRecords);
    }
  }, [
    initialRecords,
    initialSummary,
    initialScopeKey,
    initialHasMoreRecords,
    initialLoadedRecordsPage,
    initialTotalRecordsCount,
  ]);

  const refreshSummaryForScope = useCallback(
    async (activityId: string | null) => {
      const scopeKey = activityId ?? GLOBAL_SUMMARY_KEY;
      const reqSeq = ++filterRequestSeqRef.current;
      const res = await getFocusSummary(activityId);
      if (reqSeq !== filterRequestSeqRef.current) return;
      if (res.success && res.data) {
        setSummaryByScope((prev) => ({
          ...prev,
          [scopeKey]: res.data ?? null,
        }));
      }
    },
    [],
  );

  // Ao trocar filtro de atividade (ou virar meia-noite), busca resumo exato + 1ª página da atividade
  // com token anti-race para descartar respostas obsoletas.
  useEffect(() => {
    const scopeKey = selectedActivityId ?? GLOBAL_SUMMARY_KEY;
    const hasCachedSummary = scopeKey in summaryByScopeRef.current;
    const hasLoadedActivityPage =
      !selectedActivityId ||
      Boolean(activityPaginationRef.current[selectedActivityId]?.initialized);

    if (hasCachedSummary && hasLoadedActivityPage) {
      return;
    }

    const reqSeq = ++filterRequestSeqRef.current;
    let cancelled = false;

    void (async () => {
      const [summaryRes, activityPageRes] = await Promise.all([
        hasCachedSummary
          ? Promise.resolve(null)
          : getFocusSummary(selectedActivityId),
        selectedActivityId && !hasLoadedActivityPage
          ? getFocusActivityRecordsPage(selectedActivityId, 0)
          : Promise.resolve(null),
      ]);

      if (cancelled || reqSeq !== filterRequestSeqRef.current) return;

      if (summaryRes?.success && summaryRes.data) {
        setSummaryByScope((prev) => ({
          ...prev,
          [scopeKey]: summaryRes.data ?? null,
        }));
      }

      if (
        selectedActivityId &&
        activityPageRes?.success &&
        activityPageRes.data
      ) {
        const pageData = activityPageRes.data;
        const mapped = mapFocusRecords(
          pageData.records,
          initialActivities,
          effectiveTimeZone,
          initialAllInventoryItems,
        );
        if (mapped.length > 0) {
          setExtraRecords((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const nextNew = mapped.filter((r) => !existingIds.has(r.id));
            return nextNew.length > 0 ? [...prev, ...nextNew] : prev;
          });
        }
        setActivityPagination((prev) => ({
          ...prev,
          [selectedActivityId]: {
            nextPage: pageData.currentPage + 1,
            hasMore: pageData.hasMore,
            totalElements: pageData.totalElements,
            initialized: true,
          },
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedActivityId,
    initialActivities,
    initialAllInventoryItems,
    effectiveTimeZone,
  ]);

  // Ao virar meia-noite, invalida o cache de resumo e recarrega o resumo do escopo atual
  const prevTodayIsoRef = useRef(todayIso);
  useEffect(() => {
    if (prevTodayIsoRef.current === todayIso) return;
    prevTodayIsoRef.current = todayIso;
    setSummaryByScope({});
    void refreshSummaryForScope(selectedActivityId);
  }, [todayIso, selectedActivityId, refreshSummaryForScope]);

  const allRecords = useMemo(() => {
    const activityById = new Map(
      initialActivities.map((activity) => [activity.id, activity]),
    );
    let needsSort = extraRecords.length > 0;

    const transformRecord = (rec: FocusRecord): FocusRecord | null => {
      if (deletedRecordIds.has(rec.id)) {
        return null;
      }
      // Aplica edições ANTES de checar deletedActivityIds (ex.: registro movido de/para atividade excluída)
      const patched = editedRecordsById[rec.id] ?? rec;
      if (patched !== rec && patched.endTime !== rec.endTime) {
        needsSort = true;
      }
      if (
        patched.focusActivityId &&
        deletedActivityIds.has(patched.focusActivityId)
      ) {
        return null;
      }
      if (
        patched.focusActivityId &&
        preservedActivityIds.has(patched.focusActivityId)
      ) {
        return {
          ...patched,
          focusActivityId: undefined,
          activityName: undefined,
          activityIcon: undefined,
        };
      }
      if (patched.focusActivityId) {
        const liveActivity = activityById.get(patched.focusActivityId);
        if (
          liveActivity &&
          (patched.activityName !== liveActivity.name ||
            patched.activityIcon !== liveActivity.icon)
        ) {
          return {
            ...patched,
            activityName: liveActivity.name,
            activityIcon: liveActivity.icon,
          };
        }
      }
      return patched;
    };

    const seen = new Set<string>();
    const merged: FocusRecord[] = [];
    for (const rawList of [initialRecords, extraRecords]) {
      for (const rawRec of rawList) {
        if (seen.has(rawRec.id)) continue;
        seen.add(rawRec.id);
        const transformed = transformRecord(rawRec);
        if (transformed) merged.push(transformed);
      }
    }

    if (!needsSort) {
      return merged;
    }

    const withEndMs = merged.map((rec) => ({
      rec,
      endMs: Date.parse(rec.endTime) || 0,
    }));
    withEndMs.sort((a, b) => b.endMs - a.endMs);
    return withEndMs.map((item) => item.rec);
  }, [
    initialActivities,
    initialRecords,
    extraRecords,
    editedRecordsById,
    deletedRecordIds,
    deletedActivityIds,
    preservedActivityIds,
  ]);

  const allRecordsRef = useRef(allRecords);
  useEffect(() => {
    allRecordsRef.current = allRecords;
  }, [allRecords]);

  const activeSummary = summaryByScope[activeScopeKey] ?? null;

  const analytics = useFocusAnalytics({
    initialActivities,
    initialRecords: allRecords,
    selectedActivityId,
    todayDateKey: todayIso,
    initialTimeZone: effectiveTimeZone,
    activeSummary,
  });

  const selectedActivityPagination = selectedActivityId
    ? activityPagination[selectedActivityId]
    : undefined;

  const hasMoreRecordsToShow = selectedActivityId
    ? analytics.recentRecords.length < analytics.relevantRecordsCount ||
      (selectedActivityPagination
        ? selectedActivityPagination.hasMore
        : hasMoreServerRecords)
    : analytics.recentRecords.length < analytics.relevantRecordsCount ||
      hasMoreServerRecords;

  const displayedTotalRecordsCount = selectedActivityId
    ? selectedActivityPagination
      ? Math.max(
          analytics.relevantRecordsCount,
          selectedActivityPagination.totalElements,
        )
      : activeSummary
        ? Math.max(
            analytics.relevantRecordsCount,
            activeSummary.totalRecordsCount,
          )
        : analytics.relevantRecordsCount
    : Math.max(totalServerRecords, allRecords.length);

  // Com o resumo agregado do backend (`GET /focus-records/summary`), as métricas totais cobrem 100% do histórico
  const isPartialTotalWindow = Boolean(
    !activeSummary &&
      hasMoreServerRecords &&
      (!selectedActivityId || (selectedActivityPagination?.hasMore ?? true)),
  );

  const handleShowMoreRecords = useCallback(async () => {
    if (isLoadingMoreRecords) {
      return;
    }

    const nextVisibleTarget = analytics.recentRecords.length + 10;
    const serverHasMoreForCurrentScope = selectedActivityId
      ? selectedActivityPagination
        ? selectedActivityPagination.hasMore
        : hasMoreServerRecords
      : hasMoreServerRecords;

    if (
      analytics.recentRecords.length < analytics.relevantRecordsCount &&
      (nextVisibleTarget <= analytics.relevantRecordsCount ||
        !serverHasMoreForCurrentScope)
    ) {
      analytics.showMoreRecords(10);
      return;
    }

    if (!serverHasMoreForCurrentScope) {
      analytics.showMoreRecords(10);
      return;
    }

    const reqSeq = ++loadMoreSeqRef.current;
    const targetActivityId = selectedActivityId;
    setIsLoadingMoreRecords(true);
    try {
      if (targetActivityId) {
        const nextPage =
          selectedActivityPagination?.nextPage ??
          Math.floor(analytics.relevantRecordsCount / 20);
        const res = await getFocusActivityRecordsPage(
          targetActivityId,
          nextPage,
        );
        if (reqSeq !== loadMoreSeqRef.current) return;
        if (!res.success || !res.data) {
          toast.error(!res.success ? res.error : t("loadMoreRecordsError"));
          return;
        }

        const mapped = mapFocusRecords(
          res.data.records,
          initialActivities,
          effectiveTimeZone,
          initialAllInventoryItems,
        );
        if (mapped.length > 0) {
          hasPaginatedBeyondInitialRef.current = true;
          setExtraRecords((prev) => [...prev, ...mapped]);
        }
        setActivityPagination((prev) => ({
          ...prev,
          [targetActivityId]: {
            nextPage: res.data.currentPage + 1,
            hasMore: res.data.hasMore,
            totalElements: res.data.totalElements,
            initialized: true,
          },
        }));
        analytics.showMoreRecords(10);
        return;
      }

      const res = await getFocusRecordsPage(
        loadedRecordsPage + 1,
        initialRecordsPageSize,
      );
      if (reqSeq !== loadMoreSeqRef.current) return;
      if (!res.success || !res.data) {
        toast.error(!res.success ? res.error : t("loadMoreRecordsError"));
        return;
      }

      hasPaginatedBeyondInitialRef.current = true;
      const mapped = mapFocusRecords(
        res.data.records,
        initialActivities,
        effectiveTimeZone,
        initialAllInventoryItems,
      );
      if (mapped.length > 0) {
        setExtraRecords((prev) => [...prev, ...mapped]);
      }
      setLoadedRecordsPage(res.data.currentPage);
      setHasMoreServerRecords(res.data.hasMore);
      setTotalServerRecords(res.data.totalElements);
      analytics.showMoreRecords(10);
    } finally {
      if (reqSeq === loadMoreSeqRef.current) {
        setIsLoadingMoreRecords(false);
      }
    }
  }, [
    analytics,
    selectedActivityId,
    selectedActivityPagination,
    hasMoreServerRecords,
    isLoadingMoreRecords,
    loadedRecordsPage,
    initialRecordsPageSize,
    initialActivities,
    initialAllInventoryItems,
    effectiveTimeZone,
    t,
  ]);

  const handleDeleteRecord = useCallback(
    async (recordId: string, deleteHistory: boolean): Promise<boolean> => {
      const deletedRecord = allRecordsRef.current.find(
        (r) => r.id === recordId,
      );
      return executeDeleteFocusRecord(
        recordId,
        {
          success: t("deleteRecordSuccess"),
          error: t("deleteRecordError"),
        },
        () => {
          setDeletedRecordIds((prev) => new Set(prev).add(recordId));
          setExtraRecords((prev) => prev.filter((r) => r.id !== recordId));
          setEditedRecordsById((prev) => {
            if (!(recordId in prev)) return prev;
            const next = { ...prev };
            delete next[recordId];
            return next;
          });
          setTotalServerRecords((prev) => Math.max(0, prev - 1));
          const activityId = deletedRecord?.focusActivityId;
          if (activityId) {
            setActivityPagination((prev) => {
              const current = prev[activityId];
              if (!current) return prev;
              return {
                ...prev,
                [activityId]: {
                  ...current,
                  totalElements: Math.max(0, current.totalElements - 1),
                },
              };
            });
          }
          if (deletedRecord?.taskId) {
            dispatchTaskFocusRecorded({
              taskId: deletedRecord.taskId,
              durationMinutes: -Math.max(1, deletedRecord.durationMinutes),
              cycles: -(deletedRecord.completedPomos ?? 0),
            });
          }
          // Invalida outros escopos e atualiza o resumo agregado do escopo atual em segundo plano
          setSummaryByScope((prev) => {
            const current = prev[activeScopeKey];
            return current ? { [activeScopeKey]: current } : {};
          });
          void refreshSummaryForScope(selectedActivityId);
        },
        deleteHistory,
        deletedRecord,
      );
    },
    [t, activeScopeKey, selectedActivityId, refreshSummaryForScope],
  );

  const handleRecordUpdated = useCallback(
    (updatedRecord: FocusRecord) => {
      const previousRecord = allRecordsRef.current.find(
        (r) => r.id === updatedRecord.id,
      );

      setEditedRecordsById((prev) => ({
        ...prev,
        [updatedRecord.id]: updatedRecord,
      }));

      setExtraRecords((prev) =>
        prev.some((r) => r.id === updatedRecord.id)
          ? prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
          : prev,
      );

      const oldActivityId = previousRecord?.focusActivityId;
      const newActivityId = updatedRecord.focusActivityId;
      if (previousRecord && oldActivityId !== newActivityId) {
        setActivityPagination((prev) => {
          const hasOld = Boolean(oldActivityId && prev[oldActivityId]);
          const hasNew = Boolean(newActivityId && prev[newActivityId]);
          if (!hasOld && !hasNew) return prev;
          const next = { ...prev };
          if (oldActivityId && next[oldActivityId]) {
            next[oldActivityId] = {
              ...next[oldActivityId],
              totalElements: Math.max(0, next[oldActivityId].totalElements - 1),
            };
          }
          if (newActivityId && next[newActivityId]) {
            next[newActivityId] = {
              ...next[newActivityId],
              totalElements: next[newActivityId].totalElements + 1,
            };
          }
          return next;
        });
      }

      // Recarrega o resumo agregado exato após edição de duração/atividade/data
      setSummaryByScope((prev) => {
        const current = prev[activeScopeKey];
        return current ? { [activeScopeKey]: current } : {};
      });
      void refreshSummaryForScope(selectedActivityId);
    },
    [activeScopeKey, selectedActivityId, refreshSummaryForScope],
  );

  const handleActivityDeleted = useCallback(
    (activityId: string, deleteHistory: boolean) => {
      if (deleteHistory) {
        const affectedRecords = allRecordsRef.current.filter(
          (r) => r.focusActivityId === activityId,
        );
        if (typeof window !== "undefined") {
          const taskDeltas = new Map<
            string,
            { minutes: number; pomos: number }
          >();
          for (const rec of affectedRecords) {
            if (!rec.taskId) continue;
            const prev = taskDeltas.get(rec.taskId) ?? { minutes: 0, pomos: 0 };
            taskDeltas.set(rec.taskId, {
              minutes: prev.minutes + Math.max(1, rec.durationMinutes),
              pomos: prev.pomos + (rec.completedPomos ?? 0),
            });
          }
          taskDeltas.forEach((delta, taskId) => {
            dispatchTaskFocusRecorded({
              taskId,
              durationMinutes: -delta.minutes,
              cycles: -delta.pomos,
            });
          });
        }
        setDeletedActivityIds((prev) => new Set(prev).add(activityId));
        setExtraRecords((prev) =>
          prev.filter((r) => r.focusActivityId !== activityId),
        );
        setTotalServerRecords((prev) =>
          Math.max(0, prev - affectedRecords.length),
        );
        setActivityPagination((prev) => {
          if (!(activityId in prev)) return prev;
          const next = { ...prev };
          delete next[activityId];
          return next;
        });
      } else {
        setPreservedActivityIds((prev) => new Set(prev).add(activityId));
        setExtraRecords((prev) =>
          prev.map((rec) =>
            rec.focusActivityId === activityId
              ? {
                  ...rec,
                  focusActivityId: undefined,
                  activityName: undefined,
                  activityIcon: undefined,
                }
              : rec,
          ),
        );
        setActivityPagination((prev) => {
          if (!(activityId in prev)) return prev;
          const next = { ...prev };
          delete next[activityId];
          return next;
        });
      }

      const nextScopeId =
        selectedActivityId === activityId ? null : selectedActivityId;
      setSummaryByScope({});
      void refreshSummaryForScope(nextScopeId);
    },
    [selectedActivityId, refreshSummaryForScope],
  );

  return {
    allRecords,
    analytics,
    todayProductiveMinutes: analytics.globalTodayProductiveMinutes,
    todayRewardableMinutes: analytics.globalTodayRewardableMinutes,
    todayDurationByActivityId: analytics.todayDurationByActivityId,
    hasMoreRecordsToShow,
    displayedTotalRecordsCount,
    isPartialTotalWindow,
    isLoadingMoreRecords,
    handleShowMoreRecords,
    handleDeleteRecord,
    handleRecordUpdated,
    handleActivityDeleted,
  };
}
