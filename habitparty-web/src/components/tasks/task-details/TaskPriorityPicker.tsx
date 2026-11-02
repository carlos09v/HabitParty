"use client";

import { Check, Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { createPortal } from "react-dom";
import {
  TASK_PRIORITY_META,
  TODO_PRIORITY_OPTIONS,
  toPriorityMessageKey,
} from "@/constants/task";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { TaskPriorityOption } from "@/types/task";
import { cn } from "@/utils";

interface TaskPriorityPickerProps {
  priority: string;
  onPrioritySelect: (p: TaskPriorityOption) => void;
}

export function TaskPriorityPicker({
  priority,
  onPrioritySelect,
}: TaskPriorityPickerProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const tOptions = useTranslations("tasks.options");
  const pickerId = useId();

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedHeight: 150,
    estimatedWidth: 128,
    matchTriggerWidth: false,
    offset: 6,
  });

  const priorityKey = (
    priority in TASK_PRIORITY_META ? priority : "NONE"
  ) as TaskPriorityOption;
  const priorityMeta = TASK_PRIORITY_META[priorityKey];

  const handleSelect = (p: TaskPriorityOption) => {
    onPrioritySelect(p);
    close();
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "p-1.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105",
          priorityMeta.badgeColor,
        )}
        title={t("priorityButtonTitle", {
          label: tOptions(
            `prioritiesShort.${toPriorityMessageKey(priorityKey)}`,
          ),
        })}
      >
        <Flag size={13} />
      </button>

      {isOpen &&
        shouldRenderPortal &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="listbox"
            data-select-for={pickerId}
            style={floatingStyle}
            className={cn(
              "bg-popover/98 border border-primary/40 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-32 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md",
              coords.placement === "top" ? "origin-bottom" : "origin-top",
            )}
          >
            <span className="text-tiny uppercase font-bold text-neutral-400 px-2 py-0.5 select-none">
              {t("priorityHeader")}
            </span>
            {TODO_PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={priority === opt.id}
                onClick={() => handleSelect(opt.id)}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left",
                  priority === opt.id
                    ? "bg-white/15 font-bold text-neutral-50"
                    : "text-neutral-300 hover:bg-white/8 hover:text-neutral-100",
                )}
              >
                <span>
                  {tOptions(`priorities.${toPriorityMessageKey(opt.id)}`)}
                </span>
                {priority === opt.id && (
                  <Check size={11} className="text-gold" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
