"use client";

import { CreditCard, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteUserAccountAction } from "@/actions/userActions";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import type { UserResponseDTO } from "@/types/user";
import { clearClientAccountState } from "@/utils/clientAccountCleanup";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

interface DangerZoneCardProps {
  initialUser?: UserResponseDTO | null;
}

export function DangerZoneCard({ initialUser = null }: DangerZoneCardProps) {
  const t = useTranslations("settings.dangerZone");
  const user = useResolvedUser(initialUser);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expectedConfirmation = user?.username
    ? `@${user.username}`
    : t("deleteConfirmFallback");
  const hasActiveRecurringSubscription = Boolean(
    user?.hasActiveRecurringSubscription,
  );

  const handleDelete = () => {
    if (isPending) return;
    startTransition(async () => {
      const res = await deleteUserAccountAction();
      if (!res.success) {
        toast.error(res.error || t("errorToast"));
        setIsModalOpen(false);
        return;
      }
      clearClientAccountState({ kind: "delete" });
      window.location.replace("/signIn");
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-body-s text-neutral-300 leading-relaxed max-w-2xl">
          {t("warningNote")}
        </p>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-600 hover:text-white dark:border-red-500/50 dark:bg-red-600/20 dark:text-red-300 transition-colors font-bold cursor-pointer shrink-0 flex items-center gap-2 shadow-xs px-4 py-2.5 text-sm"
        >
          <Trash2 size={16} aria-hidden="true" />
          {t("deleteButton")}
        </button>
      </div>

      {isModalOpen && (
        <ConfirmationModal
          isOpen
          onClose={() => !isPending && setIsModalOpen(false)}
          onConfirm={handleDelete}
          title={t("modalTitle")}
          description={
            <div className="flex flex-col gap-3">
              <span>{t("modalDesc")}</span>
              {hasActiveRecurringSubscription && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  <CreditCard
                    size={15}
                    className="shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{t("activeSubscriptionAutoCancelNotice")}</span>
                </div>
              )}
            </div>
          }
          confirmText={t("modalConfirm")}
          cancelText={t("modalCancel")}
          variant="danger"
          isLoading={isPending}
          confirmInputValue={expectedConfirmation}
          confirmInputLabel={t("deleteConfirmInputLabel", {
            value: expectedConfirmation,
          })}
          confirmInputPlaceholder={expectedConfirmation}
        />
      )}
    </>
  );
}
