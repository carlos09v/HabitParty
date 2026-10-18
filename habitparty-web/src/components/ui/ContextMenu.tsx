"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ContextMenuItem, ContextMenuProps } from "@/types/ui";
import { cn } from "@/utils";

export type { ContextMenuItem, ContextMenuProps };

export function ContextMenu({
  isOpen,
  position,
  onClose,
  items,
  className,
}: ContextMenuProps) {
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const [openSubmenuKey, setOpenSubmenuKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Adjust coordinates to avoid viewport overflow
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const margin = 8;
    let newX = position.x;
    let newY = position.y;

    if (newX + rect.width > window.innerWidth - margin) {
      newX = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (newY + rect.height > window.innerHeight - margin) {
      newY = Math.max(margin, window.innerHeight - rect.height - margin);
    }

    setAdjustedPos({ x: newX, y: newY });
  }, [isOpen, position]);

  // Handle click outside, scroll, and escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    // Use capturing phase so outside click is caught immediately
    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("contextmenu", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("contextmenu", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        top: `${adjustedPos.y}px`,
        left: `${adjustedPos.x}px`,
      }}
      className={cn(
        "fixed z-[999] min-w-[150px] bg-popover/95 border border-primary/40 rounded-lg p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100",
        className,
      )}
      role="menu"
    >
      <div className="flex flex-col gap-0.5">
        {items.map((item, index) => {
          const isDestructive = item.variant === "destructive";
          const isWarning = item.variant === "warning";
          const hasChildren = Boolean(
            item.children && item.children.length > 0,
          );
          const isSubmenuOpen = openSubmenuKey === item.label;

          if (hasChildren) {
            return (
              <div key={`${item.label}-${index}`} className="flex flex-col">
                <button
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenuKey((prev) =>
                      prev === item.label ? null : item.label,
                    );
                  }}
                  aria-expanded={isSubmenuOpen}
                  role="menuitem"
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                    isSubmenuOpen
                      ? "bg-white/10 text-gold"
                      : "text-neutral-200 hover:text-gold hover:bg-white/10",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.icon && (
                      <span className="shrink-0 flex items-center justify-center">
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={cn(
                      "text-neutral-400 transition-transform duration-200 shrink-0",
                      isSubmenuOpen && "rotate-180 text-gold",
                    )}
                  />
                </button>

                {/* Dropdown com opções filhas */}
                {isSubmenuOpen && (
                  <div className="flex flex-col gap-0.5 pl-3 my-0.5 border-l-2 border-gold/40 animate-in fade-in slide-in-from-top-1 duration-150">
                    {item.children?.map((child, childIndex) => {
                      const isChildDestructive =
                        child.variant === "destructive";
                      const isChildWarning = child.variant === "warning";
                      const isChildActive = child.active;

                      return (
                        <button
                          key={`${child.label}-${childIndex}`}
                          type="button"
                          disabled={child.disabled}
                          onClick={() => {
                            onClose();
                            child.onClick?.();
                          }}
                          role="menuitem"
                          className={cn(
                            "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                            isChildActive &&
                              "bg-primary-light/15 text-gold font-semibold",
                            isChildDestructive
                              ? "text-red-400 hover:text-red-300 hover:bg-red-500/15"
                              : isChildWarning
                                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/15"
                                : isChildActive
                                  ? "text-gold"
                                  : "text-neutral-300 hover:text-gold hover:bg-white/10",
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {child.icon && (
                              <span className="shrink-0 flex items-center justify-center">
                                {child.icon}
                              </span>
                            )}
                            <span className="truncate">{child.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                onClose();
                item.onClick?.();
              }}
              role="menuitem"
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                isDestructive
                  ? "text-red-400 hover:text-red-300 hover:bg-red-500/15"
                  : isWarning
                    ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/15"
                    : "text-neutral-200 hover:text-gold hover:bg-white/10",
              )}
            >
              {item.icon && (
                <span className="shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
