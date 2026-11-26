"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/utils/cn";

interface RetryRefreshButtonProps {
  label: string;
  className?: string;
  iconSize?: number;
}

/**
 * Botão de retentativa que chama `router.refresh()` em vez de navegar com `<Link>` para a mesma URL
 * (que seria absorvido pelo Router Cache sem reexecutar o Server Component).
 */
export function RetryRefreshButton({
  label,
  className,
  iconSize = 16,
}: RetryRefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRetry = () => {
    if (isPending) return;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleRetry}
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        "inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait",
        className,
      )}
    >
      <RefreshCw
        size={iconSize}
        aria-hidden="true"
        className={cn("shrink-0", isPending && "animate-spin")}
      />
      <span>{label}</span>
    </button>
  );
}
