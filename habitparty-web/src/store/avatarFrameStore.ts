"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AvatarFrameId } from "@/constants/avatarFrames";
import { useUserStore } from "./userStore";

export interface AvatarFrameState {
  frameId: AvatarFrameId;
  setFrameId: (frameId: AvatarFrameId) => void;
}

export const useAvatarFrameStore = create<AvatarFrameState>()(
  persist(
    (set) => ({
      frameId: "cosmic_gold",
      setFrameId: (frameId) => set({ frameId }),
    }),
    {
      name: "habitparty_avatar_frame",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Retorna a moldura ativa segura considerando o status de assinatura do usuário
 */
export function useActiveAvatarFrame(): AvatarFrameId {
  const storeFrameId = useAvatarFrameStore((s) => s.frameId);
  const isPremium = useUserStore((s) => s.is_Premium);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return isPremium ? "cosmic_gold" : "none";
  if (!isPremium) return "none";
  return storeFrameId || "cosmic_gold";
}
