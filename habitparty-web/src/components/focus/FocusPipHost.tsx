"use client";

import dynamic from "next/dynamic";
import { useFocusPipState } from "@/utils/focusPipState";

const FocusPipRuntime = dynamic(
  () =>
    import("./FocusPipRuntime").then((mod) => ({
      default: mod.FocusPipRuntime,
    })),
  { ssr: false },
);

/**
 * Casca mínima global do Picture-in-Picture montada no layout `(main)`.
 * Só carrega o runtime Canvas/Document PiP e `FocusPipWidget` quando o usuário abre a janela PiP.
 */
export function FocusPipHost() {
  const { isOpen } = useFocusPipState();

  if (!isOpen) {
    return null;
  }

  return <FocusPipRuntime />;
}
