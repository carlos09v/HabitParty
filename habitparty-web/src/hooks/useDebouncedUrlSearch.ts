"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDebouncedUrlSearchOptions {
  currentSearch: string;
  onDebouncedChange: (trimmedQuery: string) => void;
  delayMs?: number;
}

/**
 * Sincroniza um campo de busca local com a URL/servidor usando debounce:
 * - Não sobrescreve digitação ativa quando uma resposta RSC em voo conclui.
 * - Expõe `cancel()` para abortar debounces pendentes ao trocar aba/filtro.
 */
export function useDebouncedUrlSearch({
  currentSearch,
  onDebouncedChange,
  delayMs = 350,
}: UseDebouncedUrlSearchOptions) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  const timerRef = useRef<number | null>(null);
  const lastCommittedRef = useRef(currentSearch.trim());
  const latestInputRef = useRef(currentSearch);
  const prevServerSearchRef = useRef(currentSearch);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    latestInputRef.current = searchInput;
  }, [searchInput]);

  // Só sincroniza de fora (ex.: botão "Limpar filtros" ou back/forward do navegador)
  // quando o usuário não tem digitação mais recente pendente do que a resposta do servidor.
  useEffect(() => {
    if (currentSearch === prevServerSearchRef.current) return;
    prevServerSearchRef.current = currentSearch;

    const currentTrimmed = currentSearch.trim();
    const inputTrimmed = latestInputRef.current.trim();
    const isEchoOfLastCommit = currentTrimmed === lastCommittedRef.current;

    if (isEchoOfLastCommit && inputTrimmed !== currentTrimmed) {
      return;
    }

    lastCommittedRef.current = currentTrimmed;
    latestInputRef.current = currentSearch;
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastCommittedRef.current = latestInputRef.current.trim();
  }, []);

  /**
   * Cancela qualquer debounce pendente e redefine atomicamente o valor do input e o
   * último termo confirmado, evitando navegações fantasma ao limpar todos os filtros.
   */
  const reset = useCallback((value = "") => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const trimmed = value.trim();
    lastCommittedRef.current = trimmed;
    latestInputRef.current = value;
    setSearchInput(value);
  }, []);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === lastCommittedRef.current) return;

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      lastCommittedRef.current = trimmed;
      onDebouncedChangeRef.current(trimmed);
    }, delayMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [searchInput, delayMs]);

  return {
    searchInput,
    setSearchInput,
    cancel,
    reset,
  };
}
