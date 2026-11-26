"use client";

import { LazyUpgradePremiumModal } from "@/components/subscription/LazyUpgradePremiumModal";
import { useUIStore } from "@/store/uiStore";

/**
 * Host único do modal de Upgrade Premium montado uma vez no AppLayout.
 * Evita múltiplas instâncias locais espalhadas por Dashboard, Tasks, Sidebar e widgets.
 */
export function GlobalUpgradeModalHost() {
  const isOpen = useUIStore((s) => s.isUpgradeModalOpen);
  const closeUpgradeModal = useUIStore((s) => s.closeUpgradeModal);

  if (!isOpen) return null;

  return (
    <LazyUpgradePremiumModal isOpen={isOpen} onClose={closeUpgradeModal} />
  );
}
