import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Login | HabitParty",
  description:
    "Entre na sua conta para continuar sua jornada de produtividade no HabitParty.",
};

interface SignInPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const error = resolvedParams.error;

  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">Login</h1>
        <p className="text-base text-neutral-300">
          Bem vindo(a) de volta! Insira seus dados.
        </p>
      </header>

      <SignInForm initialError={error} />

      <footer className="text-center text-sm text-neutral-300">
        Não tem uma conta?{" "}
        <Link
          href="/signUp"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
        >
          Cadastre
        </Link>
      </footer>
    </main>
  );
}
