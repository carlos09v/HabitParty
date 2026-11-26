import { cn } from "@/utils/cn";

export function FocusSidebarRightSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <aside
      aria-busy="true"
      className={cn(
        "shrink-0 bg-background dark:bg-primary-dark/25 border-t xl:border-t-0 xl:border-l border-neutral-700 dark:border-primary/30 h-full flex flex-col overflow-hidden w-full xl:w-[345px] p-4 gap-4",
        className,
      )}
    >
      {/* Header + Period Toggle Skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-28 rounded-md bg-neutral-700/50 motion-safe:animate-pulse" />
        <div className="h-7 w-28 rounded-lg bg-neutral-700/50 motion-safe:animate-pulse" />
      </div>

      {/* Hero Metric Card Skeleton */}
      <div className="h-28 w-full rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />

      {/* 2x2 Stat Grid Skeleton */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-16 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
        <div className="h-16 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
        <div className="h-16 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
        <div className="h-16 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
      </div>

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10 shrink-0" />

      {/* Weekly Chart Skeleton */}
      <div className="h-36 w-full rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10 shrink-0" />

      {/* Recent Records Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-36 rounded-md bg-neutral-700/50 motion-safe:animate-pulse" />
        <div className="h-14 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
        <div className="h-14 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
        <div className="h-14 rounded-xl bg-surface/70 dark:bg-surface/40 border border-neutral-700/60 dark:border-primary/20 motion-safe:animate-pulse" />
      </div>
    </aside>
  );
}
