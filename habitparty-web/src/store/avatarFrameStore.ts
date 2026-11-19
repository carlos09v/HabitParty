"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type AvatarFrameId, getAvatarFrame } from "@/constants/avatarFrames";
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
 * Retorna a moldura ativa segura considerando o status de assinatura e molduras de maestria.
 */
export function useActiveAvatarFrame(): AvatarFrameId {
  const storeFrameId = useAvatarFrameStore((s) => s.frameId);
  const userAvatarFrame = useUserStore((s) => s.user?.avatarFrame);
  const isPremium = useUserStore((s) => s.is_Premium);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const candidateId = mounted
    ? storeFrameId
    : (userAvatarFrame ?? (isPremium ? "cosmic_gold" : "none"));
  const resolved = getAvatarFrame(candidateId);
  if (resolved.isPremium && !isPremium) {
    return "none";
  }
  return resolved.id;
}
