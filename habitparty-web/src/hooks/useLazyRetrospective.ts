"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionState } from "@/actions/types";
import type { UserRetrospectiveData } from "@/types/social";

export type LazyLoadStatus = "idle" | "loading" | "ready" | "error";

interface UseLazyRetrospectiveOptions {
  initialRetrospective?: UserRetrospectiveData | null;
  enabled?: boolean;
  fetcher: (year?: number) => Promise<ActionState<UserRetrospectiveData>>;
}

/**
 * Gerencia o carregamento sob demanda (máquina de estados `idle | loading | ready | error`)
 * da retrospectiva anual do perfil próprio ou público, evitando flash de erro/cadeado no 1º frame
 * e respeitando troca de ano sem sobrescrever a seleção atual com props SSR.
 */
export function useLazyRetrospective({
  initialRetrospective = null,
  enabled = true,
  fetcher,
}: UseLazyRetrospectiveOptions) {
  const [retrospective, setRetrospective] =
    useState<UserRetrospectiveData | null>(initialRetrospective);
  const [status, setStatus] = useState<LazyLoadStatus>(
    initialRetrospective ? "ready" : "idle",
  );

  const retrospectiveRef = useRef<UserRetrospectiveData | null>(
    initialRetrospective,
  );
  const loadedRef = useRef(Boolean(initialRetrospective));
  const selectedYearRef = useRef<number | null>(
    initialRetrospective?.year ?? null,
  );
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    retrospectiveRef.current = retrospective;
  }, [retrospective]);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    if (!initialRetrospective) return;
    if (
      selectedYearRef.current === null ||
      selectedYearRef.current === initialRetrospective.year
    ) {
      retrospectiveRef.current = initialRetrospective;
      selectedYearRef.current = initialRetrospective.year;
      setRetrospective(initialRetrospective);
    }
    loadedRef.current = true;
    setStatus("ready");
  }, [initialRetrospective]);

  const ensureLoaded = useCallback(
    async (
      force = false,
      year?: number,
    ): Promise<UserRetrospectiveData | null> => {
      if (!enabled) return null;
      if (
        !force &&
        loadedRef.current &&
        (year === undefined || retrospectiveRef.current?.year === year)
      ) {
        return retrospectiveRef.current;
      }

      loadedRef.current = true;
      setStatus("loading");
      try {
        const res = await fetcherRef.current(year);
        if (res.success && res.data) {
          retrospectiveRef.current = res.data;
          selectedYearRef.current = res.data.year;
          setRetrospective(res.data);
          setStatus("ready");
          return res.data;
        }
        loadedRef.current = false;
        setStatus("error");
        return null;
      } catch {
        loadedRef.current = false;
        setStatus("error");
        return null;
      }
    },
    [enabled],
  );

  const setRetrospectiveData = useCallback((next: UserRetrospectiveData) => {
    retrospectiveRef.current = next;
    selectedYearRef.current = next.year;
    loadedRef.current = true;
    setRetrospective(next);
    setStatus("ready");
  }, []);

  return {
    retrospective,
    status,
    isLoading: !retrospective && (status === "idle" || status === "loading"),
    loadError: status === "error" && !retrospective,
    ensureLoaded,
    setRetrospectiveData,
  };
}
