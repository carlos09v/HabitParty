import Link from "next/link";
import type { ReactNode } from "react";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export function AuthPageShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthPageShellProps) {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">{title}</h1>
        {subtitle && <p className="text-base text-neutral-300">{subtitle}</p>}
      </header>

      {children}

      {footerText && footerLinkText && footerLinkHref && (
        <footer className="text-center text-sm text-neutral-300">
          {footerText}{" "}
          <Link
            href={footerLinkHref}
            className="text-primary dark:text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
          >
            {footerLinkText}
          </Link>
        </footer>
      )}
    </div>
  );
}
