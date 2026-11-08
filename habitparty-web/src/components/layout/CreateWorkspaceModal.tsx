"use client";

import { Check, FolderKanban, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { cn } from "@/utils";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialName?: string;
  isEdit?: boolean;
  isLoading?: boolean;
}

const MAX_WORKSPACE_NAME_LENGTH = 25;

export function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  isEdit = false,
  isLoading = false,
}: CreateWorkspaceModalProps) {
  const t = useTranslations("workspace.createModal");
  const [workspaceName, setWorkspaceName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setWorkspaceName(initialName);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceName.trim()) {
      onSubmit(workspaceName.trim());
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<FolderKanban size={20} />}
      title={isEdit ? t("editTitle") : t("newTitle")}
      description={isEdit ? t("editDesc") : t("newDesc")}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="workspaceName"
              className="text-body-s text-neutral-300 font-medium"
            >
              {t("nameLabel")} <span className="text-gold">*</span>
            </label>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors",
                workspaceName.length >= MAX_WORKSPACE_NAME_LENGTH
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {workspaceName.length}/{MAX_WORKSPACE_NAME_LENGTH}
            </span>
          </div>
          <input
            ref={inputRef}
            id="workspaceName"
            type="text"
            value={workspaceName}
            onChange={(e) =>
              setWorkspaceName(
                e.target.value.slice(0, MAX_WORKSPACE_NAME_LENGTH),
              )
            }
            placeholder={t("placeholder")}
            disabled={isLoading}
            className="w-full bg-card dark:bg-background/50 border border-neutral-600 dark:border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:focus:border-gold dark:focus:ring-1 dark:focus:ring-gold transition-colors text-body-s disabled:opacity-50"
            required
            maxLength={MAX_WORKSPACE_NAME_LENGTH}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-neutral-700 dark:border-white/10 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={!workspaceName.trim() || isLoading}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            <span>{isEdit ? t("saveChanges") : t("createSubmit")}</span>
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
