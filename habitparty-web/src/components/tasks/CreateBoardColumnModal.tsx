"use client";

import { Check, Columns3, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createBoardColumn,
  updateBoardColumn,
} from "@/actions/boardColumnActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { COLUMN_ICONS, inferColumnIcon } from "@/constants/routine";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { BoardColumn } from "@/types/task";
import type { CreateBoardColumnModalProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const QUICK_COLUMN_TEMPLATES = COLUMN_ICONS.filter((i) => !i.isPremium).slice(
  0,
  6,
);

const MAX_COLUMN_NAME_LENGTH = 30;

export function CreateBoardColumnModal({
  isOpen,
  onClose,
  columnToEdit,
  insertTarget,
  onSuccess,
}: CreateBoardColumnModalProps) {
  const t = useTranslations("tasks.columnModal");
  const tIcons = useTranslations("ui.iconPicker");
  const isEditing = Boolean(columnToEdit);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("sun");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );

  useEffect(() => {
    if (isOpen) {
      if (columnToEdit) {
        setName(columnToEdit.title || "");
        setSelectedIcon(columnToEdit.icon || "sun");
        setHasManuallyChangedIcon(false);
      } else {
        setName("");
        setSelectedIcon("sun");
        setHasManuallyChangedIcon(false);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, columnToEdit]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value.slice(0, MAX_COLUMN_NAME_LENGTH);
    setName(newName);

    // Sugere automaticamente o ícone com base nas palavras digitadas (ex: estudos -> book, saude -> heart)
    if (!hasManuallyChangedIcon) {
      const suggestedIcon = inferColumnIcon(newName);
      if (suggestedIcon) {
        setSelectedIcon(suggestedIcon);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error(t("toasts.nameRequired"));
      return;
    }

    if (!isEditing && !activeWorkspaceId) {
      toast.error(t("toasts.noActiveWorkspace"));
      return;
    }

    startTransition(async () => {
      if (isEditing && columnToEdit) {
        const response = await updateBoardColumn(columnToEdit.id, {
          name: trimmedName,
          icon: selectedIcon,
        });

        if (!response.success) {
          toast.error(response.error || t("toasts.updateError"));
          return;
        }

        toast.success(t("toasts.updateSuccess"));
        const updatedCol: BoardColumn = {
          ...columnToEdit,
          title: response.data.name || trimmedName,
          icon: response.data.icon || selectedIcon,
        };
        onSuccess?.(updatedCol, true);
        onClose();
        return;
      }

      if (!activeWorkspaceId) return;

      const response = await createBoardColumn({
        workspaceId: activeWorkspaceId,
        name: trimmedName,
        icon: selectedIcon,
        ...(insertTarget ? { orderIndex: insertTarget.orderIndex } : {}),
      });

      if (!response.success) {
        toast.error(response.error || t("toasts.createError"));
        return;
      }

      soundEffects.playCreateSound();
      toast.success(t("toasts.createSuccess", { name: trimmedName }), {
        description: t("toasts.createSuccessDesc"),
      });
      const newCol: BoardColumn = {
        id: response.data.id || `col-${Date.now()}`,
        title: response.data.name || trimmedName,
        order: response.data.orderIndex ?? insertTarget?.orderIndex ?? 0,
        icon: response.data.icon || selectedIcon,
        tasks: [],
      };
      onSuccess?.(newCol, false, insertTarget);
      onClose();
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<Columns3 size={20} />}
      title={isEditing ? t("editTitle") : t("createTitle")}
      description={isEditing ? t("editDescription") : t("createDescription")}
      maxWidth="max-w-md"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nome da Coluna e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="columnName"
              className="text-body-s text-neutral-300 font-medium"
            >
              {t("nameLabel")} <span className="text-gold">*</span>
            </label>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors",
                name.length >= MAX_COLUMN_NAME_LENGTH
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {name.length}/{MAX_COLUMN_NAME_LENGTH}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={COLUMN_ICONS}
              value={selectedIcon}
              onChange={(iconId) => {
                setSelectedIcon(iconId);
                setHasManuallyChangedIcon(true);
              }}
              disabled={isPending}
              title={t("iconPickerTitle")}
            />
            <input
              ref={inputRef}
              id="columnName"
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={t("namePlaceholder")}
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s h-[42px]"
              required
              maxLength={MAX_COLUMN_NAME_LENGTH}
              disabled={isPending}
            />
          </div>
          <span className="text-label-g text-neutral-400">
            {t("helperText")}
          </span>

          {/* Sugestões rápidas de colunas na criação */}
          {!isEditing && (
            <div className="flex flex-col gap-1.5 pt-1.5">
              <span className="text-tiny font-semibold text-neutral-400 uppercase tracking-wider">
                {t("quickSuggestionsLabel")}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_COLUMN_TEMPLATES.map((tpl) => {
                  const TplIcon = tpl.icon;
                  const tplKey = `icons.${tpl.id}` as Parameters<
                    typeof tIcons.has
                  >[0];
                  const localizedLabel = tIcons.has(tplKey)
                    ? tIcons(tplKey as Parameters<typeof tIcons>[0])
                    : tpl.label;
                  const isActive =
                    name.trim().toLowerCase() ===
                      localizedLabel.toLowerCase() && selectedIcon === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setName(
                          localizedLabel.slice(0, MAX_COLUMN_NAME_LENGTH),
                        );
                        setSelectedIcon(tpl.id);
                        setHasManuallyChangedIcon(true);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer active:scale-95",
                        isActive
                          ? "bg-gold/15 border-gold text-gold font-bold shadow-glow-gold-xs"
                          : "bg-surface/60 border-white/10 text-neutral-300 hover:border-gold/50 hover:text-gold hover:bg-surface",
                      )}
                    >
                      <TplIcon size={13} className="shrink-0" />
                      <span>{localizedLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-white/10 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin text-on-gold" />
                <span>{isEditing ? t("saving") : t("creating")}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{isEditing ? t("saveChanges") : t("createButton")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
