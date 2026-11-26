interface AuthDividerProps {
  label: string;
}

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div className="relative flex items-center gap-3 my-1">
      <div
        aria-hidden="true"
        className="h-px flex-1 bg-neutral-700/80 dark:bg-white/10"
      />
      <span className="text-xs font-medium text-neutral-400 select-none">
        {label}
      </span>
      <div
        aria-hidden="true"
        className="h-px flex-1 bg-neutral-700/80 dark:bg-white/10"
      />
    </div>
  );
}
