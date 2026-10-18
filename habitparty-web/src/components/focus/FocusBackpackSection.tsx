"use client";

import { ArrowUpRight, Backpack, Infinity as InfinityIcon } from "lucide-react";
import Link from "next/link";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { FocusCard } from "./FocusCard";

interface FocusBackpackSectionProps {
  items: InventoryItemResponseDTO[];
  activeTargetId?: string;
  isTimerActive?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  onStartFocus: (item: InventoryItemResponseDTO) => void;
  onContextMenu: (e: React.MouseEvent, item: InventoryItemResponseDTO) => void;
  onConsume?: (item: InventoryItemResponseDTO) => void;
  isCompact?: boolean;
}

export function FocusBackpackSection({
  items,
  activeTargetId,
  isTimerActive = false,
  isTimerRunning = false,
  onToggleTimer,
  onStartFocus,
  onContextMenu,
  onConsume,
  isCompact: propIsCompact,
}: FocusBackpackSectionProps) {
  const { isCompact: storeIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? storeIsCompact;

  return (
    <section
      className="flex flex-col gap-3 w-full"
      aria-label="Mochila em Foco"
    >
      {/* Header com Título, Contador e Link para a Mochila */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "font-bold text-neutral-100",
              isCompact ? "text-body-m sm:text-subtitle-s" : "text-subtitle-s",
            )}
          >
            Mochila
          </h3>

          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-primary/30 bg-surface/60 text-neutral-300 text-xs font-medium"
            title="Itens e cupons trazidos da mochila para o Foco"
          >
            <span>{items.length} /</span>
            <InfinityIcon size={13} className="text-primary-light" />
          </div>
        </div>

        <Link
          href="/inventory"
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-gold transition-colors group cursor-pointer"
          title="Ver todos os itens no inventário"
        >
          <span>Gerenciar Mochila</span>
          <ArrowUpRight
            size={13}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Lista de Itens da Mochila em Foco */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-surface/30 p-6 flex flex-col items-center justify-center text-center gap-2">
          <Backpack size={26} className="text-neutral-500 mb-0.5" />
          <p className="text-body-s text-neutral-300">
            Nenhum item ou cupom da mochila adicionado ao Foco.
          </p>
          <p className="text-tiny text-neutral-400 max-w-sm">
            Resgate cupons e recompensas baseadas em tempo na Loja e adicione-os
            aqui pela sua Mochila!
          </p>
          <Link
            href="/inventory"
            className="mt-1 text-xs font-bold text-gold hover:underline"
          >
            Acessar Mochila
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {items.map((item) => (
            <FocusCard
              key={item.inventoryItemId}
              variant="backpack"
              item={item}
              isActiveTarget={Boolean(
                isTimerActive && activeTargetId === item.inventoryItemId,
              )}
              isTimerRunning={Boolean(
                isTimerActive &&
                  activeTargetId === item.inventoryItemId &&
                  isTimerRunning,
              )}
              onToggleTimer={onToggleTimer}
              onStartFocus={onStartFocus}
              onContextMenu={onContextMenu}
              onConsume={onConsume}
              isCompact={isCompact}
            />
          ))}
        </div>
      )}
    </section>
  );
}
