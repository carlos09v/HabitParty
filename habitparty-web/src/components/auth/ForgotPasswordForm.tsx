"use client";

import { CheckCircle2, Mail, RotateCw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Por favor, digite seu email.");
      return;
    }

    startTransition(async () => {
      const result = await requestPasswordReset(email);

      if (!result.success) {
        toast.error(result.error);
      } else {
        setIsSubmitted(true);
        toast.success("Instruções enviadas para seu e-mail!");
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
        <div className="rounded-xl border border-neutral-200 bg-surface/60 dark:border-primary/40 dark:bg-primary-dark/30 p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-glow-gold-sm">
            <CheckCircle2 size={26} aria-hidden="true" />
          </div>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            E-mail Enviado!
          </h2>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-sm">
            Se o endereço{" "}
            <strong className="text-gold font-medium">{email}</strong> estiver
            cadastrado no HabitParty, você receberá um link em breve com
            instruções para criar uma nova senha.
          </p>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Não encontrou? Verifique a sua pasta de <strong>spam</strong> ou{" "}
            <strong>lixo eletrônico</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="w-full py-3 px-4 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-transparent transition-colors flex items-center justify-center gap-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <RotateCw size={16} aria-hidden="true" />
            Tentar outro e-mail
          </button>

          <Link
            href="/signIn"
            className="w-full text-center py-2 text-sm text-neutral-400 hover:text-gold transition-colors"
          >
            Voltar para o Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label="Email da Conta"
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        icon={<Mail size={18} aria-hidden="true" />}
        required
        disabled={isPending}
      />

      <div className="mt-2">
        <SubmitButton isPending={isPending} loadingText="Enviando link...">
          Enviar Link de Recuperação
        </SubmitButton>
      </div>
    </form>
  );
}
