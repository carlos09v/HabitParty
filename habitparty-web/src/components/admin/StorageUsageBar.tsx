import { HardDrive } from "lucide-react";
import { cn } from "@/utils";
import {
  calculateStoragePercentage,
  getUserStorageLimitFormatted,
} from "@/utils/adminUtils";

interface StorageUsageBarProps {
  bytesUsed: number;
  usedFormatted: string;
  isPremium: boolean;
  quotaLabel?: string;
  badgeText?: (params: {
    used: string;
    limit: string;
    percentage: number;
  }) => string;
  variant?: "bar" | "badge";
}

export function StorageUsageBar({
  bytesUsed,
  usedFormatted,
  isPremium,
  quotaLabel,
  badgeText,
  variant = "bar",
}: StorageUsageBarProps) {
  const limitFormatted = getUserStorageLimitFormatted(isPremium);
  const percentage = calculateStoragePercentage(bytesUsed, isPremium);

  if (variant === "badge") {
    return (
      <div className="px-3 py-1 rounded-full bg-success-500/15 border border-success-500/30 text-emerald-700 dark:text-success-500 font-mono font-bold text-xs">
        {badgeText
          ? badgeText({
              used: usedFormatted,
              limit: limitFormatted,
              percentage,
            })
          : `${usedFormatted} / ${limitFormatted} (${percentage}%)`}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-success-500/10 text-emerald-700 dark:text-success-500 border border-success-500/25 font-bold text-label-g">
          <HardDrive size={11} />
          {usedFormatted}
        </span>
        <span className="text-tiny text-neutral-400">/ {limitFormatted}</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-neutral-700 dark:bg-neutral-800 overflow-hidden">
        <div
          className={cn(
            "h-full w-full origin-left rounded-full transition-transform duration-300",
            percentage >= 80
              ? "bg-danger-500"
              : percentage >= 50
                ? "bg-warning-500"
                : "bg-success-500",
          )}
          style={{
            transform: `scaleX(${Math.max(percentage, 2) / 100})`,
          }}
        />
      </div>

      {quotaLabel && (
        <span className="text-tiny text-neutral-400 font-normal">
          {quotaLabel}
        </span>
      )}
    </div>
  );
}
