"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/utils";

interface SidebarLinkProps {
  href: string;
  label: string;
  children: ReactNode;
  badge?: number | string;
  badgeVariant?: "default" | "gold";
  onClick?: () => void;
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
        className={cn(
          "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group select-none",
          isActive
            ? "bg-primary-dark/50 text-neutral-50 border-r-2 border-gold font-bold"
            : "text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-50 border-r-2 border-transparent",
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 truncate">
          <span
            className={cn(
              "transition-colors shrink-0",
              isActive ? "text-gold" : "text-neutral-300 group-hover:text-gold",
            )}
            aria-hidden="true"
          >
            {children}
          </span>
          <span className="truncate">{label}</span>
        </div>

        {showBadge && (
          <span
            className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold shrink-0 shadow-xs transition-colors",
              badgeVariant === "gold" || isActive
                ? "bg-gold text-neutral-900"
                : "bg-white/10 text-neutral-200 border border-white/15 group-hover:border-gold/40 group-hover:text-gold",
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
