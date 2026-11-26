"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
import { type ReactNode, useState } from "react";
import { useFriendCodeActions } from "@/hooks/useFriendCodeActions";
import { cn } from "@/utils/cn";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

interface FriendCodeCardProps {
  friendCode: string;
  title: ReactNode;
  description: ReactNode;
  copyLabel: string;
  regenerateLabel: string;
  regeneratingLabel?: string;
  confirmRegenerate?: {
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
  };
  messages: {
    copied: string;
    copyError: string;
    regenerated: string;
    regenerateError: string;
  };
  onRegenerated?: (nextCode: string) => void;
  leadingIcon?: ReactNode;
  titleBadge?: ReactNode;
  extraActions?: ReactNode;
  variant?: "embedded" | "card";
}

/**
 * Cartão compartilhado de exibição, cópia e regeneração do Código de Amigo
 * reutilizado entre Privacidade (Settings) e Rede de Amigos (Profile).
 */
export function FriendCodeCard({
  friendCode,
  title,
  description,
  copyLabel,
  regenerateLabel,
  regeneratingLabel,
  confirmRegenerate,
  messages,
  onRegenerated,
  leadingIcon,
  titleBadge,
  extraActions,
  variant = "embedded",
}: FriendCodeCardProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const { copiedCode, isRegenerating, handleCopyCode, handleRegenerateCode } =
    useFriendCodeActions({
      friendCode,
      messages,
      onRegenerated,
    });

  const handleRegenerateClick = () => {
    if (confirmRegenerate) {
      setIsConfirmOpen(true);
    } else {
      handleRegenerateCode();
    }
  };

  const isCard = variant === "card";

  const textBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        {isCard ? (
          <h2 className="text-body-m font-extrabold text-neutral-100">
            {title}
          </h2>
        ) : (
          <h3 className="text-body-s font-bold text-neutral-100">{title}</h3>
        )}
        {titleBadge}
      </div>
      <p className="text-tiny text-neutral-400 mt-0.5">{description}</p>
    </div>
  );

  return (
    <section
      className={cn(
        "flex flex-col justify-between gap-4",
        isCard
          ? "rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-5 lg:flex-row lg:items-center"
          : "rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/50 p-4 sm:flex-row sm:items-center",
      )}
    >
      {leadingIcon ? (
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {leadingIcon}
          {textBlock}
        </div>
      ) : (
        textBlock
      )}

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <code
          className={cn(
            "bg-background border border-neutral-700 font-mono tracking-widest text-amber-800 dark:text-gold select-all",
            isCard
              ? "px-3.5 py-2 rounded-xl dark:border-primary/35 text-sm font-black"
              : "px-3 py-1.5 rounded-lg dark:border-primary/30 text-sm font-extrabold",
          )}
        >
          {friendCode || "HP-......"}
        </code>

        <button
          type="button"
          onClick={handleCopyCode}
          disabled={!friendCode}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-bold border border-neutral-700 dark:border-primary/30 text-neutral-100 transition-colors cursor-pointer disabled:opacity-50",
            isCard
              ? "px-3 py-2 rounded-xl bg-surface/80 hover:bg-surface"
              : "px-3 py-1.5 rounded-lg bg-card hover:bg-surface-hover",
          )}
        >
          {copiedCode ? (
            <Check
              size={14}
              className="text-emerald-700 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          <span>{copyLabel}</span>
        </button>

        <button
          type="button"
          onClick={handleRegenerateClick}
          disabled={isRegenerating}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-gold transition-colors cursor-pointer disabled:opacity-60",
            isCard ? "px-3 py-2 rounded-xl" : "px-3 py-1.5 rounded-lg",
          )}
        >
          <RefreshCw
            size={14}
            className={cn(isRegenerating && "animate-spin")}
            aria-hidden="true"
          />
          <span>
            {isRegenerating && regeneratingLabel
              ? regeneratingLabel
              : regenerateLabel}
          </span>
        </button>

        {extraActions}
      </div>

      {confirmRegenerate && isConfirmOpen && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => {
            if (!isRegenerating) {
              setIsConfirmOpen(false);
            }
          }}
          onConfirm={() => {
            handleRegenerateCode(() => setIsConfirmOpen(false));
          }}
          title={confirmRegenerate.title}
          description={confirmRegenerate.description}
          confirmText={confirmRegenerate.confirmLabel}
          cancelText={confirmRegenerate.cancelLabel}
          variant="warning"
          isLoading={isRegenerating}
        />
      )}
    </section>
  );
}
