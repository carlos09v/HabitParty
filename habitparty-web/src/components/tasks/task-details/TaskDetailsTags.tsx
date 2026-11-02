import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_TAG_LENGTH, MAX_TASK_TAGS } from "@/constants/task";

interface TaskDetailsTagsProps {
  tags: string[];
  isAddingTag: boolean;
  newTagText: string;
  onNewTagTextChange: (val: string) => void;
  onStartAddTag: () => void;
  onCancelAddTag: () => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export function TaskDetailsTags({
  tags,
  isAddingTag,
  newTagText,
  onNewTagTextChange,
  onStartAddTag,
  onCancelAddTag,
  onAddTag,
  onRemoveTag,
}: TaskDetailsTagsProps) {
  const t = useTranslations("tasks.detailsPopover.tags");
  const isLimitReached = tags.length >= MAX_TASK_TAGS;

  return (
    <div className="flex items-center gap-1.5 flex-wrap min-h-6">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-semibold bg-success-500/15 border border-success-500/30 text-success-500 group/tag"
        >
          <span className="max-w-[120px] truncate" title={tag}>
            {tag}
          </span>
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="hover:text-danger-500 cursor-pointer opacity-70 hover:opacity-100"
            title={t("removeTagTitle", { tag })}
          >
            <X size={10} />
          </button>
        </span>
      ))}

      {isAddingTag ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newTagText}
            maxLength={MAX_TAG_LENGTH}
            onChange={(e) => onNewTagTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAddTag();
              if (e.key === "Escape") onCancelAddTag();
            }}
            onBlur={onAddTag}
            placeholder={t("tagPlaceholder")}
            className="w-20 bg-background/60 border border-primary/40 rounded px-1.5 py-0.5 text-tiny text-neutral-50 focus:outline-none focus:border-gold"
          />
        </div>
      ) : isLimitReached ? (
        <span
          title={t("maxTagsTitle", { max: MAX_TASK_TAGS })}
          className="text-tiny text-neutral-500 italic px-1 select-none"
        >
          {t("maxTagsLabel", { max: MAX_TASK_TAGS })}
        </span>
      ) : (
        <button
          type="button"
          onClick={onStartAddTag}
          title={t("addTagTitle", {
            current: tags.length,
            max: MAX_TASK_TAGS,
          })}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-tiny text-neutral-400 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
        >
          <Plus size={10} />
          <span>{t("addTagButton")}</span>
        </button>
      )}
    </div>
  );
}
