import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { RootShell } from "@/components/layout/RootShell";
import { type AppLocale, isValidLocale, LOCALES } from "@/i18n/config";
import { setStaticLocale } from "@/i18n/request";

export const viewport: Viewport = {
  colorScheme: "dark light",
};

export function generateStaticParams(): Array<{ locale: AppLocale }> {
  return LOCALES.map((locale) => ({ locale }));
}

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
  const t = await getTranslations({ locale: rawLocale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PublicRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  "use cache";
  cacheLife("static");

  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) {
    notFound();
  }

  setStaticLocale(rawLocale);

  return (
    <RootShell locale={rawLocale} scope="public">
      {children}
    </RootShell>
  );
}
