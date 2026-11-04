"use client";

import { useTranslations } from "next-intl";
import { Loading } from "@/components/ui/Loading";

export type MainRouteLoadingId =
  | "dashboard"
  | "tasks"
  | "focus"
  | "rewards"
  | "inventory"
  | "history"
  | "help"
  | "admin"
  | "settings";

interface RouteLoadingProps {
  route?: MainRouteLoadingId;
  label?: string;
}

const ROUTE_LABEL_KEYS = {
  dashboard: "dashboard.loading",
  tasks: "tasks.loading.label",
  focus: "focus.loading.ariaLabel",
  rewards: "rewards.loading.label",
  inventory: "inventory.loading.label",
  history: "history.loading.ariaLabel",
  help: "help.loading.label",
  admin: "admin.loading.label",
  settings: "settings.loading.label",
} as const;

/**
 * Componente reutilizável de estado de carregamento (fallback síncrono de `loading.tsx`)
 * para as páginas internas da área autenticada `(main)`.
 *
 * Por ser um Client Component síncrono que lê `useTranslations()` do provider `(main)`
 * já montado, permite exibir o fallback imediatamente na navegação sem suspender em `cookies()`.
 */
export function RouteLoading({ route, label }: RouteLoadingProps) {
  const t = useTranslations();
  const resolvedLabel =
    label ?? (route ? t(ROUTE_LABEL_KEYS[route]) : undefined);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <Loading size="lg" label={resolvedLabel} />
    </div>
  );
}
