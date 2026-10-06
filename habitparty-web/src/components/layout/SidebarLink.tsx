"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/utils";

interface SidebarLinkProps {
  href: string;
  label: string;
  children: ReactNode; // Recebemos o ícone já renderizado como children
}

export function SidebarLink({ href, label, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
          isActive
            ? "bg-primary-dark/50 text-neutral-50 border-r-2 border-gold font-bold"
            : "text-neutral-300 hover:bg-neutral-500/10 hover:text-neutral-50 border-r-2 border-transparent",
        )}
      >
        <span
          className={isActive ? "text-gold" : "text-neutral-300"}
          aria-hidden="true"
        >
          {children}
        </span>
        {label}
      </Link>
    </li>
  );
}
