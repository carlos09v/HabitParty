"use client";

import { Info } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

export interface InfoTooltipProps {
  /** Rótulo acessível para leitores de tela */
  ariaLabel: string;
  /** Título exibido no topo do popover */
  title?: string;
  /** Ícone temático exibido ao lado do título (ex: <Zap />, <Swords />, <RotateCcw />) */
  icon?: ReactNode;
  /** Conteúdo do popover (parágrafos explicativos, listas e dicas) */
  children: ReactNode;
  /** Tamanho do ícone <Info /> no botão gatilho (padrão: 15) */
  size?: number;
  /** Alinhamento horizontal preferido do popover (padrão: 'left') */
  align?: "left" | "right";
  /** Posição vertical preferida do popover (padrão: 'top') */
  side?: "top" | "bottom";
  /** Classes extras para o container relativo do gatilho */
  className?: string;
  /** Classes extras para a caixa flutuante do popover */
  popoverClassName?: string;
}

interface Coords {
  top: number;
  left: number;
  width: number;
  placement: "top" | "bottom";
}

export function InfoTooltip({
  ariaLabel,
  title,
  icon,
  children,
  size = 15,
  align = "left",
  side = "top",
  className,
  popoverClassName,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const computeCoords = useCallback(
    (measuredHeight?: number): Coords | null => {
      if (!buttonRef.current || typeof window === "undefined") return null;
      const rect = buttonRef.current.getBoundingClientRect();
      const margin = 12;
      const popoverWidth = Math.min(320, window.innerWidth - margin * 2);
      const popoverHeight =
        measuredHeight || popoverRef.current?.offsetHeight || 160;
      const gap = 8;

      // Detecta se cabe no topo ou deve inverter para a base
      let placement: "top" | "bottom" = side;
      if (side === "top") {
        if (rect.top - popoverHeight - gap < margin) {
          placement = "bottom";
        }
      } else {
        if (rect.bottom + popoverHeight + gap > window.innerHeight - margin) {
          placement = "top";
        }
      }

      const top =
        placement === "top"
          ? Math.max(margin, rect.top - popoverHeight - gap)
          : Math.min(
              window.innerHeight - popoverHeight - margin,
              rect.bottom + gap,
            );

      // Alinhamento horizontal com clamp nas bordas da tela
      let left = align === "right" ? rect.right - popoverWidth : rect.left;

      if (left + popoverWidth > window.innerWidth - margin) {
        left = window.innerWidth - popoverWidth - margin;
      }
      if (left < margin) {
        left = margin;
      }

      return {
        top: Math.round(top),
        left: Math.round(left),
        width: popoverWidth,
        placement,
      };
    },
    [side, align],
  );

  const updatePosition = useCallback(() => {
    const next = computeCoords();
    if (next) {
      setCoords((prev) => {
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.placement === next.placement
        ) {
          return prev;
        }
        return next;
      });
    }
  }, [computeCoords]);

  // Refina coordenadas antes da pintura (useLayoutEffect) assim que o DOM do popover existe
  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [isOpen, updatePosition]);

  // Acompanha scrolls e redimensionamentos enquanto aberto
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Fecha ao clicar fora tanto do botão gatilho quanto do portal flutuante
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isOpen) {
      const initial = computeCoords();
      if (initial) {
        setCoords(initial);
      }
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (!isOpen) {
            const initial = computeCoords();
            if (initial) {
              setCoords(initial);
            }
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className="text-neutral-400 hover:text-gold focus:outline-none focus:text-gold transition-colors cursor-pointer p-0.5"
      >
        <Info size={size} />
      </button>

      {isOpen &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              transformOrigin: coords.placement === "top" ? "bottom" : "top",
            }}
            className={cn(
              "fixed z-[130] p-3.5 rounded-xl bg-surface/98 border border-gold/40 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 transition-none text-neutral-200 text-xs flex flex-col gap-2 pointer-events-auto",
              popoverClassName,
            )}
          >
            {(title || icon) && (
              <div className="flex items-center gap-1.5 font-bold text-gold text-xs border-b border-white/10 pb-1.5">
                {icon}
                {title && <span>{title}</span>}
              </div>
            )}

            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
