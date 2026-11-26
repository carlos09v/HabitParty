"use client";

import { Check, Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
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
  disabled?: boolean;
}

export function TaskPriorityPicker({
  priority,
  onPrioritySelect,
  disabled = false,
}: TaskPriorityPickerProps) {
  const t = useTranslations("tasks.detailsPopover.header");
  const tOptions = useTranslations("tasks.options");
  const pickerId = useId();
  const listboxId = useId();
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    portalContainer,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedHeight: 150,
    estimatedWidth: 128,
    matchTriggerWidth: false,
    offset: 6,
    disabled,
    restoreFocusOnEscape: true,
  });

  const priorityKey = (
    priority in TASK_PRIORITY_META ? priority : "NONE"
  ) as TaskPriorityOption;
  const priorityMeta = TASK_PRIORITY_META[priorityKey];

  useEffect(() => {
    if (!isOpen) return;
    const activeIdx = Math.max(
      0,
      TODO_PRIORITY_OPTIONS.findIndex((opt) => opt.id === priorityKey),
    );
    const frameId = window.requestAnimationFrame(() => {
      optionRefs.current[activeIdx]?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, priorityKey]);

  const handleSelect = (p: TaskPriorityOption) => {
    onPrioritySelect(p);
    close();
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const total = TODO_PRIORITY_OPTIONS.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      optionRefs.current[(index + 1) % total]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      optionRefs.current[(index - 1 + total) % total]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      optionRefs.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      optionRefs.current[total - 1]?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        ref={triggerRef}
        id={pickerId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) toggle();
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={cn(
          "p-1.5 rounded-md border flex items-center justify-center transition-[transform,color,background-color,border-color] shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          disabled
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer hover:scale-105",
          priorityMeta.badgeColor,
        )}
        title={t("priorityButtonTitle", {
          label: tOptions(
            `prioritiesShort.${toPriorityMessageKey(priorityKey)}`,
          ),
        })}
        aria-label={t("priorityButtonTitle", {
          label: tOptions(
            `prioritiesShort.${toPriorityMessageKey(priorityKey)}`,
          ),
        })}
      >
        <Flag size={13} aria-hidden="true" />
      </button>

      {isOpen &&
        shouldRenderPortal &&
        coords &&
        portalContainer &&
        createPortal(
          <div
            ref={popoverRef}
            id={listboxId}
            role="listbox"
            aria-label={t("priorityHeader")}
            data-select-for={pickerId}
            style={floatingStyle}
            className={cn(
              "bg-popover border border-neutral-700 dark:border-primary/40 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-32 animate-in fade-in zoom-in-95 duration-100",
              coords.placement === "top" ? "origin-bottom" : "origin-top",
            )}
          >
            <span className="text-tiny uppercase font-bold text-neutral-400 px-2 py-0.5 select-none">
              {t("priorityHeader")}
            </span>
            {TODO_PRIORITY_OPTIONS.map((opt, index) => (
              <button
                key={opt.id}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={priority === opt.id}
                onClick={() => handleSelect(opt.id)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={cn(
                  "flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  priority === opt.id
                    ? "bg-primary/10 font-bold text-primary dark:bg-white/15 dark:text-neutral-50"
                    : "text-neutral-200 dark:text-neutral-300 hover:bg-surface dark:hover:bg-white/8 hover:text-neutral-50 dark:hover:text-neutral-100",
                )}
              >
                <span>
                  {tOptions(`priorities.${toPriorityMessageKey(opt.id)}`)}
                </span>
                {priority === opt.id && (
                  <Check
                    size={11}
                    className="text-primary dark:text-gold"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>,
          portalContainer,
        )}
    </div>
  );
}
