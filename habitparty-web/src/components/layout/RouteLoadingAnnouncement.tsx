"use client";

import { useTranslations } from "next-intl";

export type MainRouteLoadingId =
  | "dashboard"
  | "tasks"
  | "focus"
  | "rewards"
  | "inventory"
  | "history"
  | "help"
  | "admin"
  | "settings"
  | "showcase";

export const ROUTE_LOADING_LABEL_KEYS = {
  dashboard: "dashboard.loading",
  tasks: "tasks.loading.label",
  focus: "focus.loading.ariaLabel",
  rewards: "rewards.loading.label",
  inventory: "inventory.loading.label",
  history: "history.loading.ariaLabel",
  help: "help.loading.label",
  admin: "admin.loading.label",
  settings: "settings.loading.label",
  showcase: "showcase.loading.ariaLabel",
} as const satisfies Record<MainRouteLoadingId, string>;

interface RouteLoadingAnnouncementProps {
  route: MainRouteLoadingId;
}

/**
 * Leaf client mínimo para anunciar o carregamento da rota em leitores de tela
 * dentro de skeletons Server Components (`loading.tsx`), lendo `useTranslations()`
 * de forma síncrona do provider `(main)` sem suspender em `cookies()`.
 */
export function RouteLoadingAnnouncement({
  route,
}: RouteLoadingAnnouncementProps) {
  const t = useTranslations();

  return (
    <output className="sr-only">{t(ROUTE_LOADING_LABEL_KEYS[route])}</output>
  );
}
