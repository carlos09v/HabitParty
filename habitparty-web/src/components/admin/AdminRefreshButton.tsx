"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { refreshAdminDataAction } from "@/actions/adminActions";

export function AdminRefreshButton() {
  const t = useTranslations("admin.dashboard");
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await refreshAdminDataAction();
        if (res.success) {
          toast.success(t("refreshedMessage"));
        } else {
          toast.error(res.error || t("refreshError"));
        }
      } catch {
        toast.error(t("refreshError"));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="self-start sm:self-auto px-4 py-2 rounded-xl bg-card hover:bg-surface-hover dark:bg-surface border border-neutral-700 dark:border-white/10 hover:border-gold/40 text-neutral-200 hover:text-gold-ink dark:hover:text-gold transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <RefreshCw
        size={14}
        aria-hidden="true"
        className={isPending ? "animate-spin text-gold-ink dark:text-gold" : ""}
      />
      {t("refreshButton")}
    </button>
  );
}
