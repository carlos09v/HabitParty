"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { SelectItem, SelectOption, SelectProps } from "@/types/ui";
import { cn } from "@/utils";

function normalizeOption(option: SelectItem): SelectOption {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return option;
}

interface DropdownCoords {
  top: number;
  left: number;
  width?: number;
  placement: "bottom" | "top";
}

export function Select({
  label,
  options,
  placeholder = "Selecione uma opção",
  compact = false,
  variant = "default",
  align,
  icon,
  value,
  defaultValue,
  onChange,
  name,
  id,
  disabled = false,
  required = false,
  className,
  dropdownClassName,
  triggerClassName,
  usePortal = true,
  "aria-label": ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);

  const normalizedOptions = options.map(normalizeOption);

  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? "",
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const currentOption = normalizedOptions.find(
    (opt) => opt.value === currentValue,
  );

  const isInline = variant === "inline";

  // Montagem no cliente para permitir createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechamento no clique fora e Escape (inclui listRef do Portal nos elementos protegidos)
  useClickOutside(containerRef, () => setIsOpen(false), {
    enabled: isOpen,
    onEscape: () => setIsOpen(false),
    extraRefs: [listRef],
  });

  // Cálculo síncrono e preciso de coordenadas do gatilho
  const computeCoords = useCallback((): DropdownCoords | null => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const margin = 8;
    const estimatedHeight = Math.min(listRef.current?.offsetHeight || 220, 240);

    // Se o gatilho rolou totalmente para fora do viewport visível, fecha
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return null;
    }

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let placement: "bottom" | "top" = "bottom";
    if (spaceBelow < estimatedHeight + margin && spaceAbove > spaceBelow) {
      placement = "top";
    }

    const top =
      placement === "bottom"
        ? rect.bottom + 4
        : Math.max(margin, rect.top - estimatedHeight - 4);

    let left = rect.left;
    let width: number | undefined = isInline ? undefined : rect.width;

    if (isInline) {
      width = undefined;
      const dropdownWidth = listRef.current?.offsetWidth || 140;
      if (align === "right") {
        left = rect.right - dropdownWidth;
      } else if (align === "left") {
        left = rect.left;
      } else {
        left = rect.left + rect.width / 2 - dropdownWidth / 2;
      }
    } else if (align === "right") {
      const dropdownWidth = listRef.current?.offsetWidth || rect.width;
      left = rect.right - dropdownWidth;
    }

    if (width) {
      if (left + width > viewportWidth - margin) {
        left = Math.max(margin, viewportWidth - width - margin);
      }
    } else {
      const estimatedWidth = listRef.current?.offsetWidth || 120;
      if (left + estimatedWidth > viewportWidth - margin) {
        left = Math.max(margin, viewportWidth - estimatedWidth - margin);
      }
    }
    if (left < margin) {
      left = margin;
    }

    return {
      top: Math.round(top),
      left: Math.round(left),
      width,
      placement,
    };
  }, [align, isInline]);

  // Alterna abertura calculando coordenadas de forma síncrona NO ATO DO CLIQUE
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      const initialCoords = computeCoords();
      if (initialCoords) {
        setCoords(initialCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setCoords(null);
    }
  };

  // Atualiza coordenadas em scroll ou resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      const nextCoords = computeCoords();
      if (!nextCoords) {
        setIsOpen(false);
      } else {
        setCoords(nextCoords);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, computeCoords]);

  // Rola automaticamente para a opção selecionada ao abrir
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.querySelector(
        '[aria-selected="true"]',
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const shouldRenderPortal = Boolean(usePortal && mounted);

  // Se estiver usando Portal, aguarda termos as coordenadas válidas do gatilho antes de renderizar
  // Isso evita qualquer renderização no topo esquerdo (0,0)
  if (isOpen && shouldRenderPortal && !coords) {
    return (
      <div
        ref={containerRef}
        className={cn(
          isInline ? "relative inline-block" : "flex flex-col w-full relative",
          "gap-1.5",
          className,
        )}
      >
        {/* Renderiza o gatilho sem o dropdown até o cálculo de coordenadas estar pronto */}
        {renderTrigger()}
      </div>
    );
  }

  function renderTrigger() {
    return isInline ? (
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "px-2 py-0.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
          isOpen
            ? "bg-gold/15 text-gold border border-gold/40 shadow-glow-gold-xs"
            : "bg-transparent text-neutral-100 hover:text-gold hover:bg-white/10 border border-transparent hover:border-white/10",
          disabled && "opacity-50 cursor-not-allowed",
          triggerClassName,
        )}
      >
        {icon && (
          <span className="shrink-0 flex items-center justify-center">
            {icon}
          </span>
        )}
        {currentOption?.icon && !icon && (
          <span className="shrink-0 flex items-center justify-center">
            {currentOption.icon}
          </span>
        )}
        <span className="truncate">
          {currentOption ? currentOption.label : placeholder}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-gold",
          )}
        />
      </button>
    ) : (
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "w-full rounded-lg text-left transition-all flex items-center justify-between cursor-pointer",
          compact ? "py-2 px-3 text-body-s" : "py-3 px-4 text-body-m",
          "bg-card border border-neutral-700 text-neutral-50 shadow-xs",
          "dark:bg-primary-dark/20 dark:border-primary/30 dark:shadow-none",
          "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen
            ? "border-primary dark:border-primary-light bg-card dark:bg-primary-dark/30 shadow-[0_0_8px_rgba(168,99,255,0.3)]"
            : "hover:border-neutral-500 dark:hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          currentOption ? "text-neutral-50" : "text-neutral-400",
          triggerClassName,
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && (
            <span className="shrink-0 flex items-center justify-center">
              {icon}
            </span>
          )}
          {currentOption?.icon && !icon && (
            <span className="shrink-0 flex items-center justify-center">
              {currentOption.icon}
            </span>
          )}
          <span className="truncate">
            {currentOption ? currentOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={compact ? 16 : 18}
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-primary-light",
          )}
        />
      </button>
    );
  }

  const dropdownMenu = (
    <div
      ref={listRef}
      role="listbox"
      style={
        shouldRenderPortal && coords
          ? {
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: coords.width ? `${coords.width}px` : undefined,
              zIndex: 150,
              transformOrigin: coords.placement === "top" ? "bottom" : "top",
            }
          : undefined
      }
      className={cn(
        shouldRenderPortal
          ? "fixed z-[150] bg-card dark:bg-popover/98 border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
          : "absolute z-50 bg-card dark:bg-popover/98 border border-neutral-700 dark:border-primary/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100 origin-top",
        coords?.placement === "top" ? "origin-bottom" : "origin-top",
        isInline
          ? cn(
              !shouldRenderPortal && "top-[115%]",
              "min-w-[120px] max-h-48 p-1",
              !shouldRenderPortal && align === "right" && "right-0 left-auto",
              !shouldRenderPortal && align === "left" && "left-0",
              !shouldRenderPortal &&
                (!align || align === "center") &&
                "left-1/2 -translate-x-1/2",
            )
          : cn(
              !shouldRenderPortal && "top-[105%]",
              "max-h-60",
              !shouldRenderPortal &&
                (align === "right" ? "right-0 left-auto" : "left-0 w-full"),
            ),
        dropdownClassName,
      )}
    >
      {normalizedOptions.map((opt) => {
        const isSelected = opt.value === currentValue;
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "w-full text-left cursor-pointer transition-colors flex items-center gap-2",
              isInline
                ? "px-2.5 py-1.5 rounded-lg text-xs justify-between"
                : compact
                  ? "py-2 px-3 text-body-s"
                  : "py-2.5 px-4 text-body-s",
              isSelected
                ? "bg-primary/20 text-gold font-bold"
                : "text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-100 dark:hover:bg-primary/20 dark:hover:text-neutral-50",
            )}
          >
            {opt.icon && (
              <span className="shrink-0 flex items-center justify-center">
                {opt.icon}
              </span>
            )}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        isInline ? "relative inline-block" : "flex flex-col w-full relative",
        "gap-1.5",
        isOpen && "z-30",
        className,
      )}
    >
      {label &&
        !isInline &&
        (typeof label === "string" ? (
          <label
            htmlFor={selectId}
            className="font-medium text-neutral-100 select-none text-body-s"
          >
            {label}
          </label>
        ) : (
          <div className="font-medium text-neutral-100 select-none text-body-s">
            {label}
          </div>
        ))}

      {/* Input hidden para suporte nativo a FormData */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Gatilho (Botão do Select) */}
      {renderTrigger()}

      {/* Caixa de Opções Flutuante Customizada */}
      {isOpen &&
        !disabled &&
        (shouldRenderPortal
          ? createPortal(dropdownMenu, document.body)
          : dropdownMenu)}
    </div>
  );
}
