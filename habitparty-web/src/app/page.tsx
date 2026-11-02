import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-neutral-50 flex flex-col selection:bg-gold selection:text-on-gold">
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
