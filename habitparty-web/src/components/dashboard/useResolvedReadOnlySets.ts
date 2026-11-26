"use client";

import { useMemo } from "react";
import { buildReadOnlySets } from "@/utils/taskMapper";

const EMPTY_READONLY_SET: ReadonlySet<string> = new Set();

/**
 * Reutiliza os conjuntos read-only pré-computados quando fornecidos via props
 * ou computa fallback memoizado a partir de `workspaces` e `columns`.
 */
export function useResolvedReadOnlySets(
  workspaces: ReadonlyArray<{ id?: string; isReadOnly?: boolean }>,
  columns?: ReadonlyArray<{
    id?: string;
    workspaceId?: string;
    isReadOnly?: boolean;
  }>,
  propReadOnlyWorkspaceIds?: ReadonlySet<string>,
  propReadOnlyColumnIds?: ReadonlySet<string>,
): {
  readOnlyWorkspaceIds: ReadonlySet<string>;
  readOnlyColumnIds: ReadonlySet<string>;
} {
  const fallbackReadOnlySets = useMemo(
    () =>
      propReadOnlyWorkspaceIds && propReadOnlyColumnIds
        ? null
        : buildReadOnlySets(workspaces, columns),
    [propReadOnlyWorkspaceIds, propReadOnlyColumnIds, workspaces, columns],
  );

  return {
    readOnlyWorkspaceIds:
      propReadOnlyWorkspaceIds ??
      fallbackReadOnlySets?.readOnlyWorkspaceIds ??
      EMPTY_READONLY_SET,
    readOnlyColumnIds:
      propReadOnlyColumnIds ??
      fallbackReadOnlySets?.readOnlyColumnIds ??
      EMPTY_READONLY_SET,
  };
}
