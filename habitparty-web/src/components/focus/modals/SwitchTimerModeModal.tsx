"use client";

import type { FocusRecordType } from "@/types/focus";
import { FocusConfirmSwitchModal } from "./FocusConfirmSwitchModal";

interface SwitchTimerModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: FocusRecordType;
  newMode: FocusRecordType;
  onConfirm: () => void;
}

export function SwitchTimerModeModal({
  isOpen,
  onClose,
  currentMode,
  newMode,
  onConfirm,
}: SwitchTimerModeModalProps) {
  const currentModeLabel = currentMode === "POMO" ? "Pomodoro" : "Cronômetro";
  const newModeLabel = newMode === "POMO" ? "Pomodoro" : "Cronômetro";

  return (
    <FocusConfirmSwitchModal
      isOpen={isOpen}
      onClose={onClose}
      title="Trocar Modo de Foco"
      description="Já existe uma contagem de foco em andamento."
      warningText={
        <p>
          Você possui uma contagem ativa no modo{" "}
          <strong className="text-amber-300">{currentModeLabel}</strong>. Se
          você alternar para{" "}
          <strong className="text-gold">{newModeLabel}</strong> agora, o tempo
          não salvo desta sessão será zerado.
        </p>
      }
      currentLabel="Modo Atual"
      currentValue={currentModeLabel}
      newLabel="Novo Modo"
      newValue={newModeLabel}
      cancelButtonText="Manter Atual"
      confirmButtonText="Trocar e Zerar Tempo"
      onConfirm={onConfirm}
    />
  );
}
