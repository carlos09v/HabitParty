"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createWorkspaceAction } from "@/actions/workspaceActions";
import { CreateWorkspaceModal } from "@/components/layout/CreateWorkspaceModal";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function DashboardEmptyWorkspaceActions() {
  const t = useTranslations("dashboard.emptyWorkspace");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (name: string) => {
    setIsModalOpen(false);

    startTransition(async () => {
      const response = await createWorkspaceAction({ name });

      if (response.success && response.data?.id) {
        toast.success(
          t("createSuccessToast", { name: response.data.name || name }),
        );

        useWorkspaceStore.setState((state) => ({
          workspaces: [...state.workspaces, response.data],
          activeWorkspaceId: response.data.id || null,
        }));
      } else {
        toast.error(!response.success ? response.error : t("createErrorToast"));
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isPending}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-body-m shadow-glow-gold-sm hover:shadow-glow-gold-md transition-[background-color,box-shadow] flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
        <span>{t("createButton")}</span>
      </button>

      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        initialName={t("defaultInitialName")}
      />
    </>
  );
}
