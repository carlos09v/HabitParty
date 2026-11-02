import { useTranslations } from "next-intl";
import type { RefObject } from "react";

interface TaskDescriptionEditorProps {
  description: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function TaskDescriptionEditor({
  description,
  onChange,
  onBlur,
  textareaRef,
}: TaskDescriptionEditorProps) {
  const t = useTranslations("tasks.detailsPopover");

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={textareaRef}
        rows={3}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={t("descriptionPlaceholder")}
        className="w-full bg-surface/60 border border-primary/30 rounded-xl p-2.5 text-xs text-neutral-100 placeholder:text-neutral-500 hover:border-gold/40 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none resize-none custom-scrollbar transition-all leading-relaxed"
      />
    </div>
  );
}
