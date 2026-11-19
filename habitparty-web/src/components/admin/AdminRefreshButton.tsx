"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import { refreshAdminDataAction } from "@/actions/adminActions";

export function AdminRefreshButton() {
  const t = useTranslations("admin.dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      await refreshAdminDataAction();
      router.refresh();
      toast.success(t("refreshedMessage"));
    });
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="self-start sm:self-auto px-4 py-2 rounded-xl bg-surface border border-white/10 hover:border-gold/40 text-neutral-200 hover:text-gold transition-colors text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
    >
      <RefreshCw
        size={14}
        className={isPending ? "animate-spin text-gold" : ""}
      />
      {t("refreshButton")}
    </button>
  );
}
