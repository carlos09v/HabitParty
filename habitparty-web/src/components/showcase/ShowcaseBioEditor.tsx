"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateShowcaseProfileAction } from "@/actions/showcaseActions";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { Textarea } from "@/components/ui/Textarea";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils/cn";

const BIO_MAX_LENGTH = 160;

interface ShowcaseBioEditorProps {
  currentBio?: string | null;
  isVisitorMode: boolean;
  isGamified: boolean;
}

export function ShowcaseBioEditor({
  currentBio,
  isVisitorMode,
  isGamified,
}: ShowcaseBioEditorProps) {
  const t = useTranslations("showcase.header");
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const bioInputId = useId();

  const resolvedBio = currentBio || "";
  const [draftBio, setDraftBio] = useState(resolvedBio);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisitorMode) {
      setIsEditingBio(false);
    }
  }, [isVisitorMode]);

  useEffect(() => {
    if (!isEditingBio) {
      setDraftBio(resolvedBio);
    }
  }, [resolvedBio, isEditingBio]);

  useEffect(() => {
    if (isEditingBio) {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }, [isEditingBio]);

  const handleCancelBio = () => {
    setDraftBio(resolvedBio);
    setIsEditingBio(false);
  };

  const handleSaveBio = () => {
    const trimmed = draftBio.trim();
    if (trimmed === resolvedBio.trim()) {
      setDraftBio(resolvedBio);
      setIsEditingBio(false);
      return;
    }

    startTransition(async () => {
      const res = await updateShowcaseProfileAction({ bio: trimmed });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      updateUserPartial({ bio: trimmed });
      setIsEditingBio(false);
      toast.success(t("bioSaved"));
      useUserStore.getState().triggerAchievementCheck();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelBio();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isPending) {
        handleSaveBio();
      }
    }
  };

  if (isEditingBio && !isVisitorMode) {
    return (
      <div className="flex flex-col gap-2 w-full max-w-xl mt-1">
        <label htmlFor={bioInputId} className="sr-only">
          {t("bioLabel")}
        </label>
        <Textarea
          id={bioInputId}
          ref={textareaRef}
          rows={2}
          maxLength={BIO_MAX_LENGTH}
          value={draftBio}
          onChange={(e) => setDraftBio(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("bioPlaceholder")}
          compact
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DescriptionCharCounter
            length={draftBio.length}
            max={BIO_MAX_LENGTH}
            alwaysVisible
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleCancelBio}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface-hover cursor-pointer"
            >
              {t("cancelBio")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveBio}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover cursor-pointer disabled:opacity-60"
            >
              {t("saveBio")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group w-full max-w-xl mt-1 min-w-0">
      <p
        className={cn(
          "text-body-s leading-relaxed min-w-0 flex-1 break-words",
          resolvedBio ? "text-neutral-200" : "text-neutral-400 italic",
        )}
      >
        {resolvedBio ||
          (isVisitorMode
            ? isGamified
              ? t("emptyBioVisitor")
              : t("emptyBioVisitorEssential")
            : t("addBio"))}
      </p>
      {!isVisitorMode && (
        <button
          type="button"
          onClick={() => {
            setDraftBio(resolvedBio);
            setIsEditingBio(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-tiny font-semibold text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
          title={t("editBio")}
        >
          <Pencil size={12} aria-hidden="true" />
          <span>{t("editBio")}</span>
        </button>
      )}
    </div>
  );
}
