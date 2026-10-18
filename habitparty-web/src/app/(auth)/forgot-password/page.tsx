import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar Senha | HabitParty",
  description:
    "Recupere o acesso à sua conta HabitParty através do seu endereço de e-mail cadastrado.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Recuperar Senha
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300">
          Informe seu e-mail cadastrado para receber as instruções de
          recuperação.
        </p>
      </header>

      <ForgotPasswordForm />

      <footer className="text-center text-sm text-neutral-600 dark:text-neutral-300">
        Lembrou sua senha?{" "}
        <Link
          href="/signIn"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
        >
          Entrar
        </Link>
      </footer>
    </main>
  );
}
