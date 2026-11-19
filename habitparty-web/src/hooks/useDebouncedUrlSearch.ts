"use client";

import { useEffect, useRef, useState } from "react";

interface UseDebouncedUrlSearchOptions {
  currentSearch: string;
  onDebouncedChange: (trimmedQuery: string) => void;
  delayMs?: number;
}

/**
 * Sincroniza um campo de busca local com a URL/servidor usando debounce,
 * evitando disparos repetidos ou sobrescrita de estado ao navegar.
 */
export function useDebouncedUrlSearch({
  currentSearch,
  onDebouncedChange,
  delayMs = 350,
}: UseDebouncedUrlSearchOptions) {
  const [searchInput, setSearchInput] = useState(currentSearch);
  const onDebouncedChangeRef = useRef(onDebouncedChange);
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === currentSearch.trim()) return;

    const timer = window.setTimeout(() => {
      onDebouncedChangeRef.current(trimmed);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [searchInput, currentSearch, delayMs]);

  return {
    searchInput,
    setSearchInput,
  };
}
