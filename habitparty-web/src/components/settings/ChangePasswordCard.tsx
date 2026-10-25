"use client";

import { Check, KeyRound, Lock, Mail, X } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { updateUserPasswordAction } from "@/actions/userActions";
import { GoogleLogoIcon } from "@/components/ui/GoogleLogoIcon";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import type { ProfileCardBaseProps } from "@/types/settings";
import { cn } from "@/utils";
import { validatePasswordRequirements } from "@/utils/validators";

import { SettingsCard } from "./SettingsCard";

function PasswordRuleItem({
  satisfied,
  label,
  isError = false,
  className,
}: {
  satisfied: boolean;
  label: string;
  isError?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        isError
          ? "text-red-400 font-medium"
          : satisfied
            ? "text-emerald-400 font-medium"
            : "text-neutral-400",
        className,
      )}
    >
      {satisfied && !isError ? <Check size={14} /> : <X size={14} />}
      {label}
    </span>
  );
}

export function ChangePasswordCard({ isCompact }: ProfileCardBaseProps) {
  const user = useUserStore((s) => s.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isSendingReset, startResetTransition] = useTransition();
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const isSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;

  const {
    hasMinLength,
    hasUpperCase,
    hasSpecialChar,
    passwordsMatch,
    isValid: isFormValid,
  } = validatePasswordRequirements(newPassword, confirmPassword);

  const canSubmit =
    currentPassword.length > 0 && isFormValid && !isSameAsCurrent;

  const handleSendPasswordSetupEmail = () => {
    if (!user?.email) {
      toast.error("E-mail do usuário não encontrado.");
      return;
    }

    startResetTransition(async () => {
      const res = await requestPasswordReset(user.email || "");
      if (res.success) {
        setResetEmailSent(true);
        toast.success(
          `Enviamos um link para ${user.email} para você definir ou redefinir sua senha!`,
        );
      } else {
        toast.error(
          res.error ||
            "Não foi possível enviar o e-mail de definição de senha.",
        );
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Informe a sua senha atual.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha deve ser diferente da sua senha atual.");
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
      <div className="flex flex-col gap-5">
        {/* Aviso informativo para contas criadas/vinculadas via Google */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl bg-surface/60 border border-primary/25">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <GoogleLogoIcon />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs sm:text-body-s font-bold text-neutral-100">
                Criou sua conta com o Google ou não sabe sua senha atual?
              </span>
              <p className="text-tiny sm:text-xs text-neutral-300 leading-relaxed">
                Contas criadas via Google não possuem uma senha manual inicial.
                Se desejar definir uma senha própria para também entrar com
                e-mail e senha, solicite um link de definição no seu e-mail.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendPasswordSetupEmail}
            disabled={isSendingReset || resetEmailSent || !user?.email}
            className={cn(
              "shrink-0 rounded-xl border font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
              resetEmailSent
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 cursor-default"
                : "border-gold/40 bg-gold/10 text-gold hover:bg-gold hover:text-neutral-950",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isCompact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs",
            )}
          >
            {resetEmailSent ? (
              <>
                <Check size={14} />
                <span>Link enviado no e-mail</span>
              </>
            ) : (
              <>
                <Mail size={14} />
                <span>
                  {isSendingReset
                    ? "Enviando link..."
                    : "Receber link por e-mail"}
                </span>
              </>
            )}
          </button>
        </div>

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
              error={
                isSameAsCurrent
                  ? "A nova senha não pode ser igual à senha atual."
                  : undefined
              }
              required
            />

            {/* Indicador de requisitos */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface/60 border border-primary/20 text-xs">
              <span className="font-semibold text-neutral-300">
                Requisitos da senha:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                <PasswordRuleItem
                  satisfied={hasMinLength}
                  label="Mínimo de 8 caracteres"
                />
                <PasswordRuleItem
                  satisfied={hasUpperCase}
                  label="1 letra maiúscula"
                />
                <PasswordRuleItem
                  satisfied={hasSpecialChar}
                  label="1 caractere especial (@$!%*?&#)"
                />
                <PasswordRuleItem
                  satisfied={passwordsMatch}
                  label="Senhas coincidem"
                />
                <PasswordRuleItem
                  satisfied={
                    newPassword.length > 0 &&
                    currentPassword.length > 0 &&
                    !isSameAsCurrent
                  }
                  isError={isSameAsCurrent}
                  label="Diferente da senha atual"
                  className="sm:col-span-2"
                />
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
      </div>
    </SettingsCard>
  );
}
