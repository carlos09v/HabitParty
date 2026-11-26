"use client";

import { useCallback, useState } from "react";

/**
 * Gerencia o estado de confirmação de ações destrutivas em modais sob demanda,
 * fechando o diálogo antes de disparar o callback confirmado.
 */
export function useConfirmationDialog<T>() {
  const [pending, setPending] = useState<T | null>(null);

  const request = useCallback((payload: T) => {
    setPending(payload);
  }, []);

  const close = useCallback(() => {
    setPending(null);
  }, []);

  const confirm = useCallback(
    (onConfirm: (payload: T) => void) => {
      if (pending === null) return;
      const current = pending;
      setPending(null);
      onConfirm(current);
    },
    [pending],
  );

  return {
    pending,
    isOpen: pending !== null,
    request,
    close,
    confirm,
  };
}
