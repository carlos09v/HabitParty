import { RouteLoadingAnnouncement } from "@/components/layout/RouteLoadingAnnouncement";

/**
 * Skeleton estrutural da rota `/dashboard` (Server Component síncrono) alinhado à geometria real
 * do `DashboardMain` (Briefing com 4 KPIs em @container, Resumo de Listas, 5 abas de filtro +
 * linhas separadas da TaskTable e Rail Direito com 4 widgets) para minimizar CLS durante streaming RSC.
 */
export function DashboardSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex h-full w-full overflow-hidden animate-pulse motion-reduce:animate-none"
    >
      <RouteLoadingAnnouncement route="dashboard" />

      {/* Área Principal (espelha @container e padding exato de DashboardMain) */}
      <div className="@container flex-1 min-w-0 h-full overflow-hidden flex flex-col p-3.5 sm:p-4 md:p-5 pb-24 xl:pb-5 gap-4 sm:gap-5">
        {/* Briefing Card + 4 KPI Cards */}
        <div className="w-full shrink-0 rounded-2xl border border-neutral-700/60 dark:border-primary/25 bg-card/60 dark:bg-surface/40 p-3.5 @lg:p-4 flex flex-col gap-3 @lg:gap-3.5">
          <div className="flex flex-col @xl:flex-row @xl:items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="h-3.5 w-32 rounded bg-neutral-700/45 dark:bg-white/8" />
              <div className="h-7 w-56 rounded-lg bg-neutral-700/60 dark:bg-white/10" />
              <div className="h-4 w-72 max-w-full rounded-md bg-neutral-700/40 dark:bg-white/6" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-28 rounded-xl bg-neutral-700/50 dark:bg-white/10" />
              <div className="h-8 w-20 rounded-xl bg-neutral-700/40 dark:bg-white/6" />
            </div>
          </div>

          <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-[74px] rounded-xl border border-neutral-700/60 dark:border-white/10 bg-surface/60 dark:bg-white/5 p-2.5 sm:p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-700/45 dark:bg-white/10 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="h-3 w-20 rounded bg-neutral-700/45 dark:bg-white/8" />
                  <div className="h-5 w-24 rounded bg-neutral-700/60 dark:bg-white/12" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo das Listas */}
        <div className="flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-36 rounded bg-neutral-700/60 dark:bg-white/10" />
              <div className="h-5 w-10 rounded-md bg-neutral-700/45 dark:bg-white/8" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-20 rounded-lg bg-neutral-700/40 dark:bg-white/6" />
              <div className="h-7 w-24 rounded-lg bg-neutral-700/50 dark:bg-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-6 gap-2.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-[88px] rounded-xl border border-neutral-700/60 dark:border-primary/20 bg-card/60 dark:bg-surface/40 p-3 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-neutral-700/50 dark:bg-white/10 shrink-0" />
                  <div className="h-4 w-24 rounded bg-neutral-700/50 dark:bg-white/10" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-700/40 dark:bg-white/8" />
              </div>
            ))}
          </div>
        </div>

        {/* Painel de Tarefas */}
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-28 rounded bg-neutral-700/60 dark:bg-white/10" />
            <div className="h-5 w-8 rounded-md bg-neutral-700/45 dark:bg-white/8" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="h-8 w-20 rounded-lg bg-neutral-700/50 dark:bg-white/8 shrink-0"
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="h-8 w-44 rounded-lg bg-neutral-700/40 dark:bg-white/8" />
              <div className="h-8 w-8 rounded-lg bg-neutral-700/40 dark:bg-white/8" />
              <div className="h-8 w-28 rounded-lg bg-neutral-700/50 dark:bg-white/10" />
            </div>
          </div>

          {/* Linhas separadas (espelha TaskTable ul gap-1.5) */}
          <div className="flex flex-col gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 rounded-xl border border-neutral-700/60 dark:border-primary/20 bg-card/55 dark:bg-surface/35"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-5 w-5 rounded-md bg-neutral-700/50 dark:bg-white/10 shrink-0" />
                  <div className="h-4 w-2/3 max-w-xs rounded bg-neutral-700/50 dark:bg-white/10" />
                </div>
                <div className="h-5 w-16 rounded-md bg-neutral-700/40 dark:bg-white/8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rail Direito (xl+) — 4 widgets: WeeklyCalendar, Activities, Economy, Party */}
      <div className="hidden xl:flex shrink-0 w-[320px] 2xl:w-[345px] border-l border-neutral-700/60 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/15 px-4 2xl:px-5 py-5 flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-2.5">
          <div className="h-5 w-32 rounded bg-neutral-700/60 dark:bg-white/10" />
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-14 rounded-lg bg-neutral-700/40 dark:bg-white/8"
              />
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-neutral-700/50 dark:bg-white/10" />

        <div className="flex flex-col gap-2">
          <div className="h-5 w-36 rounded bg-neutral-700/60 dark:bg-white/10" />
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-11 rounded-lg bg-neutral-700/40 dark:bg-white/8"
            />
          ))}
        </div>

        <div className="h-px w-full bg-neutral-700/50 dark:bg-white/10" />

        <div className="flex flex-col gap-2">
          <div className="h-5 w-28 rounded bg-neutral-700/60 dark:bg-white/10" />
          <div className="h-28 rounded-lg bg-neutral-700/40 dark:bg-white/8" />
        </div>

        <div className="h-px w-full bg-neutral-700/50 dark:bg-white/10" />

        <div className="flex flex-col gap-2">
          <div className="h-5 w-32 rounded bg-neutral-700/60 dark:bg-white/10" />
          <div className="h-16 rounded-lg bg-neutral-700/40 dark:bg-white/8" />
        </div>
      </div>
    </div>
  );
}
