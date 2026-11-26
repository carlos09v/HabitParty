interface SkipLinkProps {
  label: string;
  targetId?: string;
}

export function SkipLink({ label, targetId = "main-content" }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-primary focus:text-white dark:focus:bg-gold dark:focus:text-on-gold focus:font-bold focus:text-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      {label}
    </a>
  );
}
