import { PageWrapper } from "@/components/layout/PageWrapper";
import { HISTORY_GRID_COLS } from "@/constants/history";
import { cn } from "@/utils";

export default function HistoryLoading() {
  return (
    <PageWrapper>
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16 animate-pulse">
        {/* Welcome Card Skeleton */}
        <div className="w-full h-14 rounded-2xl bg-surface/50 border border-primary/20" />

        {/* Filter Bar Skeleton */}
        <div className="w-full h-12 rounded-xl bg-surface/50 border border-white/10" />

        {/* Table Skeleton */}
        <div className="flex flex-col gap-2">
          {/* Header Skeleton */}
          <div
            className={cn(
              "hidden md:grid items-center h-8 px-4 gap-3.5 text-xs",
              HISTORY_GRID_COLS,
            )}
          >
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/10 rounded" />
            <div className="h-3 w-12 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded ml-auto" />
            <div className="w-6" />
          </div>

          {/* 8 Rows Skeleton */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholder skeleton rows
              key={`skeleton-row-${i}`}
              className="w-full h-16 rounded-xl border border-primary/20 bg-primary-dark/20"
            />
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
