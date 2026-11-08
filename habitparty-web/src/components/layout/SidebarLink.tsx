"use client";

import { Loader2 } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useProgressStore } from "@/store/progressStore";
import { cn } from "@/utils";

interface SidebarLinkProps {
  href: string;
  label: string;
  children: ReactNode;
  badge?: number | string;
  badgeVariant?: "default" | "gold";
  onClick?: () => void;
}

interface SidebarLinkContentProps {
  href: string;
  label: string;
  children: ReactNode;
  isActive: boolean;
  showBadge: boolean;
  badge?: number | string;
  badgeVariant: "default" | "gold";
}

function SidebarLinkContent({
  href,
  label,
  children,
  isActive,
  showBadge,
  badge,
  badgeVariant,
}: SidebarLinkContentProps) {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;

  useEffect(() => {
    if (!pending) return;

    const taskId = `nav:${href}`;
    const timerId = window.setTimeout(() => {
      useProgressStore.getState().start(taskId, label);
    }, 120);

    return () => {
      window.clearTimeout(timerId);
      useProgressStore.getState().done(taskId);
    };
  }, [pending, href, label]);

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-body-s font-medium",
        isHighlighted
          ? "bg-primary/[0.08] dark:bg-primary-dark/50 text-primary dark:text-neutral-50 border-r-2 border-primary dark:border-gold font-bold"
          : "text-neutral-300 group-hover:bg-neutral-500/10 group-hover:text-neutral-50 border-r-2 border-transparent",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 truncate">
        <span
          className={cn(
            "transition-colors shrink-0",
            isHighlighted
              ? "text-primary dark:text-gold"
              : "text-neutral-400 dark:text-neutral-300 group-hover:text-primary dark:group-hover:text-gold",
          )}
          aria-hidden="true"
        >
          {pending && !isActive ? (
            <Loader2 size={18} className="animate-spin text-gold" />
          ) : (
            children
          )}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {showBadge && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 shadow-xs transition-colors",
            badgeVariant === "gold" || isHighlighted
              ? "bg-primary text-white dark:bg-gold dark:text-on-gold"
              : "bg-surface dark:bg-white/10 text-neutral-200 border border-neutral-700 dark:border-white/15 group-hover:border-primary/40 dark:group-hover:border-gold/40 group-hover:text-primary dark:group-hover:text-gold",
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function SidebarLink({
  href,
  label,
  children,
  badge,
  badgeVariant = "default",
  onClick,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const numBadge = typeof badge === "number" ? badge : Number(badge);
  const showBadge =
    badge !== undefined && !Number.isNaN(numBadge) && numBadge > 0;

  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className="block rounded-lg outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group select-none"
      >
        <SidebarLinkContent
          href={href}
          label={label}
          isActive={isActive}
          showBadge={showBadge}
          badge={badge}
          badgeVariant={badgeVariant}
        >
          {children}
        </SidebarLinkContent>
      </Link>
    </li>
  );
}
