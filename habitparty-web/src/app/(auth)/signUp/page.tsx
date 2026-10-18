import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Cadastro | HabitParty",
  description:
    "Crie sua conta no HabitParty e construa seu novo sistema de produtividade gamificada.",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Cabeçalho do Formulário */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">Cadastro</h1>
        <p className="text-base text-neutral-300">
          O primeiro passo para construir seu novo sistema de vitórias.
        </p>
      </header>

      {/* Formulário Modularizado */}
      <SignUpForm />

      {/* Link de redirecionamento */}
      <footer className="text-center text-sm text-neutral-300">
        Já tem uma conta?{" "}
        <Link
          href="/signIn"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
        >
          Entre
        </Link>
      </footer>
    </main>
  );
}
