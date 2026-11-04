import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
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
import { isValidLocale, SITE_URL } from "@/i18n/config";
import { setStaticLocale } from "@/i18n/request";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  "use cache";
  cacheLife("static");

  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    return {};
  }

  setStaticLocale(rawLocale);
  const t = await getTranslations({
    locale: rawLocale,
    namespace: "landing.metadata",
  });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${rawLocale}`,
      languages: {
        en: `${SITE_URL}/en`,
        "pt-BR": `${SITE_URL}/pt-BR`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${rawLocale}`,
      siteName: "HabitParty",
      locale: rawLocale === "pt-BR" ? "pt_BR" : "en_US",
      alternateLocale: rawLocale === "pt-BR" ? ["en_US"] : ["pt_BR"],
      type: "website",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  "use cache";
  cacheLife("static");
  cacheTag("landing", "founders-quota");

  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  setStaticLocale(rawLocale);

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
