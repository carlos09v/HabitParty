"use client";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetPassword } from "@/actions/auth";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { validateAuthPassword } from "@/utils/validators";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch =
    confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateAuthPassword(password);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    if (!passwordsMatch) {
      toast.error("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const result = await resetPassword({ token, password });

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Senha redefinida com sucesso! Você já pode entrar.");
        router.push("/signIn");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <Input
          label="Nova Senha"
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo de 8 caracteres"
          icon={<KeyRound size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label="Confirmar Nova Senha"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (!confirmTouched) setConfirmTouched(true);
          }}
          placeholder="Repita a nova senha"
          icon={<KeyRound size={18} aria-hidden="true" />}
          error={
            showPasswordMismatch
              ? "As senhas digitadas não coincidem"
              : undefined
          }
          required
          disabled={isPending}
        />
      </div>

      <div className="mt-2">
        <SubmitButton isPending={isPending} loadingText="Redefinindo senha...">
          Redefinir Senha
        </SubmitButton>
      </div>
    </form>
  );
}
