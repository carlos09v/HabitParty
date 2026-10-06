import type { ReactNode } from "react";
import { cn } from "@/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  noScroll?: boolean;
  isCompact?: boolean;
}

export function PageWrapper({
  children,
  className,
  noScroll,
  isCompact = false,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "flex-1 min-w-0 h-screen flex flex-col custom-scrollbar transition-all duration-200",
        noScroll ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
        isCompact ? "p-4 sm:p-5 gap-4 sm:gap-5" : "p-6 gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
