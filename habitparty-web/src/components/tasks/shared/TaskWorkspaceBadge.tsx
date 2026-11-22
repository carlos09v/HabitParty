import { Layers, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export interface TaskWorkspaceBadgeProps {
  workspaceName?: string;
  size?: "xs" | "row" | "header";
  isReadOnly?: boolean;
  className?: string;
}

/**
 * Exibe a pílula identificadora do ambiente (workspace) de origem da tarefa
 * nas visões multi-workspace do Dashboard (`TaskRow` e `TaskDetailsHeader`).
 */
export function TaskWorkspaceBadge({
  workspaceName,
  size = "row",
  isReadOnly = false,
  className,
}: TaskWorkspaceBadgeProps) {
  const t = useTranslations("dashboard.taskShared.badges");

  if (!workspaceName) return null;

  const isHeader = size === "header";
  const isMini = size === "xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium border truncate",
        isReadOnly
          ? "bg-amber-500/10 border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/45 dark:text-gold"
          : "bg-primary/10 dark:bg-primary-dark/55 border-primary/30 dark:border-primary-light/45 text-primary dark:text-primary-light",
        isHeader
          ? "px-2 py-0.5 rounded-md text-tiny font-semibold max-w-[115px]"
          : isMini
            ? "px-1.5 py-0.5 rounded text-tiny max-w-[105px]"
            : "px-2 py-0.5 rounded text-xs max-w-[110px]",
        className,
      )}
      title={
        isReadOnly
          ? t("workspaceReadOnlyTitle", { workspace: workspaceName })
          : t("workspaceTitle", { workspace: workspaceName })
      }
    >
      {isReadOnly ? (
        <Lock
          size={isHeader ? 10 : isMini ? 9 : 10}
          className="shrink-0 opacity-90"
          aria-hidden="true"
        />
      ) : (
        <Layers
          size={isHeader ? 11 : isMini ? 9 : 10}
          className="shrink-0 opacity-85"
          aria-hidden="true"
        />
      )}
      <span className="truncate">{workspaceName}</span>
    </span>
  );
}
