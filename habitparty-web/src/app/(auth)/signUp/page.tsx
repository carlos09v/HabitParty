"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export default function SignUpPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/firstStep");
  };

  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Cabeçalho do Formulário */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">Cadastro</h1>
        <p className="text-base text-neutral-300">
          O primeiro passo para construir seu novo sistema de vitórias.
        </p>
      </header>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome Completo"
          id="name"
          name="fullName"
          type="text"
          placeholder="Insira seu nome completo"
          required
        />

        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          placeholder="Insira seu email"
          required
        />

        <Input
          label="Senha"
          id="password"
          name="password"
          type="password"
          placeholder="********"
          required
        />

        <div className="flex flex-col sm:flex-row gap-4 w-full items-start">
          {/* Coluna 1: Data de Nascimento (50%) */}
          <div className="flex-1 w-full sm:w-auto min-w-0">
            <Input
              label="Data de Nascimento"
              id="dob"
              name="birthday"
              type="date"
              placeholder="DD / MM / YYYY"
              icon={<Calendar size={18} aria-hidden="true" />}
            />
          </div>

          {/* Coluna 2: Gênero (50%) */}
          <div className="flex-1 w-full sm:w-auto min-w-0">
            <Select
              label="Gênero"
              placeholder="Não informado"
              options={["Não informado", "Masculino", "Feminino", "Outro"]}
            />
          </div>
        </div>

        {/* Botão de Submissão Cadastrar */}
        <button
          type="submit"
          className="mt-2 w-full py-3.5 rounded-lg border-2 border-gold/50 text-base text-neutral-50 font-bold bg-neutral-900/60 hover:bg-neutral-900/80 hover:border-gold hover:shadow-[0_0_15px_rgba(237,229,57,0.25)] transition-all cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Cadastrar
        </button>
      </form>

      {/* Link de redirecionamento */}
      <footer className="text-center text-sm text-neutral-300">
        Já tem uma conta?{" "}
        <Link
          href="/signIn"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          Entre
        </Link>
      </footer>
    </main>
  );
}
