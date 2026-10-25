export default function FocusLoading() {
  return (
    <div
      className="flex flex-col xl:flex-row h-full w-full overflow-hidden bg-background animate-pulse"
      aria-busy="true"
    >
      {/* Área Principal Esquerda */}
      <div className="flex-1 min-w-0 h-full flex flex-col p-5 sm:p-6 gap-5 overflow-hidden">
        {/* Welcome Card Colapsado Skeleton */}
        <div className="h-14 w-full rounded-2xl bg-card/50 border border-primary/20 shrink-0" />

        {/* Palco Heróico Skeleton */}
        <div className="h-64 w-full rounded-2xl bg-card/50 border border-primary/20 p-4 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20" />
              <div className="h-5 w-48 rounded-lg bg-primary/20" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-36 rounded-xl bg-primary/20" />
              <div className="h-8 w-24 rounded-xl bg-primary/20" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 my-auto">
            <div className="w-36 h-36 rounded-full border-4 border-primary/25 bg-primary/10" />
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <div className="h-11 w-full rounded-xl bg-gold/20" />
              <div className="h-8 w-full rounded-lg bg-primary/15" />
              <div className="h-8 w-full rounded-lg bg-primary/15" />
            </div>
          </div>
        </div>

        {/* Grid de Atividades Skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 rounded-lg bg-primary/20" />
            <div className="h-8 w-36 rounded-lg bg-primary/20" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`focus-act-skeleton-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  i
                }`}
                className="h-20 rounded-xl bg-card/40 border border-primary/20"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Direita Skeleton */}
      <aside className="hidden xl:flex flex-col w-80 2xl:w-96 shrink-0 border-l border-primary/20 bg-surface/60 p-4 gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`focus-metric-skeleton-${
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                i
              }`}
              className="h-20 rounded-xl bg-card/40 border border-primary/20"
            />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-card/40 border border-primary/20" />
        <div className="flex-1 rounded-2xl bg-card/40 border border-primary/20" />
      </aside>
    </div>
  );
}
