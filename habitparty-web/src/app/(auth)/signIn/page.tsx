import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Login | HabitParty",
  description:
    "Entre na sua conta para continuar sua jornada de produtividade no HabitParty.",
};

export default function SignInPage() {
  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">Login</h1>
        <p className="text-base text-neutral-300">
          Bem vindo(a) de volta! Insira seus dados.
        </p>
      </header>

      <SignInForm />

      <footer className="text-center text-sm text-neutral-300">
        Não tem uma conta?{" "}
        <Link
          href="/signUp"
          className="text-gold font-bold hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-gold rounded"
        >
          Cadastre
        </Link>
      </footer>
    </main>
  );
}
