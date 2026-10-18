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
        "flex-1 min-w-0 h-full flex flex-col custom-scrollbar transition-[padding,gap] duration-200",
        noScroll ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
        isCompact
          ? "p-3.5 sm:p-4 md:p-5 gap-3.5 sm:gap-4 md:gap-5"
          : "p-3.5 sm:p-5 md:p-6 gap-4 sm:gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
