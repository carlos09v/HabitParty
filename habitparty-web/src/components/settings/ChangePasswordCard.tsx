"use client";

import { Check, KeyRound, Lock, Mail, X } from "lucide-react";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { updateUserPasswordAction } from "@/actions/userActions";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import type { ProfileCardBaseProps } from "@/types/settings";
import { cn } from "@/utils";
import { validatePasswordRequirements } from "@/utils/validators";

import { SettingsCard } from "./SettingsCard";

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
              <svg
                className="w-4 h-4 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
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

                <span
                  className={cn(
                    "flex items-center gap-1.5 transition-colors sm:col-span-2",
                    isSameAsCurrent
                      ? "text-red-400 font-medium"
                      : newPassword.length > 0 && currentPassword.length > 0
                        ? "text-emerald-400 font-medium"
                        : "text-neutral-400",
                  )}
                >
                  {newPassword.length > 0 &&
                  currentPassword.length > 0 &&
                  !isSameAsCurrent ? (
                    <Check size={14} />
                  ) : (
                    <X size={14} />
                  )}
                  Diferente da senha atual
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
      </div>
    </SettingsCard>
  );
}
