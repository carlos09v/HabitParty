import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full flex bg-background overflow-hidden">
      {/* LADO ESQUERDO: Branding + Formulário Centralizado na Metade (50% do viewport) */}
      <div className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-between p-4 sm:p-8 lg:p-16 relative z-10">
        {/* Top bar: Logo HabitParty e Alternador de Tema */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <Image
              src="/assets/logo.png"
              alt="HabitParty"
              width={251}
              height={55}
              className="w-auto h-11 object-contain"
              priority
            />
          </Link>
          <ThemeToggleBtn variant="icon" />
        </div>

        {/* Container de Formulário: largura de 487px fiel ao Figma */}
        <main className="w-full max-w-[487px] mx-auto my-auto py-8">
          {children}
        </main>

        {/* Rodapé sutil */}
        <footer className="text-[12px] text-neutral-400 text-center lg:text-left">
          © {new Date().getFullYear()} HabitParty. Todos os direitos reservados.
        </footer>
      </div>

      {/* LADO DIREITO: Ilustração Cósmica da Galáxia (50% do viewport) */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen items-center justify-end overflow-hidden pointer-events-none">
        {/* Elipse Azul na base do Figma (brilho suave, etéreo e atmosférico) */}
        <div className="cosmic-orb absolute -bottom-16 -right-16 w-[500px] h-[420px] rounded-full bg-blue/30 blur-[180px] z-0 pointer-events-none opacity-30 dark:opacity-100" />

        {/* Glow roxo suave adicional */}
        <div className="cosmic-orb absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/25 blur-[160px] z-0 pointer-events-none opacity-30 dark:opacity-100" />

        {/* Galáxia em escala generosa que ocupa a metade da tela (z-10 sobre a elipse azul) */}
        <div className="absolute top-0 right-0 w-full h-full max-w-[850px] flex items-start justify-end z-10 opacity-35 dark:opacity-100">
          <Image
            src="/assets/Galaxia.svg"
            alt="Atmosfera Cósmica HabitParty"
            fill
            className="object-contain object-top-right select-none"
            priority
          />
        </div>
      </div>
    </div>
  );
}
