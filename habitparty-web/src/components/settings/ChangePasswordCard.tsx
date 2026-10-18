"use client";

import { Check, KeyRound, Lock, X } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserPasswordAction } from "@/actions/userActions";
import { Input } from "@/components/ui/Input";
import type { ProfileCardBaseProps } from "@/types/settings";
import { cn } from "@/utils";
import { validatePasswordRequirements } from "@/utils/validators";

import { SettingsCard } from "./SettingsCard";

export function ChangePasswordCard({ isCompact }: ProfileCardBaseProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, startTransition] = useTransition();

  const {
    hasMinLength,
    hasUpperCase,
    hasSpecialChar,
    passwordsMatch,
    isValid: isFormValid,
  } = validatePasswordRequirements(newPassword, confirmPassword);

  const canSubmit = currentPassword.length > 0 && isFormValid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Informe a sua senha atual.");
      return;
    }

    if (!hasMinLength || !hasUpperCase || !hasSpecialChar) {
      toast.error(
        "A nova senha deve atender a todos os requisitos de segurança.",
      );
      return;
    }

    if (!passwordsMatch) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    startTransition(async () => {
      const res = await updateUserPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(
          res.error || "Erro ao alterar senha. Verifique sua senha atual.",
        );
      }
    });
  };

  return (
    <SettingsCard
      title="Segurança & Senha"
      description="Mantenha sua conta protegida atualizando sua senha periodicamente."
      icon={<KeyRound size={18} className="text-gold" />}
      isCompact={isCompact}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 max-w-xl">
          <Input
            id="currentPassword"
            type="password"
            label="Senha Atual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Digite sua senha atual"
            compact={isCompact}
            icon={<Lock size={18} />}
            required
          />

          <Input
            id="newPassword"
            type="password"
            label="Nova Senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Digite a nova senha"
            compact={isCompact}
            icon={<Lock size={18} />}
            required
          />

          {/* Indicador de requisitos */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface/60 border border-primary/20 text-xs">
            <span className="font-semibold text-neutral-300">
              Requisitos da senha:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              <span
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  hasMinLength
                    ? "text-emerald-400 font-medium"
                    : "text-neutral-400",
                )}
              >
                {hasMinLength ? <Check size={14} /> : <X size={14} />}
                Mínimo de 8 caracteres
              </span>

              <span
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  hasUpperCase
                    ? "text-emerald-400 font-medium"
                    : "text-neutral-400",
                )}
              >
                {hasUpperCase ? <Check size={14} /> : <X size={14} />}1 letra
                maiúscula
              </span>

              <span
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  hasSpecialChar
                    ? "text-emerald-400 font-medium"
                    : "text-neutral-400",
                )}
              >
                {hasSpecialChar ? <Check size={14} /> : <X size={14} />}1
                caractere especial (@$!%*?&#)
              </span>

              <span
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  passwordsMatch
                    ? "text-emerald-400 font-medium"
                    : "text-neutral-400",
                )}
              >
                {passwordsMatch ? <Check size={14} /> : <X size={14} />}
                Senhas coincidem
              </span>
            </div>
          </div>

          <Input
            id="confirmPassword"
            type="password"
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a nova senha"
            compact={isCompact}
            icon={<Lock size={18} />}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={cn(
              "rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md",
              "bg-gold text-neutral-900 hover:bg-gold-hover active:bg-gold-pressed",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              isCompact ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm",
            )}
          >
            {isPending ? "Alterando..." : "Alterar Senha"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
