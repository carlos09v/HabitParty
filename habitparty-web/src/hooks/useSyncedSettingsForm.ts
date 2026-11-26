"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function areFieldValuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }
  return false;
}

/**
 * Sincroniza um formulário controlado com valores persistidos (`persisted`) usando baseline diffing:
 * atualizações externas (hidratação/refresh do `userStore`) só sobrescrevem campos que ainda não
 * foram modificados localmente pelo usuário.
 */
export function useSyncedSettingsForm<T extends Record<string, unknown>>(
  persisted: T,
  options?: { resetKey?: string | number | null },
) {
  const resetKey = options?.resetKey;
  const [values, setValues] = useState<T>(persisted);
  const syncedRef = useRef<T>(persisted);
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKeyRef.current !== resetKey) {
      resetKeyRef.current = resetKey;
      syncedRef.current = persisted;
      setValues(persisted);
      return;
    }

    const prevSynced = syncedRef.current;
    const keys = Object.keys(persisted) as Array<keyof T>;
    const hasPersistedChange = keys.some(
      (key) => !areFieldValuesEqual(prevSynced[key], persisted[key]),
    );
    if (!hasPersistedChange) return;

    syncedRef.current = persisted;
    setValues((current) => {
      let changed = false;
      const next = { ...current };
      for (const key of keys) {
        if (
          !areFieldValuesEqual(prevSynced[key], persisted[key]) &&
          areFieldValuesEqual(current[key], prevSynced[key])
        ) {
          next[key] = persisted[key];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [persisted, resetKey]);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) =>
      areFieldValuesEqual(prev[key], value) ? prev : { ...prev, [key]: value },
    );
  }, []);

  const markSaved = useCallback((submitted: T, normalized?: Partial<T>) => {
    const nextSynced = { ...syncedRef.current };
    for (const key of Object.keys(submitted) as Array<keyof T>) {
      nextSynced[key] =
        normalized && key in normalized
          ? (normalized[key] as T[keyof T])
          : submitted[key];
    }
    syncedRef.current = nextSynced;

    if (normalized) {
      setValues((current) => {
        let changed = false;
        const next = { ...current };
        for (const key of Object.keys(normalized) as Array<keyof T>) {
          const normVal = normalized[key] as T[keyof T];
          if (
            areFieldValuesEqual(current[key], submitted[key]) &&
            !areFieldValuesEqual(current[key], normVal)
          ) {
            next[key] = normVal;
            changed = true;
          }
        }
        return changed ? next : current;
      });
    }
  }, []);

  const isDirty = (Object.keys(persisted) as Array<keyof T>).some(
    (key) => !areFieldValuesEqual(values[key], persisted[key]),
  );

  return {
    values,
    setValues,
    setField,
    markSaved,
    isDirty,
  };
}
