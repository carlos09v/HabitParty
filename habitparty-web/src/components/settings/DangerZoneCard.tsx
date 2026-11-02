"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteUserAccountAction } from "@/actions/userActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import type { ProfileCardBaseProps } from "@/types/settings";
import { cn } from "@/utils";

import { SettingsCard } from "./SettingsCard";

export function DangerZoneCard({ isCompact }: ProfileCardBaseProps) {
  const t = useTranslations("settings.dangerZone");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUserAccountAction();
      if (res && !res.success) {
        toast.error(res.error || t("errorToast"));
        setIsModalOpen(false);
      }
    });
  };

  return (
    <>
      <SettingsCard
        title={t("cardTitle")}
        description={t("cardDesc")}
        icon={<AlertTriangle size={18} className="text-red-400" />}
        variant="danger"
        isCompact={isCompact}
        headerAction={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "rounded-xl border border-red-500/50 bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white transition-all font-bold cursor-pointer shrink-0 flex items-center gap-2 shadow-xs",
              isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
            )}
          >
            <Trash2 size={16} />
            {t("deleteButton")}
          </button>
        }
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => !isPending && setIsModalOpen(false)}
        onConfirm={handleDelete}
        title={t("modalTitle")}
        description={t("modalDesc")}
        confirmText={t("modalConfirm")}
        cancelText={t("modalCancel")}
        variant="danger"
        isLoading={isPending}
      />
    </>
  );
}
