import { RouteLoadingAnnouncement } from "@/components/layout/RouteLoadingAnnouncement";

/**
 * Skeleton estrutural da rota `/tasks` (Server Component síncrono) alinhado ao padding real
 * do `TasksBoardContainer` (WelcomeCard, FilterBar e colunas Kanban com cartões de tarefas).
 */
export function TasksSkeleton() {
  return (
    <div
      aria-busy="true"
      className="flex flex-col flex-1 min-h-0 w-full gap-4 p-3.5 sm:p-4 md:p-5 animate-pulse motion-reduce:animate-none overflow-hidden"
    >
      <RouteLoadingAnnouncement route="tasks" />

      {/* WelcomeCard Skeleton */}
      <div className="h-24 rounded-2xl border border-neutral-700/60 dark:border-primary/25 bg-card/60 dark:bg-surface/40 p-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-neutral-700/50 dark:bg-white/10 shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-44 rounded bg-neutral-700/60 dark:bg-white/12" />
            <div className="h-3.5 w-64 max-w-full rounded bg-neutral-700/40 dark:bg-white/6" />
          </div>
        </div>
        <div className="hidden xl:flex items-center gap-2">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-14 w-36 rounded-xl bg-neutral-700/40 dark:bg-white/8"
            />
          ))}
        </div>
      </div>

      {/* FilterBar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-10 w-52 rounded-lg bg-neutral-700/50 dark:bg-white/8" />
          <div className="h-10 w-24 rounded-lg bg-neutral-700/40 dark:bg-white/6" />
          <div className="h-10 w-20 rounded-lg bg-neutral-700/40 dark:bg-white/6" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-28 rounded-lg bg-neutral-700/40 dark:bg-white/8" />
          <div className="h-10 w-28 rounded-lg bg-neutral-700/50 dark:bg-white/10" />
        </div>
      </div>

      {/* Colunas Kanban Skeleton */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((colIdx) => (
          <div
            key={colIdx}
            className="w-[300px] sm:w-[320px] shrink-0 rounded-2xl border border-neutral-700/60 dark:border-white/8 bg-surface/50 dark:bg-surface/30 p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-700/50 dark:border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-700/50 dark:bg-white/10" />
                <div className="h-4 w-28 rounded bg-neutral-700/60 dark:bg-white/12" />
              </div>
              <div className="h-5 w-8 rounded-full bg-neutral-700/40 dark:bg-white/8" />
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
              {[0, 1, 2].map((cardIdx) => (
                <div
                  key={cardIdx}
                  className="h-24 rounded-xl border border-neutral-700/50 dark:border-white/8 bg-card/70 dark:bg-card/40 p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 rounded bg-neutral-700/50 dark:bg-white/10" />
                    <div className="h-4 w-10 rounded bg-neutral-700/40 dark:bg-white/8" />
                  </div>
                  <div className="h-4 w-4/5 rounded bg-neutral-700/60 dark:bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-neutral-700/40 dark:bg-white/6" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
