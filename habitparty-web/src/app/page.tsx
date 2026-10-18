import type { Metadata } from "next";
import { LandingCtaBanner } from "@/components/landing/LandingCtaBanner";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFeaturesGrid } from "@/components/landing/LandingFeaturesGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingHonestyManifesto } from "@/components/landing/LandingHonestyManifesto";
import { LandingInteractiveDemo } from "@/components/landing/LandingInteractiveDemo";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingProductivityLoop } from "@/components/landing/LandingProductivityLoop";
import { LandingRoadmap } from "@/components/landing/LandingRoadmap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HabitParty — Produtividade Gamificada & Hábitos em RPG",
  description:
    "Transforme sua rotina diária em uma jornada épica. Ganhe XP, acumule moedas de ouro, vença a procrastinação no Modo Foco e troque esforço por recompensas reais.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-neutral-50 flex flex-col selection:bg-gold selection:text-neutral-900">
      {/* Barra de Navegação Fixa */}
      <LandingNavbar />

      {/* Conteúdo Principal da Landing Page */}
      <main className="flex-1">
        <LandingHero />
        <LandingInteractiveDemo />
        <LandingProductivityLoop />
        <LandingHonestyManifesto />
        <LandingFeaturesGrid />
        <LandingRoadmap />
        <LandingPricing />
        <LandingFaq />
        <LandingCtaBanner />
      </main>

      {/* Rodapé */}
      <LandingFooter />
    </div>
  );
}
