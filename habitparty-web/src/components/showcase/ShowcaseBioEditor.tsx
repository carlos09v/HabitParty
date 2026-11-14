"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateShowcaseProfileAction } from "@/actions/showcaseActions";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { Textarea } from "@/components/ui/Textarea";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";

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

  const resolvedBio = currentBio || "";
  const [draftBio, setDraftBio] = useState(resolvedBio);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const handleSaveBio = () => {
    const trimmed = draftBio.trim();
    startTransition(async () => {
      const res = await updateShowcaseProfileAction({ bio: trimmed });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      updateUserPartial({ bio: trimmed });
      setIsEditingBio(false);
      toast.success(t("bioSaved"));
    });
  };

  if (isEditingBio && !isVisitorMode) {
    return (
      <div className="flex flex-col gap-2 max-w-xl mt-1">
        <Textarea
          rows={2}
          maxLength={BIO_MAX_LENGTH}
          value={draftBio}
          onChange={(e) => setDraftBio(e.target.value)}
          placeholder={t("bioPlaceholder")}
          compact
        />
        <div className="flex items-center justify-between gap-2">
          <DescriptionCharCounter
            length={draftBio.length}
            max={BIO_MAX_LENGTH}
            alwaysVisible
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDraftBio(resolvedBio);
                setIsEditingBio(false);
              }}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-surface-hover cursor-pointer"
            >
              {t("cancelBio")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveBio}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover cursor-pointer"
            >
              {t("saveBio")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 group max-w-xl mt-1">
      <p
        className={cn(
          "text-body-s leading-relaxed",
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
          <Pencil size={12} />
          <span>{t("editBio")}</span>
        </button>
      )}
    </div>
  );
}
