"use client";

import { ArrowRight, LayoutDashboard, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createWorkspaceAction } from "@/actions/workspaceActions";
import { CreateWorkspaceModal } from "@/components/layout/CreateWorkspaceModal";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useWorkspaceStore } from "@/store/workspaceStore";

export function DashboardEmptyWorkspace() {
  const t = useTranslations("dashboard.emptyWorkspace");
  const { isGamified } = useExperienceMode();
  const router = useRouter();
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

        // Sincroniza estado na store de workspaces
        useWorkspaceStore.setState((state) => ({
          workspaces: [...state.workspaces, response.data],
          activeWorkspaceId: response.data.id || null,
        }));

        router.refresh();
      } else {
        toast.error(!response.success ? response.error : t("createErrorToast"));
      }
    });
  };

  return (
    <div className="flex h-full w-full overflow-hidden items-center justify-center p-6 select-none relative">
      {/* CARD PRINCIPAL CONVIDATIVO */}
      <div className="relative z-10 w-full max-w-lg p-8 sm:p-10 rounded-2xl bg-surface/60 border border-primary/30 backdrop-blur-md shadow-card-deep text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Ícone Cósmico / Produtividade Iluminado */}
        <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/40 text-gold shadow-glow-gold-sm flex items-center justify-center mb-1">
          {isGamified ? (
            <Sparkles size={28} className="animate-pulse" />
          ) : (
            <LayoutDashboard size={28} />
          )}
        </div>

        {/* Textos Acolhedores */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-50 tracking-tight">
            {isGamified ? t("titleGamified") : t("titleProductivity")}
          </h2>
          <p className="text-body-s sm:text-body-m text-neutral-300 leading-relaxed max-w-md">
            {isGamified
              ? t("descriptionPrefixGamified")
              : t("descriptionPrefixProductivity")}{" "}
            <strong className="text-neutral-100 font-semibold">
              {t("workspaceHighlight")}
            </strong>{" "}
            {t("descriptionSuffix")}
          </p>
        </div>

        {/* Ações: Opção Híbrida (Botão de Modal + Atalho para Assistente) */}
        <div className="flex flex-col items-center gap-3.5 w-full pt-1">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={isPending}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-body-m shadow-glow-gold-sm hover:shadow-glow-gold-md transition-all flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>{t("createButton")}</span>
          </button>

          <Link
            href="/firstStep"
            className="text-xs sm:text-body-s text-neutral-400 hover:text-gold transition-colors inline-flex items-center gap-1.5 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded group"
          >
            <span>{t("wizardQuestion")}</span>
            <span className="text-neutral-200 group-hover:text-gold font-semibold underline underline-offset-4 flex items-center gap-1">
              {t("wizardLink")}
              <ArrowRight
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO RÁPIDA DE AMBIENTE */}
      <CreateWorkspaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        initialName={t("defaultInitialName")}
      />
    </div>
  );
}
