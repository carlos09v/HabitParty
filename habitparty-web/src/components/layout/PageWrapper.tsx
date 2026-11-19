import type { ReactNode } from "react";
import { cn } from "@/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  noScroll?: boolean | "lg";
}

export function PageWrapper({
  children,
  className,
  noScroll,
}: PageWrapperProps) {
  const scrollClass =
    noScroll === "lg"
      ? "overflow-y-auto overflow-x-hidden lg:overflow-hidden"
      : noScroll
        ? "overflow-hidden"
        : "overflow-y-auto overflow-x-hidden";

  return (
    <div
      className={cn(
        "flex-1 min-w-0 h-full flex flex-col custom-scrollbar",
        scrollClass,
        "p-3.5 sm:p-5 md:p-6 gap-4 sm:gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
