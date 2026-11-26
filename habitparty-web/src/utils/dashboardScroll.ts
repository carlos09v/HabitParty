/**
 * Rola suavemente até o painel de tarefas do Dashboard respeitando `prefers-reduced-motion`.
 */
export function scrollToDashboardTasksPanel(): void {
  if (typeof window === "undefined") return;
  const panel = document.getElementById("dashboard-tasks-panel");
  if (!panel) return;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  panel.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}
